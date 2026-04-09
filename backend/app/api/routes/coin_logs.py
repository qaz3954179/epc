import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select, func

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    CoinLog,
    CoinLogPublic,
    CoinLogsPublic,
    TransactionType,
)

router = APIRouter(prefix="/coin-logs", tags=["coin-logs"])


@router.get("/", response_model=CoinLogsPublic)
def read_my_coin_logs(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    transaction_type: TransactionType | None = None,
) -> Any:
    """查询我的学习币明细"""
    statement = select(CoinLog).where(CoinLog.user_id == current_user.id)
    
    if transaction_type:
        statement = statement.where(CoinLog.transaction_type == transaction_type)
    
    statement = statement.order_by(CoinLog.created_at.desc()).offset(skip).limit(limit)
    
    # 查询总数
    count_statement = select(func.count()).select_from(CoinLog).where(
        CoinLog.user_id == current_user.id
    )
    if transaction_type:
        count_statement = count_statement.where(CoinLog.transaction_type == transaction_type)
    
    count = session.exec(count_statement).one()
    logs = session.exec(statement).all()
    
    return CoinLogsPublic(data=logs, count=count)


@router.get("/all", response_model=CoinLogsPublic)
def read_all_coin_logs(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    user_id: uuid.UUID | None = None,
    transaction_type: TransactionType | None = None,
) -> Any:
    """查询所有学习币明细（仅管理员）"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")
    
    statement = select(CoinLog)
    
    if user_id:
        statement = statement.where(CoinLog.user_id == user_id)
    
    if transaction_type:
        statement = statement.where(CoinLog.transaction_type == transaction_type)
    
    statement = statement.order_by(CoinLog.created_at.desc()).offset(skip).limit(limit)
    
    # 查询总数
    count_statement = select(func.count()).select_from(CoinLog)
    if user_id:
        count_statement = count_statement.where(CoinLog.user_id == user_id)
    if transaction_type:
        count_statement = count_statement.where(CoinLog.transaction_type == transaction_type)
    
    count = session.exec(count_statement).one()
    logs = session.exec(statement).all()
    
    return CoinLogsPublic(data=logs, count=count)


@router.get("/{id}", response_model=CoinLogPublic)
def read_coin_log(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
) -> Any:
    """查询单条学习币明细"""
    log = session.get(CoinLog, id)
    if not log:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    # 只能查看自己的记录，或管理员可以查看所有
    if log.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")
    
    return log
