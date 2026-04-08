from fastapi import APIRouter

from app.api.routes import growth, items, login, private, prizes, task_completions, users, utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(task_completions.router)
api_router.include_router(prizes.router)
api_router.include_router(growth.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
