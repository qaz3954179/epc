# 成就解锁模块设计方案

## 核心设计理念

**不是量化成就本身，而是量化成就背后的行为模式变化。**

成就系统采用「延迟揭晓 + 意外惊喜」设计：
- 孩子不知道隐藏成就的条件
- 解锁后才看到揭晓文案
- 防止"为了徽章而刷"的外驱行为
- 强化过程而非结果

---

## 一、自驱力量化指标

### 四大行为指标

#### 1. 主动性指标 - "谁发起的？"
```
主动完成率 = 无提醒完成次数 / 总完成次数

数据采集：trigger_type 字段
- self_initiated: 孩子自己点击完成（主动）
- parent_reminded: 家长提醒后完成（被动）
- deadline_driven: 临近deadline才完成（拖延）
```

#### 2. 探索性指标 - "愿不愿意尝试新东西？"
```
探索广度 = 尝试过的任务类型数 / 可用任务类型总数
探索深度 = 非必选任务完成次数 / 必选任务完成次数

数据采集：
- 通过 category 字段统计
- 记录首次尝试新类型任务的时间点
```

#### 3. 持续性指标 - "停止奖励后还做吗？"
```
连续完成天数
低奖励任务完成率变化

数据采集：
- 时间序列分析
- 对比不同奖励级别的任务完成率
```

#### 4. 质量指标 - "是应付还是真学？"
```
深度参与度 = 超额完成次数 / 总完成次数

数据采集：
- quality_score: 家长评分 1-5 分
- is_extra: 是否超额完成
- extra_detail: 超额说明
```

### SDI 自驱力指数（Self-Drive Index）

```
SDI = (
    主动性得分 × 0.4 +      # 最重要
    探索性得分 × 0.2 +      
    持续性得分 × 0.2 +      
    质量得分 × 0.2
) × 时间衰减系数

时间衰减系数：
- 近7天的行为权重 = 1.0
- 8-14天的行为权重 = 0.7
- 15-30天的行为权重 = 0.4
```

**各维度得分计算（0-100分）：**
- **主动性** = `self_initiated 次数 / 总完成次数 × 100`
- **探索性** = `(尝试过的分类数 / 总分类数) × 50 + (可选任务完成数 / 必选任务完成数) × 50`
- **持续性** = `当前连续天数 / 目标天数(21天) × 100`，封顶100
- **质量** = `平均 quality_score × 20`（1-5分映射到20-100）

**关键：这个指数只给家长看，不给孩子看。**

---

## 二、成就定义体系

### A. 隐藏成就（核心，对应自驱力指标）

孩子看不到条件，只有解锁后才揭晓。

| 成就 | 对应指标 | 触发条件 | 揭晓文案示例 |
|---|---|---|---|
| 🌟 自驱小达人 | 主动性 | 连续7天主动完成率>80% | "你已经连续一周都是自己想起来学习的，太棒了！" |
| 🔥 习惯养成者 | 持续性 | 连续21天每天至少完成1个任务 | "21天，学习已经变成你的习惯了！" |
| 🧭 好奇探险家 | 探索性 | 尝试了所有任务分类（daily/exam/game/pe） | "你的学习地图越来越丰富了！" |
| 🎯 深度学习者 | 质量 | 累计5次超额完成 | "你不只是完成任务，你在超越自己！" |
| 🌈 全能选手 | 探索性 | 单周内每个分类都有完成记录 | "这周你在各个领域都有进步！" |
| 💪 不靠奖励 | 持续性 | 低奖励任务（<5币）连续完成10次 | "你做这些不是为了学习币，而是因为你喜欢！" |
| 🚀 连续进步 | 质量+持续性 | 连续4周SDI指数上升 | "你的自驱力一直在成长，继续保持！" |
| 🌱 早起鸟 | 主动性 | 早上8点前主动完成任务累计10次 | "早起的鸟儿有虫吃，你就是那只鸟！" |
| 🎨 跨界达人 | 探索性 | 首次尝试新分类任务累计5次 | "每次尝试新领域都是一次冒险！" |

