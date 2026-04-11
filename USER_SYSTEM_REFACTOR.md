# 用户体系重构方案

## 需求背景

1. 项目面向宝贝使用，宝贝可以在平台上完成任务、攒学习币、兑换礼物
2. 家长可以登录，添加宝贝账户（添加后宝贝即可登录）；家长不做任务，负责管理奖品（维护宝贝能兑换的礼物）
3. 管理员进行网站管理和家长管理
4. 家长不能做任务
5. 家长可以切换查看每个宝贝的成长记录、兑换记录、任务完成情况
6. 后续需要支持家长对宝贝的任务完成进行审核（防止宝贝随意点击完成任务刷学习币）

## 采用方案

方案一：宝贝升级为独立 User。扩展 UserRole 为 admin / parent / child 三种角色，宝贝也是 User 表中的记录，拥有独立登录凭证。

---

## 整改清单

### 一、数据模型层（models.py）

1. `UserRole` 枚举增加 `parent` 和 `child` 两个值
2. `User` 表新增 `parent_id` 字段（外键指向 user.id，nullable，仅 child 角色有值）
3. `User` 表新增 `username` 字段（unique，用于宝贝登录；家长/管理员可为空，继续用邮箱登录）
4. `UserBase` 里的 `email` 改为 optional（宝贝不需要邮箱）
5. 新增 `ChildAccountCreate` schema（家长创建宝贝用：username、password、full_name、nickname、gender、birth_month、avatar_url）
6. 现有 `Child` 模型废弃，宝贝扩展信息（nickname、gender、birth_month、avatar_url）合并到 `User` 表，或保留 `Child` 作为 User 的一对一扩展表
7. `UserPublic` 响应里加上 `parent_id`、`username` 等新字段

### 二、认证层（deps.py + login.py）

8. 登录接口支持两种方式：邮箱+密码（家长/管理员）、用户名+密码（宝贝）。复用同一个 `/login/access-token`，后端自动判断输入是邮箱还是用户名
9. `crud.authenticate` 函数增加按 username 查找用户的逻辑
10. JWT payload 里加入 `role` 字段，方便前端快速判断角色
11. `deps.py` 新增权限依赖函数：`get_current_parent`（校验 role=parent）、`get_current_child`（校验 role=child）

### 三、API 路由层

12. **任务完成接口**（task_completions.py）：加角色检查，只允许 `child` 角色完成任务
13. **奖品兑换接口**（prizes.py / prize_redemptions.py）：只允许 `child` 角色兑换
14. **奖品管理接口**（prizes.py）：创建/编辑/删除奖品只允许 `parent` 和 `admin`
15. **任务管理接口**（items.py）：创建/编辑/删除任务允许 `parent` 和 `admin`，`child` 只能查看
16. **children.py 路由重构**：从"管理 Child 记录"改为"家长创建/管理宝贝账户"，实际操作变成在 User 表创建 role=child 的记录
17. **新增家长监控 API**（建议新建 `parent.py` 路由文件）：
    - `GET /parent/children` — 获取家长名下所有宝贝列表
    - `GET /parent/children/{child_id}/dashboard` — 宝贝概览（余额、今日任务等）
    - `GET /parent/children/{child_id}/task-completions` — 宝贝的任务完成记录
    - `GET /parent/children/{child_id}/coin-logs` — 宝贝的学习币明细
    - `GET /parent/children/{child_id}/redemptions` — 宝贝的兑换记录
    - `GET /parent/children/{child_id}/growth` — 宝贝的成长数据
    - 所有接口校验 `child.parent_id == current_user.id`
18. **用户管理接口**（users.py）：
    - `signup` 注册流程改为注册家长账户（role=parent），保留邮箱验证
    - admin 创建用户时可指定 role
    - admin 用户列表支持按 role 筛选

### 四、现有接口权限加固

19. 成长记录接口（growth.py）：确保只返回当前登录用户自己的数据（child 看自己的，parent 通过监控 API 看宝贝的）
20. 学习币明细接口：同上
21. 推荐系统（referrals.py）：考虑是否只对 parent 角色开放，child 不参与推荐

### 五、数据库迁移

22. 编写 Alembic 迁移脚本：User 表加 `parent_id`、`username` 字段，以及宝贝扩展字段（如果合并到 User 表）
23. 处理现有数据：把现有 `user` 角色的用户迁移为 `parent` 角色
24. 如果废弃 Child 表，需要迁移已有 Child 数据到 User 表

### 六、前端适配

25. 登录页：增加"宝贝登录"入口（用户名+密码），或统一输入框自动识别
26. 注册页：明确标注为"家长注册"
27. 家长端导航：增加"我的宝贝"菜单，包含宝贝列表、添加宝贝、切换查看宝贝数据
28. 宝贝端导航：隐藏奖品管理、用户管理等家长/管理员功能，只展示任务、兑换、成长记录、学习币
29. 根据 JWT 里的 role 控制前端路由和菜单可见性


# 后端重构完成

所有路由加载成功。后端重构完成，总结一下做了什么：

- `models.py` — UserRole 改为 admin/parent/child，User 表新增 username、parent_id、nickname、gender、birth_month、avatar_url，email 改为 optional，新增 ChildAccountCreate/Update/Public schema，TokenPayload 加 role
- `security.py` — JWT 加入 role 字段
- `crud.py` — authenticate 支持邮箱/用户名自动判断，新增 get_user_by_username、create_child_account
- `deps.py` — 新增 get_current_parent、get_current_child、get_current_parent_or_admin 权限依赖
- `login.py` — token 携带 role
- `parent.py` — 新建家长监控 API（宝贝列表/CRUD/dashboard/任务记录/学习币/兑换记录/成长数据）
- `items.py` — child 只读，parent/admin 可增删改
- `task_completions.py` — 只允许 child 完成任务，child 看 parent 创建的任务
- `prizes.py` — parent+admin 可管理奖品
- `prize_redemptions.py` — 只允许 child 兑换
- `users.py` — signup 注册为 parent，admin 列表支持 role 筛选
- `growth.py` — parent 可查看宝贝数据
- `db.py` — 初始 superuser 设为 admin 角色
- Alembic 迁移两步完成：ENUM 扩展 + 字段添加 + 数据迁移