# Casdoor OAuth 集成指南

## 快速启动

### 1. 启动 Casdoor 服务

```bash
docker compose up casdoor-db casdoor -d
```

等待 30 秒让数据库初始化完成，然后访问：
- **Casdoor 管理后台**: http://localhost:8000 (或 http://auth.localhost:8000)
- **默认管理员账号**: `admin` / `123`

### 2. 获取应用凭证

登录 Casdoor 后台后：

1. 进入 **Applications** 页面
2. 找到 `epc` 应用（已自动创建）
3. 点击编辑，复制 `Client ID` 和 `Client Secret`
4. 更新项目根目录的 `.env` 文件：

```bash
CASDOOR_ENDPOINT=http://localhost:8000
CASDOOR_CLIENT_ID=<复制的 Client ID>
CASDOOR_CLIENT_SECRET=<复制的 Client Secret>
CASDOOR_ORG_NAME=built-in
CASDOOR_APP_NAME=epc
```

5. 重启后端服务：

```bash
docker compose restart backend
```

### 3. 配置社交登录 Provider

Casdoor 已预置了三个 Provider 占位符（微信、QQ、Google），需要你填入真实的 App ID 和 Secret：

#### 微信开放平台

1. 访问 [微信开放平台](https://open.weixin.qq.com/)，创建网站应用
2. 获取 `AppID` 和 `AppSecret`
3. 在 Casdoor 后台 **Providers** → `provider_wechat_epc` 中填入：
   - **Client ID**: 微信 AppID
   - **Client Secret**: 微信 AppSecret
4. 保存

#### QQ 互联

1. 访问 [QQ 互联](https://connect.qq.com/)，创建网站应用
2. 获取 `APP ID` 和 `APP Key`
3. 在 Casdoor 后台 **Providers** → `provider_qq_epc` 中填入：
   - **Client ID**: QQ APP ID
   - **Client Secret**: QQ APP Key
4. 保存

#### Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建 OAuth 2.0 客户端 ID（Web 应用）
3. 授权重定向 URI 添加：`http://localhost:8000/callback/google`
4. 获取 `Client ID` 和 `Client Secret`
5. 在 Casdoor 后台 **Providers** → `provider_google_epc` 中填入
6. 保存

### 4. 测试登录

1. 访问前端登录页：http://localhost:5173/login
2. 点击底部的社交登录按钮（微信/QQ/Google）
3. 完成三方授权后，会自动跳转回系统并登录

## 架构说明

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   前端      │─────▶│   Casdoor    │─────▶│  微信/QQ/   │
│ localhost:  │      │  localhost:  │      │  Google     │
│   5173      │◀─────│    8000      │◀─────│             │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │
       │ code 换 JWT         │
       ▼                     ▼
┌─────────────┐      ┌──────────────┐
│  后端 API   │      │  MySQL DB    │
│ localhost:  │      │  (Casdoor)   │
│   8000      │      │              │
└─────────────┘      └──────────────┘
```

**登录流程**：
1. 用户点击社交登录按钮 → 跳转到 Casdoor
2. Casdoor 跳转到微信/QQ/Google 授权页
3. 用户授权后，Casdoor 回调前端 `/oauth/callback?code=xxx`
4. 前端用 `code` 调用后端 `/api/v1/oauth/casdoor/callback`
5. 后端用 `code` 向 Casdoor 换取用户信息
6. 后端创建/关联本地用户，返回 JWT token
7. 前端存储 token，跳转到首页

## 数据库变更

已添加 OAuth 字段到 `user` 表：
- `oauth_provider`: 三方平台标识（如 "casdoor"）
- `oauth_id`: 三方平台用户唯一 ID
- `hashed_password`: 改为可选（OAuth 用户无密码）

运行迁移：

```bash
docker compose exec backend alembic upgrade head
```

## 生产环境配置

### 1. 修改 Casdoor 域名

在 `.env` 中：

```bash
CASDOOR_ENDPOINT=https://auth.yourdomain.com
```

在 `docker-compose.yml` 中，Casdoor 的 Traefik 标签已配置为 `auth.${DOMAIN}`。

### 2. 更新回调 URI

在 Casdoor 后台 **Applications** → `epc` → **Redirect URIs** 中添加生产环境地址：

```
https://dashboard.yourdomain.com/oauth/callback
```

### 3. HTTPS 证书

Traefik 会自动通过 Let's Encrypt 申请证书（需要域名解析到服务器）。

## 故障排查

### 社交登录按钮不显示

检查后端配置接口：

```bash
curl http://localhost:8000/api/v1/oauth/casdoor/config
```

应返回：

```json
{
  "endpoint": "http://localhost:8000",
  "client_id": "epc_client_id_placeholder",
  "org_name": "built-in",
  "app_name": "epc"
}
```

如果 `client_id` 是 placeholder，说明 `.env` 中的 `CASDOOR_CLIENT_ID` 未配置。

### OAuth 登录失败

1. 检查 Casdoor 日志：`docker compose logs casdoor`
2. 检查后端日志：`docker compose logs backend`
3. 确认 Provider 的 Client ID/Secret 正确
4. 确认回调 URI 在三方平台配置中已添加

### 用户重复创建

如果同一个邮箱通过不同方式登录（邮箱密码 + OAuth），会自动关联到同一个用户。关联逻辑：
1. 先按 `oauth_provider` + `oauth_id` 查找
2. 未找到则按 `email` 查找并绑定
3. 都未找到则创建新用户

## 扩展更多 Provider

在 Casdoor 后台 **Providers** 页面点击 **Add**，选择你需要的平台（支持 80+ 种），填入凭证后，在 **Applications** → `epc` → **Providers** 中启用即可。

前端登录按钮会自动显示所有已启用的 Provider。
