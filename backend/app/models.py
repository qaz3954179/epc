import uuid
import string
import secrets
from datetime import datetime
from typing import Optional

from enum import Enum

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


def generate_referral_code(length: int = 8) -> str:
    """生成随机推荐码：8位大写字母+数字"""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


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
    referral_code: str | None = Field(default=None, max_length=16)  # 推荐人的推荐码


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


class VerifyEmail(SQLModel):
    email: EmailStr = Field(max_length=255)
    code: str = Field(min_length=6, max_length=6)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    referral_code: str = Field(default_factory=generate_referral_code, max_length=16, unique=True, index=True)
    referred_by_id: uuid.UUID | None = Field(default=None, foreign_key="user.id", nullable=True)
    email_verification_code: str | None = Field(default=None, max_length=6)
    email_verification_expires: datetime | None = Field(default=None)
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    referral_code: str
    referred_by_id: uuid.UUID | None = None


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
class PrizeType(str, Enum):
    """奖品类型"""
    physical = "physical"  # 实物
    virtual = "virtual"    # 虚拟


class PrizeBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    image_url: str | None = Field(default=None, max_length=2000)
    product_url: str | None = Field(default=None, max_length=2000)
    price: float | None = Field(default=None, ge=0)
    coins_cost: int = Field(default=100, ge=0)  # 兑换所需学习币
    stock: int = Field(default=0, ge=0)  # 库存数量
    prize_type: PrizeType = Field(default=PrizeType.physical, max_length=20)  # 奖品类型
    is_active: bool = Field(default=True)  # 是否上架


class PrizeCreate(PrizeBase):
    pass


class PrizeUpdate(PrizeBase):
    name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore
    coins_cost: int | None = Field(default=None, ge=0)  # type: ignore
    stock: int | None = Field(default=None, ge=0)  # type: ignore


class Prize(PrizeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    total_redeemed: int = Field(default=0, ge=0)  # 累计兑换次数
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PrizePublic(PrizeBase):
    id: uuid.UUID
    total_redeemed: int
    created_at: datetime
    updated_at: datetime


class PrizesPublic(SQLModel):
    data: list[PrizePublic]
    count: int


class TaobaoProductInfo(SQLModel):
    """淘宝商品信息"""
    name: str
    price: float | None
    image_url: str | None


# ─── Shipping Address models ───────────────────────────────────────

class ShippingAddressBase(SQLModel):
    recipient_name: str = Field(max_length=100)
    recipient_phone: str = Field(max_length=20)
    province: str = Field(max_length=50)
    city: str = Field(max_length=50)
    district: str | None = Field(default=None, max_length=50)
    detail_address: str = Field(max_length=500)
    postal_code: str | None = Field(default=None, max_length=10)
    is_default: bool = Field(default=False)


class ShippingAddressCreate(ShippingAddressBase):
    pass


class ShippingAddressUpdate(ShippingAddressBase):
    recipient_name: str | None = Field(default=None, max_length=100)  # type: ignore
    recipient_phone: str | None = Field(default=None, max_length=20)  # type: ignore
    province: str | None = Field(default=None, max_length=50)  # type: ignore
    city: str | None = Field(default=None, max_length=50)  # type: ignore
    detail_address: str | None = Field(default=None, max_length=500)  # type: ignore


class ShippingAddress(ShippingAddressBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user: User | None = Relationship()


class ShippingAddressPublic(ShippingAddressBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ShippingAddressesPublic(SQLModel):
    data: list[ShippingAddressPublic]
    count: int


# ─── Coin Log models ───────────────────────────────────────────────

class TransactionType(str, Enum):
    """交易类型"""
    task_completion = "task_completion"      # 完成任务
    prize_redemption = "prize_redemption"    # 兑换奖品
    admin_adjustment = "admin_adjustment"    # 管理员调整
    refund = "refund"                        # 退款
    referral_bonus = "referral_bonus"        # 推荐奖励


class CoinLogBase(SQLModel):
    amount: int  # 正数为收入，负数为支出
    balance_after: int  # 变动后余额
    transaction_type: TransactionType = Field(max_length=30)
    description: str = Field(max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CoinLog(CoinLogBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    related_id: uuid.UUID | None = Field(default=None)  # 关联的任务完成ID或兑换记录ID
    user: User | None = Relationship()


class CoinLogPublic(SQLModel):
    """学习币明细"""
    id: uuid.UUID
    amount: int
    balance_after: int
    transaction_type: TransactionType
    description: str
    created_at: datetime
    related_id: uuid.UUID | None = None


class CoinLogsPublic(SQLModel):
    data: list[CoinLogPublic]
    count: int


# ─── Prize Redemption models ───────────────────────────────────────

class RedemptionStatus(str, Enum):
    """兑换状态"""
    pending = "pending"        # 待处理
    processing = "processing"  # 处理中
    completed = "completed"    # 已完成
    cancelled = "cancelled"    # 已取消
    refunded = "refunded"      # 已退款


class PrizeRedemptionBase(SQLModel):
    coins_spent: int = Field(ge=0)
    redeemed_at: datetime = Field(default_factory=datetime.utcnow)


class PrizeRedemption(PrizeRedemptionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    prize_id: uuid.UUID = Field(
        foreign_key="prize.id", nullable=False, ondelete="RESTRICT"
    )
    prize_name: str = Field(max_length=255)  # 兑换时快照奖品名称
    prize_type: str = Field(max_length=20)  # 奖品类型快照
    status: RedemptionStatus = Field(default=RedemptionStatus.pending, max_length=20)
    
    # 收货信息（仅实物奖品需要）
    shipping_address_id: uuid.UUID | None = Field(
        default=None, foreign_key="shippingaddress.id", nullable=True
    )
    recipient_name: str | None = Field(default=None, max_length=100)
    recipient_phone: str | None = Field(default=None, max_length=20)
    recipient_address: str | None = Field(default=None, max_length=500)
    
    # 物流信息
    tracking_number: str | None = Field(default=None, max_length=100)
    shipping_company: str | None = Field(default=None, max_length=50)
    shipped_at: datetime | None = Field(default=None)
    
    # 备注
    admin_note: str | None = Field(default=None, max_length=500)
    user_note: str | None = Field(default=None, max_length=500)
    
    # 时间戳
    completed_at: datetime | None = Field(default=None)
    cancelled_at: datetime | None = Field(default=None)
    
    user: User | None = Relationship()
    prize: Prize | None = Relationship()
    shipping_address: Optional["ShippingAddress"] = Relationship()


class PrizeRedemptionPublic(PrizeRedemptionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    prize_id: uuid.UUID
    prize_name: str
    prize_type: str
    status: RedemptionStatus
    recipient_name: str | None = None
    recipient_phone: str | None = None
    recipient_address: str | None = None
    tracking_number: str | None = None
    shipping_company: str | None = None
    shipped_at: datetime | None = None
    completed_at: datetime | None = None
    cancelled_at: datetime | None = None


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
