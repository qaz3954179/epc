import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    CodingProject,
    CodingProjectCreate,
    CodingProjectPublic,
    CodingProjectsPublic,
    CodingProjectUpdate,
    Message,
    UserRole,
)

router = APIRouter(prefix="/coding", tags=["coding"])


@router.get("/projects", response_model=CodingProjectsPublic)
def list_projects(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
    public_only: bool = False,
) -> Any:
    """获取编程作品列表。宝贝看自己的，家长看孩子的，admin 看所有。"""
    if public_only:
        # 公开作品任何人都能看
        count_stmt = (
            select(func.count())
            .select_from(CodingProject)
            .where(CodingProject.is_public == True)
        )
        count = session.exec(count_stmt).one()
        stmt = (
            select(CodingProject)
            .where(CodingProject.is_public == True)
            .order_by(CodingProject.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
    elif current_user.is_superuser or current_user.role == UserRole.admin:
        count_stmt = select(func.count()).select_from(CodingProject)
        count = session.exec(count_stmt).one()
        stmt = (
            select(CodingProject)
            .order_by(CodingProject.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
    elif current_user.role == UserRole.child:
        count_stmt = (
            select(func.count())
            .select_from(CodingProject)
            .where(CodingProject.user_id == current_user.id)
        )
        count = session.exec(count_stmt).one()
        stmt = (
            select(CodingProject)
            .where(CodingProject.user_id == current_user.id)
            .order_by(CodingProject.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
    else:
        # 家长看自己所有孩子的作品
        from app.models import User

        child_ids_stmt = select(User.id).where(User.parent_id == current_user.id)
        child_ids = list(session.exec(child_ids_stmt).all())
        count_stmt = (
            select(func.count())
            .select_from(CodingProject)
            .where(CodingProject.user_id.in_(child_ids))
        )
        count = session.exec(count_stmt).one()
        stmt = (
            select(CodingProject)
            .where(CodingProject.user_id.in_(child_ids))
            .order_by(CodingProject.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )

    projects = session.exec(stmt).all()
    return CodingProjectsPublic(data=projects, count=count)


@router.get("/projects/{project_id}", response_model=CodingProjectPublic)
def get_project(
    session: SessionDep, current_user: CurrentUser, project_id: uuid.UUID
) -> Any:
    """获取单个编程作品。"""
    project = session.get(CodingProject, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="作品不存在")
    # 公开作品任何人可看
    if project.is_public:
        return project
    # admin 可看所有
    if current_user.is_superuser or current_user.role == UserRole.admin:
        return project
    # 自己的作品
    if project.user_id == current_user.id:
        return project
    # 家长看孩子的
    if current_user.role == UserRole.parent:
        from app.models import User

        child = session.get(User, project.user_id)
        if child and child.parent_id == current_user.id:
            return project
    raise HTTPException(status_code=403, detail="权限不足")


@router.post("/projects", response_model=CodingProjectPublic)
def create_project(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_in: CodingProjectCreate,
) -> Any:
    """创建编程作品。"""
    project = CodingProject.model_validate(
        project_in, update={"user_id": current_user.id}
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@router.put("/projects/{project_id}", response_model=CodingProjectPublic)
def update_project(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
    project_in: CodingProjectUpdate,
) -> Any:
    """更新编程作品。只能改自己的。"""
    project = session.get(CodingProject, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="作品不存在")
    if project.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="只能编辑自己的作品")
    update_dict = project_in.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    project.sqlmodel_update(update_dict)
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@router.delete("/projects/{project_id}")
def delete_project(
    session: SessionDep, current_user: CurrentUser, project_id: uuid.UUID
) -> Message:
    """删除编程作品。"""
    project = session.get(CodingProject, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="作品不存在")
    if project.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="只能删除自己的作品")
    session.delete(project)
    session.commit()
    return Message(message="作品已删除")
