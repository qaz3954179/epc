"""
成就系统 API

管理员：CRUD 成就定义、手动授予/撤销、全局统计
家长：查看孩子成就列表
孩子：查看已解锁成就、通知
"""
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import col, func, select

from app.api.deps import CurrentChild, CurrentParent, CurrentParentOrAdmin, CurrentUser, SessionDep
from app.models import (
    Achievement,
    AchievementCategory,
    AchievementChildSummary,
    AchievementChildView,
    AchievementCreate,
    AchievementNotification,
    AchievementPublic,
    AchievementsPublic,
    AchievementUpdate,
    User,
    UserAchievement,
    UserAchievementPublic,
    UserAchievementsPublic,
    UserRole,
)

router = APIRouter(prefix="/achievements", tags=["achievements"])


# ─── 管理员：成就定义 CRUD ──────────────────────────────────────────

@router.get("/", response_model=AchievementsPublic)
def list_achievements(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    category: AchievementCategory | None = None,
    is_active: bool | None = None,
) -> Any:
    """管理员查看所有成就定义。"""
    if not current_user.is_superuser and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="仅管理员可查看成就定义列表")

    stmt = select(Achievement)
    count_stmt = select(func.count()).select_from(Achievement)

    if category is not None:
        stmt = stmt.where(Achievement.category == category)
        count_stmt = count_stmt.where(Achievement.category == category)
    if is_active is not None:
        stmt = stmt.where(Achievement.is_active == is_active)
        count_stmt = count_stmt.where(Achievement.is_active == is_active)

    count = session.exec(count_stmt).one()
    achievements = session.exec(stmt.offset(skip).limit(limit).order_by(col(Achievement.created_at).desc())).all()

    return AchievementsPublic(
        data=[AchievementPublic.model_validate(a) for a in achievements],
        count=count,
    )


@router.post("/", response_model=AchievementPublic)
def create_achievement(
    session: SessionDep,
    current_user: CurrentUser,
    body: AchievementCreate,
) -> Any:
    """管理员创建成就定义。"""
    if not current_user.is_superuser and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="仅管理员可创建成就")

    achievement = Achievement.model_validate(body)
    session.add(achievement)
    session.commit()
    session.refresh(achievement)
    return achievement


@router.put("/{achievement_id}", response_model=AchievementPublic)
def update_achievement(
    session: SessionDep,
    current_user: CurrentUser,
    achievement_id: uuid.UUID,
    body: AchievementUpdate,
) -> Any:
    """管理员更新成就定义。"""
    if not current_user.is_superuser and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="仅管理员可更新成就")

    achievement = session.get(Achievement, achievement_id)
    if not achievement:
        raise HTTPException(status_code=404, detail="成就不存在")

    update_data = body.model_dump(exclude_unset=True)
    achievement.sqlmodel_update(update_data)
    achievement.updated_at = datetime.utcnow()
    session.add(achievement)
    session.commit()
    session.refresh(achievement)
    return achievement


@router.delete("/{achievement_id}")
def delete_achievement(
    session: SessionDep,
    current_user: CurrentUser,
    achievement_id: uuid.UUID,
) -> Any:
    """管理员删除成就定义。"""
    if not current_user.is_superuser and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="仅管理员可删除成就")

    achievement = session.get(Achievement, achievement_id)
    if not achievement:
        raise HTTPException(status_code=404, detail="成就不存在")

    session.delete(achievement)
    session.commit()
    return {"message": "成就已删除"}


# ─── 管理员：手动授予/撤销 ──────────────────────────────────────────

