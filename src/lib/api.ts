import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

export default api;

// ── Types ─────────────────────────────────────────────────────────────────────

export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

export interface Question {
  id: string;
  form_id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  order_index: number;
  choices?: string[];
  rating_steps?: number;
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  status: "draft" | "published";
  public_id: string;
  created_at: string;
  updated_at: string;
  thank_you_message: string;
  theme_color: string;
  button_text: string;
  response_count: number;
  questions: Question[];
}

export interface FormListItem {
  id: string;
  title: string;
  status: "draft" | "published";
  public_id: string;
  created_at: string;
  updated_at: string;
  response_count: number;
  question_count: number;
}

export interface Answer {
  id: string;
  question_id: string;
  value?: string;
}

export interface Response {
  id: string;
  form_id: string;
  submitted_at: string;
  answers: Answer[];
}

export interface ChoiceCount {
  choice: string;
  count: number;
}

export interface QuestionStats {
  question_id: string;
  question_title: string;
  question_type: string;
  total_answers: number;
  choice_counts?: ChoiceCount[];
  average?: number;
}

export interface FormStats {
  form_id: string;
  total_responses: number;
  questions: QuestionStats[];
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const formsApi = {
  list: () => api.get<FormListItem[]>("/api/forms").then((r) => r.data),
  get: (id: string) => api.get<Form>(`/api/forms/${id}`).then((r) => r.data),
  create: (data: Partial<Form>) =>
    api.post<Form>("/api/forms", data).then((r) => r.data),
  update: (id: string, data: Partial<Form>) =>
    api.patch<Form>(`/api/forms/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/forms/${id}`),
  duplicate: (id: string) =>
    api.post<Form>(`/api/forms/${id}/duplicate`).then((r) => r.data),
  publish: (id: string) =>
    api.post<Form>(`/api/forms/${id}/publish`).then((r) => r.data),
  unpublish: (id: string) =>
    api.post<Form>(`/api/forms/${id}/unpublish`).then((r) => r.data),

  addQuestion: (formId: string, data: Partial<Question>) =>
    api
      .post<Question>(`/api/forms/${formId}/questions`, data)
      .then((r) => r.data),
  updateQuestion: (formId: string, qId: string, data: Partial<Question>) =>
    api
      .patch<Question>(`/api/forms/${formId}/questions/${qId}`, data)
      .then((r) => r.data),
  deleteQuestion: (formId: string, qId: string) =>
    api.delete(`/api/forms/${formId}/questions/${qId}`),
  reorderQuestions: (
    formId: string,
    questions: { id: string; order_index: number }[]
  ) => api.post(`/api/forms/${formId}/questions/reorder`, { questions }),
};

export const responsesApi = {
  list: (formId: string) =>
    api.get<Response[]>(`/api/forms/${formId}/responses`).then((r) => r.data),
  get: (formId: string, responseId: string) =>
    api
      .get<Response>(`/api/forms/${formId}/responses/${responseId}`)
      .then((r) => r.data),
  stats: (formId: string) =>
    api.get<FormStats>(`/api/forms/${formId}/stats`).then((r) => r.data),
};

export const publicApi = {
  getForm: (publicId: string) =>
    api.get<Form>(`/api/public/forms/${publicId}`).then((r) => r.data),
  submit: (publicId: string, answers: { question_id: string; value: string }[]) =>
    api
      .post<Response>(`/api/public/forms/${publicId}/responses`, { answers })
      .then((r) => r.data),
};
