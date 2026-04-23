# 📱 EPC 小程序 — 详细页面设计

> 2026-04-22 · 详细设计稿 · Taro 4 + React 18 + TypeScript + Zustand

---

## 一、全局规范

### 1.1 路由配置

```typescript
// src/app.config.ts
export default defineAppConfig({
  pages: [
    'pages/index/index',        // Tab 1: 首页（孩子）/ 花园（家长）
    'pages/tasks/tasks',        // Tab 2: 任务（孩子）/ 数据（家长）
    'pages/store/store',        // Tab 3: 商城
    'pages/profile/profile',    // Tab 4: 我的
  ],
  subPackages: [
    {
      root: 'subpackages/auth',
      pages: [
        'login/login',          // 登录/角色选择
      ],
    },
    {
      root: 'subpackages/child',
      pages: [
        'exam/exam',            // 考试列表
        'exam-play/exam-play',  // 答题页面
        'achievements/achievements',
        'growth/growth',
        'exchange/exchange',    // 兑换确认
        'exchange-records/exchange-records',
      ],
    },
    {
      root: 'subpackages/parent',
      pages: [
        'child-manage/child-manage',  // 宝贝管理
        'wish-review/wish-review',    // 愿望审核（星球相关）
        'exam-schedule/exam-schedule', // 考试安排
        'task-manage/task-manage',    // 任务管理（跳转 Web）
      ],
    },
  ],
  tabBar: {
    // 动态配置：根据角色渲染不同 tab
    list: [], // 运行时通过 useRole() 动态设置
  },
});
```

**路由策略：**
- 4 个主 Tab 放在主包（高频页面）
- 次级页面分包加载
- 任务管理和奖品管理复杂表单 → 跳转 Web 端（`Taro.navigateToMiniProgram` 或 H5 嵌入）

### 1.2 状态管理 (Zustand)

```typescript
// src/store/auth.ts
interface AuthState {
  token: string | null;
  user: UserPublic | null;
  role: UserRole | null;        // 'parent' | 'child'
  childId: string | null;       // 当前选择的孩子 ID（家长视角）
  setAuth: (token: string, user: UserPublic) => void;
  switchRole: (role: UserRole) => void;
  switchChild: (childId: string) => void;
  logout: () => void;
}

// src/store/tasks.ts
interface TasksState {
  todayTasks: TodayTaskPublic[];
  loading: boolean;
  setTodayTasks: (tasks: TodayTaskPublic[]) => void;
  completeTask: (itemId: string) => void; // 乐观更新
}

// src/store/coins.ts
interface CoinsState {
  balance: number;
  todayLogs: CoinLogPublic[];
  updateBalance: (balance: number) => void;
  addLog: (log: CoinLogPublic) => void;
}

// src/store/store.ts — 统一导出
const useAuthStore = create<AuthState>(...);
const useTasksStore = create<TasksState>(...);
const useCoinsStore = create<CoinsState>(...);
```

**状态管理原则：**
- 全局 store 只存用户信息、角色、当前选中孩子
- 页面级数据用 React Query（`@tanstack/react-query`）缓存
- 乐观更新只用于打卡、兑换等确定性操作

### 1.3 API 封装

```typescript
// src/services/api.ts
const BASE_URL = process.env.TARO_APP_API_URL;

function request<T>(options: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: unknown;
  needAuth?: boolean;
}): Promise<T> {
  const header: Record<string, string> = {};
  if (options.needAuth !== false) {
    const token = useAuthStore.getState().token;
    if (token) header['Authorization'] = `Bearer ${token}`;
  }
  header['Content-Type'] = 'application/json';

  return Taro.request({
    url: `${BASE_URL}${options.url}`,
    method: options.method || 'GET',
    data: options.data,
    header,
  }).then(res => {
    if (res.statusCode === 401) {
      // token 过期，跳转登录
      Taro.redirectTo({ url: '/subpackages/auth/login/login' });
      throw new Error('未登录');
    }
    return res.data as T;
  });
}

// 导出便捷方法
export const api = {
  get: <T>(url: string) => request<T>({ url }),
  post: <T>(url: string, data?: unknown) => request<T>({ url, method: 'POST', data }),
  put: <T>(url: string, data?: unknown) => request<T>({ url, method: 'PUT', data }),
  patch: <T>(url: string, data?: unknown) => request<T>({ url, method: 'PATCH', data }),
  delete: <T>(url: string) => request<T>({ url, method: 'DELETE' }),
};
```

### 1.4 主题变量

