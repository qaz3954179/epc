# 任务管理功能部署说明

## 数据库迁移

当数据库可访问时，执行以下命令应用迁移：

```bash
cd /home/admin/openclaw/workspace/epc/backend
source .venv/bin/activate
alembic upgrade head
```

这将在 `item` 表中添加以下字段：
- `category` VARCHAR(50) - 任务分类
- `task_type` VARCHAR(50) - 任务类型  
- `target_count` INTEGER DEFAULT 1 - 周期完成次数

## 前端启动

前端代码已完成，可以直接启动：

```bash
cd /home/admin/openclaw/workspace/epc/frontend
npm run dev
```

## 功能说明

### 任务分类
- 日常任务 (daily)
- 模拟考试 (exam)
- 互动游戏 (game)
- 体能项目 (pe)

### 任务类型
- 每日任务 (daily)
- 每周任务 (weekly)

### 新增功能
1. 点击"新建任务"按钮打开创建对话框
2. 填写任务名称、选择分类、选择类型、设置完成次数
3. 使用搜索框搜索任务
4. 使用下拉框筛选分类和类型
5. 表格展示所有任务信息

## 数据库连接问题

当前错误：`psycopg.OperationalError: [Errno -2] Name or service not known`

可能原因：
1. 数据库服务器 `epc-2025.rwlb.rds.aliyuncs.com` 无法访问
2. DNS 解析失败
3. 网络连接问题
4. 防火墙阻止连接

请检查：
- 数据库服务器是否运行
- 网络连接是否正常
- 安全组/防火墙规则是否允许访问
- 数据库连接配置是否正确
