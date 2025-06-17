export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  subsidyTypes: string[];
  requiredFields: Record<string, any>;
  templateContent: Record<string, any>;
  estimatedTime: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface GeneratedDocument {
  id: string;
  userId: string;
  templateId: string;
  subsidyId?: string;
  inputData: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filePath?: string;
  downloadUrl?: string;
  previewUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentGenerateRequest {
  templateId: string;
  subsidyId?: string;
  companyInfo: {
    name: string;
    representative: string;
    address: string;
    phone: string;
    email: string;
    establishedDate: string;
    employeeCount: number;
    capital: number;
    industry: string;
  };
  businessPlan: {
    currentChallenges: string;
    solutionApproach: string;
    expectedEffects: string;
  };
  itInvestmentPlan: {
    targetSoftware: string;
    investmentAmount: number;
    implementationSchedule: string;
    expectedROI: string;
  };
}

export interface DocumentGenerateResponse {
  success: boolean;
  data: {
    documentId: string;
    status: string;
    downloadUrl?: string;
    previewUrl?: string;
    expiresAt?: string;
  };
}

export interface DocumentTemplateResponse {
  success: boolean;
  data: {
    templates: DocumentTemplate[];
  };
}

export interface DocumentDetailResponse {
  success: boolean;
  data: GeneratedDocument;
}