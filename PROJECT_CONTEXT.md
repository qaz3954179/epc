# 学习币管理系统 - 项目上下文文档

## 项目概述

这是一个为激励孩子学习而创建的学习币管理系统（Education Reward Plan of Children）。通过完成各类学习任务获得学习币，学习币可以兑换奖品或其他权益。

**核心理念：** 创造一个学习币系统，激励孩子自己驱动学习

**兑换比例：** 学习币 : 人民币 = 10 : 1

---

## 功能模块

### 1. 用户系统
- **角色管理：** 支持管理员（admin）和普通用户（user）两种角色
- **账户功能：** 
  - 用户注册（需邮箱验证）
  - 登录认证（JWT Token）
  - 密码找回
  - 个人信息管理
- **学习币余额：** 每个用户有独立的学习币账户
- **推荐系统：** 每个用户有唯一的推荐码，可以推荐新用户注册

### 2. 任务管理（Items）
任务是孩子获得学习币的主要方式。

**任务分类（category）：**
- `daily` - 日常学习任务
- `exam` - 模拟考试
- `game` - 互动游戏
- `pe` - 体能项目

**任务类型（task_type）：**
- `daily` - 每日任务（每天可完成）
- `weekly` - 每周任务（每周可完成）

**任务属性：**
- 任务名称和描述
- 分类和类型
- 周期内目标完成次数（target_count）
- 每次完成奖励的学习币数量（coins_reward）

**具体任务示例：**
- 日常学习：半小时 5 个币
- 模拟考试：
  - 每周每科最多 3 次，需提前一天预约
  - 70 分以下扣 5 个币
  - 70-90 分奖励 10 个币
  - 90 分及以上奖励 20 个币
  - 学校考试按模拟考试奖励 × 3
- 互动游戏：
  - 英语单词速记：挑战成功 5 个币
  - 跳绳挑战：周末最多 2 次，根据获胜次数奖励 1-5 个币
  - 跑步挑战：连续跑步 10 分钟，1 个币
- 画画：完整的画 3 个币（每周最多 3 次，需提前一天预约）

### 3. 任务完成记录（Task Completions）
- 记录每次任务完成的时间
- 关联用户和任务
- 统计今日任务完成情况
- 支持查询某个周期内的完成次数

**今日任务视图（TodayTaskPublic）：**
- 显示任务基本信息
- 显示今日已完成次数（completed_count）
- 显示是否已完成今日目标（completed_today）

### 4. 奖品管理（Prizes）
学习币的消费方式。

**奖品属性：**
- 奖品名称和描述
- 奖品图片（image_url）
- 商品链接（product_url，支持淘宝等电商平台）
- 人民币价格（price）
- 兑换所需学习币（coins_cost）
- 库存数量（stock）

**奖品兑换记录（Prize Redemptions）：**
- 记录兑换时间
- 记录消耗的学习币
- 快照奖品名称（防止奖品信息变更后历史记录混乱）
  思路如下：

    **核心流程**

    1. 用户查看奖品列表（含所需积分、库存）
    2. 选择奖品 → 系统校验积分是否足够、库存是否充足
    3. 确认兑换 → 原子操作：扣积分 + 减库存 + 生成兑换记录
    4. 发放奖品（虚拟直接到账，实物填写收货信息进入物流）
    5. 用户可查看兑换历史和状态

    **关键设计点**

    - 积分扣减和库存减少必须在同一事务里，防止超兑
    - 兑换记录状态机：待处理 → 处理中 → 已完成 / 已取消
    - 积分变动全程留日志，支持对账和回滚

    ---


**消费方式示例：**
- 看电视：半小时 50 个币（看完能总结内容返币 5%）
- 购买游戏币：按学习币兑换人民币后兑换
- 购买除必须学习用品外的任何物品

