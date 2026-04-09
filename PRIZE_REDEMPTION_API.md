# 积分兑换奖品功能 API 文档

## 概述

基于数据库迁移 `07cd01068927`，实现了完整的积分兑换奖品功能，包括：
- 奖品兑换
- 收货地址管理
- 学习币明细查询
- 管理员发货/退款操作

## API 端点

### 1. 奖品兑换 (`/api/prize-redemptions`)

#### 1.1 兑换奖品
```http
POST /api/prize-redemptions
```

**请求体：**
```json
{
  "prize_id": "uuid",
  "shipping_address_id": "uuid",  // 实物奖品必填
  "user_note": "string"           // 可选
}
```

**业务逻辑：**
1. 校验奖品是否上架、库存是否充足
2. 校验用户学习币是否足够
3. 实物奖品需要提供收货地址
4. 原子操作：扣减学习币、减少库存、创建兑换记录、创建学习币明细

**响应：** `PrizeRedemptionPublic`

---

#### 1.2 查询我的兑换记录
```http
GET /api/prize-redemptions?skip=0&limit=100&status=pending
```

**查询参数：**
- `skip`: 跳过记录数（分页）
- `limit`: 返回记录数（分页）
- `status`: 过滤状态（可选）：`pending` | `processing` | `completed` | `cancelled` | `refunded`

**响应：** `PrizeRedemptionsPublic`

---

#### 1.3 查询所有兑换记录（管理员）
```http
GET /api/prize-redemptions/all?skip=0&limit=100&status=pending
```

**权限：** 仅管理员

**响应：** `PrizeRedemptionsPublic`

---

#### 1.4 查询单个兑换记录详情
```http
GET /api/prize-redemptions/{id}
```

**权限：** 用户只能查看自己的记录，管理员可查看所有

**响应：** `PrizeRedemptionPublic`

---

#### 1.5 取消兑换
```http
PUT /api/prize-redemptions/{id}/cancel
```

**限制：** 只有 `pending` 状态可以取消

**业务逻辑：**
1. 更新状态为 `cancelled`
2. 恢复用户学习币
3. 恢复奖品库存
4. 创建退款明细

**响应：** `PrizeRedemptionPublic`

---

#### 1.6 发货（管理员）
```http
PUT /api/prize-redemptions/{id}/ship
```

**权限：** 仅管理员

**请求体：**
```json
{
  "tracking_number": "string",
  "shipping_company": "string",
  "admin_note": "string"  // 可选
}
```

**限制：** 只有 `pending` 或 `processing` 状态可以发货

**业务逻辑：**
1. 更新状态为 `processing`
2. 填写物流信息
3. 记录发货时间

**响应：** `PrizeRedemptionPublic`

---

#### 1.7 完成兑换（管理员）
```http
PUT /api/prize-redemptions/{id}/complete
```

**权限：** 仅管理员

**请求体：**
```json
{
  "admin_note": "string"  // 可选
}
```

**限制：** 只有 `processing` 状态可以完成

**响应：** `PrizeRedemptionPublic`

---

#### 1.8 退款（管理员）
```http
PUT /api/prize-redemptions/{id}/refund
```

**权限：** 仅管理员

**请求体：**
```json
{
  "admin_note": "string"  // 可选
}
```

**限制：** 已退款或已取消的不能再退款

**业务逻辑：**
1. 更新状态为 `refunded`
2. 恢复用户学习币
3. 恢复奖品库存
4. 创建退款明细

**响应：** `PrizeRedemptionPublic`

---

### 2. 收货地址管理 (`/api/shipping-addresses`)

#### 2.1 获取我的收货地址列表
```http
GET /api/shipping-addresses
```

**排序：** 默认地址优先，然后按创建时间倒序

**响应：** `ShippingAddressesPublic`

---

#### 2.2 创建收货地址
```http
POST /api/shipping-addresses
```

**请求体：**
```json
{
  "recipient_name": "string",
  "recipient_phone": "string",
  "province": "string",
  "city": "string",
  "district": "string",      // 可选
  "detail_address": "string",
  "postal_code": "string",   // 可选
  "is_default": false
}
```

**业务逻辑：** 如果设为默认，自动取消其他默认地址

**响应：** `ShippingAddressPublic`

---

#### 2.3 获取单个收货地址
```http
GET /api/shipping-addresses/{id}
```

**响应：** `ShippingAddressPublic`

---

#### 2.4 更新收货地址
```http
PUT /api/shipping-addresses/{id}
```

**请求体：** 同创建，所有字段可选

**响应：** `ShippingAddressPublic`

---

#### 2.5 删除收货地址
```http
DELETE /api/shipping-addresses/{id}
```

**响应：** `Message`

---

#### 2.6 设置默认收货地址
```http
PUT /api/shipping-addresses/{id}/set-default
```

**业务逻辑：** 自动取消其他默认地址

**响应：** `ShippingAddressPublic`

---

### 3. 学习币明细 (`/api/coin-logs`)

#### 3.1 查询我的学习币明细
```http
GET /api/coin-logs?skip=0&limit=100&transaction_type=task_completion
```

**查询参数：**
- `skip`: 跳过记录数（分页）
- `limit`: 返回记录数（分页）
- `transaction_type`: 过滤交易类型（可选）：
  - `task_completion` - 完成任务
  - `prize_redemption` - 兑换奖品
  - `admin_adjustment` - 管理员调整
  - `refund` - 退款
  - `referral_bonus` - 推荐奖励

**排序：** 按创建时间倒序

