import uuid
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import Item, ItemCreate, User, UserCreate, UserUpdate, UserRole


def create_user(*, session: Session, user_create: UserCreate, referred_by_id: uuid.UUID | None = None) -> User:
    db_obj = User.model_validate(
        user_create, update={
            "hashed_password": get_password_hash(user_create.password),
            **({"referred_by_id": referred_by_id} if referred_by_id else {}),
        }
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_user_by_referral_code(*, session: Session, referral_code: str) -> User | None:
    statement = select(User).where(User.referral_code == referral_code)
    return session.exec(statement).first()


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def get_user_by_username(*, session: Session, username: str) -> User | None:
    """按用户名查找用户（宝贝登录用）"""
    statement = select(User).where(User.username == username)
    return session.exec(statement).first()


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    """
    认证用户：自动判断输入是邮箱还是用户名。
    - 包含 @ 视为邮箱（家长/管理员登录）
    - 否则视为用户名（宝贝登录）
    """
    if "@" in email:
        db_user = get_user_by_email(session=session, email=email)
    else:
        db_user = get_user_by_username(session=session, username=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_child_account(
    *, session: Session, parent_id: uuid.UUID,
    username: str, password: str, full_name: str | None = None,
    nickname: str, gender: str, birth_month: str | None = None,
    avatar_url: str | None = None,
) -> User:
    """家长创建宝贝账户"""
    child = User(
        username=username,
        hashed_password=get_password_hash(password),
        full_name=full_name,
        nickname=nickname,
        gender=gender,
        birth_month=birth_month,
        avatar_url=avatar_url,
        role=UserRole.child,
        parent_id=parent_id,
        is_active=True,
        coins=0,
    )
    session.add(child)
    session.commit()
    session.refresh(child)
    return child


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item
