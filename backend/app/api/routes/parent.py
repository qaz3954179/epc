"""
家长监控 API：查看宝贝数据、管理宝贝账户
"""
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app import crud
from app.api.deps import CurrentParent, SessionDep
from app.models import (
    ChildAccountCreate,
    ChildAccountPublic,
    ChildAccountUpdate,
    CoinLog,
    CoinLogPublic,
    CoinLogsPublic,
    Message,
    PrizeRedemption,
    PrizeRedemptionPublic,
    PrizeRedemptionsPublic,
    TaskCompletion,
    TaskCompletionPublic,
    User,
    UserRole,
)

router = APIRouter(prefix="/parent", tags=["parent"])


@router.get("/children", response_model=list[ChildAccountPublic])
def get_my_children(
    session: SessionDep,
    current_user: CurrentParent,
) -> Any:
    """获取家长名下所有宝贝列表"""
    statement = select(User).where(
        User.parent_id == current_user.id,
        User.role == UserRole.child,
    )
    children = session.exec(statement).all()
    
    return [
        ChildAccountPublic(
            id=child.id,
            username=child.username,
            full_name=child.full_name,
            nickname=child.nickname,
            gender=child.gender,
            birth_month=child.birth_month,
            avatar_url=child.avatar_url,
            coins=child.coins,
            is_active=child.is_active,
        )
        for child in children
    ]


@router.post("/children", response_model=ChildAccountPublic)
def create_child_account(
    *,
    session: SessionDep,
    current_user: CurrentParent,
    child_in: ChildAccountCreate,
) -> Any:
    """家长创建宝贝账户"""
    # 检查用户名是否已存在
    existing = crud.get_user_by_username(session=session, username=child_in.username)
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    
    child = crud.create_child_account(
        session=session,
        parent_id=current_user.id,
        username=child_in.username,
        password=child_in.password,
        full_name=child_in.full_name,
        nickname=child_in.nickname,
        gender=child_in.gender,
        birth_month=child_in.birth_month,
        avatar_url=child_in.avatar_url,
    )
    
    return ChildAccountPublic(
        id=child.id,
        username=child.username,
        full_name=child.full_name,
        nickname=child.nickname,
        gender=child.gender,
        birth_month=child.birth_month,
        avatar_url=child.avatar_url,
        coins=child.coins,
        is_active=child.is_active,
    )


@router.get("/children/{child_id}", response_model=ChildAccountPublic)
def get_child_detail(
    session: SessionDep,
    current_user: CurrentParent,
    child_id: uuid.UUID,
) -> Any:
    """获取宝贝详情"""
    child = session.get(User, child_id)
    if not child or child.parent_id != current_user.id:
        raise HTTPException(status_code=404, detail="宝贝不存在")
    
    return ChildAccountPublic(
        id=child.id,
        username=child.username,
        full_name=child.full_name,
        nickname=child.nickname,
        gender=child.gender,
        birth_month=child.birth_month,
        avatar_url=child.avatar_url,
        coins=child.coins,
        is_active=child.is_active,
    )


@router.put("/children/{child_id}", response_model=ChildAccountPublic)
def update_child_account(
    *,
    session: SessionDep,
    current_user: CurrentParent,
    child_id: uuid.UUID,
    child_in: ChildAccountUpdate,
) -> Any:
    """更新宝贝账户信息"""
    child = session.get(User, child_id)
    if not child or child.parent_id != current_user.id:
        raise HTTPException(status_code=404, detail="宝贝不存在")
    
    update_dict = child_in.model_dump(exclude_unset=True)
    
    # 如果更新用户名，检查是否重复
    if "username" in update_dict and update_dict["username"] != child.username:
        existing = crud.get_user_by_username(session=session, username=update_dict["username"])
        if existing:
            raise HTTPException(status_code=400, detail="用户名已存在")
    
    # 如果更新密码，需要哈希
    if "password" in update_dict:
        from app.core.security import get_password_hash
        child.hashed_password = get_password_hash(update_dict.pop("password"))
    
    child.sqlmodel_update(update_dict)
    session.add(child)
    session.commit()
    session.refresh(child)
    
    return ChildAccountPublic(
        id=child.id,
        username=child.username,
        full_name=child.full_name,
        nickname=child.nickname,
        gender=child.gender,
        birth_month=child.birth_month,
        avatar_url=child.avatar_url,
        coins=child.coins,
        is_active=child.is_active,
    )


