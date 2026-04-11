搞定。总结一下做了什么：

**登录页 UI 优化**：输入框 48px 高度 + 橙色 hover/focus 光晕，按钮微上浮动效，卡片毛玻璃效果 + 暖色渐变背景，间距全面拉开。

**Casdoor 集成**（完整链路）：
- Docker Compose 加了 `casdoor` + `casdoor-db`（MySQL），Traefik 路由到 `auth.${DOMAIN}`
- 后端：User 模型加 `oauth_provider` / `oauth_id` 字段，新增 `/oauth/casdoor/callback`（code 换 JWT）和 `/oauth/casdoor/config`（前端获取配置）
- 前端：`lib/casdoor.ts` 封装 SDK，`/oauth/callback` 路由处理回调，登录页底部加微信/QQ/Google 社交登录按钮（Casdoor 未配置时自动隐藏）

**下一步需要你做的**：
1. `docker compose up casdoor-db casdoor` 启动 Casdoor
2. 访问 `http://auth.localhost:8000` 进入 Casdoor 管理后台
3. 创建 Application（名称 `epc`），拿到 `client_id` 和 `client_secret` 填入 `.env`
4. 在 Casdoor 里配置你想要的社交 Provider（微信/QQ/Google 等）

要我帮你写 Casdoor 的 init_data.json 自动初始化配置吗？