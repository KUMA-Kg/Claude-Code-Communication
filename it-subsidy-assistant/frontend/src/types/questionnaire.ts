export interface QuestionOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

export interface Question {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'text' | 'number';
  options: QuestionOption[];
  required?: boolean;
  hint?: string;
}

export interface QuestionnaireData {
  businessType?: string;
  employeeCount?: string;
  annualRevenue?: string;
  currentChallenges?: string;
  digitalizationLevel?: string;
  budgetRange?: string;
  [key: string]: any;
}

export interface DynamicQuestion {
  id: string;
  condition: (answers: QuestionnaireData) => boolean;
  question: string;
  type: 'single' | 'multiple' | 'boolean';
  options?: QuestionOption[];
}

export interface SubsidyRequirement {
  subsidyId: string;
  questions: DynamicQuestion[];
}