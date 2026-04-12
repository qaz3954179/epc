"""
成就检测引擎

根据 condition_type 分发到不同的评估器：
- streak: 连续天数检查
- count: 累计次数检查
- rate: 比率检查（如主动完成率）
- composite: 复合条件（多个指标组合）

condition_config JSON 结构示例：

streak:
  {"metric": "daily_completion", "days": 7}
  {"metric": "initiative_rate", "days": 7, "min_rate": 0.8}

count:
  {"metric": "total_completions", "threshold": 100}
  {"metric": "total_coins_earned", "threshold": 1000}
  {"metric": "extra_completions", "threshold": 5}
  {"metric": "first_completion", "threshold": 1}
  {"metric": "first_redemption", "threshold": 1}
  {"metric": "low_reward_completions", "threshold": 10, "max_coins": 5}
  {"metric": "early_completions", "threshold": 10, "before_hour": 8}
  {"metric": "new_category_tries", "threshold": 5}

rate:
  {"metric": "initiative_rate", "threshold": 0.8, "window_days": 7}

composite:
  {"operator": "and", "conditions": [
    {"type": "streak", ...},
    {"type": "rate", ...}
  ]}
"""
import uuid
from datetime import date, datetime, time, timedelta
from typing import Any

from sqlmodel import Session, col, func, select

from app.models import (
    Achievement,
    AchievementConditionType,
    AchievementNotification,
    CoinLog,
    Item,
    PrizeRedemption,
    TaskCompletion,
    TriggerType,
    User,
    UserAchievement,
)


def check_achievements_for_user(session: Session, user_id: uuid.UUID) -> list[Achievement]:
    """
    检查用户是否满足任何未解锁成就的条件。
    返回本次新解锁的成就列表。
    """
    # 获取用户已解锁的成就 ID
    unlocked_stmt = select(UserAchievement.achievement_id).where(
        UserAchievement.user_id == user_id
    )
    unlocked_ids = set(session.exec(unlocked_stmt).all())

    # 获取所有活跃成就
    achievements_stmt = select(Achievement).where(Achievement.is_active == True)
    achievements = session.exec(achievements_stmt).all()

    newly_unlocked: list[Achievement] = []

    for achievement in achievements:
        if achievement.id in unlocked_ids:
            continue

        result = evaluate_condition(
            session, user_id, achievement.condition_type, achievement.condition_config
        )
        if result["passed"]:
            # 解锁成就
            user_achievement = UserAchievement(
                user_id=user_id,
                achievement_id=achievement.id,
                unlocked_at=datetime.utcnow(),
                trigger_snapshot=result.get("snapshot", {}),
            )
            session.add(user_achievement)

            # 创建通知
            notification = AchievementNotification(
                user_id=user_id,
                achievement_id=achievement.id,
            )
            session.add(notification)

            # 发放奖励币
            if achievement.coins_bonus > 0:
                user = session.get(User, user_id)
                if user:
                    user.coins = (user.coins or 0) + achievement.coins_bonus
                    session.add(user)

                    coin_log = CoinLog(
                        user_id=user_id,
                        amount=achievement.coins_bonus,
                        balance_after=user.coins,
                        transaction_type="task_completion",
                        description=f"成就解锁奖励：{achievement.name}",
                        related_id=achievement.id,
                    )
                    session.add(coin_log)

            newly_unlocked.append(achievement)

    if newly_unlocked:
        session.commit()

    return newly_unlocked


def evaluate_condition(
    session: Session,
    user_id: uuid.UUID,
    condition_type: AchievementConditionType,
    config: dict[str, Any],
) -> dict[str, Any]:
    """评估单个条件，返回 {"passed": bool, "snapshot": dict}"""
    evaluators = {
        AchievementConditionType.streak: _eval_streak,
        AchievementConditionType.count: _eval_count,
        AchievementConditionType.rate: _eval_rate,
        AchievementConditionType.composite: _eval_composite,
    }
    evaluator = evaluators.get(condition_type)
    if not evaluator:
        return {"passed": False, "snapshot": {"error": f"unknown condition_type: {condition_type}"}}
    return evaluator(session, user_id, config)


# ─── Streak evaluator ──────────────────────────────────────────────