### 5. 学习币明细（Coin Logs）
- 记录每笔学习币的收入和支出
- 显示交易时间
- 显示交易金额（正数为收入，负数为支出）
- 显示交易说明（任务名称或兑换奖品名称）

### 6. 成长记录（Growth）
可视化展示孩子的学习成长轨迹。

**习惯热力图（HeatmapData）：**
- 每日完成任务数量的日历热力图
- 当前连续完成天数（current_streak）
- 最长连续完成天数（longest_streak）
- 总完成次数（total_completions）

**分类统计（CategoryStats）：**
- 按任务分类统计完成次数
- 统计每个分类获得的学习币总数

**周期对比（PeriodComparison）：**
- 对比不同时间段的任务完成情况
- 帮助了解学习进步趋势

### 7. 推荐系统（Referrals）
- 每个用户有唯一的 8 位推荐码（大写字母+数字）
- 新用户注册时可填写推荐码
- 记录推荐关系（referred_by_id）

---

## 技术架构

### 后端技术栈
- **框架：** FastAPI（Python 异步 Web 框架）
- **ORM：** SQLModel（结合 SQLAlchemy 和 Pydantic）
- **数据库：** PostgreSQL
- **数据库迁移：** Alembic
- **认证：** JWT Token
- **密码加密：** bcrypt
- **邮件服务：** SMTP（用于邮箱验证和密码找回）
- **API 文档：** 自动生成 OpenAPI/Swagger 文档

**后端目录结构：**
```
backend/
├── app/
│   ├── api/
│   │   └── routes/          # API 路由
│   │       ├── items.py     # 任务管理
│   │       ├── prizes.py    # 奖品管理
│   │       ├── task_completions.py  # 任务完成
│   │       ├── growth.py    # 成长记录
│   │       ├── referrals.py # 推荐系统
│   │       ├── users.py     # 用户管理
│   │       └── login.py     # 登录认证
│   ├── models.py            # 数据模型
│   ├── core/                # 核心配置
│   └── crud.py              # 数据库操作
├── alembic/                 # 数据库迁移脚本
└── tests/                   # 测试代码
```

### 前端技术栈
- **框架：** React 18
- **语言：** TypeScript
- **UI 组件库：** Chakra UI v3（支持深色模式）
- **路由：** TanStack Router
- **状态管理：** TanStack Query（React Query）
- **表单处理：** React Hook Form
- **HTTP 客户端：** Axios
- **图标：** React Icons
- **构建工具：** Vite
- **测试：** Playwright（E2E 测试）

**前端目录结构：**
```
frontend/
├── src/
│   ├── routes/              # 页面路由
│   │   ├── _layout.tsx      # 主布局
│   │   ├── login.tsx        # 登录页
│   │   ├── signup.tsx       # 注册页
│   │   ├── verify-email.tsx # 邮箱验证
│   │   └── coins/           # 学习币相关页面
│   │       └── logs.tsx     # 学习币明细
│   ├── components/          # 可复用组件
│   ├── client/              # API 客户端（自动生成）
│   └── hooks/               # 自定义 Hooks
└── tests/                   # E2E 测试
```

### 部署架构
- **容器化：** Docker + Docker Compose
- **反向代理：** Traefik（自动 HTTPS 证书）
- **CI/CD：** GitHub Actions
- **数据库：** 阿里云 RDS PostgreSQL

**Docker Compose 服务：**
- `backend` - FastAPI 后端服务
- `frontend` - React 前端服务（生产环境为静态文件）
- `db` - PostgreSQL 数据库（开发环境）
- `proxy` - Traefik 反向代理

---

## 界面布局

### 整体布局
- **头部区域：**
  - Logo
  - 用户名称
  - Home 链接
  - 用户信息
  - 退出登录按钮

- **内容区域（左右结构）：**
  - **左侧导航栏：** 可收起/展开
    - 展开：显示完整菜单文字
    - 收起：仅显示图标
  - **右侧内容区：** 根据导航显示对应页面

