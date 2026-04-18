"""
微信 OAuth 授权登录

支持：
- 微信开放平台（PC 端扫码登录，snsapi_login）
- 微信公众平台（H5/移动端，snsapi_userinfo）
"""
from datetime import timedelta

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlmodel import select

from app.api.deps import SessionDep
from app.core import security
from app.core.config import settings
from app.models import User, UserRole

router = APIRouter(tags=["wechat-oauth"])


class WeChatCodeRequest(BaseModel):
    code: str
    state: str | None = None


class WeChatTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_new_user: bool = False


async def _exchange_wechat_code(code: str) -> dict:
    """
    用微信授权码换取 access_token 和 openid。

    - 开放平台（PC 扫码）: api.weixin.qq.com/sns/oauth2/access_token
    - 公众平台（公众号/服务号）: api.weixin.qq.com/sns/oauth2/access_token
      （接口相同，区别在于 scope 和获取用户信息的方式）
    """
    token_url = "https://api.weixin.qq.com/sns/oauth2/access_token"

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(token_url, params={
            "appid": settings.WECHAT_APP_ID,
            "secret": settings.WECHAT_APP_SECRET,
            "code": code,
            "grant_type": "authorization_code",
        })

        data = resp.json()

        # 微信错误时返回 errcode + errmsg
        if data.get("errcode"):
            raise HTTPException(
                status_code=400,
                detail=f"微信授权失败: {data.get('errmsg', '未知错误')}",
            )

        return data


async def _get_wechat_userinfo(access_token: str, openid: str) -> dict:
    """获取微信用户信息（昵称、头像等）"""
    userinfo_url = "https://api.weixin.qq.com/sns/userinfo"

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(userinfo_url, params={
            "access_token": access_token,
            "openid": openid,
            "lang": "zh_CN",
        })

        data = resp.json()
        if data.get("errcode"):
            raise HTTPException(
                status_code=400,
                detail=f"获取微信用户信息失败: {data.get('errmsg', '未知错误')}",
            )

        return data


def _find_or_create_user(session: SessionDep, wechat_openid: str, wechat_user: dict | None = None) -> tuple[User, bool]:
    """根据微信 openid 查找或创建本地用户"""

    # 先按 oauth_id 查找已绑定用户
    stmt = select(User).where(User.oauth_provider == "wechat", User.oauth_id == wechat_openid)
    user = session.exec(stmt).first()
    if user:
        # 更新头像（如果微信有新头像）
        if wechat_user and wechat_user.get("headimgurl"):
            if not user.avatar_url or user.avatar_url != wechat_user.get("headimgurl"):
                user.avatar_url = wechat_user.get("headimgurl")
                user.nickname = wechat_user.get("nickname")
                session.add(user)
                session.commit()
                session.refresh(user)
        return user, False

    # 再按邮箱查找（如果微信绑定了邮箱）
    wechat_email = wechat_user.get("email") if wechat_user else None
    if wechat_email:
        stmt = select(User).where(User.email == wechat_email)
        user = session.exec(stmt).first()
        if user:
            user.oauth_provider = "wechat"
            user.oauth_id = wechat_openid
            if wechat_user and wechat_user.get("headimgurl") and not user.avatar_url:
                user.avatar_url = wechat_user.get("headimgurl")
            session.add(user)
            session.commit()
            session.refresh(user)
            return user, False

    # 创建新用户（默认 parent 角色）
    nickname = wechat_user.get("nickname") if wechat_user else None
    avatar_url = wechat_user.get("headimgurl") if wechat_user else None
    # 生成随机用户名
    import secrets
    random_username = f"wx_{secrets.token_hex(8)}"

    user = User(
        username=random_username,
        full_name=nickname,
        nickname=nickname,
        avatar_url=avatar_url,
        oauth_provider="wechat",
        oauth_id=wechat_openid,
        hashed_password="",  # OAuth 用户无密码
        role=UserRole.parent,
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user, True


@router.get("/oauth/wechat/authorize-url")
def get_wechat_authorize_url(
    redirect_uri: str,
    scope: str = "snsapi_userinfo",
    state: str | None = None,
):
    """
    获取微信授权 URL，前端直接跳转。

    - scope=snsapi_login: 开放平台扫码登录（PC 端）
    - scope=snsapi_userinfo: 公众号/服务号授权（需要用户确认，可获取用户信息）
    - scope=snsapi_base: 公众号静默授权（仅获取 openid）
    """
    import secrets as _secrets

    # 区分开放平台和公众平台的授权 URL
    if settings.WECHAT_LOGIN_TYPE == "open":
        base_url = "https://open.weixin.qq.com/connect/qrconnect"
        scope = "snsapi_login"
    else:
        base_url = "https://open.weixin.qq.com/connect/oauth2/authorize"

    state = state or _secrets.token_urlsafe(16)

    params = {
        "appid": settings.WECHAT_APP_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": scope,
        "state": state,
    }

    if settings.WECHAT_LOGIN_TYPE == "open":
        url = f"{base_url}?" + "&".join(f"{k}={v}" for k, v in params.items())
        return {"authorize_url": url, "state": state}
    else:
        url = f"{base_url}?" + "&".join(f"{k}={v}" for k, v in params.items()) + "#wechat_redirect"
        return {"authorize_url": url, "state": state}


@router.post("/oauth/wechat/callback", response_model=WeChatTokenResponse)
async def wechat_oauth_callback(body: WeChatCodeRequest, session: SessionDep):
    """
    微信 OAuth 回调：前端用 code 换取本系统 JWT token。
    """
    if not settings.WECHAT_APP_ID or not settings.WECHAT_APP_SECRET:
        raise HTTPException(status_code=500, detail="微信登录未配置")

    # 1. 用 code 换 access_token + openid
    token_data = await _exchange_wechat_code(body.code)
    access_token = token_data.get("access_token")
    openid = token_data.get("openid")

    if not openid:
        raise HTTPException(status_code=400, detail="获取微信 openid 失败")

    # 2. 获取用户信息（snsapi_userinfo / snsapi_login 才能获取）
    wechat_userinfo = None
    if token_data.get("scope") in ("snsapi_userinfo", "snsapi_login"):
        try:
            wechat_userinfo = await _get_wechat_userinfo(access_token, openid)
        except HTTPException:
            # 用户信息获取失败不影响登录，仅拿 openid
            pass

    # 3. 查找或创建用户
    user, is_new = _find_or_create_user(session, openid, wechat_userinfo)

    if not user.is_active:
        raise HTTPException(status_code=400, detail="账户未激活")

    # 4. 返回本系统 JWT token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return WeChatTokenResponse(
        access_token=security.create_access_token(
            user.id, expires_delta=access_token_expires, role=user.role.value
        ),
        is_new_user=is_new,
    )


@router.get("/oauth/wechat/config")
def get_wechat_config():
    """返回前端需要的微信配置（不含 secret）"""
    login_type = settings.WECHAT_LOGIN_TYPE if settings.WECHAT_LOGIN_TYPE else "open"
    return {
        "app_id": settings.WECHAT_APP_ID,
        "login_type": login_type,
        "enabled": bool(settings.WECHAT_APP_ID and settings.WECHAT_APP_SECRET),
    }