```scss
// src/styles/variables.scss
$primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$success-gradient: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
$reward-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

$child-font-size-base: 16px;
$child-font-size-title: 20px;
$child-btn-height: 60px;
$child-touch-min: 44px;

$parent-font-size-base: 14px;
$parent-font-size-title: 18px;

$color-primary: #667eea;
$color-success: #43e97b;
$color-warning: #f5576c;
$color-text: #333;
$color-text-secondary: #888;
$color-bg: #f5f5f5;
$color-bg-white: #ffffff;
$color-border: #e8e8e8;
```

---

## 二、认证模块

### 2.1 登录页 `subpackages/auth/login/login`

**页面结构：**

```
┌──────────────────────────────┐
│         [Logo]               │
│      EPC 教育平台             │
├──────────────────────────────┤
│                              │
│  ┌──────────────────────┐    │
│  │  微信一键登录          │    │  ← 主按钮（绿色）
│  │      🟢              │    │
│  └──────────────────────┘    │
│                              │
│  ──── 或 ────                │
│                              │
│  ┌──────────────────────┐    │
│  │  邮箱登录             │    │  ← 次按钮
│  └──────────────────────┘    │
│                              │
│  [没有账号？注册 →]           │
└──────────────────────────────┘
```

**流程：**

```
用户点击"微信一键登录"
  ↓
Taro.login() → 获取 code
  ↓
POST /oauth/wechat/callback { code }
  ↓
后端返回 { access_token, is_new_user }
  ↓
存储 token + 获取用户信息 GET /users/me
  ↓
用户角色判断：
  ├── role === 'child' → 直接进入孩子端
  ├── role === 'parent' → 直接进入家长端
  └── 同时有 parent + child 身份 → 弹出角色选择

角色选择弹窗：
  ┌──────────────────────────────┐
  │     选择你的身份              │
  ├──────────────────────────────┤
  │  👤 家长                      │
  │  管理宝贝的学习计划            │
  ├──────────────────────────────┤
  │  👶 我是宝贝                  │
  │  打卡、兑奖品、看星球          │
  └──────────────────────────────┘
```

**家长首次登录（is_new_user = true）：**

```
微信登录成功 → is_new_user = true
  ↓
跳转到"添加宝贝"页面
  ↓
输入孩子信息（昵称、性别、出生月份）
  ↓
POST /children/ { ... } → 创建 child 账户
  ↓
进入家长端首页
```

### 2.2 注册页（邮箱方式，低频）

```
POST /signup { email, password, full_name, referral_code? }
→ 发送验证邮件
→ 用户点击邮件链接验证
→ POST /login/email { email, password } → 获取 JWT
```

---

## 三、孩子端详细设计

### 3.1 Tab 1: 🏠 首页 `pages/index/index`（孩子视角）

**组件树：**

```
<ChildHome>
  ├── <HeaderGreeting />           // 顶部问候
  ├── <CoinBalanceCard />          // 学习币余额卡片
  ├── <TodayProgressBar />         // 今日任务进度横幅
  ├── <TodayTaskQuickList />       // 今日待完成任务（快速打卡）
  │   └── <TaskCard /> × N         // 单个任务卡片
  ├── <PlanetTeaser />             // 星球入口预告
  └── <BottomSpacing />
</ChildHome>
```

**数据流：**

```
页面加载
  ├── GET /users/me → 用户信息（昵称、coins、avatar_url）
  ├── GET /task-completions/today → 今日任务列表
  └── GET /task-completions/coin-logs/today → 今日学习币变动

状态：
  ├── authStore: user, role
  ├── coinsStore: balance
  ├── queryCache: todayTasks
  └── localState: refreshing
```

**组件详细设计：**

#### `<HeaderGreeting />`

```tsx
// 输入：user.nickname 或 user.full_name
// 输出：
//   早上 → "🌅 [昵称]，早上好呀！"
//   下午 → "☀️ [昵称]，下午好！"
//   晚上 → "🌙 [昵称]，晚上好哦~"
// 样式：文字 20px，居中，margin-bottom: 16px
```

#### `<CoinBalanceCard />`

```tsx
// 输入：balance (number)
// 样式：渐变背景（紫色系），圆角 16px，padding 20px
// 内容：
//   🪙 学习币
//   1,280（大字 36px，加粗）
//   [去商城 →]（右侧小链接）
// 点击 → Taro.switchTab({ url: '/pages/store/store' })
```

#### `<TodayProgressBar />`

