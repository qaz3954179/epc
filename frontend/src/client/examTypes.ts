// ─── 考试系统类型定义 ─────────────────────────────────────────────

export type ExamSubject = "math" | "english" | "chinese" | "science" | "other"
export type ExamDifficulty = "easy" | "medium" | "hard"
export type ExamSourceType = "manual" | "ai"
export type ExamGameMode = "classic" | "countdown" | "challenge" | "speed_run"
export type QuestionType = "choice" | "fill_blank" | "true_false" | "spelling"
export type BookingStatus = "booked" | "started" | "completed" | "cancelled" | "expired"
export type ExamSessionStatus = "in_progress" | "completed" | "timeout"

export interface ExamTemplate {
  id: string
  title: string
  subject: ExamSubject
  source_type: ExamSourceType
  difficulty: ExamDifficulty
  question_count: number
  time_limit_seconds: number | null
  coins_reward_rules: Record<string, number>
  game_mode: ExamGameMode
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface QuestionContent {
  stem: string
  options?: string[]
  image_url?: string
}

export interface Question {
  id: string
  template_id: string
  question_type: QuestionType
  content: QuestionContent
  answer: string
  explanation?: string
  difficulty: ExamDifficulty
  points: number
  created_at: string
}

export interface ExamBooking {
  id: string
  template_id: string
  child_id: string
  scheduled_at: string
  booking_type: string
  status: BookingStatus
  created_at: string
  template?: ExamTemplate
}

export interface ExamSession {
  id: string
  booking_id: string | null
  child_id: string
  template_id: string
  started_at: string
  finished_at: string | null
  score: number
  total_points: number
  coins_earned: number
  combo_max: number
  accuracy_rate: number
  status: ExamSessionStatus
}

export interface ExamAnswer {
  id: string
  session_id: string
  question_id: string
  child_answer: string
  is_correct: boolean
  time_spent_ms: number
  combo_count: number
  answered_at: string
}

export interface ExamSessionQuestion {
  id: string
  question_type: QuestionType
  content: QuestionContent
  difficulty: ExamDifficulty
  points: number
  answered: boolean
}

export interface ExamSessionQuestions {
  game_mode: ExamGameMode
  time_limit_seconds: number | null
  questions: ExamSessionQuestion[]
}

export interface ExamReport {
  session_id: string
  template_title: string
  subject: string
  score: number
  total_points: number
  accuracy_rate: number
  combo_max: number
  coins_earned: number
  time_spent_seconds: number
  answers: ExamReportAnswer[]
  summary: string
}

export interface ExamReportAnswer {
  question_id: string
  question_content: QuestionContent
  correct_answer: string
  child_answer: string
  is_correct: boolean
  time_spent_ms: number
  combo_count: number
  points: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
}
