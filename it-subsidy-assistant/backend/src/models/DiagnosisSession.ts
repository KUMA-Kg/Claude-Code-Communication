import { z } from 'zod';

// 診断セッションのスキーマ
export const DiagnosisSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  session_token: z.string(),
  company_info: z.object({
    name: z.string().optional(),
    industry: z.string().optional(),
    employee_count: z.number().optional(),
    annual_revenue: z.number().optional(),
    established_date: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
  diagnosis_data: z.object({
    current_step: z.string(),
    answers: z.record(z.any()),
    progress: z.number().min(0).max(100),
  }).optional(),
  matched_subsidies: z.array(z.object({
    subsidy_id: z.string().uuid(),
    match_score: z.number().min(0).max(100),
    reasons: z.array(z.string()),
  })).optional(),
  status: z.enum(['in_progress', 'completed', 'abandoned']).default('in_progress'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
});

export type DiagnosisSession = z.infer<typeof DiagnosisSessionSchema>;

// 診断回答のスキーマ
export const DiagnosisAnswerSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  question_key: z.string(),
  answer: z.any(),
  answered_at: z.string().datetime(),
});

export type DiagnosisAnswer = z.infer<typeof DiagnosisAnswerSchema>;

// 診断開始リクエストのスキーマ
export const StartDiagnosisRequestSchema = z.object({
  user_id: z.string().uuid().optional(),
  initial_data: z.object({
    company_name: z.string().optional(),
    industry: z.string().optional(),
  }).optional(),
});

export type StartDiagnosisRequest = z.infer<typeof StartDiagnosisRequestSchema>;

// 診断回答リクエストのスキーマ
export const AnswerDiagnosisRequestSchema = z.object({
  session_id: z.string().uuid(),
  question_key: z.string(),
  answer: z.any(),
  current_step: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export type AnswerDiagnosisRequest = z.infer<typeof AnswerDiagnosisRequestSchema>;

// 補助金マッチング結果のスキーマ
export const SubsidyMatchResultSchema = z.object({
  subsidy_id: z.string().uuid(),
  subsidy_name: z.string(),
  match_score: z.number().min(0).max(100),
  eligibility_status: z.enum(['eligible', 'potentially_eligible', 'not_eligible']),
  reasons: z.array(z.string()),
  missing_requirements: z.array(z.string()).optional(),
  next_steps: z.array(z.string()).optional(),
});

export type SubsidyMatchResult = z.infer<typeof SubsidyMatchResultSchema>;