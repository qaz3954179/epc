"""
成长记录 API — P0 功能
- 习惯热力图 (heatmap)
- 进步报告 (progress)
- 奖励记录 (rewards)
"""

import uuid
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import literal_column
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    CategoryStats,
    DailyCompletionPoint,
    HeatmapData,
    Item,
    Message,
    PeriodComparison,
    Prize,
    PrizeRedemption,
    PrizeRedemptionPublic,
    PrizeRedemptionsPublic,
    ProgressReport,
    RewardSummary,
    TaskCompletion,
    User,
)

router = APIRouter(prefix="/growth", tags=["growth"])


# ─── Helpers ────────────────────────────────────────────────────────


def _date_range(d: date) -> tuple[datetime, datetime]:
    return datetime.combine(d, time.min), datetime.combine(d, time.max)


def _week_range(d: date) -> tuple[date, date]:
    """Return (Monday, Sunday) of the week containing `d`."""
    monday = d - timedelta(days=d.weekday())
    sunday = monday + timedelta(days=6)
    return monday, sunday


def _month_range(d: date) -> tuple[date, date]:
    """Return (first_day, last_day) of the month containing `d`."""
    first = d.replace(day=1)
    if d.month == 12:
        last = d.replace(year=d.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        last = d.replace(month=d.month + 1, day=1) - timedelta(days=1)
    return first, last


def _compute_streaks(
    completion_dates: set[date], today: date
) -> tuple[int, int]:
    """
    Given a set of dates with completions, compute:
    - current_streak: consecutive days ending today (or yesterday)
    - longest_streak: longest run ever
    """
    if not completion_dates:
        return 0, 0

    sorted_dates = sorted(completion_dates)

    # Longest streak
    longest = 1
    current_run = 1
    for i in range(1, len(sorted_dates)):
        if sorted_dates[i] - sorted_dates[i - 1] == timedelta(days=1):
            current_run += 1
            longest = max(longest, current_run)
        else:
            current_run = 1

    # Current streak (must include today or yesterday)
    current_streak = 0
    check = today
    if check not in completion_dates:
        check = today - timedelta(days=1)
    while check in completion_dates:
        current_streak += 1
        check -= timedelta(days=1)

    return current_streak, longest


def _generate_summary(
    period: str,
    comparison: PeriodComparison,
    category_stats: list[CategoryStats],
) -> str:
    """Auto-generate a short summary text."""
    parts: list[str] = []

    period_label = "本周" if period == "week" else "本月"
    prev_label = "上周" if period == "week" else "上月"

    if comparison.current_count == 0 and comparison.previous_count == 0:
        return f"{period_label}还没有完成任何任务，加油！"

    if comparison.change_rate > 0:
        parts.append(
            f"{period_label}比{prev_label}多完成了"
            f" {comparison.current_count - comparison.previous_count} 个任务，"
            f"进步 {comparison.change_rate:.0f}%！"
        )
    elif comparison.change_rate < 0:
        parts.append(
            f"{period_label}比{prev_label}少完成了"
            f" {comparison.previous_count - comparison.current_count} 个任务，"
            f"要继续努力哦！"
        )
    else:
        parts.append(f"{period_label}和{prev_label}完成任务数持平。")

    # Find best category
    if category_stats:
        best = max(category_stats, key=lambda c: c.count)
        cat_names = {
            "daily": "日常",
            "exam": "考试",
            "game": "游戏",
            "pe": "体育",
        }
        cat_label = cat_names.get(best.category, best.category)
        parts.append(f"{cat_label}类表现最好！")

    return "".join(parts)


# ─── Heatmap ────────────────────────────────────────────────────────


@router.get("/heatmap", response_model=HeatmapData)
def get_heatmap(
    session: SessionDep,
    current_user: CurrentUser,
    days: int = Query(default=90, ge=7, le=365),
    user_id: uuid.UUID | None = None,
) -> Any:
    """
    获取习惯热力图数据。
    管理员可通过 user_id 查看其他用户；普通用户只能看自己。
    """
    target_id = _resolve_target(current_user, user_id)

    today = date.today()
    start_date = today - timedelta(days=days - 1)
    start_dt = datetime.combine(start_date, time.min)

    # Query completions grouped by date
    stmt = (
        select(
            func.date(TaskCompletion.completed_at).label("d"),
            func.count().label("cnt"),
        )
        .where(
            TaskCompletion.user_id == target_id,
            col(TaskCompletion.completed_at) >= start_dt,
        )
        .group_by(func.date(TaskCompletion.completed_at))
    )
    rows = session.exec(stmt).all()

    counts_by_date: dict[date, int] = {}
    for row in rows:
        d = row.d if isinstance(row.d, date) else date.fromisoformat(str(row.d))
        counts_by_date[d] = row.cnt

    # Build full day list (fill zeros)
    day_list: list[DailyCompletionPoint] = []
    for offset in range(days):
        d = start_date + timedelta(days=offset)
        day_list.append(
            DailyCompletionPoint(
                date=d.isoformat(),
                count=counts_by_date.get(d, 0),
            )
        )

    completion_dates = {d for d, c in counts_by_date.items() if c > 0}
    current_streak, longest_streak = _compute_streaks(completion_dates, today)

    return HeatmapData(
        days=day_list,
        current_streak=current_streak,
        longest_streak=longest_streak,
        total_completions=sum(counts_by_date.values()),
    )


# ─── Progress Report ───────────────────────────────────────────────


@router.get("/progress", response_model=ProgressReport)
def get_progress(
    session: SessionDep,
    current_user: CurrentUser,
    period: str = Query(default="week", pattern="^(week|month)$"),
    user_id: uuid.UUID | None = None,
) -> Any:
    """
    获取进步报告（周/月对比）。
    """
    target_id = _resolve_target(current_user, user_id)
    today = date.today()

    if period == "week":
        cur_start, cur_end = _week_range(today)
        prev_start = cur_start - timedelta(days=7)
        prev_end = cur_start - timedelta(days=1)
    else:
        cur_start, cur_end = _month_range(today)
        prev_month = (cur_start - timedelta(days=1))
        prev_start, prev_end = _month_range(prev_month)

    # Query helper: completions + coins in a date range
    def _query_period(start: date, end: date):
        start_dt = datetime.combine(start, time.min)
        end_dt = datetime.combine(end, time.max)
        stmt = (
            select(
                func.count().label("cnt"),
                func.coalesce(func.sum(Item.coins_reward), 0).label("coins"),
            )
            .select_from(TaskCompletion)
            .join(Item, TaskCompletion.item_id == Item.id)
            .where(
                TaskCompletion.user_id == target_id,
                col(TaskCompletion.completed_at) >= start_dt,
                col(TaskCompletion.completed_at) <= end_dt,
            )
        )
        row = session.exec(stmt).one()
        return row.cnt, row.coins

    cur_count, cur_coins = _query_period(cur_start, cur_end)
    prev_count, prev_coins = _query_period(prev_start, prev_end)

    change_rate = 0.0
    if prev_count > 0:
        change_rate = ((cur_count - prev_count) / prev_count) * 100

    comparison = PeriodComparison(
        current_count=cur_count,
        previous_count=prev_count,
        current_coins=cur_coins,
        previous_coins=prev_coins,
        change_rate=round(change_rate, 1),
    )

    # Category breakdown for current period
    cat_stmt = (
        select(
            func.coalesce(Item.category, "other").label("cat"),
            func.count().label("cnt"),
            func.coalesce(func.sum(Item.coins_reward), 0).label("coins"),
        )
        .select_from(TaskCompletion)
        .join(Item, TaskCompletion.item_id == Item.id)
        .where(
            TaskCompletion.user_id == target_id,
            col(TaskCompletion.completed_at) >= datetime.combine(cur_start, time.min),
            col(TaskCompletion.completed_at) <= datetime.combine(cur_end, time.max),
        )
        .group_by(literal_column("cat"))
    )
    cat_rows = session.exec(cat_stmt).all()
    category_stats = [
        CategoryStats(category=r.cat, count=r.cnt, coins_earned=r.coins)
        for r in cat_rows
    ]

    # Daily trend for current period
    trend_stmt = (
        select(
            func.date(TaskCompletion.completed_at).label("d"),
            func.count().label("cnt"),
        )
        .where(
            TaskCompletion.user_id == target_id,
            col(TaskCompletion.completed_at) >= datetime.combine(cur_start, time.min),
            col(TaskCompletion.completed_at) <= datetime.combine(cur_end, time.max),
        )
        .group_by(func.date(TaskCompletion.completed_at))
    )
    trend_rows = session.exec(trend_stmt).all()
    trend_map = {}
    for r in trend_rows:
        d = r.d if isinstance(r.d, date) else date.fromisoformat(str(r.d))
        trend_map[d] = r.cnt

    daily_trend: list[DailyCompletionPoint] = []
    d = cur_start
    while d <= min(cur_end, today):
        daily_trend.append(
            DailyCompletionPoint(date=d.isoformat(), count=trend_map.get(d, 0))
        )
        d += timedelta(days=1)

    summary = _generate_summary(period, comparison, category_stats)

    return ProgressReport(
        period=period,
        comparison=comparison,
        category_stats=category_stats,
        daily_trend=daily_trend,
        summary=summary,
    )


# ─── Rewards ────────────────────────────────────────────────────────


@router.get("/rewards", response_model=RewardSummary)
def get_rewards(
    session: SessionDep,
    current_user: CurrentUser,
    user_id: uuid.UUID | None = None,
) -> Any:
    """
    获取奖励汇总：总收入、总支出、分类收入、最近兑换记录。
    """
    target_id = _resolve_target(current_user, user_id)

    # Total coins earned (from task completions)
    earned_stmt = (
        select(func.coalesce(func.sum(Item.coins_reward), 0))
        .select_from(TaskCompletion)
        .join(Item, TaskCompletion.item_id == Item.id)
        .where(TaskCompletion.user_id == target_id)
    )
    total_earned = session.exec(earned_stmt).one()

    # Total coins spent (from redemptions)
    spent_stmt = (
        select(func.coalesce(func.sum(PrizeRedemption.coins_spent), 0))
        .where(PrizeRedemption.user_id == target_id)
    )
    total_spent = session.exec(spent_stmt).one()

    # Current balance
    user = session.get(User, target_id)
    balance = user.coins if user else 0

    # Earnings by category
    cat_stmt = (
        select(
            func.coalesce(Item.category, "other").label("cat"),
            func.count().label("cnt"),
            func.coalesce(func.sum(Item.coins_reward), 0).label("coins"),
        )
        .select_from(TaskCompletion)
        .join(Item, TaskCompletion.item_id == Item.id)
        .where(TaskCompletion.user_id == target_id)
        .group_by(literal_column("cat"))
    )
    cat_rows = session.exec(cat_stmt).all()
    category_earnings = [
        CategoryStats(category=r.cat, count=r.cnt, coins_earned=r.coins)
        for r in cat_rows
    ]

    # Recent redemptions (last 20)
    redemptions_stmt = (
        select(PrizeRedemption)
        .where(PrizeRedemption.user_id == target_id)
        .order_by(col(PrizeRedemption.redeemed_at).desc())
        .limit(20)
    )
    redemptions = session.exec(redemptions_stmt).all()

    return RewardSummary(
        total_coins_earned=total_earned,
        total_coins_spent=total_spent,
        current_balance=balance,
        category_earnings=category_earnings,
        recent_redemptions=redemptions,
    )


# ─── Prize Redemption ──────────────────────────────────────────────


@router.post("/prizes/{prize_id}/redeem", response_model=PrizeRedemptionPublic)
def redeem_prize(
    session: SessionDep,
    current_user: CurrentUser,
    prize_id: uuid.UUID,
) -> Any:
    """
    兑换奖品：扣除学习币，减库存，创建兑换记录。
    """
    prize = session.get(Prize, prize_id)
    if not prize:
        raise HTTPException(status_code=404, detail="奖品不存在")

    if prize.stock <= 0:
        raise HTTPException(status_code=400, detail="奖品库存不足")

    user = session.get(User, current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if user.coins < prize.coins_cost:
        raise HTTPException(
            status_code=400,
            detail=f"学习币不足，需要 {prize.coins_cost}，当前余额 {user.coins}",
        )

    # Deduct coins
    user.coins -= prize.coins_cost
    session.add(user)

    # Decrease stock
    prize.stock -= 1
    session.add(prize)

    # Create redemption record
    redemption = PrizeRedemption(
        user_id=user.id,
        prize_id=prize.id,
        prize_name=prize.name,
        coins_spent=prize.coins_cost,
    )
    session.add(redemption)

    session.commit()
    session.refresh(redemption)
    return redemption


@router.get("/redemptions", response_model=PrizeRedemptionsPublic)
def get_redemptions(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
    user_id: uuid.UUID | None = None,
) -> Any:
    """获取兑换记录列表。"""
    target_id = _resolve_target(current_user, user_id)

    count_stmt = (
        select(func.count())
        .select_from(PrizeRedemption)
        .where(PrizeRedemption.user_id == target_id)
    )
    count = session.exec(count_stmt).one()

    stmt = (
        select(PrizeRedemption)
        .where(PrizeRedemption.user_id == target_id)
        .order_by(col(PrizeRedemption.redeemed_at).desc())
        .offset(skip)
        .limit(limit)
    )
    records = session.exec(stmt).all()

    return PrizeRedemptionsPublic(data=records, count=count)


# ─── Auth helper ────────────────────────────────────────────────────


def _resolve_target(current_user: User, user_id: uuid.UUID | None) -> uuid.UUID:
    """管理员可查看任意用户，普通用户只能看自己。"""
    if user_id and user_id != current_user.id:
        if not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="无权查看其他用户数据")
        return user_id
    return current_user.id
