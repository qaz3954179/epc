import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentChild, CurrentUser, SessionDep
from app.models import (
    CardDifficulty,
    KnowledgeCard,
    KnowledgeCardCreate,
    KnowledgeCardPublic,
    KnowledgeCardsPublic,
    Message,
    MilestoneProgressUpdate,
    MilestoneType,
    PlanetMilestone,
    PlanetMilestonePublic,
    PlanetMilestonesPublic,
    PlanetStage,
    User,
    UserRole,
    Wish,
    WishCreate,
    WishesPublic,
    WishPlanet,
    WishPlanetDetail,
    WishPlanetPublic,
    WishPlanetsPublic,
    WishPlanetUpdate,
    WishPublic,
    WishReview,
    WishStatus,
)

router = APIRouter(prefix="/planets", tags=["planets"])


# ─── Helper: 获取孩子 ID 列表（家长看孩子的数据）──────────────────

def _get_child_ids(session: Any, current_user: User) -> list[uuid.UUID]:
    """根据角色返回可查看的 child_id 列表"""
    if current_user.role == UserRole.child:
        return [current_user.id]
    elif current_user.role == UserRole.parent:
        statement = select(User.id).where(User.parent_id == current_user.id)
        return list(session.exec(statement).all())
    else:
        # admin 看所有
        return []


def _check_planet_access(
    session: Any, current_user: User, planet_id: uuid.UUID
) -> "WishPlanet":
    """校验星球访问权限并返回星球对象"""
    planet = session.get(WishPlanet, planet_id)
    if not planet:
        raise HTTPException(status_code=404, detail="星球不存在")
    if current_user.is_superuser or current_user.role == UserRole.admin:
        return planet
    if current_user.role == UserRole.child and planet.child_id == current_user.id:
        return planet
    if current_user.role == UserRole.parent:
        child = session.get(User, planet.child_id)
        if child and child.parent_id == current_user.id:
            return planet
    raise HTTPException(status_code=403, detail="权限不足")


def _update_planet_stage(planet: "WishPlanet") -> None:
    """根据里程碑完成情况更新星球阶段和亮度"""
    if planet.total_milestones == 0:
        return
    ratio = planet.completed_milestones / planet.total_milestones
    if ratio >= 1.0:
        planet.stage = PlanetStage.born
        planet.brightness = 100
        planet.born_at = datetime.utcnow()
    elif ratio >= 0.7:
        planet.stage = PlanetStage.thriving
        planet.brightness = 80
    elif ratio >= 0.3:
        planet.stage = PlanetStage.growing
        planet.brightness = 65
    else:
        planet.stage = PlanetStage.sprout
        planet.brightness = 50
    planet.last_activity_at = datetime.utcnow()


def _create_default_milestones(
    session: Any, planet: "WishPlanet"
) -> list["PlanetMilestone"]:
    """为新星球创建默认里程碑"""
    defaults = [
        PlanetMilestone(
            planet_id=planet.id,
            title="阅读 3 张知识卡片",
            description="探索与愿望相关的知识",
            milestone_type=MilestoneType.card_read,
            target_value=3,
            sort_order=0,
        ),
        PlanetMilestone(
            planet_id=planet.id,
            title="连续打卡 7 天",
            description="养成好习惯，坚持每天完成任务",
            milestone_type=MilestoneType.task_streak,
            target_value=7,
            sort_order=1,
        ),
        PlanetMilestone(
            planet_id=planet.id,
            title="攒够 100 学习币",
            description="通过努力积攒学习币",
            milestone_type=MilestoneType.coins_saved,
            target_value=100,
            sort_order=2,
        ),
        PlanetMilestone(
            planet_id=planet.id,
            title="通过一次考试",
            description="在考试中取得好成绩",
            milestone_type=MilestoneType.exam_passed,
            target_value=1,
            sort_order=3,
        ),
        PlanetMilestone(
            planet_id=planet.id,
            title="完成自定义挑战",
            description="完成家长设定的特别挑战",
            milestone_type=MilestoneType.custom,
            target_value=1,
            sort_order=4,
        ),
    ]
    for m in defaults:
        session.add(m)
    return defaults


# ═══════════════════════════════════════════════════════════════════
# 愿望相关
# ═══════════════════════════════════════════════════════════════════


@router.post("/wishes", response_model=WishPublic)
def create_wish(
    *, session: SessionDep, current_user: CurrentChild, wish_in: WishCreate
) -> Any:
    """孩子许愿（需要 child 角色）"""
    wish = Wish.model_validate(wish_in, update={"child_id": current_user.id})
    session.add(wish)
    session.commit()
    session.refresh(wish)
    return wish


@router.get("/wishes", response_model=WishesPublic)
def list_wishes(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    status: WishStatus | None = None,
) -> Any:
    """获取愿望列表（孩子看自己的，家长看孩子的）"""
    child_ids = _get_child_ids(session, current_user)

    base_filter = select(Wish)
    count_filter = select(func.count()).select_from(Wish)

    if child_ids:
        base_filter = base_filter.where(Wish.child_id.in_(child_ids))  # type: ignore
        count_filter = count_filter.where(Wish.child_id.in_(child_ids))  # type: ignore

    if status:
        base_filter = base_filter.where(Wish.status == status)
        count_filter = count_filter.where(Wish.status == status)

    count = session.exec(count_filter).one()
    wishes = session.exec(
        base_filter.order_by(Wish.created_at.desc()).offset(skip).limit(limit)  # type: ignore
    ).all()
    return WishesPublic(data=wishes, count=count)