### 导航菜单
1. **学习币** - 余额、明细、提现
2. **任务** - 任务列表、创建任务、完成任务
3. **奖品** - 奖品列表、兑换奖品
4. **推广** - 推荐码、推荐记录
5. **设置** - 个人设置、系统设置
6. **成长记录** - 习惯热力图、统计图表

### 学习币页面特点
- **突出显示学习币余额**
- **余额为 0 时显示鼓励提示语**
- **设计风格体现孩子的趣味性和积极性**
- **使用明亮的色彩和友好的图标**

---

## 数据模型关系

### 核心实体关系
```
User (用户)
├── 1:N → Item (任务，作为创建者)
├── 1:N → TaskCompletion (任务完成记录)
├── 1:N → PrizeRedemption (奖品兑换记录)
└── 1:N → User (推荐关系，referred_by_id)

Item (任务)
└── 1:N → TaskCompletion (完成记录)

Prize (奖品)
└── 1:N → PrizeRedemption (兑换记录)
```

### 关键字段说明

**User 表：**
- `id` - UUID 主键
- `email` - 邮箱（唯一，用于登录）
- `hashed_password` - 加密密码
- `full_name` - 姓名
- `role` - 角色（admin/user）
- `coins` - 学习币余额
- `referral_code` - 推荐码（唯一）
- `referred_by_id` - 推荐人 ID
- `email_verification_code` - 邮箱验证码
- `email_verification_expires` - 验证码过期时间

**Item 表（任务）：**
- `id` - UUID 主键
- `title` - 任务名称
- `description` - 任务描述
- `category` - 分类（daily/exam/game/pe）
- `task_type` - 类型（daily/weekly）
- `target_count` - 周期内目标完成次数
- `coins_reward` - 每次完成奖励的学习币
- `owner_id` - 创建者 ID

**TaskCompletion 表（任务完成记录）：**
- `id` - UUID 主键
- `item_id` - 任务 ID
- `user_id` - 用户 ID
- `completed_at` - 完成时间

**Prize 表（奖品）：**
- `id` - UUID 主键
- `name` - 奖品名称
- `description` - 描述
- `image_url` - 图片链接
- `product_url` - 商品链接
- `price` - 人民币价格
- `coins_cost` - 兑换所需学习币
- `stock` - 库存数量
- `created_at` - 创建时间

**PrizeRedemption 表（奖品兑换记录）：**
- `id` - UUID 主键
- `user_id` - 用户 ID
- `prize_id` - 奖品 ID
- `prize_name` - 奖品名称快照
- `coins_spent` - 消耗的学习币
- `redeemed_at` - 兑换时间

---

## API 设计风格

### RESTful API 规范
- 使用标准 HTTP 方法（GET/POST/PUT/DELETE）
- 统一的响应格式
- 分页支持（skip/limit）
- 错误处理和状态码

### 主要 API 端点

**认证相关：**
- `POST /api/v1/login/access-token` - 登录获取 Token
- `POST /api/v1/login/test-token` - 验证 Token
- `POST /api/v1/password-recovery/{email}` - 发送密码重置邮件
- `POST /api/v1/reset-password/` - 重置密码

**用户相关：**
- `GET /api/v1/users/me` - 获取当前用户信息
- `PATCH /api/v1/users/me` - 更新当前用户信息
- `POST /api/v1/users/signup` - 用户注册
- `POST /api/v1/users/verify-email` - 验证邮箱

**任务相关：**
- `GET /api/v1/items/` - 获取任务列表
- `POST /api/v1/items/` - 创建任务
- `GET /api/v1/items/{id}` - 获取任务详情
- `PUT /api/v1/items/{id}` - 更新任务
- `DELETE /api/v1/items/{id}` - 删除任务

**任务完成相关：**
- `GET /api/v1/task-completions/today` - 获取今日任务列表
- `POST /api/v1/task-completions/` - 完成任务
- `GET /api/v1/task-completions/` - 获取完成记录