### B. 里程碑成就（可见但不强调）

条件可以让孩子知道，但不做进度条展示。

| 成就 | 触发条件 |
|---|---|
| 🎓 学习新手 | 首次完成任务 |
| 💰 小小理财家 | 首次兑换奖品 |
| 📚 百次达成 | 累计完成100次任务 |
| 🏆 千币富翁 | 累计获得1000学习币 |

---

## 三、角色分工

### 管理员（admin）
- 创建/编辑/删除成就定义（包括条件、文案、图标、是否隐藏）
- 查看全局成就解锁统计（哪些成就解锁率高/低，用于调优）
- 手动授予/撤销特殊成就
- 配置 SDI 权重参数（主动性0.4、探索性0.2、持续性0.2、质量0.2）
- 查看所有孩子的 SDI 趋势数据

### 家长（parent）
- 查看自己孩子的成就列表（已解锁 + 未解锁数量，但隐藏成就不显示条件）
- 查看孩子的 SDI 自驱力指数及趋势图（**只有家长能看，孩子看不到**）
- 对任务完成进行质量评分（1-5分）
- 查看行为分析报告：
  - 主动完成率趋势
  - 探索广度/深度
  - 各分类参与度
  - 个性化引导建议（如"建议引导孩子试试科学实验类任务"）
- 在任务完成时标记 `trigger_type`（主动/提醒后/拖延）

### 孩子（child）
- 查看已解锁的成就（带故事性文案和解锁时间）
- 收到成就解锁的惊喜通知（弹窗/动画）
- 查看成就总数（如"已解锁 8/? 个成就"，用 `?` 代替总数，保持神秘感）
- **看不到**：SDI 指数、未解锁隐藏成就的条件、行为分析数据

---

## 四、数据模型设计

### 扩展现有表：TaskCompletion

新增字段：
```python
trigger_type: str | None  # self_initiated / parent_reminded / deadline_driven
quality_score: int | None  # 1-5 分，家长评价
is_extra: bool  # 是否超额完成
extra_detail: str | None  # 超额说明
```

### 新增表

#### Achievement（成就定义）
```python
id: uuid.UUID
name: str  # 成就名称
description: str  # 描述
icon: str  # 图标 emoji 或 URL
reveal_message: str  # 解锁揭晓文案
category: str  # hidden / milestone
condition_type: str  # streak / count / rate / composite
condition_config: dict  # JSON，具体条件参数
is_active: bool
created_at: datetime
updated_at: datetime
```

#### UserAchievement（用户成就解锁记录）
```python
id: uuid.UUID
user_id: uuid.UUID → User
achievement_id: uuid.UUID → Achievement
unlocked_at: datetime
trigger_snapshot: dict  # JSON，解锁时的行为数据快照
```

#### SDIRecord（自驱力指数记录）
```python
id: uuid.UUID
user_id: uuid.UUID → User
date: date  # 记录日期
period_type: str  # daily / weekly
sdi_score: float  # 综合得分
initiative_score: float  # 主动性得分
exploration_score: float  # 探索性得分
persistence_score: float  # 持续性得分
quality_score: float  # 质量得分
detail: dict  # JSON，详细分析数据
created_at: datetime
```

#### AchievementNotification（成就通知队列）
```python
id: uuid.UUID
user_id: uuid.UUID → User
achievement_id: uuid.UUID → Achievement
is_read: bool
created_at: datetime
```

---

## 五、成就检测引擎

### 触发时机

1. **任务完成时** → 检查计数类、连续类成就
2. **每日定时任务（cron）** → 计算 SDI 指数、检查趋势类成就
3. **家长评分后** → 检查质量类成就

### 检测流程

```
任务完成 → 写入 TaskCompletion（含 trigger_type）
         → 触发成就检测引擎
         → 遍历该用户未解锁的成就
         → 逐个评估条件
         → 满足条件 → 写入 UserAchievement + AchievementNotification
         → 孩子下次打开页面看到惊喜弹窗
```

