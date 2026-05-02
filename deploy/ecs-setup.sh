#!/bin/bash
# ============================================
# ECS 初始化脚本 — 安装 Docker + Docker Compose
# 适用：阿里云 Ubuntu 20.04/22.04 / Debian 11/12
# 用法：bash ecs-setup.sh
# ============================================

set -e

echo "========================================="
echo "  ECS 初始化 — Docker + Docker Compose"
echo "========================================="

# ─── 1. 系统更新 ────────────────────────────
echo ""
echo "[1/4] 更新系统包..."
apt-get update
apt-get upgrade -y

# ─── 2. 安装 Docker ─────────────────────────
echo ""
echo "[2/4] 安装 Docker..."

if command -v docker &>/dev/null; then
    echo "Docker 已安装: $(docker --version)"
else
    curl -fsSL https://get.docker.com | sh -s docker --mirror Aliyun
    systemctl enable docker
    systemctl start docker
    echo "Docker 安装完成: $(docker --version)"
fi

# ─── 3. 安装 Docker Compose ─────────────────
echo ""
echo "[3/4] 安装 Docker Compose..."

if command -v docker compose &>/dev/null; then
    echo "Docker Compose 已安装: $(docker compose version)"
else
    # 使用 Docker 官方方式安装 compose 插件
    DOCKER_CONFIG=/usr/local/lib/docker/cli-plugins
    mkdir -p "$DOCKER_CONFIG"
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')
    curl -SL "https://github.com/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-linux-$(uname -m)" \
        -o "$DOCKER_CONFIG/docker-compose"
    chmod +x "$DOCKER_CONFIG/docker-compose"
    echo "Docker Compose 安装完成: $(docker compose version)"
fi

# ─── 4. 基础配置 ────────────────────────────
echo ""
echo "[4/4] 基础配置..."

# 创建部署目录
mkdir -p /opt/epc

# 安装必要工具
apt-get install -y git curl jq

# Docker 开机自启
systemctl enable docker

echo ""
echo "========================================="
echo "  ✅ ECS 初始化完成！"
echo "========================================="
echo ""
echo "Docker:      $(docker --version)"
echo "Compose:     $(docker compose version)"
echo "部署目录:    /opt/epc"
echo ""
echo "下一步：把代码放到 /opt/epc，配置 .env，运行一键部署"
