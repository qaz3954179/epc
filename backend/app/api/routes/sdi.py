"""
SDI 自驱力指数 API

家长：查看孩子 SDI 仪表盘、趋势、分析报告
管理员：查看所有孩子 SDI、手动触发计算
"""
import uuid
from datetime import date
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from app.api.deps import CurrentParent, CurrentParentOrAdmin, CurrentUser, SessionDep
from app.models import (
    SDIDashboard,
    SDIRecordPublic,
    SDIRecordsPublic,
    User,
    UserRole,
)
from app.sdi_calculator import (
    calculate_sdi_for_all_children,
    calculate_sdi_for_user,
    generate_analysis,
    generate_suggestions,
    get_sdi_trend,
)

router = APIRouter(prefix="/sdi", tags=["sdi"])


@router.get("/child/{child_id}", response_model=SDIDashboard)
def get_child_sdi_dashboard(
    session: SessionDep,
    current_user: CurrentParentOrAdmin,
    child_id: uuid.UUID,
    days: int = Query(default=30, ge=7, le=90),
) -> Any:
    """
    家长查看孩子的 SDI 仪表盘。
    包含当前得分、趋势、四维分析、个性化建议。
    """
    child = session.get(User, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 家长只能看自己的孩子
    if current_user.role == UserRole.parent and child.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="只能查看自己孩子的数据")

    # 计算当天 SDI
    current_record = calculate_sdi_for_user(session, child_id)

    # 获取趋势
    trend = get_sdi_trend(session, child_id, days)

    # 计算上周得分（用于对比）
    previous_score = None
    score_change = None
    if len(trend) >= 2:
        # 找7天前的记录
        for r in reversed(trend):
            if r.record_date < current_record.record_date:
                previous_score = r.sdi_score
                score_change = round(current_record.sdi_score - r.sdi_score, 1)
                break

    # 生成分析报告
    detail = current_record.detail or {}
    analysis = generate_analysis(
        session,
        child_id,
        detail.get("initiative", {}),
        detail.get("exploration", {}),
        detail.get("persistence", {}),
        detail.get("quality", {}),
    )

    # 生成建议
    suggestions = generate_suggestions(
        current_record.initiative_score,
        current_record.exploration_score,
        current_record.persistence_score,
        current_record.quality_score,
        detail,
    )

    return SDIDashboard(
        current_score=current_record.sdi_score,
        previous_score=previous_score,
        score_change=score_change,
        initiative_score=current_record.initiative_score,
        exploration_score=current_record.exploration_score,
        persistence_score=current_record.persistence_score,
        quality_score=current_record.quality_score,
        trend=trend,
        analysis=analysis,
        suggestions=suggestions,
    )


@router.get("/child/{child_id}/trend", response_model=SDIRecordsPublic)
def get_child_sdi_trend(
    session: SessionDep,
    current_user: CurrentParentOrAdmin,
    child_id: uuid.UUID,
    days: int = Query(default=30, ge=7, le=90),
) -> Any:
    """家长查看孩子 SDI 趋势数据（用于图表）。"""
    child = session.get(User, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="用户不存在")

    if current_user.role == UserRole.parent and child.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="只能查看自己孩子的数据")

    trend = get_sdi_trend(session, child_id, days)
    return SDIRecordsPublic(data=trend, count=len(trend))


@router.post("/calculate/{child_id}", response_model=SDIRecordPublic)
def calculate_child_sdi(
    session: SessionDep,
    current_user: CurrentParentOrAdmin,
    child_id: uuid.UUID,
) -> Any:
    """手动触发计算指定孩子的 SDI。"""
    child = session.get(User, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="用户不存在")

    if current_user.role == UserRole.parent and child.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="只能操作自己孩子的数据")

    record = calculate_sdi_for_user(session, child_id)
    return SDIRecordPublic.model_validate(record)


@router.post("/calculate-all")
def calculate_all_sdi(
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    管理员手动触发所有孩子的 SDI 计算。
    通常由定时任务每日调用。
    """
    if not current_user.is_superuser and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="仅管理员可执行此操作")

    records = calculate_sdi_for_all_children(session)
    return {
        "message": f"已计算 {len(records)} 个孩子的 SDI",
        "count": len(records),
    }
