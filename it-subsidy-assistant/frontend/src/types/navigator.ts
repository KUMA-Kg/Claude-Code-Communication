export interface CompanyProfile {
  companySize: number;
  industry: string;
  annualRevenue: number;
  currentChallenges: string[];
  investmentBudget: number;
  digitalizationLevel: 'none' | 'basic' | 'intermediate' | 'advanced';
  previousSubsidies?: string[];
}

export interface SubsidyData {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  color: string;
  maxAmount: number;
  subsidyRate: number;
  requirements: string[];
  deadline?: string;
  applicationDifficulty?: 'easy' | 'medium' | 'hard';
}

export interface PathNode {
  subsidyId: string;
  score: number;
  reasoning: string;
}

export interface CalculatedPath {
  path: string[];
  totalScore: number;
  estimatedTime: number;
  confidence: number;
}