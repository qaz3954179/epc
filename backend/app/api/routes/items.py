import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Item, ItemCreate, ItemPublic, ItemsPublic, ItemUpdate, Message, UserRole

router = APIRouter(prefix="/items", tags=["items"])


@router.get("/", response_model=ItemsPublic)
def read_items(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve items.
    child 角色看自己 parent 创建的任务（通过 parent_id 关联）。
    parent 看自己创建的任务。
    admin 看所有。
    """
    if current_user.is_superuser or current_user.role == UserRole.admin:
        count_statement = select(func.count()).select_from(Item)
        count = session.exec(count_statement).one()
        statement = select(Item).offset(skip).limit(limit)
        items = session.exec(statement).all()
    elif current_user.role == UserRole.child:
        # 宝贝看自己 parent 创建的任务
        parent_id = current_user.parent_id
        if parent_id:
            count_statement = (
                select(func.count())
                .select_from(Item)
                .where(Item.owner_id == parent_id)
            )
            count = session.exec(count_statement).one()
            statement = (
                select(Item)
                .where(Item.owner_id == parent_id)
                .offset(skip)
                .limit(limit)
            )
            items = session.exec(statement).all()
        else:
            count = 0
            items = []
    else:
        # parent 看自己创建的
        count_statement = (
            select(func.count())
            .select_from(Item)
            .where(Item.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(Item)
            .where(Item.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        items = session.exec(statement).all()

    return ItemsPublic(data=items, count=count)


@router.get("/{id}", response_model=ItemPublic)
def read_item(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get item by ID.
    """
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    # admin 可以看所有
    if current_user.is_superuser or current_user.role == UserRole.admin:
        return item
    # parent 看自己的
    if current_user.role == UserRole.parent and item.owner_id == current_user.id:
        return item
    # child 看自己 parent 的
    if current_user.role == UserRole.child and item.owner_id == current_user.parent_id:
        return item
    raise HTTPException(status_code=403, detail="权限不足")


@router.post("/", response_model=ItemPublic)
def create_item(
    *, session: SessionDep, current_user: CurrentUser, item_in: ItemCreate
) -> Any:
    """
    Create new item. 只允许 parent 和 admin。
    """
    if current_user.role not in (UserRole.parent, UserRole.admin) and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="只有家长和管理员可以创建任务")
    item = Item.model_validate(item_in, update={"owner_id": current_user.id})
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.put("/{id}", response_model=ItemPublic)
def update_item(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    item_in: ItemUpdate,
) -> Any:
    """
    Update an item. 只允许 parent 和 admin。
    """
    if current_user.role not in (UserRole.parent, UserRole.admin) and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="只有家长和管理员可以编辑任务")
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="权限不足")
    update_dict = item_in.model_dump(exclude_unset=True)
    item.sqlmodel_update(update_dict)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.delete("/{id}")
def delete_item(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete an item. 只允许 parent 和 admin。
    """
    if current_user.role not in (UserRole.parent, UserRole.admin) and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="只有家长和管理员可以删除任务")
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="权限不足")
    session.delete(item)
    session.commit()
    return Message(message="Item deleted successfully")
