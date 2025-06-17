// API型定義
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
  message?: string;
  requestId?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Subsidy {
  id: string;
  name: string;
  category: string;
  description?: string;
  organizer?: string;
  subsidyAmount: {
    min: number;
    max: number;
  };
  subsidyRate: number;
  eligibleCompanies: string[];
  eligibleExpenses?: string[];
  applicationPeriod: {
    start: string;
    end: string;
  };
  requirements: string[];
  applicationFlow?: string[];
  contactInfo?: {
    phone: string;
    email: string;
    website: string;
  };
  matchScore?: number;
}

export interface SubsidySearchParams {
  companySize?: string;
  industry?: string;
  investmentAmount?: number;
  region?: string;
  deadline?: string;
  subsidyRate?: number;
  page?: number;
  limit?: number;
}

export interface SubsidySearchResponse {
  subsidies: Subsidy[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Favorite {
  id: string;
  name: string;
  subsidyAmount: {
    min: number;
    max: number;
  };
  addedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  subsidyTypes: string[];
  requiredFields: string[];
  estimatedTime: number;
}

export interface CompanyInfo {
  name: string;
  representative: string;
  address: string;
  phone: string;
  email: string;
  establishedDate: string;
  employeeCount: number;
  capital: number;
  industry: string;
}

export interface BusinessPlan {
  currentChallenges: string;
  solutionApproach: string;
  expectedEffects: string;
}

export interface ITInvestmentPlan {
  targetSoftware: string;
  investmentAmount: number;
  implementationSchedule: string;
  expectedROI: string;
}

export interface DocumentGenerationRequest {
  templateId: string;
  subsidyId: string;
  companyInfo: CompanyInfo;
  businessPlan: BusinessPlan;
  itInvestmentPlan: ITInvestmentPlan;
}

export interface Document {
  id: string;
  templateId: string;
  subsidyId: string;
  status: 'generated' | 'completed' | 'processing';
  createdAt: string;
  downloadUrl: string;
  previewUrl: string;
  expiresAt?: string;
}