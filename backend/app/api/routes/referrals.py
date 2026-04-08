import uuid
from typing import Any
from fastapi import APIRouter, Depends
from sqlmodel import select, func
from app.api.deps import CurrentUser, SessionDep
from app.models import User, UserPublic

router = APIRouter(prefix="/referrals", tags=["referrals"])

REFERRAL_REWARD_COINS = 50  # 推荐人奖励学习币


class ReferralStatsPublic:
    pass


@router.get("/me/stats")
def get_my_referral_stats(
    session: SessionDep, current_user: CurrentUser
) -> Any:
    """获取我的推荐统计：推荐码、邀请人数"""
    count = session.exec(
        select(func.count()).select_from(User).where(User.referred_by_id == current_user.id)
    ).one()
    return {
        "referral_code": current_user.referral_code,
        "total_referred": count,
        "coins_per_referral": REFERRAL_REWARD_COINS,
        "total_coins_earned": count * REFERRAL_REWARD_COINS,
    }


@router.get("/me/list")
def get_my_referrals(
    session: SessionDep, current_user: CurrentUser
) -> Any:
    """获取我推荐的用户列表"""
    users = session.exec(
        select(User).where(User.referred_by_id == current_user.id)
    ).all()
    return {
        "data": [
            {"id": str(u.id), "full_name": u.full_name, "email": u.email}
            for u in users
        ],
        "count": len(users),
    }
