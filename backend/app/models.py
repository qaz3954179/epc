import uuid
import string
import secrets
from datetime import datetime
from typing import Any, Optional

from enum import Enum

from pydantic import EmailStr
from sqlmodel import Column, Field, Relationship, SQLModel, JSON


def generate_referral_code(length: int = 8) -> str:
    """生成随机推荐码：8位大写字母+数字"""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


class UserRole(str, Enum):
    """用户角色"""
    admin = "admin"    # 管理员
    parent = "parent"  # 家长
    child = "child"    # 宝贝


# Shared properties
class UserBase(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=255)  # 宝贝不需要邮箱
    username: str | None = Field(default=None, max_length=100)  # 宝贝登录用
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    role: UserRole = Field(default=UserRole.parent, max_length=20)
    coins: int = Field(default=0)
    # 宝贝扩展字段（合并到 User 表）
    nickname: str | None = Field(default=None, max_length=100)
    gender: str | None = Field(default=None, max_length=10)  # boy / girl
    birth_month: str | None = Field(default=None, max_length=7)  # YYYY-MM
    avatar_url: str | None = Field(default=None, max_length=2000)
    parent_id: uuid.UUID | None = Field(default=None, foreign_key="user.id", nullable=True)
    # OAuth 三方登录字段
    oauth_provider: str | None = Field(default=None, max_length=50)   # e.g. "wechat", "qq", "google"
    oauth_id: str | None = Field(default=None, max_length=255)        # 三方平台用户唯一 ID


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)
    referral_code: str | None = Field(default=None, max_length=16)


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


# Database model
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str = Field(default="")  # OAuth 用户无密码，默认空字符串
    referral_code: str = Field(default_factory=generate_referral_code, max_length=16, unique=True, index=True)
    referred_by_id: uuid.UUID | None = Field(default=None, foreign_key="user.id", nullable=True)
    email_verification_code: str | None = Field(default=None, max_length=6)
    email_verification_expires: datetime | None = Field(default=None)
    items: list["Item"] = Relationship(
        back_populates="owner",
        cascade_delete=True,
        sa_relationship_kwargs={"foreign_keys": "[Item.owner_id]"},
    )
    children: list["User"] = Relationship(
        back_populates="parent",
        sa_relationship_kwargs={
            "foreign_keys": "[User.parent_id]",
        },
    )
    parent: Optional["User"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={
            "foreign_keys": "[User.parent_id]",
            "remote_side": "[User.id]",
        },
    )


# Properties to return via API
class UserPublic(UserBase):
    id: uuid.UUID
    referral_code: str
    referred_by_id: uuid.UUID | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# ─── Child Account schemas ─────────────────────────────────────────

class ChildAccountCreate(SQLModel):
    """家长创建宝贝账户"""
    username: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=6, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)
    nickname: str = Field(min_length=1, max_length=100)
    gender: str = Field(max_length=10)  # boy / girl
    birth_month: str | None = Field(default=None, max_length=7)
    avatar_url: str | None = Field(default=None, max_length=2000)


class ChildAccountUpdate(SQLModel):
    """更新宝贝账户"""
    username: str | None = Field(default=None, min_length=2, max_length=100)
    password: str | None = Field(default=None, min_length=6, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)
    nickname: str | None = Field(default=None, min_length=1, max_length=100)
    gender: str | None = Field(default=None, max_length=10)
    birth_month: str | None = Field(default=None, max_length=7)
    avatar_url: str | None = Field(default=None, max_length=2000)


class ChildAccountPublic(SQLModel):
    """宝贝账户公开信息"""
    id: uuid.UUID
    username: str | None
    full_name: str | None
    nickname: str | None
    gender: str | None
    birth_month: str | None
    avatar_url: str | None
    coins: int
    is_active: bool
    created_at: datetime | None = None


# ─── Item models ────────────────────────────────────────────────────

class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=50)
    task_type: str | None = Field(default=None, max_length=50)
    target_count: int = Field(default=1)
    coins_reward: int = Field(default=10)


class ItemCreate(ItemBase):
    pass


class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(
        back_populates="items",
        sa_relationship_kwargs={"foreign_keys": "[Item.owner_id]"},
    )
    completions: list["TaskCompletion"] = Relationship(
        back_populates="item", cascade_delete=True
    )


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
    role: str | None = None


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
    physical = "physical"
    virtual = "virtual"


class PrizeBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    image_url: str | None = Field(default=None, max_length=2000)
    product_url: str | None = Field(default=None, max_length=2000)
    price: float | None = Field(default=None, ge=0)
    coins_cost: int = Field(default=100, ge=0)
    stock: int = Field(default=0, ge=0)
    prize_type: PrizeType = Field(default=PrizeType.physical, max_length=20)
    is_active: bool = Field(default=True)


class PrizeCreate(PrizeBase):
    pass


class PrizeUpdate(PrizeBase):
    name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore
    coins_cost: int | None = Field(default=None, ge=0)  # type: ignore
    stock: int | None = Field(default=None, ge=0)  # type: ignore


class Prize(PrizeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    total_redeemed: int = Field(default=0, ge=0)
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
    task_completion = "task_completion"
    prize_redemption = "prize_redemption"
    admin_adjustment = "admin_adjustment"
    refund = "refund"
    referral_bonus = "referral_bonus"


class CoinLogBase(SQLModel):
    amount: int
    balance_after: int
    transaction_type: TransactionType = Field(max_length=30)
    description: str = Field(max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CoinLog(CoinLogBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    related_id: uuid.UUID | None = Field(default=None)
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
    pending = "pending"
    processing = "processing"
    completed = "completed"
    cancelled = "cancelled"
    refunded = "refunded"


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
    prize_name: str = Field(max_length=255)
    prize_type: str = Field(max_length=20)
    status: RedemptionStatus = Field(default=RedemptionStatus.pending, max_length=20)
    shipping_address_id: uuid.UUID | None = Field(
        default=None, foreign_key="shippingaddress.id", nullable=True
    )
    recipient_name: str | None = Field(default=None, max_length=100)
    recipient_phone: str | None = Field(default=None, max_length=20)
    recipient_address: str | None = Field(default=None, max_length=500)
    tracking_number: str | None = Field(default=None, max_length=100)
    shipping_company: str | None = Field(default=None, max_length=50)
    shipped_at: datetime | None = Field(default=None)
    admin_note: str | None = Field(default=None, max_length=500)
    user_note: str | None = Field(default=None, max_length=500)
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
    date: str
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
    change_rate: float


class ProgressReport(SQLModel):
    """进步报告"""
    period: str
    comparison: PeriodComparison
    category_stats: list[CategoryStats]
    daily_trend: list[DailyCompletionPoint]
    summary: str


class RewardSummary(SQLModel):
    """奖励汇总"""
    total_coins_earned: int
    total_coins_spent: int
    current_balance: int
    category_earnings: list[CategoryStats]
    recent_redemptions: list[PrizeRedemptionPublic]


# ─── Child (旧模型，保留兼容但标记废弃) ────────────────────────────

class ChildGender(str, Enum):
    """宝贝性别 (deprecated, use User.gender instead)"""
    boy = "boy"
    girl = "girl"


class ChildBase(SQLModel):
    real_name: str = Field(max_length=100)
    nickname: str = Field(min_length=1, max_length=100)
    gender: ChildGender = Field(max_length=10)
    birth_month: str | None = Field(default=None, max_length=7)
    avatar_url: str | None = Field(default=None, max_length=2000)


class ChildCreate(ChildBase):
    pass


class ChildUpdate(ChildBase):
    real_name: str | None = Field(default=None, max_length=100)  # type: ignore
    nickname: str | None = Field(default=None, min_length=1, max_length=100)  # type: ignore
    gender: ChildGender | None = Field(default=None, max_length=10)  # type: ignore


class Child(ChildBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user: User | None = Relationship()


class ChildPublic(ChildBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ChildrenPublic(SQLModel):
    data: list[ChildPublic]
    count: int


# ─── Exam System models ────────────────────────────────────────────

class ExamSubject(str, Enum):
    """考试科目"""
    math = "math"
    english = "english"
    chinese = "chinese"
    science = "science"
    other = "other"


class ExamDifficulty(str, Enum):
    """考试难度"""
    easy = "easy"
    medium = "medium"
    hard = "hard"


class ExamSourceType(str, Enum):
    """题目来源"""
    manual = "manual"  # 手动录入
    ai = "ai"          # AI 生成


class ExamGameMode(str, Enum):
    """考试模式"""
    classic = "classic"        # 标准模式
    countdown = "countdown"    # 倒计时挑战
    challenge = "challenge"    # 闯关模式
    speed_run = "speed_run"    # 极速模式


class QuestionType(str, Enum):
    """题目类型"""
    choice = "choice"          # 选择题
    fill_blank = "fill_blank"  # 填空题
    true_false = "true_false"  # 判断题
    spelling = "spelling"      # 拼写题


class BookingStatus(str, Enum):
    """预约状态"""
    booked = "booked"
    started = "started"
    completed = "completed"
    cancelled = "cancelled"
    expired = "expired"


class SessionStatus(str, Enum):
    """考试会话状态"""
    in_progress = "in_progress"
    completed = "completed"
    timeout = "timeout"


# ─── ExamTemplate ──────────────────────────────────────────────────

class ExamTemplateBase(SQLModel):
    title: str = Field(max_length=255)
    subject: ExamSubject = Field(max_length=20)
    source_type: ExamSourceType = Field(default=ExamSourceType.manual, max_length=20)
    difficulty: ExamDifficulty = Field(default=ExamDifficulty.medium, max_length=20)
    question_count: int = Field(default=10, ge=1)
    time_limit_seconds: int | None = Field(default=None, ge=0)
    coins_reward_rules: dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    game_mode: ExamGameMode = Field(default=ExamGameMode.classic, max_length=20)
    is_active: bool = Field(default=True)


class ExamTemplateCreate(ExamTemplateBase):
    pass


class ExamTemplateUpdate(SQLModel):
    title: str | None = Field(default=None, max_length=255)
    subject: ExamSubject | None = None
    difficulty: ExamDifficulty | None = None
    question_count: int | None = Field(default=None, ge=1)
    time_limit_seconds: int | None = Field(default=None, ge=0)
    coins_reward_rules: dict[str, Any] | None = None
    game_mode: ExamGameMode | None = None
    is_active: bool | None = None


class ExamTemplate(ExamTemplateBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    creator: User | None = Relationship()
    questions: list["Question"] = Relationship(back_populates="template", cascade_delete=True)


class ExamTemplatePublic(ExamTemplateBase):
    id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ExamTemplatesPublic(SQLModel):
    data: list[ExamTemplatePublic]
    count: int


# ─── Question ──────────────────────────────────────────────────────

class QuestionBase(SQLModel):
    question_type: QuestionType = Field(max_length=20)
    content: dict[str, Any] = Field(sa_column=Column(JSON))
    answer: str = Field(max_length=500)
    explanation: str | None = Field(default=None, max_length=1000)
    difficulty: ExamDifficulty = Field(default=ExamDifficulty.medium, max_length=20)
    points: int = Field(default=10, ge=1)


class QuestionCreate(QuestionBase):
    template_id: uuid.UUID


class QuestionUpdate(SQLModel):
    question_type: QuestionType | None = None
    content: dict[str, Any] | None = None
    answer: str | None = Field(default=None, max_length=500)
    explanation: str | None = Field(default=None, max_length=1000)
    difficulty: ExamDifficulty | None = None
    points: int | None = Field(default=None, ge=1)


class Question(QuestionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    template_id: uuid.UUID = Field(foreign_key="examtemplate.id", nullable=False, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    template: ExamTemplate | None = Relationship(back_populates="questions")


class QuestionPublic(QuestionBase):
    id: uuid.UUID
    template_id: uuid.UUID
    created_at: datetime


class QuestionsPublic(SQLModel):
    data: list[QuestionPublic]
    count: int


# ─── ExamBooking ───────────────────────────────────────────────────

class ExamBookingBase(SQLModel):
    scheduled_at: datetime
    booking_type: str = Field(default="self_book", max_length=20)


class ExamBookingCreate(SQLModel):
    template_id: uuid.UUID
    child_id: uuid.UUID | None = None  # 家长可以为孩子预约
    scheduled_at: datetime
    booking_type: str = Field(default="self_book", max_length=20)


class ExamBooking(ExamBookingBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    template_id: uuid.UUID = Field(foreign_key="examtemplate.id", nullable=False, ondelete="CASCADE")
    child_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    status: BookingStatus = Field(default=BookingStatus.booked, max_length=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    template: ExamTemplate | None = Relationship()
    child: User | None = Relationship()


class ExamBookingPublic(ExamBookingBase):
    id: uuid.UUID
    template_id: uuid.UUID
    child_id: uuid.UUID
    status: BookingStatus
    created_at: datetime
    template: ExamTemplatePublic | None = None


class ExamBookingsPublic(SQLModel):
    data: list[ExamBookingPublic]
    count: int


# ─── ExamSession ───────────────────────────────────────────────────

class ExamSessionBase(SQLModel):
    started_at: datetime = Field(default_factory=datetime.utcnow)


class ExamSession(ExamSessionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    booking_id: uuid.UUID | None = Field(default=None, foreign_key="exambooking.id", nullable=True, ondelete="SET NULL")
    child_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    template_id: uuid.UUID = Field(foreign_key="examtemplate.id", nullable=False, ondelete="CASCADE")
    finished_at: datetime | None = None
    score: int = Field(default=0)
    total_points: int = Field(default=0)
    coins_earned: int = Field(default=0)
    combo_max: int = Field(default=0)
    accuracy_rate: float = Field(default=0.0)
    status: SessionStatus = Field(default=SessionStatus.in_progress, max_length=20)
    template: ExamTemplate | None = Relationship()
    child: User | None = Relationship()
    answers: list["ExamAnswer"] = Relationship(back_populates="session", cascade_delete=True)


class ExamSessionPublic(ExamSessionBase):
    id: uuid.UUID
    booking_id: uuid.UUID | None
    child_id: uuid.UUID
    template_id: uuid.UUID
    finished_at: datetime | None
    score: int
    total_points: int
    coins_earned: int
    combo_max: int
    accuracy_rate: float
    status: SessionStatus


class ExamSessionsPublic(SQLModel):
    data: list[ExamSessionPublic]
    count: int


# ─── ExamAnswer ────────────────────────────────────────────────────

class ExamAnswerBase(SQLModel):
    child_answer: str = Field(max_length=500)
    is_correct: bool
    time_spent_ms: int = Field(default=0, ge=0)
    combo_count: int = Field(default=0, ge=0)
    answered_at: datetime = Field(default_factory=datetime.utcnow)


class ExamAnswerCreate(SQLModel):
    question_id: uuid.UUID
    child_answer: str = Field(max_length=500)
    time_spent_ms: int = Field(default=0, ge=0)


class ExamAnswer(ExamAnswerBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="examsession.id", nullable=False, ondelete="CASCADE")
    question_id: uuid.UUID = Field(foreign_key="question.id", nullable=False, ondelete="CASCADE")
    session: ExamSession | None = Relationship(back_populates="answers")
    question: Question | None = Relationship()


class ExamAnswerPublic(ExamAnswerBase):
    id: uuid.UUID
    session_id: uuid.UUID
    question_id: uuid.UUID


class ExamAnswersPublic(SQLModel):
    data: list[ExamAnswerPublic]
    count: int


# ─── Exam Report ───────────────────────────────────────────────────

class ExamReport(SQLModel):
    """考试报告"""
    session_id: uuid.UUID
    template_title: str
    subject: str
    score: int
    total_points: int
    accuracy_rate: float
    combo_max: int
    coins_earned: int
    time_spent_seconds: int
    answers: list[dict[str, Any]]
    summary: str


# ─── Coding Project models ─────────────────────────────────────────

class CodingProjectBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    blockly_xml: str = Field(max_length=100000)  # Blockly 积木 XML
    generated_code: str | None = Field(default=None, max_length=100000)  # 生成的代码
    thumbnail_url: str | None = Field(default=None, max_length=2000)
    is_public: bool = Field(default=False)


class CodingProjectCreate(CodingProjectBase):
    pass


class CodingProjectUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    blockly_xml: str | None = Field(default=None, max_length=100000)
    generated_code: str | None = Field(default=None, max_length=100000)
    thumbnail_url: str | None = Field(default=None, max_length=2000)
    is_public: bool | None = None


class CodingProject(CodingProjectBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user: User | None = Relationship()


class CodingProjectPublic(CodingProjectBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class CodingProjectsPublic(SQLModel):
    data: list[CodingProjectPublic]
    count: int