```tsx
// 输入：TodayTaskPublic[]
// 计算：
//   totalTargets = sum(items with target_count that are daily)
//   completed = count(items where completed_today)
// 样式：
//   彩虹渐变进度条（CSS linear-gradient）
//   进度文字：`${completed}/${totalTargets} 完成`
//   激励文字：
//     - 全部完成 → "🎉 太厉害了！今日任务全部完成！"
//     - 未完成 → `⭐ 再完成 ${remaining} 个就能解锁...`
```

#### `<TodayTaskQuickList />`

```tsx
// 输入：TodayTaskPublic[] 过滤未完成的任务（最多显示 3 个）
// 每个任务卡片 <TaskCard />:
//   - 图标（根据 category 映射 emoji）
//   - 标题
//   - 奖励文字 "+10 🪙"
//   - 大按钮 "打卡"（60px 高，渐变色）
// 点击打卡 → handleComplete(itemId)
// 底部 "查看更多任务 →" → Taro.switchTab({ url: '/pages/tasks/tasks' })
```

**打卡交互流程：**

```
用户点击 [打卡]
  ↓
乐观更新：本地标记已完成 + 播放动画
  ↓
POST /task-completions/{itemId}/complete { }
  ↓
成功 → 弹出鼓励弹窗 + 震动反馈
  ├── "太棒了！+{coins_reward} 🪙"
  ├── Lottie 粒子动画（0.8s）
  ├── Taro.vibrateShort()
  ├── 刷新余额
  └── 成就弹窗（如果触发了新成就）
失败 → 恢复按钮状态 + Toast 提示
```

**鼓励弹窗组件 `<CelebrateModal />`：**

```tsx
// 触发：打卡成功后
// 内容：
//   大 emoji（🎉✨⭐）
//   "太棒了！"
//   "+10 🪙"
//   Lottie 粒子动画背景
//   自动消失（1.5s），或点击关闭
```

#### `<PlanetTeaser />`

```tsx
// 星球子系统入口（Phase 1 后可用）
// 输入：星球列表（后续接入）
// MVP 阶段：静态占位 "🪐 我的星球（即将上线）"
// 后期：显示 1-2 个星球缩略图 + 生长状态文字
```

---

### 3.2 Tab 2: 📝 任务 `pages/tasks/tasks`（孩子视角）

**组件树：**

```
<ChildTasks>
  ├── <TaskFilterBar />            // 筛选：分类 + 时间
  ├── <Section title="📅 今日任务">
  │   └── <TaskCard /> × N         // 今日任务（含已完成和未完成）
  ├── <Section title="📝 考试预约">
  │   └── <ExamBookingCard /> × N  // 考试预约卡片
  └── <Section title="📊 本周统计">
      └── <WeeklyChart />          // 柱状图
</ChildTasks>
```

**数据流：**

```
页面加载
  ├── GET /items/ → 全部任务列表
  ├── GET /task-completions/today → 今日完成情况
  ├── GET /exams/bookings → 考试预约
  └── 计算本周统计（前端根据 task-completions 历史记录）

下拉刷新：重新拉取所有数据
```

#### `<TaskFilterBar />`

```tsx
// 筛选维度：
//   分类：全部 / 学习 / 运动 / 生活 / 其他
//   时间：今天 / 本周
// UI：横向滚动 pill 按钮
// 状态：local state，过滤本地数据
```

#### `<TaskCard />`（复用组件）

```tsx
interface TaskCardProps {
  task: TodayTaskPublic;
  onComplete: (itemId: string) => void;
  variant: 'home' | 'tasks';  // 首页用简化版，任务页用完整版
}

// 完整版显示：
//   - 图标 + 标题 + 描述
//   - 分类标签（彩色 pill）
//   - 奖励文字 "+{coins_reward} 🪙"
//   - 进度 "{completed_count}/{target_count}"
//   - 状态：
//     - 未完成 → 大按钮 "打卡 加油！💪"
//     - 进行中 → 进度条 + "已完成 {count}/{target}"
//     - 已完成 → "✅ 已完成 · {time}"

// 状态样式：
//   未完成：按钮渐变色（紫→粉）
//   进行中：按钮橙色
//   已完成：灰色，打勾图标
```

#### `<ExamBookingCard />`

```tsx
interface ExamBookingCardProps {
  booking: ExamBookingPublic;
}

// 显示：
//   科目 emoji（🔢数学 📖语文 🔤英语）
//   标题
//   预约时间 "明天 10:00"
//   状态标签：
//     - booked → "已预约"
//     - started → "进行中"（可点击进入）
//   按钮：
//     - 未到时间 → "等待中"
//     - 已到时间 → "开始考试 →"

// 点击"开始考试" →
//   Taro.navigateTo({ url: '/subpackages/child/exam-play/exam-play' })
```

