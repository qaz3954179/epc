# 积分兑换奖品功能 - 数据库迁移完成

## 迁移信息

- **迁移版本**: `07cd01068927`
- **迁移名称**: `add_prize_redemption_enhancements_and_coin_logs`
- **执行时间**: 2026-04-08
- **状态**: ✅ 成功

## 新增表

### 1. coinlog（学习币明细表）

记录所有学习币的收入和支出明细。

**字段**:
- `id` (UUID) - 主键
- `user_id` (UUID) - 用户ID，外键关联 user 表
- `amount` (INTEGER) - 变动金额（正数为收入，负数为支出）
- `balance_after` (INTEGER) - 变动后余额
- `transaction_type` (ENUM) - 交易类型
  - `task_completion` - 完成任务
  - `prize_redemption` - 兑换奖品
  - `admin_adjustment` - 管理员调整
  - `refund` - 退款
  - `referral_bonus` - 推荐奖励
- `description` (VARCHAR 500) - 交易说明
- `related_id` (UUID, 可空) - 关联的任务完成ID或兑换记录ID
- `created_at` (TIMESTAMP) - 创建时间

**索引**:
- 主键索引: `id`
- 外键索引: `user_id`

### 2. shippingaddress（收货地址表）

存储用户的收货地址信息。

**字段**:
- `id` (UUID) - 主键
- `user_id` (UUID) - 用户ID，外键关联 user 表
- `recipient_name` (VARCHAR 100) - 收货人姓名
- `recipient_phone` (VARCHAR 20) - 收货人电话
- `province` (VARCHAR 50) - 省份
- `city` (VARCHAR 50) - 城市
- `district` (VARCHAR 50, 可空) - 区/县
- `detail_address` (VARCHAR 500) - 详细地址
- `postal_code` (VARCHAR 10, 可空) - 邮政编码
- `is_default` (BOOLEAN) - 是否默认地址
- `created_at` (TIMESTAMP) - 创建时间
- `updated_at` (TIMESTAMP) - 更新时间

**索引**:
- 主键索引: `id`
- 外键索引: `user_id`

## 扩展的表

### 3. prize（奖品表）- 新增字段

**新增字段**:
- `prize_type` (ENUM) - 奖品类型，默认 'physical'
  - `physical` - 实物
  - `virtual` - 虚拟
- `is_active` (BOOLEAN) - 是否上架，默认 true
- `total_redeemed` (INTEGER) - 累计兑换次数，默认 0
- `updated_at` (TIMESTAMP) - 更新时间，默认 now()

### 4. prizeredemption（奖品兑换记录表）- 新增字段

**新增字段**:
- `prize_type` (VARCHAR 20) - 奖品类型快照，默认 'physical'
- `status` (ENUM) - 兑换状态，默认 'completed'
  - `pending` - 待处理
  - `processing` - 处理中
  - `completed` - 已完成
  - `cancelled` - 已取消
  - `refunded` - 已退款
- `shipping_address_id` (UUID, 可空) - 收货地址ID，外键关联 shippingaddress 表
- `recipient_name` (VARCHAR 100, 可空) - 收货人姓名
- `recipient_phone` (VARCHAR 20, 可空) - 收货人电话
- `recipient_address` (VARCHAR 500, 可空) - 收货地址
- `tracking_number` (VARCHAR 100, 可空) - 物流单号
- `shipping_company` (VARCHAR 50, 可空) - 物流公司
- `shipped_at` (TIMESTAMP, 可空) - 发货时间
- `admin_note` (VARCHAR 500, 可空) - 管理员备注
- `user_note` (VARCHAR 500, 可空) - 用户备注
- `completed_at` (TIMESTAMP, 可空) - 完成时间
- `cancelled_at` (TIMESTAMP, 可空) - 取消时间

**外键变更**:
- `prize_id` 的删除策略从 `CASCADE` 改为 `RESTRICT`（防止误删奖品导致历史记录丢失）

### 5. user（用户表）- 字段类型变更

**变更字段**:
- `role` - 从 VARCHAR(20) 改为 ENUM(userrole)
  - `admin` - 管理员
  - `user` - 普通用户