@router.get("/wishes/{wish_id}", response_model=WishPublic)
def get_wish(
    session: SessionDep, current_user: CurrentUser, wish_id: uuid.UUID
) -> Any:
    """愿望详情"""
    wish = session.get(Wish, wish_id)
    if not wish:
        raise HTTPException(status_code=404, detail="愿望不存在")
    if current_user.is_superuser or current_user.role == UserRole.admin:
        return wish
    if current_user.role == UserRole.child and wish.child_id == current_user.id:
        return wish
    if current_user.role == UserRole.parent:
        child = session.get(User, wish.child_id)
        if child and child.parent_id == current_user.id:
            return wish
    raise HTTPException(status_code=403, detail="权限不足")


@router.put("/wishes/{wish_id}/review", response_model=WishPublic)
def review_wish(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    wish_id: uuid.UUID,
    review_in: WishReview,
) -> Any:
    """家长审核愿望（approve/defer/reject + response）"""
    if current_user.role not in (UserRole.parent, UserRole.admin) and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="仅家长或管理员可审核愿望")

    wish = session.get(Wish, wish_id)
    if not wish:
        raise HTTPException(status_code=404, detail="愿望不存在")

    # 家长只能审核自己孩子的愿望
    if current_user.role == UserRole.parent:
        child = session.get(User, wish.child_id)
        if not child or child.parent_id != current_user.id:
            raise HTTPException(status_code=403, detail="权限不足")

    if wish.status != WishStatus.pending:
        raise HTTPException(status_code=400, detail="该愿望已被审核")

    if review_in.status not in (WishStatus.approved, WishStatus.deferred, WishStatus.rejected):
        raise HTTPException(status_code=400, detail="审核状态无效，请选择 approved/deferred/rejected")

    wish.status = review_in.status
    wish.parent_response = review_in.parent_response
    wish.responded_at = datetime.utcnow()
    session.add(wish)

    # 审核通过时，自动创建星球 + 默认里程碑
    if review_in.status == WishStatus.approved:
        planet = WishPlanet(
            wish_id=wish.id,
            child_id=wish.child_id,
            name=f"{wish.content[:20]}星球",
            stage=PlanetStage.sprout,
            brightness=50,
            total_milestones=5,
        )
        session.add(planet)
        session.flush()  # 获取 planet.id
        _create_default_milestones(session, planet)

    session.commit()
    session.refresh(wish)
    return wish


# ═══════════════════════════════════════════════════════════════════
# 星球相关
# ═══════════════════════════════════════════════════════════════════


@router.get("/", response_model=WishPlanetsPublic)
def list_planets(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    is_active: bool | None = None,
) -> Any:
    """获取星球列表（孩子看自己的，家长看孩子的）"""
    child_ids = _get_child_ids(session, current_user)

    base_filter = select(WishPlanet)
    count_filter = select(func.count()).select_from(WishPlanet)

    if child_ids:
        base_filter = base_filter.where(WishPlanet.child_id.in_(child_ids))  # type: ignore
        count_filter = count_filter.where(WishPlanet.child_id.in_(child_ids))  # type: ignore

    if is_active is not None:
        base_filter = base_filter.where(WishPlanet.is_active == is_active)
        count_filter = count_filter.where(WishPlanet.is_active == is_active)

    count = session.exec(count_filter).one()
    planets = session.exec(
        base_filter.order_by(WishPlanet.created_at.desc()).offset(skip).limit(limit)  # type: ignore
    ).all()
    return WishPlanetsPublic(data=planets, count=count)


@router.get("/{planet_id}", response_model=WishPlanetDetail)
def get_planet(
    session: SessionDep, current_user: CurrentUser, planet_id: uuid.UUID
) -> Any:
    """星球详情（含里程碑和卡片）"""
    planet = _check_planet_access(session, current_user, planet_id)

    # 加载关联数据
    milestones_stmt = (
        select(PlanetMilestone)
        .where(PlanetMilestone.planet_id == planet_id)
        .order_by(PlanetMilestone.sort_order)  # type: ignore
    )
    milestones = session.exec(milestones_stmt).all()

    cards_stmt = (
        select(KnowledgeCard)
        .where(KnowledgeCard.planet_id == planet_id)
        .order_by(KnowledgeCard.sort_order)  # type: ignore
    )
    cards = session.exec(cards_stmt).all()

    # 加载愿望
    wish = session.get(Wish, planet.wish_id)

    return WishPlanetDetail(
        **planet.model_dump(),
        wish=WishPublic.model_validate(wish) if wish else None,
        milestones=[PlanetMilestonePublic.model_validate(m) for m in milestones],
        cards=[KnowledgeCardPublic.model_validate(c) for c in cards],
    )


