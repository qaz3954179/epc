#!/bin/bash
# ============================================
# EPC 一键部署脚本
# 用法：
#   bash deploy.sh                    # 默认 production
#   bash deploy.sh --env staging      # 指定环境
# ============================================

set -e

DEPLOY_DIR="/opt/epc"
REPO_URL="git@github.com:YOUR_USERNAME/epc.git"  # 替换为你的仓库地址
BRANCH="main"

# ─── 参数解析 ───────────────────────────────
DEPLOY_ENV="production"
while [[ $# -gt 0 ]]; do
    case $1 in
        --env) DEPLOY_ENV="$2"; shift 2;;
        *) shift;;
    esac
done

echo "========================================="
echo "  EPC 部署 — ${DEPLOY_ENV}"
echo "========================================="

# ─── 1. 拉取代码 ─────────────────────────────
echo ""
echo "[1/5] 拉取代码..."

if [ -d "$DEPLOY_DIR/.git" ]; then
    cd "$DEPLOY_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    echo "代码已更新到最新"
else
    mkdir -p "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    git clone "$REPO_URL" .
    git checkout "$BRANCH"
    echo "代码已克隆"
fi

# ─── 2. 配置 .env ───────────────────────────
echo ""
echo "[2/5] 配置环境变量..."

if [ ! -f ".env" ]; then
    cp .env.production.example .env
    echo "已从模板创建 .env，请编辑后重新运行"
    echo "  vim .env"
    exit 1
else
    echo ".env 已存在"
fi

# ─── 3. 创建 Traefik 网络 ─────────────────────
echo ""
echo "[3/5] 检查 Docker 网络..."

docker network inspect traefik-public &>/dev/null || \
    docker network create traefik-public

echo "网络就绪"

# ─── 4. 启动服务 ─────────────────────────────
echo ""
echo "[4/5] 启动服务..."

docker compose -f docker-compose.yml up -d --build

echo ""
echo "等待数据库就绪..."
sleep 10

# ─── 5. 数据库迁移 ────────────────────────────
echo ""
echo "[5/5] 运行数据库迁移..."

docker compose exec -T backend alembic upgrade head 2>/dev/null || {
    echo "⚠️  迁移失败，可能需要手动运行："
    echo "   docker compose exec backend alembic upgrade head"
}

# ─── 完成 ─────────────────────────────────────
echo ""
echo "========================================="
echo "  ✅ 部署完成！"
echo "========================================="
echo ""
echo "服务列表："
docker compose ps
echo ""
echo "访问地址："
echo "  前端:   https://dashboard.${DOMAIN}"
echo "  API:    https://api.${DOMAIN}"
echo "  Casdoor: https://auth.${DOMAIN}"
echo "  Adminer: https://adminer.${DOMAIN}"
echo ""
echo "日志查看："
echo "  docker compose logs -f backend"
echo ""
echo "更新部署："
echo "  bash deploy.sh"
