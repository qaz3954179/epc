import re
import uuid
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    Prize,
    PrizeCreate,
    PrizePublic,
    PrizesPublic,
    PrizeUpdate,
    TaobaoProductInfo,
    UserRole,
)

router = APIRouter(prefix="/prizes", tags=["prizes"])


@router.get("/", response_model=PrizesPublic)
def read_prizes(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """获取奖品列表"""
    count_statement = select(func.count()).select_from(Prize)
    count = session.exec(count_statement).one()
    statement = select(Prize).offset(skip).limit(limit)
    prizes = session.exec(statement).all()
    return PrizesPublic(data=prizes, count=count)


@router.get("/{id}", response_model=PrizePublic)
def read_prize(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """获取单个奖品"""
    prize = session.get(Prize, id)
    if not prize:
        raise HTTPException(status_code=404, detail="奖品不存在")
    return prize


@router.post("/", response_model=PrizePublic)
def create_prize(
    *, session: SessionDep, current_user: CurrentUser, prize_in: PrizeCreate
) -> Any:
    """创建奖品（家长和管理员）"""
    if current_user.role not in (UserRole.parent, UserRole.admin) and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")
    prize = Prize.model_validate(prize_in)
    session.add(prize)
    session.commit()
    session.refresh(prize)
    return prize


@router.put("/{id}", response_model=PrizePublic)
def update_prize(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    prize_in: PrizeUpdate,
) -> Any:
    """更新奖品（家长和管理员）"""
    if current_user.role not in (UserRole.parent, UserRole.admin) and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")
    prize = session.get(Prize, id)
    if not prize:
        raise HTTPException(status_code=404, detail="奖品不存在")
    update_dict = prize_in.model_dump(exclude_unset=True)
    prize.sqlmodel_update(update_dict)
    session.add(prize)
    session.commit()
    session.refresh(prize)
    return prize


@router.delete("/{id}")
def delete_prize(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """删除奖品（家长和管理员）"""
    if current_user.role not in (UserRole.parent, UserRole.admin) and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")
    prize = session.get(Prize, id)
    if not prize:
        raise HTTPException(status_code=404, detail="奖品不存在")
    session.delete(prize)
    session.commit()
    return Message(message="奖品已删除")


def _extract_taobao_meta(html: str) -> TaobaoProductInfo:
    """从淘宝页面 HTML 中提取商品信息"""
    # 提取标题: og:title 或 <title>
    name = ""
    og_title = re.search(r'<meta\s+property="og:title"\s+content="([^"]*)"', html)
    if og_title:
        name = og_title.group(1)
    else:
        title_match = re.search(r"<title>([^<]*)</title>", html)
        if title_match:
            name = title_match.group(1).replace("-淘宝网", "").replace("-天猫", "").strip()

    # 提取价格
    price = None
    price_match = re.search(
        r'data-price="([\d.]+)"', html
    ) or re.search(
        r'"price"\s*:\s*"?([\d.]+)"?', html
    ) or re.search(
        r'<em\s+class="tb-rmb-num">([\d.]+)</em>', html
    )
    if price_match:
        try:
            price = float(price_match.group(1))
        except ValueError:
            pass

    # 提取图片
    image_url = None
    og_image = re.search(r'<meta\s+property="og:image"\s+content="([^"]*)"', html)
    if og_image:
        image_url = og_image.group(1)
        if image_url.startswith("//"):
            image_url = "https:" + image_url

    if not name:
        raise HTTPException(status_code=400, detail="无法解析该链接，请手动填写商品信息")

    return TaobaoProductInfo(name=name, price=price, image_url=image_url)


@router.post("/parse-taobao-url", response_model=TaobaoProductInfo)
async def parse_taobao_url(*, current_user: CurrentUser, url: str) -> Any:
    """解析淘宝/天猫商品链接，自动提取商品信息"""
    if current_user.role not in (UserRole.parent, UserRole.admin) and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")

    if not re.match(r"https?://(item\.taobao|detail\.tmall|m\.tb|a\.m\.taobao)", url):
        raise HTTPException(status_code=400, detail="请输入有效的淘宝/天猫商品链接")

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "zh-CN,zh;q=0.9",
    }

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            return _extract_taobao_meta(resp.text)
    except httpx.HTTPError:
        raise HTTPException(status_code=400, detail="无法访问该链接，请检查链接是否正确")
