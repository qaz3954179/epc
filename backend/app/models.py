import uuid
from datetime import datetime

from enum import Enum

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


class UserRole(str, Enum):
    """用户角色"""
    admin = "admin"  # 管理员
    user = "user"    # 用户


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    role: UserRole = Field(default=UserRole.user, max_length=20)  # 角色：admin/user
    coins: int = Field(default=0)  # 学习币余额


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=50)  # daily, exam, game, pe
    task_type: str | None = Field(default=None, max_length=50)  # daily, weekly
    target_count: int = Field(default=1)  # 周期内完成次数
    coins_reward: int = Field(default=10)  # 每次完成获得的学习币


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")
    completions: list["TaskCompletion"] = Relationship(
        back_populates="item", cascade_delete=True
    )


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


# Task Completion models
class TaskCompletionBase(SQLModel):
    completed_at: datetime = Field(default_factory=datetime.utcnow)


class TaskCompletionCreate(SQLModel):
    item_id: uuid.UUID


class TaskCompletion(TaskCompletionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    item_id: uuid.UUID = Field(
        foreign_key="item.id", nullable=False, ondelete="CASCADE"
    )
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    item: Item | None = Relationship(back_populates="completions")
    user: User | None = Relationship()


class TaskCompletionPublic(TaskCompletionBase):
    id: uuid.UUID
    item_id: uuid.UUID
    user_id: uuid.UUID


class TodayTaskPublic(SQLModel):
    """Today's task with completion info"""
    id: uuid.UUID
    title: str
    description: str | None
    category: str | None
    task_type: str | None
    target_count: int
    coins_reward: int
    completed_count: int
    completed_today: bool


class TodayTasksPublic(SQLModel):
    data: list[TodayTaskPublic]
    count: int


# Prize models
class PrizeBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    image_url: str | None = Field(default=None, max_length=2000)
    product_url: str | None = Field(default=None, max_length=2000)
    price: float | None = Field(default=None, ge=0)
    coins_cost: int = Field(default=100, ge=0)  # 兑换所需学习币
    stock: int = Field(default=0, ge=0)  # 库存数量


class PrizeCreate(PrizeBase):
    pass


class PrizeUpdate(PrizeBase):
    name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore
    coins_cost: int | None = Field(default=None, ge=0)  # type: ignore
    stock: int | None = Field(default=None, ge=0)  # type: ignore


class Prize(PrizeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PrizePublic(PrizeBase):
    id: uuid.UUID
    created_at: datetime


class PrizesPublic(SQLModel):
    data: list[PrizePublic]
    count: int


class TaobaoProductInfo(SQLModel):
    """淘宝商品信息"""
    name: str
    price: float | None
    image_url: str | None


# Coin log models
class CoinLogPublic(SQLModel):
    """学习币明细"""
    name: str
    completed_at: datetime
    amount: int


class CoinLogsPublic(SQLModel):
    data: list[CoinLogPublic]
    count: int


# ─── Prize Redemption models ───────────────────────────────────────

class PrizeRedemptionBase(SQLModel):
    coins_spent: int = Field(ge=0)
    redeemed_at: datetime = Field(default_factory=datetime.utcnow)


class PrizeRedemption(PrizeRedemptionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    prize_id: uuid.UUID = Field(
        foreign_key="prize.id", nullable=False, ondelete="CASCADE"
    )
    prize_name: str = Field(max_length=255)  # 兑换时快照奖品名称
    user: User | None = Relationship()
    prize: Prize | None = Relationship()


class PrizeRedemptionPublic(PrizeRedemptionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    prize_id: uuid.UUID
    prize_name: str


class PrizeRedemptionsPublic(SQLModel):
    data: list[PrizeRedemptionPublic]
    count: int


# ─── Growth Record models ──────────────────────────────────────────

class DailyCompletionPoint(SQLModel):
    """单日完成数据点"""
    date: str  # YYYY-MM-DD
    count: int


class HeatmapData(SQLModel):
    """习惯热力图数据"""
    days: list[DailyCompletionPoint]
    current_streak: int
    longest_streak: int
    total_completions: int


class CategoryStats(SQLModel):
    """分类统计"""
    category: str
    count: int
    coins_earned: int


class PeriodComparison(SQLModel):
    """周期对比"""
    current_count: int
    previous_count: int
    current_coins: int
    previous_coins: int
    change_rate: float  # 变化百分比


class ProgressReport(SQLModel):
    """进步报告"""
    period: str  # "week" or "month"
    comparison: PeriodComparison
    category_stats: list[CategoryStats]
    daily_trend: list[DailyCompletionPoint]
    summary: str  # 自动生成的总结文字


class RewardSummary(SQLModel):
    """奖励汇总"""
    total_coins_earned: int
    total_coins_spent: int
    current_balance: int
    category_earnings: list[CategoryStats]
    recent_redemptions: list[PrizeRedemptionPublic]