@router.post("/{achievement_id}/grant/{user_id}", response_model=UserAchievementPublic)
def grant_achievement(
    session: SessionDep,
    current_user: CurrentUser,
    achievement_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Any:
    """管理员手动授予成就。"""
    if not current_user.is_superuser and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="仅管理员可手动授予成就")

    achievement = session.get(Achievement, achievement_id)
    if not achievement:
        raise HTTPException(status_code=404, detail="成就不存在")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 检查是否已解锁
    existing = session.exec(
        select(UserAchievement).where(
            UserAchievement.user_id == user_id,
            UserAchievement.achievement_id == achievement_id,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该用户已解锁此成就")

    ua = UserAchievement(
        user_id=user_id,
        achievement_id=achievement_id,
        trigger_snapshot={"granted_by": str(current_user.id), "method": "manual"},
    )
    session.add(ua)

    notification = AchievementNotification(
        user_id=user_id,
        achievement_id=achievement_id,
    )
    session.add(notification)

    # 发放奖励币
    if achievement.coins_bonus > 0:
        user.coins = (user.coins or 0) + achievement.coins_bonus
        session.add(user)

    session.commit()
    session.refresh(ua)
    return UserAchievementPublic(
        id=ua.id,
        user_id=ua.user_id,
        achievement_id=ua.achievement_id,
        unlocked_at=ua.unlocked_at,
        trigger_snapshot=ua.trigger_snapshot,
        achievement=AchievementPublic.model_validate(achievement),
    )


@router.delete("/{achievement_id}/revoke/{user_id}")
def revoke_achievement(
    session: SessionDep,
    current_user: CurrentUser,
    achievement_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Any:
    """管理员撤销成就。"""
    if not current_user.is_superuser and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="仅管理员可撤销成就")

    ua = session.exec(
        select(UserAchievement).where(
            UserAchievement.user_id == user_id,
            UserAchievement.achievement_id == achievement_id,
        )
    ).first()
    if not ua:
        raise HTTPException(status_code=404, detail="该用户未解锁此成就")

    session.delete(ua)
    session.commit()
    return {"message": "成就已撤销"}


# ─── 管理员：全局统计 ───────────────────────────────────────────────

@router.get("/stats/global")
def get_global_achievement_stats(
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """管理员查看全局成就解锁统计。"""
    if not current_user.is_superuser and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="仅管理员可查看全局统计")

    stmt = (
        select(
            Achievement.id,
            Achievement.name,
            Achievement.icon,
            Achievement.category,
            func.count(UserAchievement.id).label("unlock_count"),
        )
        .outerjoin(UserAchievement, UserAchievement.achievement_id == Achievement.id)
        .group_by(Achievement.id)
        .order_by(func.count(UserAchievement.id).desc())
    )
    results = session.exec(stmt).all()

    return [
        {
            "id": str(r[0]),
            "name": r[1],
            "icon": r[2],
            "category": r[3],
            "unlock_count": r[4],
        }
        for r in results
    ]


# ─── 孩子：我的成就 ────────────────────────────────────────────────

@router.get("/my", response_model=AchievementChildSummary)
def get_my_achievements(
    session: SessionDep,
    current_user: CurrentChild,
) -> Any:
    """
    孩子查看自己的成就。
    已解锁的显示名称+图标+揭晓文案+解锁时间。
    未解锁的隐藏成就不显示任何信息，只显示总数为 "?"。
    """
    # 获取所有活跃成就
    all_achievements = session.exec(
        select(Achievement).where(Achievement.is_active == True)
    ).all()

    # 获取已解锁的
    unlocked_map: dict[uuid.UUID, UserAchievement] = {}
    unlocked_records = session.exec(
        select(UserAchievement).where(UserAchievement.user_id == current_user.id)
    ).all()
    for ua in unlocked_records:
        unlocked_map[ua.achievement_id] = ua

    unlocked_views: list[AchievementChildView] = []
    for a in all_achievements:
        ua = unlocked_map.get(a.id)
        if ua:
            unlocked_views.append(AchievementChildView(
                id=a.id,
                name=a.name,
                icon=a.icon,
                reveal_message=a.reveal_message,
                category=a.category,
                unlocked=True,
                unlocked_at=ua.unlocked_at,
            ))

    # 按解锁时间倒序
    unlocked_views.sort(key=lambda v: v.unlocked_at or datetime.min, reverse=True)

    return AchievementChildSummary(
        unlocked=unlocked_views,
        unlocked_count=len(unlocked_views),
        total_hidden="?",
    )


# ─── 家长：查看孩子成就 ────────────────────────────────────────────

@router.get("/child/{child_id}", response_model=UserAchievementsPublic)
def get_child_achievements(
    session: SessionDep,
    current_user: CurrentParent,
    child_id: uuid.UUID,
) -> Any:
    """家长查看自己孩子的成就解锁记录。"""
    child = session.get(User, child_id)
    if not child or child.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="只能查看自己孩子的成就")

    stmt = (
        select(UserAchievement)
        .where(UserAchievement.user_id == child_id)
        .order_by(col(UserAchievement.unlocked_at).desc())
    )
    records = session.exec(stmt).all()

    data = []
    for ua in records:
        achievement = session.get(Achievement, ua.achievement_id)
        data.append(UserAchievementPublic(
            id=ua.id,
            user_id=ua.user_id,
            achievement_id=ua.achievement_id,
            unlocked_at=ua.unlocked_at,
            trigger_snapshot=ua.trigger_snapshot,
            achievement=AchievementPublic.model_validate(achievement) if achievement else None,
        ))

    return UserAchievementsPublic(data=data, count=len(data))


# ─── 通知 ──────────────────────────────────────────────────────────

@router.get("/notifications", response_model=list[dict])
def get_achievement_notifications(
    session: SessionDep,
    current_user: CurrentUser,
    unread_only: bool = True,
) -> Any:
    """获取成就解锁通知。"""
    stmt = (
        select(AchievementNotification)
        .where(AchievementNotification.user_id == current_user.id)
    )
    if unread_only:
        stmt = stmt.where(AchievementNotification.is_read == False)
    stmt = stmt.order_by(col(AchievementNotification.created_at).desc())

    notifications = session.exec(stmt).all()

    result = []
    for n in notifications:
        achievement = session.get(Achievement, n.achievement_id)
        result.append({
            "id": str(n.id),
            "achievement_id": str(n.achievement_id),
            "achievement_name": achievement.name if achievement else None,
            "achievement_icon": achievement.icon if achievement else None,
            "reveal_message": achievement.reveal_message if achievement else None,
            "coins_bonus": achievement.coins_bonus if achievement else 0,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        })

    return result


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    session: SessionDep,
    current_user: CurrentUser,
    notification_id: uuid.UUID,
) -> Any:
    """标记通知已读。"""
    notification = session.get(AchievementNotification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="通知不存在")
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权操作")

    notification.is_read = True
    session.add(notification)
    session.commit()
    return {"message": "已标记为已读"}


@router.patch("/notifications/read-all")
def mark_all_notifications_read(
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """标记所有通知已读。"""
    stmt = (
        select(AchievementNotification)
        .where(
            AchievementNotification.user_id == current_user.id,
            AchievementNotification.is_read == False,
        )
    )
    notifications = session.exec(stmt).all()
    for n in notifications:
        n.is_read = True
        session.add(n)
    session.commit()
    return {"message": f"已标记 {len(notifications)} 条通知为已读"}
