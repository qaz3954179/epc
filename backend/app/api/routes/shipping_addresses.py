import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select, func

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    ShippingAddress,
    ShippingAddressCreate,
    ShippingAddressPublic,
    ShippingAddressesPublic,
    ShippingAddressUpdate,
)

router = APIRouter(prefix="/shipping-addresses", tags=["shipping-addresses"])


@router.get("/", response_model=ShippingAddressesPublic)
def read_shipping_addresses(session: SessionDep, current_user: CurrentUser) -> Any:
    """获取我的收货地址列表"""
    statement = select(ShippingAddress).where(
        ShippingAddress.user_id == current_user.id
    ).order_by(ShippingAddress.is_default.desc(), ShippingAddress.created_at.desc())
    addresses = session.exec(statement).all()
    count = len(addresses)
    return ShippingAddressesPublic(data=addresses, count=count)


@router.post("/", response_model=ShippingAddressPublic)
def create_shipping_address(
    *, session: SessionDep, current_user: CurrentUser, address_in: ShippingAddressCreate
) -> Any:
    """创建收货地址"""
    # 如果设为默认，先取消其他默认地址
    if address_in.is_default:
        _clear_default(session, current_user.id)

    address = ShippingAddress.model_validate(
        address_in, update={"user_id": current_user.id}
    )
    session.add(address)
    session.commit()
    session.refresh(address)
    return address


@router.get("/{id}", response_model=ShippingAddressPublic)
def read_shipping_address(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """获取单个收货地址"""
    address = _get_own_address(session, current_user.id, id)
    return address


@router.put("/{id}", response_model=ShippingAddressPublic)
def update_shipping_address(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    address_in: ShippingAddressUpdate,
) -> Any:
    """更新收货地址"""
    address = _get_own_address(session, current_user.id, id)

    if address_in.is_default:
        _clear_default(session, current_user.id)

    update_dict = address_in.model_dump(exclude_unset=True)
    address.sqlmodel_update(update_dict)
    address.updated_at = datetime.utcnow()
    session.add(address)
    session.commit()
    session.refresh(address)
    return address


@router.delete("/{id}", response_model=Message)
def delete_shipping_address(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """删除收货地址"""
    address = _get_own_address(session, current_user.id, id)
    session.delete(address)
    session.commit()
    return Message(message="收货地址已删除")


@router.put("/{id}/set-default", response_model=ShippingAddressPublic)
def set_default_address(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """设置默认收货地址"""
    address = _get_own_address(session, current_user.id, id)
    _clear_default(session, current_user.id)
    address.is_default = True
    address.updated_at = datetime.utcnow()
    session.add(address)
    session.commit()
    session.refresh(address)
    return address


# ─── helpers ──────────────────────────────────────────────────────

def _get_own_address(session, user_id: uuid.UUID, id: uuid.UUID) -> ShippingAddress:
    address = session.get(ShippingAddress, id)
    if not address or address.user_id != user_id:
        raise HTTPException(status_code=404, detail="收货地址不存在")
    return address


def _clear_default(session, user_id: uuid.UUID) -> None:
    statement = select(ShippingAddress).where(
        ShippingAddress.user_id == user_id,
        ShippingAddress.is_default == True,  # noqa: E712
    )
    for addr in session.exec(statement).all():
        addr.is_default = False
        session.add(addr)
