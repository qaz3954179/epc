import uuid
from datetime import date, datetime, time
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.achievement_checker import check_achievements_for_user
from app.api.deps import CurrentUser, CurrentChild, CurrentParent, SessionDep
from app.models import (
    CoinLog,
    CoinLogPublic,
    CoinLogsPublic,
    Item,
    Message,
    TaskCompletion,
    TaskCompletionCreate,
    TaskCompletionPublic,
    TaskCompletionQualityUpdate,
    TodayTaskPublic,
    TodayTasksPublic,
    User,
    UserRole,
)

router = APIRouter(prefix="/task-completions", tags=["task-completions"])


def _today_range() -> tuple[datetime, datetime]:
    """Return (start, end) datetimes for today (UTC)."""
    today = date.today()
    return datetime.combine(today, time.min), datetime.combine(today, time.max)


@router.get("/coin-logs/today", response_model=CoinLogsPublic)
def get_today_coin_logs(
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get today's coin transaction logs for the current user.
    """
    start, end = _today_range()

    stmt = (
        select(CoinLog)
        .where(
            CoinLog.user_id == current_user.id,
            col(CoinLog.created_at) >= start,
            col(CoinLog.created_at) <= end,
        )
        .order_by(col(CoinLog.created_at).desc())
    )
    results = session.exec(stmt).all()

    logs = [
        CoinLogPublic(
            id=log.id,
            amount=log.amount,
            balance_after=log.balance_after,
            transaction_type=log.transaction_type,
            description=log.description,
            created_at=log.created_at,
            related_id=log.related_id,
        )
        for log in results
    ]

    return CoinLogsPublic(data=logs, count=len(logs))


@router.get("/today", response_model=TodayTasksPublic)
def get_today_tasks(
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get today's tasks with completion counts for the current user.
    Daily tasks always show; weekly tasks show every day of the week.
    child 角色看自己 parent 创建的任务。
    """
    start, end = _today_range()

    # 确定任务所有者：child 看 parent 的任务，parent 看自己的
    if current_user.role == UserRole.child and current_user.parent_id:
        owner_id = current_user.parent_id
    else:
        owner_id = current_user.id

    # Get all items belonging to the owner
    items_stmt = select(Item).where(Item.owner_id == owner_id)
    items = session.exec(items_stmt).all()

    result: list[TodayTaskPublic] = []
    for item in items:
        # Count today's completions for this item by this user
        count_stmt = (
            select(func.count())
            .select_from(TaskCompletion)
            .where(
                TaskCompletion.item_id == item.id,
                TaskCompletion.user_id == current_user.id,
                col(TaskCompletion.completed_at) >= start,
                col(TaskCompletion.completed_at) <= end,
            )
        )
        completed_count = session.exec(count_stmt).one()

        result.append(
            TodayTaskPublic(
                id=item.id,
                title=item.title,
                description=item.description,
                category=item.category,
                task_type=item.task_type,
                target_count=item.target_count,
                coins_reward=item.coins_reward,
                completed_count=completed_count,
                completed_today=completed_count >= item.target_count,
            )
        )

    return TodayTasksPublic(data=result, count=len(result))


@router.post("/{item_id}/complete", response_model=TaskCompletionPublic)
def complete_task(
    session: SessionDep,
    current_user: CurrentUser,
    item_id: uuid.UUID,
    completion_data: TaskCompletionCreate,
) -> Any:
    """
    Record a task completion. Respects the target_count limit per day.
    支持记录 trigger_type（触发方式）、is_extra（超额完成）等字段。
    """
    # 只允许 child 角色完成任务
    if current_user.role != UserRole.child and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="只有宝贝可以完成任务")

    item = session.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="任务不存在")
    # child 可以完成自己 parent 创建的任务
    if not current_user.is_superuser:
        allowed_owner = current_user.parent_id if current_user.role == UserRole.child else current_user.id
        if item.owner_id != allowed_owner:
            raise HTTPException(status_code=403, detail="无权操作此任务")

    # Check today's completion count
    start, end = _today_range()
    count_stmt = (
        select(func.count())
        .select_from(TaskCompletion)
        .where(
            TaskCompletion.item_id == item_id,
            TaskCompletion.user_id == current_user.id,
            col(TaskCompletion.completed_at) >= start,
            col(TaskCompletion.completed_at) <= end,
        )
    )
    completed_count = session.exec(count_stmt).one()

    if completed_count >= item.target_count:
        raise HTTPException(
            status_code=400,
            detail=f"今日已完成 {completed_count}/{item.target_count} 次，已达上限",
        )

    completion = TaskCompletion(
        item_id=item_id,
        user_id=current_user.id,
        completed_at=datetime.utcnow(),
        trigger_type=completion_data.trigger_type,
        is_extra=completion_data.is_extra,
        extra_detail=completion_data.extra_detail,
    )
    session.add(completion)

    # Add coins to user balance
    user = session.get(User, current_user.id)
    if user:
        user.coins = (user.coins or 0) + item.coins_reward
        session.add(user)

    session.commit()
    session.refresh(completion)

    # 触发成就检测
    try:
        check_achievements_for_user(session, current_user.id)
    except Exception:
        pass  # 成就检测失败不影响主流程

    return completion


@router.get("/{item_id}/history", response_model=list[TaskCompletionPublic])
def get_task_completions(
    session: SessionDep,
    current_user: CurrentUser,
    item_id: uuid.UUID,
) -> Any:
    """
    Get today's completion records for a specific task.
    """
    start, end = _today_range()
    stmt = (
        select(TaskCompletion)
        .where(
            TaskCompletion.item_id == item_id,
            TaskCompletion.user_id == current_user.id,
            col(TaskCompletion.completed_at) >= start,
            col(TaskCompletion.completed_at) <= end,
        )
        .order_by(col(TaskCompletion.completed_at).desc())
    )
    completions = session.exec(stmt).all()
    return completions


@router.patch("/{completion_id}/quality", response_model=TaskCompletionPublic)
def rate_task_quality(
    session: SessionDep,
    current_user: CurrentParent,
    completion_id: uuid.UUID,
    body: TaskCompletionQualityUpdate,
) -> Any:
    """
    家长对孩子的任务完成质量评分（1-5分）。
    仅家长可操作，且只能评自己孩子的完成记录。
    """
    completion = session.get(TaskCompletion, completion_id)
    if not completion:
        raise HTTPException(status_code=404, detail="完成记录不存在")

    # 校验是否是自己孩子的记录
    child = session.get(User, completion.user_id)
    if not child or child.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="只能评价自己孩子的任务")

    completion.quality_score = body.quality_score
    session.add(completion)
    session.commit()
    session.refresh(completion)

    # 评分后触发成就检测
    try:
        check_achievements_for_user(session, completion.user_id)
    except Exception:
        pass

    return completion


@router.get("/child/{child_id}/completions", response_model=list[TaskCompletionPublic])
def get_child_completions(
    session: SessionDep,
    current_user: CurrentParent,
    child_id: uuid.UUID,
    days: int = 7,
) -> Any:
    """
    家长查看孩子最近 N 天的任务完成记录（含 trigger_type、quality_score 等）。
    用于行为数据分析。
    """
    from datetime import timedelta

    child = session.get(User, child_id)
    if not child or child.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="只能查看自己孩子的记录")

    since = datetime.utcnow() - timedelta(days=days)
    stmt = (
        select(TaskCompletion)
        .where(
            TaskCompletion.user_id == child_id,
            col(TaskCompletion.completed_at) >= since,
        )
        .order_by(col(TaskCompletion.completed_at).desc())
    )
    completions = session.exec(stmt).all()
    return completions
