import api from "./api"
import type {
  ExamTemplate,
  ExamBooking,
  ExamSession,
  ExamAnswer,
  ExamSessionQuestions,
  ExamReport,
  Question,
  PaginatedResponse,
} from "./examTypes"

export const examService = {
  // ─── 模板 ──────────────────────────────────────────────────────
  listTemplates: (params?: { skip?: number; limit?: number }) =>
    api.get<PaginatedResponse<ExamTemplate>>("/exams/templates", { params }),

  getTemplate: (id: string) =>
    api.get<ExamTemplate>(`/exams/templates/${id}`),

  createTemplate: (data: Partial<ExamTemplate>) =>
    api.post<ExamTemplate>("/exams/templates", data),

  updateTemplate: (id: string, data: Partial<ExamTemplate>) =>
    api.put<ExamTemplate>(`/exams/templates/${id}`, data),

  deleteTemplate: (id: string) =>
    api.delete(`/exams/templates/${id}`),

  // ─── 题目 ──────────────────────────────────────────────────────
  listQuestions: (templateId: string) =>
    api.get<PaginatedResponse<Question>>(`/exams/templates/${templateId}/questions`),

  addQuestion: (templateId: string, data: Partial<Question>) =>
    api.post<Question>(`/exams/templates/${templateId}/questions`, data),

  addQuestionsBatch: (templateId: string, data: Partial<Question>[]) =>
    api.post<PaginatedResponse<Question>>(`/exams/templates/${templateId}/questions/batch`, data),

  updateQuestion: (id: string, data: Partial<Question>) =>
    api.put<Question>(`/exams/questions/${id}`, data),

  deleteQuestion: (id: string) =>
    api.delete(`/exams/questions/${id}`),

  // ─── 预约 ──────────────────────────────────────────────────────
  listBookings: (params?: { status?: string; skip?: number; limit?: number }) =>
    api.get<PaginatedResponse<ExamBooking>>("/exams/bookings", { params }),

  createBooking: (data: { template_id: string; child_id?: string; scheduled_at: string; booking_type?: string }) =>
    api.post<ExamBooking>("/exams/bookings", data),

  cancelBooking: (id: string) =>
    api.post(`/exams/bookings/${id}/cancel`),

  // ─── 考试会话 ──────────────────────────────────────────────────
  startExam: (bookingId: string) =>
    api.post<ExamSession>(`/exams/bookings/${bookingId}/start`),

  getSessionQuestions: (sessionId: string) =>
    api.get<ExamSessionQuestions>(`/exams/sessions/${sessionId}/questions`),

  submitAnswer: (sessionId: string, data: { question_id: string; child_answer: string; time_spent_ms: number }) =>
    api.post<ExamAnswer>(`/exams/sessions/${sessionId}/answer`, data),

  submitExam: (sessionId: string) =>
    api.post<ExamSession>(`/exams/sessions/${sessionId}/submit`),

  getReport: (sessionId: string) =>
    api.get<ExamReport>(`/exams/sessions/${sessionId}/report`),

  listSessions: (params?: { skip?: number; limit?: number }) =>
    api.get<PaginatedResponse<ExamSession>>("/exams/sessions", { params }),
}