def _eval_streak(session: Session, user_id: uuid.UUID, config: dict) -> dict:
    """
    连续天数检查。
    metric:
      - daily_completion: 每天至少完成1个任务
      - initiative_rate: 每天主动完成率 >= min_rate
    """
    metric = config.get("metric", "daily_completion")
    required_days = config.get("days", 7)
    min_rate = config.get("min_rate", 0.0)

    today = date.today()
    streak = 0

    for i in range(required_days + 30):  # 最多回溯 required_days+30 天
        check_date = today - timedelta(days=i)
        day_start = datetime.combine(check_date, time.min)
        day_end = datetime.combine(check_date, time.max)

        completions_stmt = (
            select(TaskCompletion)
            .where(
                TaskCompletion.user_id == user_id,
                col(TaskCompletion.completed_at) >= day_start,
                col(TaskCompletion.completed_at) <= day_end,
            )
        )
        completions = session.exec(completions_stmt).all()

        if metric == "daily_completion":
            if len(completions) > 0:
                streak += 1
            else:
                break
        elif metric == "initiative_rate":
            if len(completions) == 0:
                break
            self_count = sum(1 for c in completions if c.trigger_type == TriggerType.self_initiated)
            rate = self_count / len(completions)
            if rate >= min_rate:
                streak += 1
            else:
                break

        if streak >= required_days:
            return {
                "passed": True,
                "snapshot": {"streak": streak, "metric": metric, "checked_date": str(today)},
            }

    return {"passed": False, "snapshot": {"streak": streak, "metric": metric}}


# ─── Count evaluator ───────────────────────────────────────────────

def _eval_count(session: Session, user_id: uuid.UUID, config: dict) -> dict:
    """
    累计次数检查。
    metric:
      - total_completions: 总完成次数
      - total_coins_earned: 总获得学习币
      - extra_completions: 超额完成次数
      - first_completion: 首次完成任务
      - first_redemption: 首次兑换奖品
      - low_reward_completions: 低奖励任务完成次数
      - early_completions: 早起完成次数（before_hour 之前）
      - new_category_tries: 首次尝试新分类次数
      - all_categories: 是否尝试了所有分类
    """
    metric = config.get("metric", "total_completions")
    threshold = config.get("threshold", 1)

    if metric == "total_completions":
        count_stmt = (
            select(func.count())
            .select_from(TaskCompletion)
            .where(TaskCompletion.user_id == user_id)
        )
        count = session.exec(count_stmt).one()
        return {"passed": count >= threshold, "snapshot": {"count": count, "metric": metric}}

    elif metric == "total_coins_earned":
        count_stmt = (
            select(func.coalesce(func.sum(CoinLog.amount), 0))
            .where(CoinLog.user_id == user_id, CoinLog.amount > 0)
        )
        total = session.exec(count_stmt).one()
        return {"passed": total >= threshold, "snapshot": {"total": total, "metric": metric}}

    elif metric == "extra_completions":
        count_stmt = (
            select(func.count())
            .select_from(TaskCompletion)
            .where(TaskCompletion.user_id == user_id, TaskCompletion.is_extra == True)
        )
        count = session.exec(count_stmt).one()
        return {"passed": count >= threshold, "snapshot": {"count": count, "metric": metric}}

    elif metric == "first_completion":
        count_stmt = (
            select(func.count())
            .select_from(TaskCompletion)
            .where(TaskCompletion.user_id == user_id)
        )
        count = session.exec(count_stmt).one()
        return {"passed": count >= 1, "snapshot": {"count": count, "metric": metric}}

    elif metric == "first_redemption":
        count_stmt = (
            select(func.count())
            .select_from(PrizeRedemption)
            .where(PrizeRedemption.user_id == user_id)
        )
        count = session.exec(count_stmt).one()
        return {"passed": count >= 1, "snapshot": {"count": count, "metric": metric}}

    elif metric == "low_reward_completions":
        max_coins = config.get("max_coins", 5)
        count_stmt = (
            select(func.count())
            .select_from(TaskCompletion)
            .join(Item, TaskCompletion.item_id == Item.id)
            .where(
                TaskCompletion.user_id == user_id,
                Item.coins_reward <= max_coins,
            )
        )
        count = session.exec(count_stmt).one()
        return {"passed": count >= threshold, "snapshot": {"count": count, "metric": metric, "max_coins": max_coins}}

    elif metric == "early_completions":
        before_hour = config.get("before_hour", 8)
        # 查询所有完成记录，过滤时间
        stmt = (
            select(TaskCompletion)
            .where(
                TaskCompletion.user_id == user_id,
                TaskCompletion.trigger_type == TriggerType.self_initiated,
            )
        )
        completions = session.exec(stmt).all()
        count = sum(1 for c in completions if c.completed_at.hour < before_hour)
        return {"passed": count >= threshold, "snapshot": {"count": count, "metric": metric}}

    elif metric == "new_category_tries":
        # 统计孩子尝试过的不同分类数
        stmt = (
            select(Item.category)
            .join(TaskCompletion, TaskCompletion.item_id == Item.id)
            .where(TaskCompletion.user_id == user_id, Item.category.is_not(None))
            .distinct()
        )
        categories = session.exec(stmt).all()
        return {"passed": len(categories) >= threshold, "snapshot": {"categories": categories, "count": len(categories), "metric": metric}}

    elif metric == "all_categories":
        # 检查是否尝试了所有分类
        all_cats = {"daily", "exam", "game", "pe"}
        stmt = (
            select(Item.category)
            .join(TaskCompletion, TaskCompletion.item_id == Item.id)
            .where(TaskCompletion.user_id == user_id, Item.category.is_not(None))
            .distinct()
        )
        tried = set(session.exec(stmt).all())
        return {"passed": all_cats.issubset(tried), "snapshot": {"tried": list(tried), "all": list(all_cats), "metric": metric}}

    elif metric == "week_all_categories":
        # 单周内每个分类都有完成记录
        all_cats = {"daily", "exam", "game", "pe"}
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_start_dt = datetime.combine(week_start, time.min)
        stmt = (
            select(Item.category)
            .join(TaskCompletion, TaskCompletion.item_id == Item.id)
            .where(
                TaskCompletion.user_id == user_id,
                col(TaskCompletion.completed_at) >= week_start_dt,
                Item.category.is_not(None),
            )
            .distinct()
        )
        tried = set(session.exec(stmt).all())
        return {"passed": all_cats.issubset(tried), "snapshot": {"tried": list(tried), "metric": metric}}

    return {"passed": False, "snapshot": {"error": f"unknown metric: {metric}"}}