@router.put("/{planet_id}", response_model=WishPlanetPublic)
def update_planet(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    planet_id: uuid.UUID,
    planet_in: WishPlanetUpdate,
) -> Any:
    """更新星球信息（名字、颜色、emoji）"""
    planet = _check_planet_access(session, current_user, planet_id)
    update_dict = planet_in.model_dump(exclude_unset=True)
    planet.sqlmodel_update(update_dict)
    session.add(planet)
    session.commit()
    session.refresh(planet)
    return planet


# ═══════════════════════════════════════════════════════════════════
# 里程碑相关
# ═══════════════════════════════════════════════════════════════════


@router.get("/{planet_id}/milestones", response_model=PlanetMilestonesPublic)
def list_milestones(
    session: SessionDep, current_user: CurrentUser, planet_id: uuid.UUID
) -> Any:
    """获取里程碑列表"""
    _check_planet_access(session, current_user, planet_id)
    statement = (
        select(PlanetMilestone)
        .where(PlanetMilestone.planet_id == planet_id)
        .order_by(PlanetMilestone.sort_order)  # type: ignore
    )
    milestones = session.exec(statement).all()
    return PlanetMilestonesPublic(data=milestones, count=len(milestones))


@router.put(
    "/{planet_id}/milestones/{milestone_id}/progress",
    response_model=PlanetMilestonePublic,
)
def update_milestone_progress(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    planet_id: uuid.UUID,
    milestone_id: uuid.UUID,
    progress_in: MilestoneProgressUpdate,
) -> Any:
    """更新里程碑进度"""
    planet = _check_planet_access(session, current_user, planet_id)

    milestone = session.get(PlanetMilestone, milestone_id)
    if not milestone or milestone.planet_id != planet_id:
        raise HTTPException(status_code=404, detail="里程碑不存在")
    if milestone.is_completed:
        raise HTTPException(status_code=400, detail="该里程碑已完成")

    milestone.current_value = min(
        milestone.current_value + progress_in.increment, milestone.target_value
    )

    # 检查是否完成
    if milestone.current_value >= milestone.target_value:
        milestone.is_completed = True
        milestone.completed_at = datetime.utcnow()
        planet.completed_milestones += 1
        _update_planet_stage(planet)
        session.add(planet)

    session.add(milestone)
    session.commit()
    session.refresh(milestone)
    return milestone


# ═══════════════════════════════════════════════════════════════════
# 知识卡片相关
# ═══════════════════════════════════════════════════════════════════


@router.get("/{planet_id}/cards", response_model=KnowledgeCardsPublic)
def list_cards(
    session: SessionDep, current_user: CurrentUser, planet_id: uuid.UUID
) -> Any:
    """获取知识卡片列表"""
    _check_planet_access(session, current_user, planet_id)
    statement = (
        select(KnowledgeCard)
        .where(KnowledgeCard.planet_id == planet_id)
        .order_by(KnowledgeCard.sort_order)  # type: ignore
    )
    cards = session.exec(statement).all()
    return KnowledgeCardsPublic(data=cards, count=len(cards))


@router.post("/{planet_id}/cards", response_model=KnowledgeCardPublic)
def create_card(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    planet_id: uuid.UUID,
    card_in: KnowledgeCardCreate,
) -> Any:
    """创建知识卡片（家长或管理员）"""
    if current_user.role not in (UserRole.parent, UserRole.admin) and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="仅家长或管理员可创建知识卡片")

    planet = _check_planet_access(session, current_user, planet_id)
    card = KnowledgeCard.model_validate(card_in, update={"planet_id": planet_id})
    session.add(card)
    session.commit()
    session.refresh(card)
    return card


@router.put("/{planet_id}/cards/{card_id}/read", response_model=KnowledgeCardPublic)
def mark_card_read(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    planet_id: uuid.UUID,
    card_id: uuid.UUID,
) -> Any:
    """标记卡片已读，自动推进 card_read 类型的里程碑"""
    planet = _check_planet_access(session, current_user, planet_id)

    card = session.get(KnowledgeCard, card_id)
    if not card or card.planet_id != planet_id:
        raise HTTPException(status_code=404, detail="知识卡片不存在")
    if card.is_read:
        return card  # 已读，直接返回

    card.is_read = True
    card.read_at = datetime.utcnow()
    session.add(card)

    # 自动推进 card_read 类型的里程碑
    milestones_stmt = select(PlanetMilestone).where(
        PlanetMilestone.planet_id == planet_id,
        PlanetMilestone.milestone_type == MilestoneType.card_read,
        PlanetMilestone.is_completed == False,  # noqa: E712
    )
    card_milestones = session.exec(milestones_stmt).all()
    for milestone in card_milestones:
        milestone.current_value = min(
            milestone.current_value + 1, milestone.target_value
        )
        if milestone.current_value >= milestone.target_value:
            milestone.is_completed = True
            milestone.completed_at = datetime.utcnow()
            planet.completed_milestones += 1
        session.add(milestone)

    # 更新星球状态
    if card_milestones:
        _update_planet_stage(planet)
        session.add(planet)

    session.commit()
    session.refresh(card)
    return card
