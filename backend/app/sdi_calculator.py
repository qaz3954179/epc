"""
SDI (Self-Drive Index) 自驱力指数计算引擎

SDI = (主动性 × 0.4 + 探索性 × 0.2 + 持续性 × 0.2 + 质量 × 0.2) × 时间衰减系数

时间衰减：
- 近7天权重 = 1.0
- 8-14天权重 = 0.7
- 15-30天权重 = 0.4

各维度得分 0-100：
- 主动性 = self_initiated / total × 100
- 探索性 = (分类覆盖率 × 50) + (可选任务比 × 50)
- 持续性 = min(连续天数 / 21 × 100, 100)
- 质量 = avg(quality_score) × 20  (1-5 → 20-100)
"""
import uuid
from datetime import date, datetime, time, timedelta
from typing import Any

from sqlmodel import Session, col, func, select

from app.models import (
    Item,
    SDIPeriodType,
    SDIRecord,
    SDIRecordPublic,
    TaskCompletion,
    TriggerType,
    User,
    UserRole,
)

# SDI 权重配置
WEIGHTS = {
    "initiative": 0.4,
    "exploration": 0.2,
    "persistence": 0.2,
    "quality": 0.2,
}

# 所有任务分类
ALL_CATEGORIES = {"daily", "exam", "game", "pe"}

# 习惯养成目标天数
HABIT_TARGET_DAYS = 21