#### `<WeeklyChart />`

```tsx
// 简单的柱状图（纯 CSS 实现，不依赖图表库）
// 输入：7 天的完成数量
// 每列：
//   - 柱形（渐变色，高度按完成数量）
//   - 日期标签（周一、周二...）
// 今天高亮显示
```

---

### 3.3 Tab 3: 🛒 商城 `pages/store/store`

**组件树：**

```
<Store>
  ├── <StoreHeader />              // 余额悬浮头
  ├── <CategoryTabs />             // 分类筛选
  ├── <PrizeGrid />                // 商品网格（2列）
  │   └── <PrizeCard /> × N
  └── <MyRedemptionsLink />        // 兑换记录入口
</Store>
```

**数据流：**

```
页面加载
  ├── GET /prizes/ → 奖品列表
  ├── GET /users/me → 当前余额
  └── 分类筛选 → 前端本地过滤
```

#### `<StoreHeader />`

```tsx
// 悬浮在顶部，滚动时保持可见（sticky top）
// 显示当前余额 🪙 1,280
// 背景：毛玻璃效果（backdrop-filter: blur）
```

#### `<CategoryTabs />`

```tsx
// 横向滚动 Tab
// 分类：全部 / 文具 / 玩具 / 虚拟 / 食品
// 选中态：下划线 + 加粗
// 数据：从奖品列表中提取唯一 category，加上"全部"
```

#### `<PrizeCard />`

```tsx
interface PrizeCardProps {
  prize: PrizePublic;
  onRedeem: (prize: PrizePublic) => void;
}

// 布局：2 列网格（grid-template-columns: 1fr 1fr）
// 每个卡片：
//   - 商品图片（aspect-ratio: 1，圆角 8px）
//   - 名称（最多 2 行，超出省略）
//   - 价格 🪙 {coins_cost}
//   - 兑换按钮（如果余额足够显示"兑换"，不足显示"攒币中"）

// 库存为 0 → 整张卡片灰色 + "已兑完"标签
```

**兑换流程：**

```
用户点击 [兑换]
  ↓
弹出确认弹窗 <RedeemConfirmModal />
  ├── 奖品名称 + 图片
  ├── 需要：🪙 500
  ├── 余额：🪙 1,280
  ├── 兑换后：🪙 780
  ├── [取消] [确认兑换]
  └── 如果 prize_type === 'physical' → 要求选择收货地址

确认 → POST /redemptions/ { prize_id, address? }
  ↓
成功 → Toast "兑换成功！家长确认后发货 📦"
  ↓
刷新余额
```

**兑换记录页 `subpackages/child/exchange-records/exchange-records`：**

```
GET /redemptions/ → 我的兑换列表
每个记录显示：
  - 奖品名称 + 图片
  - 状态标签：
    - pending → "待确认"（橙色）
    - processing → "处理中"（蓝色）
    - completed → "已发货"（绿色）
    - cancelled → "已取消"（灰色）
  - 如果是 physical + processing/completed → 显示物流信息
```

---

### 3.4 Tab 4: 👤 我的 `pages/profile/profile`（孩子视角）

**组件树：**

```
<ChildProfile>
  ├── <ProfileHeader />            // 个人信息卡片
  ├── <MenuItem icon="🏆" title="我的成就" subtitle="已解锁 8/20" />
  ├── <MenuItem icon="📈" title="成长记录" subtitle="本周 18/24" />
  ├── <MenuItem icon="📋" title="我的兑换记录" subtitle="最近：乐高积木" />
  ├── <MenuItem icon="🪐" title="我的星球" subtitle="2颗" />
  ├── <Divider />
  ├── <MenuItem icon="📮" title="意见反馈" />
  ├── <MenuItem icon="⚙️" title="设置" />
  ├── <MenuItem icon="🔄" title="切换身份" subtitle="切换到家长" />
  └── <MenuItem icon="🚪" title="退出登录" danger />
</ChildProfile>
```

**数据流：**

```
页面加载
  ├── GET /users/me → 个人信息
  ├── GET /achievements/child/summary → 成就概览
  └── GET /growth/heatmap?days=7 → 本周完成统计
```

#### `<ProfileHeader />`

```tsx
// 头像（avatar_url 或默认头像）
// 昵称（大字 18px）
// 🪙 {coins} 学习币
// ⭐ 连续打卡 {streak} 天
// 背景：渐变紫色
```

#### 角色切换

