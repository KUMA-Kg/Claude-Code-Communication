import { apiService, ApiResponse } from './api.service';
import { API_CONFIG } from '../config/api.config';

// 補助金関連の型定義
export interface Subsidy {
  id: string;
  name: string;
  description: string;
  type: 'it-donyu' | 'monozukuri' | 'jizokuka' | 'other';
  subsidy_amount_min: number;
  subsidy_amount_max: number;
  subsidy_rate: number;
  application_start: string;
  application_end: string;
  requirements: string[];
  target_industries: string[];
  target_company_size: string[];
  required_documents: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubsidyFilter {
  type?: string;
  minAmount?: number;
  maxAmount?: number;
  industry?: string;
  companySize?: string;
  isActive?: boolean;
  search?: string;
}

export interface SubsidyMatchingRequest {
  companyData: {
    businessType: string;
    employeeCount: string;
    annualRevenue: string;
    establishmentDate?: string;
    capital?: string;
  };
  questionnaireData: {
    currentChallenges: string;
    digitalizationLevel: string;
    budgetRange: string;
    projectDescription?: string;
  };
}

export interface SubsidyMatchingResult {
  subsidy_id: string;
  subsidy: Subsidy;
  match_score: number;
  reasons: string[];
  eligibility_status: 'eligible' | 'potentially_eligible' | 'not_eligible';
  missing_requirements: string[];
  recommendations: string[];
}

export interface AIMatchingRequest extends SubsidyMatchingRequest {
  preferences?: {
    prioritizeAmount?: boolean;
    prioritizeEase?: boolean;
    specificTypes?: string[];
  };
}

export interface AIMatchingResult extends SubsidyMatchingResult {
  ai_confidence: number;
  ai_reasoning: string;
  alternative_subsidies?: SubsidyMatchingResult[];
}

// 補助金サービスクラス
export class SubsidyService {
  private static instance: SubsidyService;

  private constructor() {}

  static getInstance(): SubsidyService {
    if (!SubsidyService.instance) {
      SubsidyService.instance = new SubsidyService();
    }
    return SubsidyService.instance;
  }

  // 補助金一覧取得
  async getSubsidies(
    filter?: SubsidyFilter,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<Subsidy[]>> {
    return apiService.get<Subsidy[]>(
      API_CONFIG.api.endpoints.subsidies.list,
      {
        ...filter,
        page,
        limit
      }
    );
  }

  // 補助金詳細取得
  async getSubsidyDetail(subsidyId: string): Promise<ApiResponse<Subsidy>> {
    const endpoint = API_CONFIG.api.endpoints.subsidies.detail.replace(':id', subsidyId);
    return apiService.get<Subsidy>(endpoint);
  }

  // 補助金検索
  async searchSubsidies(
    query: string,
    filter?: SubsidyFilter
  ): Promise<ApiResponse<Subsidy[]>> {
    return apiService.get<Subsidy[]>(
      API_CONFIG.api.endpoints.subsidies.search,
      {
        q: query,
        ...filter
      }
    );
  }

  // 補助金フィルタリング
  async filterSubsidies(filter: SubsidyFilter): Promise<ApiResponse<Subsidy[]>> {
    return apiService.post<Subsidy[]>(
      API_CONFIG.api.endpoints.subsidies.filter,
      filter
    );
  }

  // 補助金マッチング（基本）
  async getSubsidyMatching(
    request: SubsidyMatchingRequest
  ): Promise<ApiResponse<SubsidyMatchingResult[]>> {
    return apiService.post<SubsidyMatchingResult[]>(
      API_CONFIG.api.endpoints.subsidies.matching,
      request
    );
  }

  // AIを使った高度なマッチング
  async getAIMatching(
    request: AIMatchingRequest
  ): Promise<ApiResponse<AIMatchingResult[]>> {
    return apiService.post<AIMatchingResult[]>(
      API_CONFIG.api.endpoints.subsidies.aiMatch,
      request,
      {},
      'ai-matching' // リクエストIDを設定してキャンセル可能に
    );
  }

  // アクティブな補助金のみ取得
  async getActiveSubsidies(): Promise<ApiResponse<Subsidy[]>> {
    return this.getSubsidies({ isActive: true });
  }

  // 締切が近い補助金を取得
  async getDeadlineApproachingSubsidies(
    daysLeft: number = 30
  ): Promise<ApiResponse<Subsidy[]>> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysLeft);
    
    return apiService.get<Subsidy[]>(
      API_CONFIG.api.endpoints.subsidies.list,
      {
        applicationEndBefore: endDate.toISOString(),
        isActive: true,
        sortBy: 'application_end',
        sortOrder: 'asc'
      }
    );
  }

  // 企業規模別の補助金取得
  async getSubsidiesByCompanySize(
    companySize: string
  ): Promise<ApiResponse<Subsidy[]>> {
    return this.filterSubsidies({ companySize });
  }

  // 業種別の補助金取得
  async getSubsidiesByIndustry(
    industry: string
  ): Promise<ApiResponse<Subsidy[]>> {
    return this.filterSubsidies({ industry });
  }

  // マッチング結果のキャッシュ
  private matchingCache = new Map<string, SubsidyMatchingResult[]>();

  // キャッシュ付きマッチング
  async getCachedMatching(
    request: SubsidyMatchingRequest
  ): Promise<ApiResponse<SubsidyMatchingResult[]>> {
    const cacheKey = JSON.stringify(request);
    
    if (this.matchingCache.has(cacheKey)) {
      return {
        success: true,
        data: this.matchingCache.get(cacheKey)!
      };
    }

    const response = await this.getSubsidyMatching(request);
    
    if (response.success && response.data) {
      this.matchingCache.set(cacheKey, response.data);
      
      // 5分後にキャッシュクリア
      setTimeout(() => {
        this.matchingCache.delete(cacheKey);
      }, 5 * 60 * 1000);
    }

    return response;
  }

  // AIマッチングのキャンセル
  cancelAIMatching(): void {
    apiService.cancelRequest('ai-matching');
  }

  // 補助金の適用可能性チェック
  async checkEligibility(
    subsidyId: string,
    companyData: any
  ): Promise<ApiResponse<{
    eligible: boolean;
    reasons: string[];
    missingRequirements: string[];
    recommendations: string[];
  }>> {
    return apiService.post(
      `/subsidies/${subsidyId}/check-eligibility`,
      { companyData }
    );
  }

  // 補助金申請に必要な書類リスト取得
  async getRequiredDocuments(
    subsidyId: string,
    companyType?: string
  ): Promise<ApiResponse<{
    required: string[];
    optional: string[];
    templates: Array<{
      name: string;
      url: string;
      description: string;
    }>;
  }>> {
    return apiService.get(
      `/subsidies/${subsidyId}/required-documents`,
      { companyType }
    );
  }
}

// シングルトンインスタンスをエクスポート
export const subsidyService = SubsidyService.getInstance();