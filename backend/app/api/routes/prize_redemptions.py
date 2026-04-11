import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import Field, select, func, SQLModel

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    CoinLog,
    Message,
    Prize,
    PrizeRedemption,
    PrizeRedemptionPublic,
    PrizeRedemptionsPublic,
    RedemptionStatus,
    ShippingAddress,
    TransactionType,
    User,
    PrizeType,
    UserRole,
)

router = APIRouter(prefix="/prize-redemptions", tags=["prize-redemptions"])


class RedeemPrizeRequest(SQLModel):
    """兑换奖品请求"""
    prize_id: uuid.UUID
    shipping_address_id: uuid.UUID | None = None  # 实物奖品必填
    user_note: str | None = Field(default=None, max_length=500)


class ShipRedemptionRequest(SQLModel):
    """发货请求"""
    tracking_number: str = Field(max_length=100)
    shipping_company: str = Field(max_length=50)
    admin_note: str | None = Field(default=None, max_length=500)


class CompleteRedemptionRequest(SQLModel):
    """完成兑换请求"""
    admin_note: str | None = Field(default=None, max_length=500)


class RefundRedemptionRequest(SQLModel):
    """退款请求"""
    admin_note: str | None = Field(default=None, max_length=500)


@router.post("/", response_model=PrizeRedemptionPublic)
def redeem_prize(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    request: RedeemPrizeRequest,
) -> Any:
    """兑换奖品（仅宝贝可兑换）"""
    # 只允许 child 角色兑换
    if current_user.role != UserRole.child and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="只有宝贝可以兑换奖品")
    
    # 1. 获取奖品信息
    prize = session.get(Prize, request.prize_id)
    if not prize:
        raise HTTPException(status_code=404, detail="奖品不存在")
    
    # 2. 校验奖品状态
    if not prize.is_active:
        raise HTTPException(status_code=400, detail="该奖品已下架")
    
    if prize.stock <= 0:
        raise HTTPException(status_code=400, detail="库存不足")
    
    # 3. 校验用户学习币
    if current_user.coins < prize.coins_cost:
        raise HTTPException(
            status_code=400,
            detail=f"学习币不足，需要 {prize.coins_cost}，当前余额 {current_user.coins}"
        )
    
    # 4. 如果是实物奖品，校验收货地址
    shipping_address = None
    if prize.prize_type == PrizeType.physical:
        if not request.shipping_address_id:
            raise HTTPException(status_code=400, detail="实物奖品需要提供收货地址")
        
        shipping_address = session.get(ShippingAddress, request.shipping_address_id)
        if not shipping_address or shipping_address.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="收货地址不存在")
    
    # 5. 开始事务：扣减学习币、减少库存、创建兑换记录、创建学习币明细
    try:
        # 扣减用户学习币
        current_user.coins -= prize.coins_cost
        session.add(current_user)
        
        # 减少奖品库存，增加累计兑换次数
        prize.stock -= 1
        prize.total_redeemed += 1
        prize.updated_at = datetime.utcnow()
        session.add(prize)
        
        # 创建兑换记录
        redemption = PrizeRedemption(
            user_id=current_user.id,
            prize_id=prize.id,
            prize_name=prize.name,
            prize_type=(prize.prize_type.value if prize.prize_type else PrizeType.physical.value),
            coins_spent=prize.coins_cost,
            status=RedemptionStatus.pending,
            user_note=request.user_note,
        )
        
        # 如果是实物奖品，保存收货信息
        if shipping_address:
            redemption.shipping_address_id = shipping_address.id
            redemption.recipient_name = shipping_address.recipient_name
            redemption.recipient_phone = shipping_address.recipient_phone
            redemption.recipient_address = (
                f"{shipping_address.province}{shipping_address.city}"
                f"{shipping_address.district or ''}{shipping_address.detail_address}"
            )
        
        session.add(redemption)
        session.flush()  # 获取 redemption.id
        
        # 创建学习币明细
        coin_log = CoinLog(
            user_id=current_user.id,
            amount=-prize.coins_cost,
            balance_after=current_user.coins,
            transaction_type=TransactionType.prize_redemption,
            description=f"兑换奖品：{prize.name}",
            related_id=redemption.id,
        )
        session.add(coin_log)
        
        session.commit()
        session.refresh(redemption)
        
        return redemption
    
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"兑换失败：{str(e)}")


@router.get("/", response_model=PrizeRedemptionsPublic)
def read_my_redemptions(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    status: RedemptionStatus | None = None,
) -> Any:
    """查询我的兑换记录"""
    # 构建查询
    statement = select(PrizeRedemption).where(PrizeRedemption.user_id == current_user.id)
    
    if status:
        statement = statement.where(PrizeRedemption.status == status)
    
    statement = statement.order_by(PrizeRedemption.redeemed_at.desc()).offset(skip).limit(limit)
    
    # 查询总数
    count_statement = select(func.count()).select_from(PrizeRedemption).where(
        PrizeRedemption.user_id == current_user.id
    )
    if status:
        count_statement = count_statement.where(PrizeRedemption.status == status)
    
    count = session.exec(count_statement).one()
    redemptions = session.exec(statement).all()
    
    return PrizeRedemptionsPublic(data=redemptions, count=count)