def calculate_sdi_for_user(
    session: Session,
    user_id: uuid.UUID,
    target_date: date | None = None,
) -> SDIRecord:
    """
    计算指定用户在指定日期的 SDI 指数。
    如果已有当天记录则更新，否则创建新记录。
    """
    if target_date is None:
        target_date = date.today()

    date_str = target_date.isoformat()

    # 计算各维度得分（带时间衰减的加权）
    initiative = _calc_initiative(session, user_id, target_date)
    exploration = _calc_exploration(session, user_id, target_date)
    persistence = _calc_persistence(session, user_id, target_date)
    quality = _calc_quality(session, user_id, target_date)

    sdi_score = round(
        initiative["score"] * WEIGHTS["initiative"]
        + exploration["score"] * WEIGHTS["exploration"]
        + persistence["score"] * WEIGHTS["persistence"]
        + quality["score"] * WEIGHTS["quality"],
        1,
    )

    detail = {
        "initiative": initiative,
        "exploration": exploration,
        "persistence": persistence,
        "quality": quality,
        "weights": WEIGHTS,
    }

    # 查找或创建记录
    existing = session.exec(
        select(SDIRecord).where(
            SDIRecord.user_id == user_id,
            SDIRecord.record_date == date_str,
            SDIRecord.period_type == SDIPeriodType.daily,
        )
    ).first()

    if existing:
        existing.sdi_score = sdi_score
        existing.initiative_score = initiative["score"]
        existing.exploration_score = exploration["score"]
        existing.persistence_score = persistence["score"]
        existing.quality_score = quality["score"]
        existing.detail = detail
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    record = SDIRecord(
        user_id=user_id,
        record_date=date_str,
        period_type=SDIPeriodType.daily,
        sdi_score=sdi_score,
        initiative_score=initiative["score"],
        exploration_score=exploration["score"],
        persistence_score=persistence["score"],
        quality_score=quality["score"],
        detail=detail,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def calculate_sdi_for_all_children(session: Session, target_date: date | None = None) -> list[SDIRecord]:
    """为所有孩子计算 SDI（定时任务调用）。"""
    children = session.exec(
        select(User).where(User.role == UserRole.child, User.is_active == True)
    ).all()

    records = []
    for child in children:
        try:
            record = calculate_sdi_for_user(session, child.id, target_date)
            records.append(record)
        except Exception:
            continue
    return records


def get_sdi_trend(
    session: Session,
    user_id: uuid.UUID,
    days: int = 30,
) -> list[SDIRecordPublic]:
    """获取用户 SDI 趋势数据。"""
    since = (date.today() - timedelta(days=days)).isoformat()
    stmt = (
        select(SDIRecord)
        .where(
            SDIRecord.user_id == user_id,
            SDIRecord.period_type == SDIPeriodType.daily,
            SDIRecord.record_date >= since,
        )
        .order_by(SDIRecord.record_date)
    )
    records = session.exec(stmt).all()
    return [SDIRecordPublic.model_validate(r) for r in records]


def generate_suggestions(
    initiative: float,
    exploration: float,
    persistence: float,
    quality: float,
    detail: dict,
) -> list[str]:
    """根据各维度得分生成个性化引导建议。"""
    suggestions = []

    # 主动性建议
    if initiative < 40:
        suggestions.append("孩子目前大部分任务需要提醒才完成，建议减少提醒频率，给孩子更多自主空间")
    elif initiative < 70:
        suggestions.append("主动性在提升中，可以尝试让孩子自己安排每天的学习计划")

    # 探索性建议
    if exploration < 40:
        tried = detail.get("exploration", {}).get("categories_tried", [])
        all_cats_cn = {"daily": "日常学习", "exam": "模拟考试", "game": "互动游戏", "pe": "体能项目"}
        missing = [all_cats_cn.get(c, c) for c in ALL_CATEGORIES - set(tried)]
        if missing:
            suggestions.append(f"建议引导孩子尝试：{'、'.join(missing)}，丰富学习维度")
    elif exploration < 70:
        suggestions.append("孩子已经在尝试不同类型的任务了，可以鼓励他深入探索感兴趣的领域")

    # 持续性建议
    if persistence < 40:
        suggestions.append("连续学习天数还不够，建议设定一个小目标，比如先坚持7天")
    elif persistence < 70:
        streak = detail.get("persistence", {}).get("current_streak", 0)
        suggestions.append(f"已经连续学习 {streak} 天了，离21天习惯养成目标越来越近！")

    # 质量建议
    if quality < 40:
        suggestions.append("任务完成质量有提升空间，可以和孩子聊聊怎样把任务做得更好")
    elif quality < 70:
        suggestions.append("完成质量不错，可以适当增加一些有挑战性的任务")

    # 综合建议
    scores = {"主动性": initiative, "探索性": exploration, "持续性": persistence, "质量": quality}
    best = max(scores, key=scores.get)
    worst = min(scores, key=scores.get)
    if scores[best] - scores[worst] > 30:
        suggestions.append(f"孩子的{best}表现突出，{worst}还有提升空间，可以重点关注")

    if not suggestions:
        suggestions.append("各项指标表现均衡，继续保持！")

    return suggestions


def generate_analysis(
    session: Session,
    user_id: uuid.UUID,
    initiative_detail: dict,
    exploration_detail: dict,
    persistence_detail: dict,
    quality_detail: dict,
) -> dict[str, Any]:
    """生成行为分析报告。"""
    analysis = {}

    # 主动性分析
    total = initiative_detail.get("total", 0)
    self_count = initiative_detail.get("self_initiated", 0)
    reminded = initiative_detail.get("parent_reminded", 0)
    deadline = initiative_detail.get("deadline_driven", 0)
    analysis["initiative"] = {
        "total_completions": total,
        "self_initiated": self_count,
        "parent_reminded": reminded,
        "deadline_driven": deadline,
        "rate": round(self_count / total * 100, 1) if total > 0 else 0,
        "summary": _initiative_summary(self_count, total),
    }

    # 探索性分析
    tried = exploration_detail.get("categories_tried", [])
    all_cats_cn = {"daily": "日常学习", "exam": "模拟考试", "game": "互动游戏", "pe": "体能项目"}
    analysis["exploration"] = {
        "categories_tried": [all_cats_cn.get(c, c) for c in tried],
        "categories_missing": [all_cats_cn.get(c, c) for c in ALL_CATEGORIES - set(tried)],
        "breadth_rate": round(len(tried) / len(ALL_CATEGORIES) * 100, 1),
    }

    # 持续性分析
    analysis["persistence"] = {
        "current_streak": persistence_detail.get("current_streak", 0),
        "target_days": HABIT_TARGET_DAYS,
        "progress_rate": round(
            min(persistence_detail.get("current_streak", 0) / HABIT_TARGET_DAYS * 100, 100), 1
        ),
    }

    # 质量分析
    analysis["quality"] = {
        "avg_score": quality_detail.get("avg_score", 0),
        "rated_count": quality_detail.get("rated_count", 0),
        "total_count": quality_detail.get("total_count", 0),
        "extra_count": quality_detail.get("extra_count", 0),
    }

    return analysis


def _initiative_summary(self_count: int, total: int) -> str:
    if total == 0:
        return "暂无数据"
    rate = self_count / total
    if rate >= 0.8:
        return "主动性非常强，大部分任务都是自己想起来做的"
    elif rate >= 0.5:
        return "主动性在提升，有一半以上的任务是主动完成的"
    elif rate >= 0.3:
        return "还需要较多提醒，但已经开始有主动意识了"
    else:
        return "目前大部分任务需要提醒才完成"


# ─── 各维度计算（带时间衰减） ───────────────────────────────────────

def _get_completions_with_decay(
    session: Session,
    user_id: uuid.UUID,
    target_date: date,
) -> tuple[list, list, list]:
    """
    获取近30天的完成记录，按时间衰减分三组：
    - 近7天 (权重1.0)
    - 8-14天 (权重0.7)
    - 15-30天 (权重0.4)
    返回 (week1, week2, month) 三组记录
    """
    d7 = datetime.combine(target_date - timedelta(days=6), time.min)
    d14 = datetime.combine(target_date - timedelta(days=13), time.min)
    d30 = datetime.combine(target_date - timedelta(days=29), time.min)
    end = datetime.combine(target_date, time.max)

    stmt = (
        select(TaskCompletion)
        .where(
            TaskCompletion.user_id == user_id,
            col(TaskCompletion.completed_at) >= d30,
            col(TaskCompletion.completed_at) <= end,
        )
    )
    all_completions = session.exec(stmt).all()

    week1, week2, month = [], [], []
    for c in all_completions:
        if c.completed_at >= d7:
            week1.append(c)
        elif c.completed_at >= d14:
            week2.append(c)
        else:
            month.append(c)

    return week1, week2, month


def _weighted_score(s1: float, s2: float, s3: float) -> float:
    """加权平均（时间衰减）。"""
    weights = [1.0, 0.7, 0.4]
    scores = [s1, s2, s3]
    # 只计算有数据的时段
    total_weight = sum(w for w, s in zip(weights, scores) if s is not None)
    if total_weight == 0:
        return 0.0
    weighted = sum(w * (s or 0) for w, s in zip(weights, scores))
    return round(weighted / total_weight, 1)


def _calc_initiative(session: Session, user_id: uuid.UUID, target_date: date) -> dict:
    """计算主动性得分。"""
    week1, week2, month = _get_completions_with_decay(session, user_id, target_date)

    def _rate(completions):
        if not completions:
            return None, 0, 0, 0, 0
        total = len(completions)
        self_init = sum(1 for c in completions if c.trigger_type == TriggerType.self_initiated)
        reminded = sum(1 for c in completions if c.trigger_type == TriggerType.parent_reminded)
        deadline = sum(1 for c in completions if c.trigger_type == TriggerType.deadline_driven)
        no_tag = total - self_init - reminded - deadline
        rate = self_init / total * 100 if total > 0 else 0
        return rate, total, self_init, reminded, deadline

    r1, t1, s1, rem1, dl1 = _rate(week1)
    r2, _, _, _, _ = _rate(week2)
    r3, _, _, _, _ = _rate(month)

    score = _weighted_score(r1 or 0, r2 or 0, r3 or 0)

    all_completions = week1 + week2 + month
    total = len(all_completions)
    self_initiated = sum(1 for c in all_completions if c.trigger_type == TriggerType.self_initiated)
    parent_reminded = sum(1 for c in all_completions if c.trigger_type == TriggerType.parent_reminded)
    deadline_driven = sum(1 for c in all_completions if c.trigger_type == TriggerType.deadline_driven)

    return {
        "score": min(score, 100),
        "total": total,
        "self_initiated": self_initiated,
        "parent_reminded": parent_reminded,
        "deadline_driven": deadline_driven,
    }


def _calc_exploration(session: Session, user_id: uuid.UUID, target_date: date) -> dict:
    """计算探索性得分。"""
    since = datetime.combine(target_date - timedelta(days=29), time.min)
    end = datetime.combine(target_date, time.max)

    # 查询尝试过的分类
    stmt = (
        select(Item.category)
        .join(TaskCompletion, TaskCompletion.item_id == Item.id)
        .where(
            TaskCompletion.user_id == user_id,
            col(TaskCompletion.completed_at) >= since,
            col(TaskCompletion.completed_at) <= end,
            Item.category.is_not(None),
        )
        .distinct()
    )
    tried = list(session.exec(stmt).all())

    breadth = len(tried) / len(ALL_CATEGORIES) * 50 if ALL_CATEGORIES else 0

    # 探索深度：非必选（game/pe）vs 必选（daily/exam）
    optional_cats = {"game", "pe"}
    required_cats = {"daily", "exam"}

    optional_stmt = (
        select(func.count())
        .select_from(TaskCompletion)
        .join(Item, TaskCompletion.item_id == Item.id)
        .where(
            TaskCompletion.user_id == user_id,
            col(TaskCompletion.completed_at) >= since,
            col(TaskCompletion.completed_at) <= end,
            Item.category.in_(optional_cats),
        )
    )
    optional_count = session.exec(optional_stmt).one()

    required_stmt = (
        select(func.count())
        .select_from(TaskCompletion)
        .join(Item, TaskCompletion.item_id == Item.id)
        .where(
            TaskCompletion.user_id == user_id,
            col(TaskCompletion.completed_at) >= since,
            col(TaskCompletion.completed_at) <= end,
            Item.category.in_(required_cats),
        )
    )
    required_count = session.exec(required_stmt).one()

    depth = min(optional_count / max(required_count, 1) * 50, 50)

    score = round(breadth + depth, 1)

    return {
        "score": min(score, 100),
        "categories_tried": tried,
        "breadth": round(breadth, 1),
        "depth": round(depth, 1),
        "optional_count": optional_count,
        "required_count": required_count,
    }


def _calc_persistence(session: Session, user_id: uuid.UUID, target_date: date) -> dict:
    """计算持续性得分（连续完成天数）。"""
    streak = 0
    for i in range(HABIT_TARGET_DAYS + 30):
        check_date = target_date - timedelta(days=i)
        day_start = datetime.combine(check_date, time.min)
        day_end = datetime.combine(check_date, time.max)

        count_stmt = (
            select(func.count())
            .select_from(TaskCompletion)
            .where(
                TaskCompletion.user_id == user_id,
                col(TaskCompletion.completed_at) >= day_start,
                col(TaskCompletion.completed_at) <= day_end,
            )
        )
        count = session.exec(count_stmt).one()
        if count > 0:
            streak += 1
        else:
            break

    score = min(streak / HABIT_TARGET_DAYS * 100, 100)

    return {
        "score": round(score, 1),
        "current_streak": streak,
        "target_days": HABIT_TARGET_DAYS,
    }


def _calc_quality(session: Session, user_id: uuid.UUID, target_date: date) -> dict:
    """计算质量得分。"""
    since = datetime.combine(target_date - timedelta(days=29), time.min)
    end = datetime.combine(target_date, time.max)

    # 有评分的记录
    rated_stmt = (
        select(TaskCompletion)
        .where(
            TaskCompletion.user_id == user_id,
            col(TaskCompletion.completed_at) >= since,
            col(TaskCompletion.completed_at) <= end,
            TaskCompletion.quality_score.is_not(None),
        )
    )
    rated = session.exec(rated_stmt).all()

    # 总记录数
    total_stmt = (
        select(func.count())
        .select_from(TaskCompletion)
        .where(
            TaskCompletion.user_id == user_id,
            col(TaskCompletion.completed_at) >= since,
            col(TaskCompletion.completed_at) <= end,
        )
    )
    total_count = session.exec(total_stmt).one()

    # 超额完成数
    extra_stmt = (
        select(func.count())
        .select_from(TaskCompletion)
        .where(
            TaskCompletion.user_id == user_id,
            col(TaskCompletion.completed_at) >= since,
            col(TaskCompletion.completed_at) <= end,
            TaskCompletion.is_extra == True,
        )
    )
    extra_count = session.exec(extra_stmt).one()

    if rated:
        avg_score = sum(c.quality_score for c in rated) / len(rated)
        # 1-5 分映射到 20-100
        score = avg_score * 20
    elif total_count > 0:
        # 没有评分数据时，用超额完成率作为替代指标
        extra_rate = extra_count / total_count
        score = min(extra_rate * 100 + 50, 100)  # 基础50分 + 超额加分
    else:
        score = 0

    return {
        "score": round(min(score, 100), 1),
        "avg_score": round(sum(c.quality_score for c in rated) / len(rated), 1) if rated else 0,
        "rated_count": len(rated),
        "total_count": total_count,
        "extra_count": extra_count,
    }