```tsx
// 点击"切换身份" →
//   authStore.switchRole('parent')
//   Taro.switchTab 刷新 Tab
//   切换到家长端首页

// 家长端点击"切换到孩子"同理
// 如果是多孩子家长，先弹出选择孩子列表
```

---

### 3.5 考试页 `subpackages/child/exam/exam`

```
GET /exams/bookings → 预约考试列表
每个考试卡片：
  - 模板标题
  - 科目 + 难度
  - 预约时间
  - 状态：
    - booked → "已预约，等待考试"
    - started → "进行中，点击继续"
    - completed → "已完成，查看报告"

点击"开始考试" → exam-play
点击"查看报告" → exam-play（只读模式）
```

### 3.6 答题页 `subpackages/child/exam-play/exam-play`

```tsx
// 考试流程：
// 1. 进入 → POST /exams/sessions { booking_id? } → 创建会话
// 2. 加载题目 → GET /exams/sessions/{sessionId}/questions
// 3. 逐题展示：
//    - 题目内容
//    - 选项（选择题）或输入框（填空题）
//    - 倒计时（如果有 time_limit_seconds）
// 4. 提交答案 → POST /exams/sessions/{sessionId}/answers { question_id, answer }
// 5. 即时反馈 → 正确 ✅ / 错误 ❌ + 解析
// 6. 全部答完 → GET /exams/sessions/{sessionId}/report → 展示报告
// 7. 报告页 → 分数、正确率、获得学习币、连击数

// 考试模式适配：
//   classic → 逐题作答
//   countdown → 倒计时模式
//   challenge → 闯关模式（答错结束）
```

### 3.7 成就页 `subpackages/child/achievements/achievements`

```
GET /achievements/child/ → 成就列表

两种显示：
  - unlocked → 显示完整信息（名称、图标、描述、解锁时间、reveal_message）
  - locked → 显示"???" 或模糊图标 + 类别提示

布局：网格（3 列），已解锁的彩色，未解锁的灰色
点击已解锁 → 弹出成就详情（含庆祝动画）
```

### 3.8 成长记录页 `subpackages/child/growth/growth`

```
GET /growth/heatmap?days=30 → 热力图数据
GET /growth/report?period=week → 进步报告
GET /growth/rewards → 奖励汇总

页面结构：
  - 热力图（30 天日历格子，颜色深浅 = 完成数量）
  - 当前连续天数 & 最长连续天数
  - 本周 vs 上周对比
  - 分类统计（学习/运动/生活各完成多少次）
  - 最近获得的奖励列表
```

---

## 四、家长端详细设计

### 4.1 Tab 1: 🏠 花园 `pages/index/index`（家长视角）

**组件树：**

```
<ParentGarden>
  ├── <BabySelector />             // 宝贝切换器
  ├── <BabyCard />                 // 宝贝信息卡片
  ├── <PlanetList />               // 星球列表（Phase 1）
  ├── <TodoList>                   // 待办事项
  │   ├── <WishReviewItem />       // 待审核愿望
  │   ├── <ExchangeApprovalItem /> // 待确认兑换
  │   └── <ActivityFeedItem />     // 最近动态
  └── <ActivityFeed />             // 时间线式动态
</ParentGarden>
```

**数据流：**

```
页面加载
  ├── GET /children/ → 宝贝列表
  ├── GET /parent/monitor/{childId} → 宝贝概览（监控面板 API）
  ├── GET /parent/activities/{childId} → 最近动态
  └── GET /parent/pending-wishes/{childId} → 待处理愿望（星球相关）

切换宝贝：重新拉取当前 childId 的数据
```

#### `<BabySelector />`

```tsx
// 多孩子时显示下拉选择
// 单孩子时显示当前宝贝名 + "▼"（可点击切换）
// 选项：宝贝昵称 + 头像
// 状态：authStore.childId
```

#### `<BabyCard />`

```tsx
// 显示：
//   - 头像 + 昵称
//   - 🪙 {coins} 学习币
//   - ⭐ 连续打卡 {streak} 天
//   - 📊 今日 {completed}/{total} 任务完成
//   - [查看详情 →] → 跳转到数据 Tab
```

#### `<TodoList />`

```tsx
// 聚合待办事项，按优先级排序：
// 1. 愿望审核（红色圆点标记数量）
// 2. 兑换审批
// 3. 考试安排提醒

// 愿望审核卡片：
//   "小明想要一只仓鼠 🐹"
//   "系统已生成 5 张知识卡片"
//   [查看详情] [种种子] [放一放]
//   → 点击操作 → POST /planets/wishes/{wishId}/respond { action }
```

### 4.2 Tab 2: 📊 数据 `pages/tasks/tasks`（家长视角）