**响应：** `CoinLogsPublic`

---

#### 3.2 查询所有学习币明细（管理员）
```http
GET /api/coin-logs/all?skip=0&limit=100&user_id=uuid&transaction_type=task_completion
```

**权限：** 仅管理员

**查询参数：**
- `skip`: 跳过记录数（分页）
- `limit`: 返回记录数（分页）
- `user_id`: 过滤用户（可选）
- `transaction_type`: 过滤交易类型（可选）

**响应：** `CoinLogsPublic`

---

#### 3.3 查询单条学习币明细
```http
GET /api/coin-logs/{id}
```

**权限：** 用户只能查看自己的记录，管理员可查看所有

**响应：** `CoinLogPublic`

---

## 数据模型

### PrizeRedemptionPublic
```typescript
{
  id: UUID
  user_id: UUID
  prize_id: UUID
  prize_name: string
  prize_type: "physical" | "virtual"
  coins_spent: number
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded"
  redeemed_at: datetime
  
  // 收货信息（实物奖品）
  recipient_name?: string
  recipient_phone?: string
  recipient_address?: string
  
  // 物流信息
  tracking_number?: string
  shipping_company?: string
  shipped_at?: datetime
  
  // 时间戳
  completed_at?: datetime
  cancelled_at?: datetime
}
```

### ShippingAddressPublic
```typescript
{
  id: UUID
  user_id: UUID
  recipient_name: string
  recipient_phone: string
  province: string
  city: string
  district?: string
  detail_address: string
  postal_code?: string
  is_default: boolean
  created_at: datetime
  updated_at: datetime
}
```

### CoinLogPublic
```typescript
{
  id: UUID
  amount: number              // 正数为收入，负数为支出
  balance_after: number       // 变动后余额
  transaction_type: TransactionType
  description: string
  created_at: datetime
  related_id?: UUID          // 关联的任务完成ID或兑换记录ID
}
```

---

## 状态流转

### 兑换状态流转图
```
pending (待处理)
  ├─> processing (处理中) [管理员发货]
  │     └─> completed (已完成) [管理员确认完成]
  ├─> cancelled (已取消) [用户取消]
  └─> refunded (已退款) [管理员退款]
```

**状态说明：**
- `pending`: 用户刚兑换，等待管理员处理
- `processing`: 管理员已发货，等待用户确认收货
- `completed`: 兑换完成
- `cancelled`: 用户主动取消（仅 pending 状态可取消）
- `refunded`: 管理员退款（任何非终态都可退款）

---

## 事务保证

所有涉及学习币变动的操作都使用数据库事务保证原子性：

1. **兑换奖品**：扣减学习币 + 减少库存 + 创建兑换记录 + 创建学习币明细
2. **取消兑换**：恢复学习币 + 恢复库存 + 更新状态 + 创建退款明细
3. **退款**：恢复学习币 + 恢复库存 + 更新状态 + 创建退款明细

---

## 权限控制

- **普通用户**：
  - 可以兑换奖品
  - 可以查看/管理自己的兑换记录
  - 可以取消自己的待处理兑换
  - 可以管理自己的收货地址
  - 可以查看自己的学习币明细

- **管理员**：
  - 拥有普通用户的所有权限
  - 可以查看所有用户的兑换记录
  - 可以发货、完成、退款
  - 可以查看所有用户的学习币明细

---

## 测试建议

### 单元测试
1. 兑换奖品成功
2. 学习币不足时兑换失败
3. 库存不足时兑换失败
4. 实物奖品未提供收货地址时失败
5. 取消兑换后学习币和库存恢复
6. 退款后学习币和库存恢复

### 集成测试
1. 完整的兑换流程：兑换 -> 发货 -> 完成
2. 取消流程：兑换 -> 取消
3. 退款流程：兑换 -> 发货 -> 退款

### 并发测试
1. 多个用户同时兑换同一奖品（库存竞争）
2. 用户同时取消和管理员发货（状态竞争）

---

## 性能优化建议

### 索引（已在迁移文档中建议）
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

### 查询优化
1. 使用分页避免一次性加载大量数据
2. 使用状态过滤减少查询范围
3. 考虑添加缓存（如热门奖品信息）

---

## 部署检查清单

- [ ] 数据库迁移已执行
- [ ] 索引已创建
- [ ] API 路由已注册
- [ ] 权限控制已测试
- [ ] 事务逻辑已验证
- [ ] 错误处理已完善
- [ ] API 文档已更新
- [ ] 前端对接已完成

---

## 文件清单

### 新增文件
- `app/api/routes/prize_redemptions.py` - 奖品兑换路由
- `app/api/routes/shipping_addresses.py` - 收货地址路由
- `app/api/routes/coin_logs.py` - 学习币明细路由

### 修改文件
- `app/api/main.py` - 注册新路由
- `app/models.py` - 已包含所有数据模型（无需修改）

---

## 下一步工作

1. **前端开发**
   - 奖品列表页面（展示可兑换奖品）
   - 兑换确认页面（选择收货地址）
   - 我的兑换页面（查看兑换记录和物流信息）
   - 收货地址管理页面
   - 学习币明细页面

2. **管理后台**
   - 兑换订单管理（发货、完成、退款）
   - 用户学习币管理
   - 奖品库存管理

3. **通知功能**
   - 兑换成功通知
   - 发货通知
   - 完成通知

4. **监控告警**
   - 库存预警（低于阈值时通知管理员）
   - 异常订单监控（长时间未处理）
   - 兑换成功率监控