@router.delete("/children/{child_id}")
def delete_child_account(
    session: SessionDep,
    current_user: CurrentParent,
    child_id: uuid.UUID,
) -> Message:
    """删除宝贝账户"""
    child = session.get(User, child_id)
    if not child or child.parent_id != current_user.id:
        raise HTTPException(status_code=404, detail="宝贝不存在")
    
    session.delete(child)
    session.commit()
    return Message(message="宝贝账户已删除")


@router.get("/children/{child_id}/dashboard")
def get_child_dashboard(
    session: SessionDep,
    current_user: CurrentParent,
    child_id: uuid.UUID,
) -> Any:
    """宝贝概览：余额、今日任务等"""
    child = session.get(User, child_id)
    if not child or child.parent_id != current_user.id:
        raise HTTPException(status_code=404, detail="宝贝不存在")
    
    # 今日完成任务数
    from datetime import date, time
    today = date.today()
    start_dt = datetime.combine(today, time.min)
    end_dt = datetime.combine(today, time.max)
    
    today_count = session.exec(
        select(func.count())
        .select_from(TaskCompletion)
        .where(
            TaskCompletion.user_id == child_id,
            TaskCompletion.completed_at >= start_dt,
            TaskCompletion.completed_at <= end_dt,
        )
    ).one()
    
    # 累计完成任务数
    total_count = session.exec(
        select(func.count())
        .select_from(TaskCompletion)
        .where(TaskCompletion.user_id == child_id)
    ).one()
    
    return {
        "child_id": str(child_id),
        "nickname": child.nickname,
        "coins": child.coins,
        "today_tasks": today_count,
        "total_tasks": total_count,
    }


@router.get("/children/{child_id}/task-completions", response_model=list[TaskCompletionPublic])
def get_child_task_completions(
    session: SessionDep,
    current_user: CurrentParent,
    child_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """宝贝的任务完成记录"""
    child = session.get(User, child_id)
    if not child or child.parent_id != current_user.id:
        raise HTTPException(status_code=404, detail="宝贝不存在")
    
    statement = (
        select(TaskCompletion)
        .where(TaskCompletion.user_id == child_id)
        .order_by(TaskCompletion.completed_at.desc())
        .offset(skip)
        .limit(limit)
    )
    completions = session.exec(statement).all()
    return completions


@router.get("/children/{child_id}/coin-logs", response_model=CoinLogsPublic)
def get_child_coin_logs(
    session: SessionDep,
    current_user: CurrentParent,
    child_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """宝贝的学习币明细"""
    child = session.get(User, child_id)
    if not child or child.parent_id != current_user.id:
        raise HTTPException(status_code=404, detail="宝贝不存在")
    
    count_statement = (
        select(func.count())
        .select_from(CoinLog)
        .where(CoinLog.user_id == child_id)
    )
    count = session.exec(count_statement).one()
    
    statement = (
        select(CoinLog)
        .where(CoinLog.user_id == child_id)
        .order_by(CoinLog.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    logs = session.exec(statement).all()
    
    return CoinLogsPublic(data=logs, count=count)


@router.get("/children/{child_id}/redemptions", response_model=PrizeRedemptionsPublic)
def get_child_redemptions(
    session: SessionDep,
    current_user: CurrentParent,
    child_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """宝贝的兑换记录"""
    child = session.get(User, child_id)
    if not child or child.parent_id != current_user.id:
        raise HTTPException(status_code=404, detail="宝贝不存在")
    
    count_statement = (
        select(func.count())
        .select_from(PrizeRedemption)
        .where(PrizeRedemption.user_id == child_id)
    )
    count = session.exec(count_statement).one()
    
    statement = (
        select(PrizeRedemption)
        .where(PrizeRedemption.user_id == child_id)
        .order_by(PrizeRedemption.redeemed_at.desc())
        .offset(skip)
        .limit(limit)
    )
    redemptions = session.exec(statement).all()
    
    return PrizeRedemptionsPublic(data=redemptions, count=count)


@router.get("/children/{child_id}/growth")
def get_child_growth(
    session: SessionDep,
    current_user: CurrentParent,
    child_id: uuid.UUID,
) -> Any:
    """宝贝的成长数据（可复用 growth.py 的逻辑）"""
    child = session.get(User, child_id)
    if not child or child.parent_id != current_user.id:
        raise HTTPException(status_code=404, detail="宝贝不存在")
    
    # 这里可以调用 growth.py 的函数，或者返回一个简单的汇总
    return {
        "child_id": str(child_id),
        "message": "成长数据接口，可调用 /api/v1/growth/* 并传入 user_id 参数",
    }