## 新增 ENUM 类型

1. **prizetype** - 奖品类型
   - `physical` - 实物
   - `virtual` - 虚拟

2. **redemptionstatus** - 兑换状态
   - `pending` - 待处理
   - `processing` - 处理中
   - `completed` - 已完成
   - `cancelled` - 已取消
   - `refunded` - 已退款

3. **transactiontype** - 交易类型
   - `task_completion` - 完成任务
   - `prize_redemption` - 兑换奖品
   - `admin_adjustment` - 管理员调整
   - `refund` - 退款
   - `referral_bonus` - 推荐奖励

4. **userrole** - 用户角色
   - `admin` - 管理员
   - `user` - 普通用户

## 业务逻辑说明

### 兑换流程

1. **校验阶段**
   - 检查奖品是否上架（`is_active = true`）
   - 检查库存是否充足（`stock > 0`）
   - 检查用户学习币是否足够（`user.coins >= prize.coins_cost`）

2. **扣减阶段**（原子操作）
   - 扣减用户学习币：`user.coins -= prize.coins_cost`
   - 减少奖品库存：`prize.stock -= 1`
   - 增加累计兑换次数：`prize.total_redeemed += 1`

3. **记录阶段**
   - 创建兑换记录（`prizeredemption`）
     - 快照奖品名称和类型
     - 设置状态为 `pending`
     - 如果是实物奖品，记录收货地址
   - 创建学习币明细（`coinlog`）
     - 记录负数金额
     - 记录变动后余额
     - 关联兑换记录ID

4. **发货阶段**（管理员操作）
   - 更新状态为 `processing`
   - 填写物流信息（`tracking_number`, `shipping_company`）
   - 设置发货时间（`shipped_at`）
   - 更新状态为 `completed`
   - 设置完成时间（`completed_at`）

### 退款流程

1. 更新兑换记录状态为 `refunded`
2. 恢复用户学习币
3. 恢复奖品库存
4. 创建退款的学习币明细记录

## 索引建议

为了提高查询性能，建议后续添加以下索引：

```sql
-- coinlog 表
CREATE INDEX idx_coinlog_user_id ON coinlog(user_id);
CREATE INDEX idx_coinlog_created_at ON coinlog(created_at DESC);
CREATE INDEX idx_coinlog_transaction_type ON coinlog(transaction_type);

-- prizeredemption 表
CREATE INDEX idx_redemption_user_id ON prizeredemption(user_id);
CREATE INDEX idx_redemption_prize_id ON prizeredemption(prize_id);
CREATE INDEX idx_redemption_status ON prizeredemption(status);
CREATE INDEX idx_redemption_redeemed_at ON prizeredemption(redeemed_at DESC);

-- shippingaddress 表
CREATE INDEX idx_address_user_id ON shippingaddress(user_id);
CREATE INDEX idx_address_default ON shippingaddress(user_id, is_default);

-- prize 表
CREATE INDEX idx_prize_active ON prize(is_active);
CREATE INDEX idx_prize_type ON prize(prize_type);
```

## 回滚说明

如需回滚此迁移：

```bash
cd /home/admin/openclaw/workspace/epc/backend
. .venv/bin/activate
alembic downgrade -1
```

回滚操作将：
1. 删除 `coinlog` 和 `shippingaddress` 表
2. 删除 `prize` 和 `prizeredemption` 表的新增字段
3. 将 `user.role` 从 ENUM 改回 VARCHAR(20)
4. 删除所有新增的 ENUM 类型
5. 恢复 `prizeredemption.prize_id` 的删除策略为 CASCADE

## 下一步工作

1. **API 开发**
   - 实现兑换奖品接口
   - 实现收货地址管理接口
   - 实现学习币明细查询接口
   - 实现管理员发货接口

2. **前端开发**
   - 奖品列表页面
   - 兑换确认页面
   - 收货地址管理页面
   - 兑换记录查询页面
   - 学习币明细页面

3. **测试**
   - 单元测试
   - 集成测试
   - 并发测试（防止超兑）
   - 性能测试

4. **监控**
   - 兑换成功率监控
   - 库存预警
   - 异常订单监控
