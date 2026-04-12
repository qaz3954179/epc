# SDI 权重配置说明

## 概述

SDI (Self-Drive Index) 自驱力指数由四个维度加权计算：

```
SDI = 主动性 × 权重1 + 探索性 × 权重2 + 持续性 × 权重3 + 质量 × 权重4
```

## 默认权重

| 维度 | 默认权重 | 说明 |
|---|---|---|
| 主动性 (initiative) | 0.4 | 最重要，反映孩子是否主动完成任务 |
| 探索性 (exploration) | 0.2 | 尝试不同类型任务的广度和深度 |
| 持续性 (persistence) | 0.2 | 连续学习天数，习惯养成 |
| 质量 (quality) | 0.2 | 任务完成质量和超额完成情况 |

**注意：四项权重之和应为 1.0**

## 配置方式

### 方法 1：环境变量（推荐）

在 `.env` 文件中添加或修改：

```bash
# SDI 权重配置
SDI_WEIGHT_INITIATIVE=0.4
SDI_WEIGHT_EXPLORATION=0.2
SDI_WEIGHT_PERSISTENCE=0.2
SDI_WEIGHT_QUALITY=0.2
```

### 方法 2：系统环境变量

```bash
export SDI_WEIGHT_INITIATIVE=0.5
export SDI_WEIGHT_EXPLORATION=0.2
export SDI_WEIGHT_PERSISTENCE=0.2
export SDI_WEIGHT_QUALITY=0.1
```

## 配置示例

### 场景 1：强调主动性

适合刚开始培养自驱力的孩子：

```bash
SDI_WEIGHT_INITIATIVE=0.5
SDI_WEIGHT_EXPLORATION=0.15
SDI_WEIGHT_PERSISTENCE=0.2
SDI_WEIGHT_QUALITY=0.15
```

### 场景 2：平衡发展

四个维度同等重要：

```bash
SDI_WEIGHT_INITIATIVE=0.25
SDI_WEIGHT_EXPLORATION=0.25
SDI_WEIGHT_PERSISTENCE=0.25
SDI_WEIGHT_QUALITY=0.25
```

### 场景 3：强调质量和持续性

适合已经有一定主动性的孩子：

```bash
SDI_WEIGHT_INITIATIVE=0.3
SDI_WEIGHT_EXPLORATION=0.15
SDI_WEIGHT_PERSISTENCE=0.3
SDI_WEIGHT_QUALITY=0.25
```

## 生效方式

1. 修改 `.env` 文件或设置环境变量
2. 重启后端服务：
   ```bash
   cd backend
   docker-compose restart backend
   # 或
   systemctl restart epc-backend
   ```
3. 新的权重配置立即生效，下次 SDI 计算时使用新权重

## 查看当前权重

SDI 计算结果的 `detail.weights` 字段会包含当前使用的权重配置：

```json
{
  "sdi_score": 68.5,
  "detail": {
    "weights": {
      "initiative": 0.4,
      "exploration": 0.2,
      "persistence": 0.2,
      "quality": 0.2
    },
    ...
  }
}
```

## 注意事项

1. **权重之和必须为 1.0**，否则 SDI 分数会失真
2. 修改权重后，历史 SDI 记录不会重新计算（保持历史一致性）
3. 建议在系统上线初期确定权重，避免频繁调整
4. 如需调整，建议小幅度调整（±0.05），观察一段时间后再决定是否继续调整

## 技术实现

- 配置文件：`backend/app/core/config.py`
- 计算引擎：`backend/app/sdi_calculator.py`
- 权重读取：`_get_weights()` 函数从 `settings` 动态读取
