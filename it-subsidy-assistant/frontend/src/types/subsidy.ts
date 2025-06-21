export interface SubsidyMatch {
  id: string;
  name: string;
  description: string;
  maxAmount: string;
  subsidyRate: string;
  matchScore: number;
  features: string[];
  targetBusiness: string[];
  applicationPeriod: string;
  color: string;
}

export interface SubsidyDetail extends SubsidyMatch {
  eligibilityRequirements: string[];
  requiredDocuments: RequiredDocument[];
  applicationProcess: ApplicationStep[];
  importantNotes: string[];
  contactInfo: ContactInfo;
}

export interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  required: boolean;
  condition?: string;
  template?: string;
}

export interface ApplicationStep {
  step: number;
  title: string;
  description: string;
  estimatedDays: number;
}

export interface ContactInfo {
  organization: string;
  phone: string;
  email: string;
  website: string;
  businessHours: string;
}