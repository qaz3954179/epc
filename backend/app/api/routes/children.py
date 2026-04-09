import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Child,
    ChildCreate,
    ChildPublic,
    ChildrenPublic,
    ChildUpdate,
    Message,
)

router = APIRouter(prefix="/children", tags=["children"])


@router.get("/", response_model=ChildrenPublic)
def read_children(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """获取当前用户的宝贝列表"""
    count_statement = (
        select(func.count())
        .select_from(Child)
        .where(Child.user_id == current_user.id)
    )
    count = session.exec(count_statement).one()
    statement = (
        select(Child)
        .where(Child.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    children = session.exec(statement).all()
    return ChildrenPublic(data=children, count=count)


@router.get("/{id}", response_model=ChildPublic)
def read_child(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """获取单个宝贝信息"""
    child = session.get(Child, id)
    if not child:
        raise HTTPException(status_code=404, detail="宝贝不存在")
    if child.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")
    return child


@router.post("/", response_model=ChildPublic)
def create_child(
    *, session: SessionDep, current_user: CurrentUser, child_in: ChildCreate
) -> Any:
    """添加宝贝"""
    child = Child.model_validate(child_in, update={"user_id": current_user.id})
    session.add(child)
    session.commit()
    session.refresh(child)
    return child


@router.put("/{id}", response_model=ChildPublic)
def update_child(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    child_in: ChildUpdate,
) -> Any:
    """更新宝贝信息"""
    child = session.get(Child, id)
    if not child:
        raise HTTPException(status_code=404, detail="宝贝不存在")
    if child.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")
    update_dict = child_in.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    child.sqlmodel_update(update_dict)
    session.add(child)
    session.commit()
    session.refresh(child)
    return child


@router.delete("/{id}")
def delete_child(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """删除宝贝"""
    child = session.get(Child, id)
    if not child:
        raise HTTPException(status_code=404, detail="宝贝不存在")
    if child.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")
    session.delete(child)
    session.commit()
    return Message(message="宝贝已删除")
