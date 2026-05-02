# EPC 阿里云部署指南

## 总览

三步搞定：**初始化 ECS → 配置环境 → 一键部署**

```
你的电脑                     阿里云 ECS
┌─────────┐   SSH/部署    ┌────────────────────┐
│  GitHub │ ────────────→ │ Docker Compose     │
│  Actions│               │  ├─ Frontend (React)│
│  ACR    │               │  ├─ Backend (FastAPI)│
└─────────┘               │  ├─ PostgreSQL      │
                          │  ├─ Casdoor + MySQL │
                          │  └─ Traefik (HTTPS) │
                          └────────────────────┘
```

---

## 第一步：买 ECS

| 配置 | 推荐 | 费用 |
|------|------|------|
| 实例 | 2核2G（e实例） | ~¥45/月 |
| 系统 | Ubuntu 22.04 | - |
| 系统盘 | 40G 高效云盘 | 包含 |
| 带宽 | 按流量计费 | ~¥20/月 |
| 域名 | 自备 .com/.cn | ~¥35/年 |

### 安全组放行

| 端口 | 用途 |
|------|------|
| 22 | SSH |
| 80 | HTTP（Traefik 自动跳转 HTTPS） |
| 443 | HTTPS |

---

## 第二步：初始化 ECS

SSH 登录，一键安装 Docker：

```bash
# 上传或克隆部署脚本后执行
bash ecs-setup.sh
```

这一步会完成：
- ✅ 系统更新
- ✅ Docker 安装
- ✅ Docker Compose 安装
- ✅ 创建 `/opt/epc` 部署目录

---

## 第三步：配置环境

```bash
cd /opt/epc

# 克隆你的代码
git clone git@github.com:YOUR_USERNAME/epc.git .

# 复制生产环境配置
cp deploy/.env.production.example .env

# 编辑 .env
vim .env
```

必须修改的配置项：

```
DOMAIN=your-domain.com              # 你的域名
SECRET_KEY=<openssl rand -hex 32>   # 随机密钥
FIRST_SUPERUSER_PASSWORD=           # 管理员密码
POSTGRES_PASSWORD=                  # 数据库密码
SMTP_PASSWORD=                      # SMTP 密码
```

生成 SECRET_KEY：
```bash
openssl rand -hex 32
```

---

## 第四步：一键部署

```bash
bash deploy.sh
```

完成！访问 `https://dashboard.your-domain.com`

---

## 后续更新

```bash
bash deploy.sh          # 拉最新代码 + 重启
docker compose logs -f backend   # 看日志
docker compose restart           # 重启服务
```

---

## 数据备份

```bash
# 数据库备份（导出到当前目录）
docker compose exec db pg_dump -U epc_user epc > backup_$(date +%Y%m%d).sql

# 恢复
docker compose exec -T db psql -U epc_user epc < backup_20260502.sql
```

### 自动备份（推荐加 crontab）

```bash
# 每天凌晨 3 点自动备份
0 3 * * * cd /opt/epc && docker compose exec -T db pg_dump -U epc_user epc | gzip > /opt/epc/backups/epc_$(date +\%Y\%m\%d).sql.gz
```

---

## 域名 + DNS 设置

1. 域名解析：A 记录指向 ECS 公网 IP
2. Traefik 会自动申请 Let's Encrypt SSL 证书，无需手动配置

需要解析的域名：
```
dashboard.your-domain.com  → ECS IP
api.your-domain.com        → ECS IP
auth.your-domain.com       → ECS IP
adminer.your-domain.com    → ECS IP（可选，调试用）
```

---

## 常见问题

### Q: 部署后访问 502？
检查域名 DNS 是否生效：`dig dashboard.your-domain.com`

### Q: SSL 证书申请失败？
检查 80/443 端口是否开放，域名是否解析正确

### Q: 数据库迁移失败？
手动执行：`docker compose exec backend alembic upgrade head`

### Q: 端口冲突？
确保 80/443 没有被 nginx/apache 占用

---

## 成本明细（月）

| 项目 | 费用 |
|------|------|
| ECS 2C2G | ¥45 |
| 按量带宽（预估） | ¥15-25 |
| 域名（年摊） | ¥3 |
| SSL 证书 | ¥0（Let's Encrypt） |
| **合计** | **¥60-75/月** |
