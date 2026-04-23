// ============ User & Auth ============
export type UserRole = 'parent' | 'child';

export interface UserPublic {
  id: string;
  email: string | null;
  full_name: string;
  nickname: string | null;
  avatar_url: string | null;
  coins: number;
  role: UserRole;
  roles: UserRole[];
  streak_days: number;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  is_new_user: boolean;
}

// ============ Children ============
export interface ChildPublic {
  id: string;
  nickname: string;
  gender: 'male' | 'female' | 'other';
  birth_month: string | null;
  avatar_url: string | null;
  coins: number;
  streak_days: number;
  parent_id: string;
  created_at: string;
}

export interface ChildCreate {
  nickname: string;
  gender: 'male' | 'female' | 'other';
  birth_month?: string;
}

// ============ Tasks ============
export interface ItemPublic {
  id: string;
  title: string;
  description: string | null;
  category: string;
  coins_reward: number;
  target_count: number;
  frequency: 'daily' | 'weekly' | 'once';
  is_active: boolean;
}

export interface TodayTaskPublic {
  item_id: string;
  title: string;
  description: string | null;
  category: string;
  coins_reward: number;
  target_count: number;
  completed_count: number;
  completed_today: boolean;
  last_completed_at: string | null;
}

export interface TaskCompletionPublic {
  id: string;
  item_id: string;
  item_title: string;
  completed_at: string;
  coins_earned: number;
  quality_rating: number | null;
}

// ============ Coins ============
export interface CoinLogPublic {
  id: string;
  amount: number;
  balance_after: number;
  description: string;
  log_type: 'earn' | 'spend' | 'adjust';
  created_at: string;
}

// ============ Prizes & Redemptions ============
export interface PrizePublic {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  coins_cost: number;
  category: string;
  prize_type: 'virtual' | 'physical';
  stock: number;
  is_active: boolean;
}

export interface RedemptionPublic {
  id: string;
  prize_id: string;
  prize_title: string;
  prize_image_url: string | null;
  coins_cost: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
}

export interface RedemptionCreate {
  prize_id: string;
  address?: string;
}

// ============ Exams ============
export interface ExamBookingPublic {
  id: string;
  template_title: string;
  subject: string;
  difficulty: string;
  scheduled_at: string;
  status: 'booked' | 'started' | 'completed';
}

export interface ExamSessionPublic {
  id: string;
  booking_id: string | null;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at: string | null;
}

export interface ExamQuestion {
  id: string;
  content: string;
  question_type: 'choice' | 'fill';
  options: string[] | null;
  time_limit_seconds: number | null;
}

export interface ExamReport {
  session_id: string;
  total_questions: number;
  correct_count: number;
  accuracy: number;
  coins_earned: number;
  combo_count: number;
  time_spent_seconds: number;
}

// ============ Achievements ============
export interface AchievementPublic {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  reveal_message: string | null;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface AchievementSummary {
  total: number;
  unlocked: number;
}

// ============ Growth ============
export interface HeatmapDay {
  date: string;
  count: number;
}

export interface GrowthReport {
  period: string;
  total_completed: number;
  prev_total_completed: number;
  by_category: Record<string, number>;
  streak_current: number;
  streak_max: number;
}

export interface GrowthReward {
  id: string;
  title: string;
  coins: number;
  earned_at: string;
}

// ============ Parent ============
export interface ParentMonitor {
  child_id: string;
  child_nickname: string;
  coins: number;
  streak_days: number;
  today_completed: number;
  today_total: number;
  accuracy_rate: number;
}

export interface ActivityItem {
  id: string;
  type: 'task_complete' | 'exam_complete' | 'redeem' | 'achievement' | 'wish';
  title: string;
  description: string;
  created_at: string;
}

export interface WishPublic {
  id: string;
  child_id: string;
  child_nickname: string;
  content: string;
  status: 'pending' | 'approved' | 'deferred' | 'rejected';
  cards_count: number;
  created_at: string;
}

// ============ Referrals ============
export interface ReferralStats {
  total_invited: number;
  total_rewards: number;
  referral_code: string;
  referral_link: string;
}

// ============ Wish Planet System ============
export type WishStatus = 'pending' | 'approved' | 'deferred' | 'rejected';
export type PlanetStage = 'seed' | 'sprout' | 'growing' | 'thriving' | 'born' | 'dimming';
export type MilestoneType = 'card_read' | 'task_streak' | 'coins_saved' | 'exam_passed' | 'custom';
export type CardDifficulty = 'easy' | 'medium' | 'hard';

export interface WishPublicV2 {
  id: string;
  child_id: string;
  content: string;
  category: string | null;
  emoji: string | null;
  status: WishStatus;
  parent_response: string | null;
  responded_at: string | null;
  created_at: string;
  planet: PlanetBrief | null;
}

export interface PlanetBrief {
  id: string;
  name: string;
  stage: PlanetStage;
  brightness: number;
}

export interface WishPublicNested {
  id: string;
  content: string;
  category: string | null;
  emoji: string | null;
  status: WishStatus;
  parent_response: string | null;
}

export interface PlanetDetail {
  id: string;
  wish_id: string;
  child_id: string;
  name: string;
  color: string;
  emoji: string;
  stage: PlanetStage;
  brightness: number;
  total_milestones: number;
  completed_milestones: number;
  is_active: boolean;
  born_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  wish: WishPublicNested | null;
  milestones: MilestonePublic[];
  cards: KnowledgeCardPublic[];
}

export interface MilestonePublic {
  id: string;
  planet_id: string;
  title: string;
  description: string | null;
  milestone_type: MilestoneType;
  target_value: number;
  current_value: number;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

export interface KnowledgeCardPublic {
  id: string;
  planet_id: string;
  title: string;
  content: string;
  fun_fact: string | null;
  difficulty: CardDifficulty;
  is_read: boolean;
  read_at: string | null;
  sort_order: number;
}
