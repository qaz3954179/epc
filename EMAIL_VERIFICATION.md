# 邮箱验证功能

## 功能说明

用户注册时会收到一个 6 位数字验证码，需要在 10 分钟内验证邮箱才能激活账户。

## 数据库变更

在 `user` 表中添加了两个字段：
- `email_verification_code`: 6 位验证码
- `email_verification_expires`: 验证码过期时间

## API 接口

### 1. 用户注册 (POST /api/v1/users/signup)

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "张三",
  "referral_code": "ABC12345"  // 可选
}
```

**响应：**
- 用户创建成功，但 `is_active` 为 `false`
- 系统自动发送验证码邮件到注册邮箱

### 2. 验证邮箱 (POST /api/v1/users/verify-email)

**请求体：**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**响应：**
```json
{
  "message": "Email verified successfully"
}
```

验证成功后，用户的 `is_active` 状态变为 `true`，可以正常登录。

### 3. 重新发送验证码 (POST /api/v1/users/resend-verification)

**查询参数：**
- `email`: 用户邮箱

**示例：**
```
POST /api/v1/users/resend-verification?email=user@example.com
```

**响应：**
```json
{
  "message": "Verification code sent successfully"
}
```

## 错误处理

- **验证码过期：** 返回 400 错误，提示 "Verification code expired"
- **验证码错误：** 返回 400 错误，提示 "Invalid verification code"
- **用户已激活：** 返回 400 错误，提示 "User already activated"
- **用户不存在：** 返回 404 错误，提示 "User not found"

## 邮件配置

确保在 `.env` 文件中配置了 SMTP 邮件服务：

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_TLS=True
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAILS_FROM_EMAIL=your-email@gmail.com
EMAILS_FROM_NAME=Your App Name
```

## 数据库迁移

运行以下命令应用数据库迁移：

```bash
cd backend
alembic upgrade head
```

或使用 Docker：

```bash
docker compose run --rm backend alembic upgrade head
```

## 前端集成建议

1. **注册流程：**
   - 用户填写注册表单 → 调用 `/signup` 接口
   - 显示"验证码已发送到您的邮箱"提示
   - 跳转到验证码输入页面

2. **验证页面：**
   - 输入 6 位验证码
   - 提供"重新发送验证码"按钮（60秒倒计时）
   - 验证成功后跳转到登录页面

3. **登录拦截：**
   - 如果用户未激活（`is_active=false`），登录时提示"请先验证邮箱"
   - 提供重新发送验证码的入口

## 注意事项

- 验证码有效期为 10 分钟
- 验证码为 6 位纯数字
- 已激活的用户无法再次验证
- 管理员创建的用户默认激活，不需要验证