**组件树：**

```
<ParentData>
  ├── <BabySelector />             // 同上
  ├── <StatsRow />                 // 4 个统计卡片
  ├── <HeatmapSection />           // 任务完成热力图
  ├── <RecentCompletions />        // 最近任务完成
  └── <CoinLogs />                 // 学习币明细
</ParentData>
```

**数据流：**

```
页面加载
  ├── GET /parent/monitor/{childId} → 监控面板数据
  ├── GET /growth/heatmap?child_id={childId}&days=30
  ├── GET /task-completions/child/{childId}/completions?days=7
  └── GET /coin-logs/ 家长查看孩子的学习币记录
```

#### `<StatsRow />`

```tsx
// 4 列统计卡片：
//   🪙 余额  |  ✅ 今日 |  📊 正确率 |  🔥 连续
//   1280    |  4/6    |   85%      |  12天
// 每个卡片：
//   - 图标 + 大数字 + 小标签
//   - 圆角卡片，白色背景
//   - 点击数字 → 跳转到详情

// 数据来源：
//   余额 → GET /users/me (child 的 coins)
//   今日 → GET /task-completions/today (家长视角需要查孩子的)
//   正确率 → 从考试报告中计算
//   连续 → GET /growth/heatmap
```

#### `<HeatmapSection />`

```tsx
// GitHub 风格热力图
// 30 天格子，颜色深浅 = 当日完成任务数
// 每个格子点击 → 弹出当日详情

// 实现：纯 CSS grid
// 7 列（周一到周日），最多 5 行
// 颜色映射：
//   0 → #ebedf0
//   1-2 → #9be9a8
//   3-5 → #40c463
//   6+ → #30a14e
```

#### `<RecentCompletions />`

```tsx
// 最近 7 天任务完成时间线
// 每条记录：
//   - 时间 "08:30"
//   - 任务名 "阅读30分钟"
//   - 状态 "✓"
//   - 质量评分（如果有）⭐⭐⭐⭐☆
// 底部 "查看全部 →" → 跳转 Web 端任务管理
```

#### `<CoinLogs />`

```tsx
// 学习币收支明细
// 每条：
//   - 日期 "今天"
//   - 描述 "+10 阅读任务" / "-500 乐高积木兑换"
//   - 金额（绿色 + / 红色 -）
// 底部 "查看全部 →" → 跳转 Web 端
```

### 4.3 Tab 3: ⚡ 审批 `pages/store/store`（家长视角）

> 复用 Tab 3 页面路径，通过角色条件渲染不同内容

**组件树：**

```
<ParentApproval>
  ├── <Section title="🪐 新愿望" badge={count}>
  │   └── <WishReviewCard /> × N
  ├── <Section title="📝 考试安排">
  │   └── <ExamScheduleCard /> × N
  ├── <Section title="🎁 兑换审批">
  │   └── <ExchangeApprovalCard /> × N
  └── <Section title="已完成">
      └── <CompletedItem /> × N
</ParentApproval>
```

**数据流：**

```
GET /parent/pending-wishes/{childId} → 待审核愿望
GET /exams/bookings → 考试安排
GET /redemptions/parent/pending → 待确认兑换
```

#### 愿望回应交互

```
家长点击 [种种子]
  ↓
POST /planets/wishes/{wishId}/respond { action: 'approve' }
  ↓
成功 → 卡片变灰 + "已种种子 ✓" + 小动画

家长点击 [放一放]
  ↓
POST /planets/wishes/{wishId}/respond { action: 'defer' }
  ↓
成功 → 卡片移出待处理列表
```

### 4.4 Tab 4: 👤 我的 `pages/profile/profile`（家长视角）

**组件树：**

```
<ParentProfile>
  ├── <ProfileHeader />            // 家长个人信息
  ├── <MenuItem icon="👶" title="我的宝贝" subtitle="小明 · 小红" />
  ├── <MenuItem icon="📋" title="任务管理" subtitle="跳转 Web 端" />
  ├── <MenuItem icon="🎁" title="奖品管理" subtitle="跳转 Web 端" />
  ├── <MenuItem icon="📣" title="推广邀请" subtitle="已邀请 3 人" />
  ├── <Divider />
  ├── <MenuItem icon="📮" title="意见反馈" />
  ├── <MenuItem icon="⚙️" title="设置" />
  ├── <MenuItem icon="🔄" title="切换身份" subtitle="切换到孩子" />
  └── <MenuItem icon="🚪" title="退出登录" danger />
</ParentProfile>
```

#### 推广邀请