@router.get("/all", response_model=PrizeRedemptionsPublic)
def read_all_redemptions(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    status: RedemptionStatus | None = None,
) -> Any:
    """查询所有兑换记录（仅管理员）"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")
    
    statement = select(PrizeRedemption)
    
    if status:
        statement = statement.where(PrizeRedemption.status == status)
    
    statement = statement.order_by(PrizeRedemption.redeemed_at.desc()).offset(skip).limit(limit)
    
    count_statement = select(func.count()).select_from(PrizeRedemption)
    if status:
        count_statement = count_statement.where(PrizeRedemption.status == status)
    
    count = session.exec(count_statement).one()
    redemptions = session.exec(statement).all()
    
    return PrizeRedemptionsPublic(data=redemptions, count=count)


@router.get("/{id}", response_model=PrizeRedemptionPublic)
def read_redemption(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
) -> Any:
    """查询单个兑换记录详情"""
    redemption = session.get(PrizeRedemption, id)
    if not redemption:
        raise HTTPException(status_code=404, detail="兑换记录不存在")
    
    # 只能查看自己的记录，或管理员可以查看所有
    if redemption.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")
    
    return redemption


@router.put("/{id}/cancel", response_model=PrizeRedemptionPublic)
def cancel_redemption(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
) -> Any:
    """取消兑换（仅待处理状态可取消）"""
    redemption = session.get(PrizeRedemption, id)
    if not redemption:
        raise HTTPException(status_code=404, detail="兑换记录不存在")
    
    # 只能取消自己的记录
    if redemption.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="权限不足")
    
    # 只有待处理状态可以取消
    if redemption.status != RedemptionStatus.pending:
        raise HTTPException(status_code=400, detail="只有待处理状态的兑换可以取消")
    
    try:
        # 更新状态
        redemption.status = RedemptionStatus.cancelled
        redemption.cancelled_at = datetime.utcnow()
        session.add(redemption)
        
        # 恢复用户学习币
        user = session.get(User, redemption.user_id)
        if user:
            user.coins += redemption.coins_spent
            session.add(user)
            
            # 创建退款明细
            coin_log = CoinLog(
                user_id=user.id,
                amount=redemption.coins_spent,
                balance_after=user.coins,
                transaction_type=TransactionType.refund,
                description=f"取消兑换：{redemption.prize_name}",
                related_id=redemption.id,
            )
            session.add(coin_log)
        
        # 恢复奖品库存
        prize = session.get(Prize, redemption.prize_id)
        if prize:
            prize.stock += 1
            prize.total_redeemed -= 1
            prize.updated_at = datetime.utcnow()
            session.add(prize)
        
        session.commit()
        session.refresh(redemption)
        
        return redemption
    
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"取消失败：{str(e)}")


@router.put("/{id}/ship", response_model=PrizeRedemptionPublic)
def ship_redemption(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    request: ShipRedemptionRequest,
) -> Any:
    """发货（仅管理员）"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")
    
    redemption = session.get(PrizeRedemption, id)
    if not redemption:
        raise HTTPException(status_code=404, detail="兑换记录不存在")
    
    # 只有待处理或处理中状态可以发货
    if redemption.status not in [RedemptionStatus.pending, RedemptionStatus.processing]:
        raise HTTPException(status_code=400, detail="当前状态不允许发货")
    
    # 更新物流信息
    redemption.status = RedemptionStatus.processing
    redemption.tracking_number = request.tracking_number
    redemption.shipping_company = request.shipping_company
    redemption.shipped_at = datetime.utcnow()
    if request.admin_note:
        redemption.admin_note = request.admin_note
    
    session.add(redemption)
    session.commit()
    session.refresh(redemption)
    
    return redemption


@router.put("/{id}/complete", response_model=PrizeRedemptionPublic)
def complete_redemption(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    request: CompleteRedemptionRequest,
) -> Any:
    """完成兑换（仅管理员）"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")
    
    redemption = session.get(PrizeRedemption, id)
    if not redemption:
        raise HTTPException(status_code=404, detail="兑换记录不存在")
    
    # 只有处理中状态可以完成
    if redemption.status != RedemptionStatus.processing:
        raise HTTPException(status_code=400, detail="只有处理中状态可以完成")
    
    # 更新状态
    redemption.status = RedemptionStatus.completed
    redemption.completed_at = datetime.utcnow()
    if request.admin_note:
        redemption.admin_note = request.admin_note
    
    session.add(redemption)
    session.commit()
    session.refresh(redemption)
    
    return redemption


@router.put("/{id}/refund", response_model=PrizeRedemptionPublic)
def refund_redemption(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    request: RefundRedemptionRequest,
) -> Any:
    """退款（仅管理员）"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")
    
    redemption = session.get(PrizeRedemption, id)
    if not redemption:
        raise HTTPException(status_code=404, detail="兑换记录不存在")
    
    # 已退款或已取消的不能再退款
    if redemption.status in [RedemptionStatus.refunded, RedemptionStatus.cancelled]:
        raise HTTPException(status_code=400, detail="该兑换已退款或已取消")
    
    try:
        # 更新状态
        redemption.status = RedemptionStatus.refunded
        if request.admin_note:
            redemption.admin_note = request.admin_note
        session.add(redemption)
        
        # 恢复用户学习币
        user = session.get(User, redemption.user_id)
        if user:
            user.coins += redemption.coins_spent
            session.add(user)
            
            # 创建退款明细
            coin_log = CoinLog(
                user_id=user.id,
                amount=redemption.coins_spent,
                balance_after=user.coins,
                transaction_type=TransactionType.refund,
                description=f"退款：{redemption.prize_name}",
                related_id=redemption.id,
            )
            session.add(coin_log)
        
        # 恢复奖品库存
        prize = session.get(Prize, redemption.prize_id)
        if prize:
            prize.stock += 1
            prize.total_redeemed -= 1
            prize.updated_at = datetime.utcnow()
            session.add(prize)
        
        session.commit()
        session.refresh(redemption)
        
        return redemption
    
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"退款失败：{str(e)}")
