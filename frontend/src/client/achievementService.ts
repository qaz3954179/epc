import api from "./api"

// ─── Types ───────────────────────────────────────────────────────

export interface Achievement {
  id: string
  name: string
  description: string | null
  icon: string
  reveal_message: string
  category: "hidden" | "milestone"
  condition_type: "streak" | "count" | "rate" | "composite"
  condition_config: Record<string, any>
  coins_bonus: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AchievementChildView {
  id: string
  name: string
  icon: string
  reveal_message: string | null
  category: "hidden" | "milestone"
  unlocked: boolean
  unlocked_at: string | null
}

export interface AchievementChildSummary {
  unlocked: AchievementChildView[]
  unlocked_count: number
  total_hidden: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  trigger_snapshot: Record<string, any>
  achievement: Achievement | null
}

export interface AchievementNotification {
  id: string
  achievement_id: string
  achievement_name: string | null
  achievement_icon: string | null
  reveal_message: string | null
  coins_bonus: number
  is_read: boolean
  created_at: string
}

export interface SDIRecord {
  id: string
  user_id: string
  record_date: string
  period_type: "daily" | "weekly"
  sdi_score: number
  initiative_score: number
  exploration_score: number
  persistence_score: number
  quality_score: number
  detail: Record<string, any>
  created_at: string
}

export interface SDIDashboard {
  current_score: number
  previous_score: number | null
  score_change: number | null
  initiative_score: number
  exploration_score: number
  persistence_score: number
  quality_score: number
  trend: SDIRecord[]
  analysis: Record<string, any>
  suggestions: string[]
}

// ─── Achievement Service ─────────────────────────────────────────

export const achievementService = {
  // 孩子：我的成就
  getMyAchievements: () =>
    api.get<AchievementChildSummary>("/achievements/my"),

  // 孩子：通知
  getNotifications: (unreadOnly = true) =>
    api.get<AchievementNotification[]>("/achievements/notifications", {
      params: { unread_only: unreadOnly },
    }),

  markNotificationRead: (id: string) =>
    api.patch(`/achievements/notifications/${id}/read`),

  markAllNotificationsRead: () =>
    api.patch("/achievements/notifications/read-all"),

  // 家长：查看孩子成就
  getChildAchievements: (childId: string) =>
    api.get<{ data: UserAchievement[]; count: number }>(
      `/achievements/child/${childId}`,
    ),

  // 管理员：CRUD
  list: (params?: { skip?: number; limit?: number; category?: string; is_active?: boolean }) =>
    api.get<{ data: Achievement[]; count: number }>("/achievements/", { params }),

  create: (data: Partial<Achievement>) =>
    api.post<Achievement>("/achievements/", data),

  update: (id: string, data: Partial<Achievement>) =>
    api.put<Achievement>(`/achievements/${id}`, data),

  delete: (id: string) =>
    api.delete(`/achievements/${id}`),

  // 管理员：手动授予/撤销
  grant: (achievementId: string, userId: string) =>
    api.post<UserAchievement>(`/achievements/${achievementId}/grant/${userId}`),

  revoke: (achievementId: string, userId: string) =>
    api.delete(`/achievements/${achievementId}/revoke/${userId}`),

  // 管理员：全局统计
  getGlobalStats: () =>
    api.get<Array<{ id: string; name: string; icon: string; category: string; unlock_count: number }>>(
      "/achievements/stats/global",
    ),
}

// ─── SDI Service ─────────────────────────────────────────────────

export const sdiService = {
  // 家长：仪表盘
  getChildDashboard: (childId: string, days = 30) =>
    api.get<SDIDashboard>(`/sdi/child/${childId}`, { params: { days } }),

  // 家长：趋势
  getChildTrend: (childId: string, days = 30) =>
    api.get<{ data: SDIRecord[]; count: number }>(`/sdi/child/${childId}/trend`, { params: { days } }),

  // 手动计算
  calculateChild: (childId: string) =>
    api.post<SDIRecord>(`/sdi/calculate/${childId}`),

  calculateAll: () =>
    api.post<{ message: string; count: number }>("/sdi/calculate-all"),
}