```
GET /referrals/stats → 推广数据
显示：
  - 已邀请人数
  - 获得的奖励
  - 推荐码（可复制）
  - 邀请链接（可分享）

分享 → Taro.shareAppMessage({ ... })
```

---

## 五、API 接口清单

### 5.1 已有接口（可直接复用）

| 方法 | 路径 | 用途 | 使用页面 |
|------|------|------|---------|
| POST | `/oauth/wechat/callback` | 微信登录 | 登录 |
| GET | `/oauth/wechat/config` | 获取微信配置 | 登录 |
| GET | `/users/me` | 当前用户信息 | 全局 |
| GET | `/users/me/children` | 我的宝贝列表 | 花园、数据 |
| GET | `/task-completions/today` | 今日任务（含完成情况） | 首页、任务 |
| POST | `/task-completions/{id}/complete` | 完成任务 | 首页、任务 |
| GET | `/task-completions/coin-logs/today` | 今日学习币变动 | 首页 |
| GET | `/task-completions/child/{id}/completions` | 孩子任务完成历史 | 数据（家长） |
| GET | `/items/` | 任务列表 | 任务 |
| GET | `/prizes/` | 奖品列表 | 商城 |
| POST | `/redemptions/` | 兑换奖品 | 商城 |
| GET | `/redemptions/` | 我的兑换记录 | 兑换记录 |
| GET | `/coin-logs/` | 学习币明细 | 数据（家长） |
| GET | `/exams/bookings` | 考试预约列表 | 任务、审批 |
| GET | `/exams/bookings/{id}` | 考试预约详情 | 任务 |
| POST | `/exams/sessions` | 创建考试会话 | 答题 |
| POST | `/exams/sessions/{id}/answers` | 提交答案 | 答题 |
| GET | `/exams/sessions/{id}/report` | 考试报告 | 答题 |
| GET | `/achievements/child/` | 孩子成就列表 | 成就 |
| GET | `/achievements/child/summary` | 成就概览 | 我的 |
| GET | `/growth/heatmap` | 热力图数据 | 成长记录、数据 |
| GET | `/growth/report` | 进步报告 | 成长记录 |
| GET | `/growth/rewards` | 奖励汇总 | 成长记录 |
| GET | `/parent/monitor/{childId}` | 家长监控面板 | 花园、数据 |
| GET | `/children/` | 宝贝列表 | 花园 |
| POST | `/children/` | 创建宝贝 | 首次登录 |
| PUT | `/children/{id}` | 更新宝贝信息 | 宝贝管理 |
| GET | `/parent/sdi/{childId}` | SDI 数据 | 数据（家长） |
| GET | `/referrals/stats` | 推广统计 | 我的（家长） |
| PATCH | `/task-completions/{id}/quality` | 任务质量评分 | 数据（家长） |

### 5.2 需要新增的接口

| 方法 | 路径 | 用途 | 优先级 |
|------|------|------|--------|
| GET | `/parent/pending-wishes/{childId}` | 待审核愿望列表 | Phase 1 |
| POST | `/planets/wishes/{id}/respond` | 回应愿望（种种子/放一放） | Phase 1 |
| GET | `/parent/activities/{childId}` | 孩子最近动态流 | Phase 1 |
| GET | `/planets/mine/{childId}` | 我的星球列表 | Phase 1 |
| GET | `/planets/{id}` | 星球详情 | Phase 1 |
| POST | `/planets/wishes` | 提交愿望 | Phase 1 |
| GET | `/planets/cards/{wishId}` | 愿望知识卡片 | Phase 1 |

---

## 六、可复用组件清单

### 6.1 基础组件

| 组件 | 路径 | 说明 |
|------|------|------|
| `TaskCard` | `components/TaskCard/` | 任务卡片（支持 home/tasks 两种模式） |
| `PrizeCard` | `components/PrizeCard/` | 奖品卡片（商城网格用） |
| `StatCard` | `components/StatCard/` | 统计数字卡片 |
| `BabySelector` | `components/BabySelector/` | 宝贝切换下拉 |
| `CoinBadge` | `components/CoinBadge/` | 学习币徽章（小标签） |
| `EmptyState` | `components/EmptyState/` | 空状态占位 |
| `LoadingSpinner` | `components/LoadingSpinner/` | 加载动画 |

### 6.2 业务组件

