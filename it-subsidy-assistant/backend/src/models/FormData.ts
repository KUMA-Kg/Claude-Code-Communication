import { z } from 'zod';

// フォームデータのスキーマ
export const FormDataSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  form_type: z.enum([
    'basic_info',
    'business_info',
    'financial_info',
    'project_plan',
    'subsidy_application',
  ]),
  form_data: z.record(z.any()),
  is_draft: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type FormData = z.infer<typeof FormDataSchema>;

// フォームデータ保存リクエストのスキーマ
export const SaveFormDataRequestSchema = z.object({
  session_id: z.string().uuid(),
  form_type: FormDataSchema.shape.form_type,
  form_data: z.record(z.any()),
  is_draft: z.boolean().default(true),
});

export type SaveFormDataRequest = z.infer<typeof SaveFormDataRequestSchema>;

// 基本情報フォームのスキーマ
export const BasicInfoFormSchema = z.object({
  company_name: z.string().min(1),
  company_name_kana: z.string().min(1),
  postal_code: z.string().regex(/^\d{3}-?\d{4}$/),
  prefecture: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  building: z.string().optional(),
  phone: z.string().regex(/^0\d{1,4}-?\d{1,4}-?\d{4}$/),
  fax: z.string().regex(/^0\d{1,4}-?\d{1,4}-?\d{4}$/).optional(),
  email: z.string().email(),
  website: z.string().url().optional(),
  representative_name: z.string().min(1),
  representative_title: z.string().min(1),
});

export type BasicInfoForm = z.infer<typeof BasicInfoFormSchema>;

// 事業情報フォームのスキーマ
export const BusinessInfoFormSchema = z.object({
  established_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  capital: z.number().positive(),
  employee_count: z.number().int().positive(),
  industry_code: z.string().min(1),
  main_business: z.string().min(1),
  business_description: z.string().min(10),
  annual_revenue: z.number().positive(),
  fiscal_year_end: z.string().regex(/^\d{2}-\d{2}$/),
});

export type BusinessInfoForm = z.infer<typeof BusinessInfoFormSchema>;

// プロジェクト計画フォームのスキーマ
export const ProjectPlanFormSchema = z.object({
  project_title: z.string().min(1),
  project_purpose: z.string().min(10),
  project_description: z.string().min(20),
  expected_effects: z.array(z.object({
    effect_type: z.string(),
    description: z.string(),
    target_value: z.string().optional(),
  })),
  implementation_schedule: z.array(z.object({
    phase: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    description: z.string(),
  })),
  total_budget: z.number().positive(),
  budget_breakdown: z.array(z.object({
    category: z.string(),
    amount: z.number().positive(),
    description: z.string(),
  })),
});

export type ProjectPlanForm = z.infer<typeof ProjectPlanFormSchema>;