### 条件评估器

根据 `condition_type` 分发到不同的评估器：

- **streak**: 连续天数检查
- **count**: 累计次数检查
- **rate**: 比率检查（如主动完成率）
- **composite**: 复合条件（多个指标组合）

---

## 六、API 设计

### 任务完成相关

```
POST /api/v1/task-completions/
Body: {
  item_id: uuid,
  trigger_type: "self_initiated" | "parent_reminded" | "deadline_driven",
  is_extra: bool,
  extra_detail: string (optional)
}

PATCH /api/v1/task-completions/{id}/quality
Body: {
  quality_score: 1-5
}
权限：仅家长可评分
```

### 成就相关

```
GET /api/v1/achievements/
查询参数：category (hidden/milestone), is_active
权限：管理员

POST /api/v1/achievements/
权限：管理员

GET /api/v1/achievements/my
返回当前用户的成就列表（已解锁 + 未解锁数量）
权限：孩子、家长

GET /api/v1/achievements/notifications
返回未读成就通知
权限：孩子

PATCH /api/v1/achievements/notifications/{id}/read
标记通知已读
权限：孩子
```

### SDI 相关

```
GET /api/v1/sdi/child/{child_id}
返回指定孩子的 SDI 指数及趋势
权限：家长（只能查看自己的孩子）、管理员

GET /api/v1/sdi/child/{child_id}/analysis
返回详细行为分析报告
权限：家长、管理员

POST /api/v1/sdi/calculate
手动触发 SDI 计算（通常由定时任务调用）
权限：管理员
```

---

## 七、开发分期

### Phase 1：数据采集层（1周）
- [x] 扩展 TaskCompletion 表（trigger_type, quality_score, is_extra, extra_detail）
- [ ] 创建数据库迁移脚本
- [ ] 更新 TaskCompletion 相关模型
- [ ] 更新任务完成 API 支持新字段
- [ ] 添加家长质量评分 API

### Phase 2：成就系统（2周）
- [ ] 创建 Achievement、UserAchievement、AchievementNotification 表
- [ ] 成就定义 CRUD API
- [ ] 成就检测引擎（条件评估器）
- [ ] 成就解锁记录 API
- [ ] 成就通知 API

### Phase 3：SDI 计算引擎（2周）
- [ ] 创建 SDIRecord 表
- [ ] SDI 计算引擎（四大指标 + 时间衰减）
- [ ] 定时任务（每日计算 SDI）
- [ ] 家长仪表盘 API（趋势图、分析报告）
- [ ] 个性化引导建议生成

### Phase 4：前端展示（1周）
- [ ] 孩子端成就展示页
- [ ] 成就解锁动画/弹窗
- [ ] 家长端 SDI 仪表盘
- [ ] 家长端行为分析报告页

---

## 八、关键设计决策

### 1. 为什么隐藏成就条件？
防止孩子"为了徽章而刷"，保持内在动机。成就是对行为的「发现」和「命名」，不是追逐的目标。

### 2. 为什么 SDI 只给家长看？
避免孩子过度关注分数，产生焦虑。家长用 SDI 了解孩子的真实状态，调整引导策略。

### 3. 为什么需要 trigger_type？
这是主动性指标的核心数据。区分"自己想起来做"和"被提醒才做"，是自驱力的关键差异。

### 4. 为什么需要质量评分？
防止孩子"应付式完成"。质量评分让家长参与评估，也让系统能识别"深度参与"。

### 5. 为什么用时间衰减？
近期行为更能反映当前状态。过去的数据权重降低，避免"吃老本"。

---

## 九、未来扩展

- AI 生成个性化成就（基于孩子的行为模式）
- 成就分享功能（家长朋友圈）
- 成就兑换特殊奖励
- 多孩子对比分析（同龄对比）
- 成就推荐系统（引导孩子尝试新领域）

---

**最后更新：** 2026-04-12
**当前状态：** Phase 1 进行中
