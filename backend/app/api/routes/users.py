import uuid
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import col, delete, func, select

from app import crud
from app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models import (
    Item,
    Message,
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UserRole,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
    VerifyEmail,
)
from app.utils import generate_new_account_email, generate_verification_code, generate_verification_code_email, send_email

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100, role: UserRole | None = None) -> Any:
    """
    Retrieve users. 支持按 role 筛选。
    """
    statement = select(User)
    count_statement = select(func.count()).select_from(User)
    
    if role:
        statement = statement.where(User.role == role)
        count_statement = count_statement.where(User.role == role)

    count = session.exec(count_statement).one()
    statement = statement.offset(skip).limit(limit)
    users = session.exec(statement).all()

    return UsersPublic(data=users, count=count)


@router.post(
    "/", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic
)
def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    """
    Create new user.
    """
    user = crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    user = crud.create_user(session=session, user_create=user_in)
    if settings.emails_enabled and user_in.email:
        email_data = generate_new_account_email(
            email_to=user_in.email, username=user_in.email, password=user_in.password
        )
        send_email(
            email_to=user_in.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    return user


@router.patch("/me", response_model=UserPublic)
def update_user_me(
    *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """
    Update own user.
    """

    if user_in.email:
        existing_user = crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.patch("/me/password", response_model=Message)
def update_password_me(
    *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """
    Update own password.
    """
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    hashed_password = get_password_hash(body.new_password)
    current_user.hashed_password = hashed_password
    session.add(current_user)
    session.commit()
    return Message(message="Password updated successfully")


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user


@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete own user.
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    session.delete(current_user)
    session.commit()
    return Message(message="User deleted successfully")


@router.post("/signup", response_model=UserPublic)
def register_user(session: SessionDep, user_in: UserRegister) -> Any:
    """
    注册家长账户（role=parent）。
    注册后需要邮箱验证才能激活。
    """
    user = crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )

    # 处理推荐码
    referred_by_id = None
    referrer = None
    if user_in.referral_code:
        referrer = crud.get_user_by_referral_code(
            session=session, referral_code=user_in.referral_code
        )
        if referrer:
            referred_by_id = referrer.id

    # 生成验证码
    verification_code = generate_verification_code()
    verification_expires = datetime.utcnow() + timedelta(minutes=10)

    user_create = UserCreate.model_validate(user_in, update={"is_active": False, "role": UserRole.parent})
    user = crud.create_user(
        session=session, user_create=user_create, referred_by_id=referred_by_id
    )

    # 保存验证码
    user.email_verification_code = verification_code
    user.email_verification_expires = verification_expires
    session.add(user)
    session.commit()
    session.refresh(user)

    # 发送验证码邮件
    if settings.emails_enabled:
        email_data = generate_verification_code_email(
            email_to=user_in.email, code=verification_code
        )
        send_email(
            email_to=user_in.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )

    # 推荐奖励：推荐人得 50 学习币
    if referred_by_id and referrer:
        referrer.coins += 50
        session.add(referrer)
        session.commit()

    return user


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get a specific user by id.
    """
    user = session.get(User, user_id)
    if user == current_user:
        return user
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    return user


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
def update_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
) -> Any:
    """
    Update a user.
    """

    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    if user_in.email:
        existing_user = crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )

    db_user = crud.update_user(session=session, db_user=db_user, user_in=user_in)
    return db_user


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> Message:
    """
    Delete a user.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    statement = delete(Item).where(col(Item.owner_id) == user_id)
    session.exec(statement)  # type: ignore
    session.delete(user)
    session.commit()
    return Message(message="User deleted successfully")


@router.post("/verify-email", response_model=Message)
def verify_email(session: SessionDep, verify_in: VerifyEmail) -> Any:
    """
    Verify user email with verification code.
    """
    user = crud.get_user_by_email(session=session, email=verify_in.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_active:
        raise HTTPException(status_code=400, detail="User already activated")
    
    if not user.email_verification_code:
        raise HTTPException(status_code=400, detail="No verification code found")
    
    if user.email_verification_expires and user.email_verification_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code expired")
    
    if user.email_verification_code != verify_in.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # 激活用户
    user.is_active = True
    user.email_verification_code = None
    user.email_verification_expires = None
    session.add(user)
    session.commit()
    
    return Message(message="Email verified successfully")


@router.post("/resend-verification", response_model=Message)
def resend_verification_code(session: SessionDep, email: str = Query(...)) -> Any:
    """
    Resend verification code to user email.
    """
    user = crud.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_active:
        raise HTTPException(status_code=400, detail="User already activated")
    
    # 生成新验证码
    verification_code = generate_verification_code()
    verification_expires = datetime.utcnow() + timedelta(minutes=10)
    
    user.email_verification_code = verification_code
    user.email_verification_expires = verification_expires
    session.add(user)
    session.commit()
    
    # 发送验证码邮件
    if settings.emails_enabled:
        email_data = generate_verification_code_email(
            email_to=email, code=verification_code
        )
        send_email(
            email_to=email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    
    return Message(message="Verification code sent successfully")