| 组件 | 路径 | 说明 |
|------|------|------|
| `PlanetView` | `components/PlanetView/` | 星球展示（核心，SVG + CSS） |
| `CelebrateModal` | `components/CelebrateModal/` | 庆祝弹窗（打卡成功等） |
| `RedeemConfirmModal` | `components/RedeemConfirmModal/` | 兑换确认弹窗 |
| `WishReviewCard` | `components/WishReviewCard/` | 愿望审核卡片 |
| `ExamBookingCard` | `components/ExamBookingCard/` | 考试预约卡片 |
| `Heatmap` | `components/Heatmap/` | 任务完成热力图 |
| `WeeklyChart` | `components/WeeklyChart/` | 本周完成柱状图 |
| `ProfileHeader` | `components/ProfileHeader/` | 个人信息头（孩子/家长两套样式） |
| `MenuItem` | `components/MenuItem/` | 我的页面列表项 |
| `ActivityFeed` | `components/ActivityFeed/` | 动态时间线 |

---

## 七、交互细节规范

### 7.1 打卡交互

```
按下打卡按钮
  ↓ (0ms)
按钮变灰色 + loading spinner
  ↓ (200ms)
请求发送到后端
  ↓ (500-1000ms)
成功 → 按钮变绿色 ✅
  → 弹出 CelebrateModal（1.5s 自动消失）
  → Taro.vibrateShort() 短震动
  → 更新余额数字（数字滚动动画 0.5s）
  → 刷新任务列表

失败 → 按钮恢复原状
  → Toast.error("打卡失败，请重试")
```

### 7.2 数字滚动动画

```tsx
// 学习币余额变化时使用数字滚动
// 从 1280 → 1290（+10）
// 实现：requestAnimationFrame 插值 0.5s
```

### 7.3 下拉刷新

```tsx
// 所有列表页支持 Taro 原生下拉刷新
// onPullDownRefresh → 重新拉取数据
// 刷新成功 → 小动画 + "刷新成功"
```

### 7.4 骨架屏

```tsx
// 首屏加载显示骨架屏（而非 loading spinner）
// 每个页面定义对应的 Skeleton 组件
// 数据加载完成后淡入真实内容（opacity transition 0.3s）
```

---

## 八、页面状态流转图

```
┌──────────────────────────────────────────────────────────────┐
│                        小程序启动                              │
└──────────────────────┬───────────────────────────────────────┘
                       ▼
              ┌─────────────────┐
              │  检查本地 token   │
              └────────┬────────┘
                       │
            ┌──────────┼──────────┐
            ▼                     ▼
      token 存在             token 不存在
            │                     │
            ▼                     ▼
   GET /users/me          进入登录页
            │                     │
     ┌──────┼──────┐              │
     ▼             ▼              │
   200 OK         401             │
     │             │              │
     ▼             ▼              │
  检查角色     清除 token          │
     │        → 进入登录页         │
  ┌──┼──┐                         │
  ▼  ▼  ▼                         │
parent child both                 │
  │    │     │                    │
  ▼    ▼     ▼                    │
家长首页 孩子首页 角色选择弹窗       │
                           ◄──────┘
                           登录成功
```

---

## 九、技术实现 Checklist

### Phase 0: 项目搭建（1-2 周）

- [ ] `npx create-taro-app epc-miniapp`（React + TS + Sass）
- [ ] 安装依赖：zustand, @tanstack/react-query, ahooks
- [ ] 配置 app.config.ts（tabBar 动态配置）
- [ ] API 封装 + 拦截器
- [ ] 主题变量 & 全局样式
- [ ] 微信登录对接（复用已有 /oauth/wechat/* 接口）
- [ ] 角色选择 + Tab 切换逻辑

### Phase 1: 孩子端核心页面（2-3 周）

- [ ] 孩子端首页（问候 + 余额 + 快速打卡）
- [ ] 任务页（列表 + 筛选 + 考试入口）
- [ ] 商城页（奖品网格 + 兑换流程）
- [ ] 我的页（孩子视角）
- [ ] 打卡动画 + 震动反馈
- [ ] 成就页 + 成长记录页
- [ ] 考试答题页

### Phase 2: 家长端核心页面（2 周）

- [ ] 家长端花园页
- [ ] 家长端数据页（统计 + 热力图）
- [ ] 家长端审批页
- [ ] 家长端我的页
- [ ] 宝贝切换器
- [ ] 推广分享

### Phase 3: 星球集成（3-4 周）

- [ ] 星球展示组件（SVG + CSS Animation）
- [ ] 星球列表/详情页
- [ ] 许愿页
- [ ] 知识卡片阅读页
- [ ] 家长回应功能
- [ ] Lottie 动画资源

---

_本文档与 MINIAPP_DESIGN.md 配套，侧重组件级实现细节。根据 Simon 反馈持续迭代。_
