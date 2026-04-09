from fastapi import APIRouter

from app.api.routes import (
    children,
    coin_logs,
    growth,
    items,
    login,
    private,
    prize_redemptions,
    prizes,
    referrals,
    shipping_addresses,
    task_completions,
    users,
    utils,
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(task_completions.router)
api_router.include_router(prizes.router)
api_router.include_router(prize_redemptions.router)
api_router.include_router(shipping_addresses.router)
api_router.include_router(coin_logs.router)
api_router.include_router(growth.router)
api_router.include_router(referrals.router)
api_router.include_router(children.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
