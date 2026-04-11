"""
Casdoor OAuth 三方登录回调接口

流程：
1. 前端跳转 Casdoor 登录页
2. 用户在 Casdoor 完成社交登录
3. Casdoor 回调前端，前端拿到 code
4. 前端调用本接口，用 code 换取本系统 JWT token
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

router = APIRouter(tags=["oauth"])


class OAuthCodeRequest(BaseModel):
    code: str
    state: str | None = None


class OAuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_new_user: bool = False


async def _exchange_casdoor_code(code: str) -> dict:
    """用 Casdoor 授权码换取用户信息"""
    token_url = f"{settings.CASDOOR_ENDPOINT}/api/login/oauth/access_token"
    userinfo_url = f"{settings.CASDOOR_ENDPOINT}/api/userinfo"

    async with httpx.AsyncClient(timeout=10) as client:
        # 1. 用 code 换 access_token
        token_resp = await client.post(token_url, data={
            "grant_type": "authorization_code",
            "client_id": settings.CASDOOR_CLIENT_ID,
            "client_secret": settings.CASDOOR_CLIENT_SECRET,
            "code": code,
        })
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Casdoor 授权码无效")

        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="获取 Casdoor token 失败")

        # 2. 用 access_token 获取用户信息
        info_resp = await client.get(
            userinfo_url,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if info_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="获取用户信息失败")

        return info_resp.json()


def _find_or_create_user(session, casdoor_user: dict) -> tuple[User, bool]:
    """根据 Casdoor 用户信息查找或创建本地用户"""
    # Casdoor 返回的字段: sub(id), name, preferred_username, email, phone, picture
    casdoor_id = casdoor_user.get("sub") or casdoor_user.get("id", "")
    email = casdoor_user.get("email")
    name = casdoor_user.get("name") or casdoor_user.get("preferred_username", "")
    avatar = casdoor_user.get("picture", "")

    # 先按 oauth_id 查找已绑定用户
    stmt = select(User).where(User.oauth_provider == "casdoor", User.oauth_id == str(casdoor_id))
    user = session.exec(stmt).first()
    if user:
        return user, False

    # 再按邮箱查找（自动关联已有账户）
    if email:
        stmt = select(User).where(User.email == email)
        user = session.exec(stmt).first()
        if user:
            user.oauth_provider = "casdoor"
            user.oauth_id = str(casdoor_id)
            if avatar and not user.avatar_url:
                user.avatar_url = avatar
            session.add(user)
            session.commit()
            session.refresh(user)
            return user, False

    # 创建新用户
    user = User(
        email=email if email else None,
        full_name=name,
        avatar_url=avatar,
        oauth_provider="casdoor",
        oauth_id=str(casdoor_id),
        hashed_password="",  # OAuth 用户无密码
        role=UserRole.parent,
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user, True


@router.post("/oauth/casdoor/callback", response_model=OAuthTokenResponse)
async def casdoor_oauth_callback(body: OAuthCodeRequest, session: SessionDep):
    """
    Casdoor OAuth 回调：前端用 code 换取本系统 JWT token
    """
    casdoor_user = await _exchange_casdoor_code(body.code)
    user, is_new = _find_or_create_user(session, casdoor_user)

    if not user.is_active:
        raise HTTPException(status_code=400, detail="账户未激活")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return OAuthTokenResponse(
        access_token=security.create_access_token(
            user.id, expires_delta=access_token_expires, role=user.role.value
        ),
        is_new_user=is_new,
    )


@router.get("/oauth/casdoor/config")
def get_casdoor_config():
    """返回前端需要的 Casdoor 配置（不含 secret）"""
    return {
        "endpoint": settings.CASDOOR_ENDPOINT,
        "client_id": settings.CASDOOR_CLIENT_ID,
        "org_name": settings.CASDOOR_ORG_NAME,
        "app_name": settings.CASDOOR_APP_NAME,
    }
