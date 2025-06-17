export interface Subsidy {
  id: string;
  name: string;
  description?: string;
  category: string;
  organizer: string;
  subsidyAmount: {
    min: number;
    max: number;
  };
  subsidyRate: number;
  eligibleCompanies: string[];
  eligibleExpenses: string[];
  applicationPeriod: {
    start: Date;
    end: Date;
  };
  requirements: string[];
  applicationFlow: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  matchScore?: number;
}

export interface SubsidySearchParams {
  companySize?: 'small' | 'medium' | 'large';
  industry?: string;
  investmentAmount?: number;
  region?: string;
  deadline?: string;
  subsidyRate?: number;
  page?: number;
  limit?: number;
  keyword?: string;
}

export interface SubsidySearchResponse {
  success: boolean;
  data: {
    subsidies: Subsidy[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface SubsidyDetailResponse {
  success: boolean;
  data: Subsidy;
}

export interface Region {
  code: string;
  name: string;
  parentCode?: string;
}

export interface Industry {
  code: string;
  name: string;
  parentCode?: string;
}

export interface UserFavorite {
  userId: string;
  subsidyId: string;
  createdAt: Date;
}

export interface FavoriteSubsidy {
  id: string;
  name: string;
  subsidyAmount: {
    min: number;
    max: number;
  };
  addedAt: Date;
}