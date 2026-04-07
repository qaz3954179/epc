import uuid
from datetime import date, datetime, time
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    CoinLogPublic,
    CoinLogsPublic,
    Item,
    Message,
    TaskCompletion,
    TaskCompletionPublic,
    TodayTaskPublic,
    TodayTasksPublic,
    User,
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
        select(TaskCompletion, Item)
        .join(Item, TaskCompletion.item_id == Item.id)
        .where(
            TaskCompletion.user_id == current_user.id,
            col(TaskCompletion.completed_at) >= start,
            col(TaskCompletion.completed_at) <= end,
        )
        .order_by(col(TaskCompletion.completed_at).desc())
    )
    results = session.exec(stmt).all()

    logs = [
        CoinLogPublic(
            name=item.title,
            completed_at=completion.completed_at,
            amount=item.coins_reward,
        )
        for completion, item in results
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
    """
    start, end = _today_range()

    # Get all items belonging to the user
    items_stmt = select(Item).where(Item.owner_id == current_user.id)
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
) -> Any:
    """
    Record a task completion. Respects the target_count limit per day.
    """
    item = session.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="任务不存在")
    if not current_user.is_superuser and item.owner_id != current_user.id:
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
    )
    session.add(completion)

    # Add coins to user balance
    user = session.get(User, current_user.id)
    if user:
        user.coins = (user.coins or 0) + item.coins_reward
        session.add(user)

    session.commit()
    session.refresh(completion)
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