# ─── Rate evaluator ────────────────────────────────────────────────

def _eval_rate(session: Session, user_id: uuid.UUID, config: dict) -> dict:
    """
    比率检查。
    metric:
      - initiative_rate: 主动完成率
    """
    metric = config.get("metric", "initiative_rate")
    threshold = config.get("threshold", 0.8)
    window_days = config.get("window_days", 7)

    since = datetime.utcnow() - timedelta(days=window_days)

    if metric == "initiative_rate":
        total_stmt = (
            select(func.count())
            .select_from(TaskCompletion)
            .where(
                TaskCompletion.user_id == user_id,
                col(TaskCompletion.completed_at) >= since,
            )
        )
        total = session.exec(total_stmt).one()
        if total == 0:
            return {"passed": False, "snapshot": {"rate": 0, "total": 0, "metric": metric}}

        self_stmt = (
            select(func.count())
            .select_from(TaskCompletion)
            .where(
                TaskCompletion.user_id == user_id,
                col(TaskCompletion.completed_at) >= since,
                TaskCompletion.trigger_type == TriggerType.self_initiated,
            )
        )
        self_count = session.exec(self_stmt).one()
        rate = self_count / total
        return {
            "passed": rate >= threshold,
            "snapshot": {"rate": round(rate, 3), "self_count": self_count, "total": total, "metric": metric},
        }

    return {"passed": False, "snapshot": {"error": f"unknown metric: {metric}"}}


# ─── Composite evaluator ───────────────────────────────────────────

def _eval_composite(session: Session, user_id: uuid.UUID, config: dict) -> dict:
    """
    复合条件。
    operator: "and" | "or"
    conditions: list of {type, ...config}
    """
    operator = config.get("operator", "and")
    conditions = config.get("conditions", [])

    if not conditions:
        return {"passed": False, "snapshot": {"error": "no conditions"}}

    results = []
    for cond in conditions:
        cond_type_str = cond.pop("type", None)
        if not cond_type_str:
            results.append({"passed": False, "snapshot": {"error": "missing type"}})
            continue
        try:
            cond_type = AchievementConditionType(cond_type_str)
        except ValueError:
            results.append({"passed": False, "snapshot": {"error": f"invalid type: {cond_type_str}"}})
            continue
        result = evaluate_condition(session, user_id, cond_type, cond)
        results.append(result)

    if operator == "and":
        passed = all(r["passed"] for r in results)
    else:
        passed = any(r["passed"] for r in results)

    return {
        "passed": passed,
        "snapshot": {"operator": operator, "sub_results": [r["snapshot"] for r in results]},
    }