**奖品相关：**
- `GET /api/v1/prizes/` - 获取奖品列表
- `POST /api/v1/prizes/` - 创建奖品
- `POST /api/v1/prizes/{id}/redeem` - 兑换奖品
- `GET /api/v1/prizes/redemptions` - 获取兑换记录

**学习币相关：**
- `GET /api/v1/users/me/coin-logs` - 获取学习币明细

**成长记录相关：**
- `GET /api/v1/growth/heatmap` - 获取习惯热力图数据
- `GET /api/v1/growth/category-stats` - 获取分类统计
- `GET /api/v1/growth/period-comparison` - 获取周期对比

---

## 开发和部署

### 本地开发环境

**后端启动：**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head  # 运行数据库迁移
uvicorn app.main:app --reload
```

**前端启动：**
```bash
cd frontend
npm install
npm run dev
```

### Docker Compose 开发

```bash
docker-compose up -d
```

服务访问：
- 前端：http://localhost:5173
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

### 生产部署

1. 配置环境变量（`.env` 文件）：
   - `SECRET_KEY` - JWT 密钥
   - `FIRST_SUPERUSER_PASSWORD` - 管理员密码
   - `POSTGRES_PASSWORD` - 数据库密码
   - `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` - 邮件服务配置

2. 使用 Docker Compose 部署：
```bash
docker-compose -f docker-compose.yml -f docker-compose.traefik.yml up -d
```

3. 数据库迁移：
```bash
docker-compose exec backend alembic upgrade head
```

---

## 安全特性

1. **密码安全：**
   - 使用 bcrypt 加密存储
   - 最小长度 8 位
   - 支持密码找回功能

2. **认证授权：**
   - JWT Token 认证
   - Token 过期机制
   - 角色权限控制（admin/user）

3. **邮箱验证：**
   - 注册时发送验证码
   - 验证码有效期限制
   - 防止未验证用户登录

4. **数据安全：**
   - SQL 注入防护（ORM）
   - CORS 配置
   - HTTPS 支持（Traefik 自动证书）

5. **业务安全：**
   - 学习币余额检查（防止负数）
   - 奖品库存检查
   - 任务完成次数限制

---

## 扩展功能建议

### 已规划功能
- 家长监控面板
- 任务预约系统
- 学习报告生成
- 多孩子账户管理
- 学习币提现功能

### 可能的增强
- 移动端 App（React Native）
- 微信小程序
- 学习提醒推送
- 社交功能（好友、排行榜）
- AI 学习建议
- 游戏化元素（等级、徽章、成就）

---

## 项目文件说明

- `README.md` - 项目介绍和快速开始
- `DEPLOYMENT.md` - 部署文档
- `development.md` - 开发指南
- `roadmap.md` - 功能规划（学习币激励规则）
- `release-notes.md` - 版本更新记录
- `SECURITY.md` - 安全政策
- `EMAIL_VERIFICATION.md` - 邮箱验证说明
- `copier.yml` - Copier 模板配置
- `docker-compose.yml` - Docker Compose 配置
- `docker-compose.override.yml` - 本地开发覆盖配置
- `docker-compose.traefik.yml` - Traefik 生产配置

---

## 总结

这是一个设计完善、功能丰富的学习币管理系统，通过游戏化的方式激励孩子主动学习。系统采用现代化的技术栈，具有良好的可扩展性和维护性。

**核心价值：**
- 让学习变得有趣和有动力
- 培养孩子的自我管理能力
- 可视化展示学习成长轨迹
- 家长可以灵活配置奖励规则

**技术优势：**
- 前后端分离，易于维护
- 类型安全（TypeScript + Pydantic）
- 自动化 API 文档
- 容器化部署，易于扩展
- 完善的测试覆盖

**适用场景：**
- 家庭教育管理
- 在线教育平台
- 培训机构学员管理
- 企业内部培训积分系统

