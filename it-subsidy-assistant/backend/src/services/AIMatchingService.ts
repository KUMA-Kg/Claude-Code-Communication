/**
 * AI補助金マッチングサービス
 * 機械学習ベースの自動マッチング・リアルタイム分析
 * Worker2実装: 企業向けIT補助金アシスタント
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import natural from 'natural'
import { TfIdf, WordTokenizer } from 'natural'

interface SubsidyData {
  id: string
  name: string
  description: string
  eligibility_criteria: string[]
  amount_min: number
  amount_max: number
  target_industries: string[]
  target_company_size: string[]
  requirements: string[]
  keywords: string[]
  application_end: string
  status: string
}

interface CompanyProfile {
  id: string
  organization_id: string
  name: string
  industry_code: string
  industry_name: string
  employee_count: number
  annual_revenue: number
  business_profile: any
  it_maturity_level: number
  subsidy_history: any[]
  matching_preferences: any
}

interface MatchingResult {
  subsidy_id: string
  overall_score: number
  category_scores: {
    industry_match: number
    size_match: number
    needs_match: number
    technical_fit: number
    historical_success: number
  }
  reason_codes: string[]
  explanation: string
  recommended_actions: string[]
  confidence_level: 'high' | 'medium' | 'low'
}

interface AIFeatureVector {
  industry_vector: number[]
  size_vector: number[]
  needs_vector: number[]
  tech_vector: number[]
  financial_vector: number[]
  experience_vector: number[]
}

export class AIMatchingService {
  private supabase: SupabaseClient
  private tfidf: TfIdf
  private tokenizer: WordTokenizer
  private industryEmbeddings: Map<string, number[]>
  private subsidyCache: Map<string, SubsidyData>

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    this.tfidf = new TfIdf()
    this.tokenizer = new WordTokenizer()
    this.industryEmbeddings = new Map()
    this.subsidyCache = new Map()
    
    this.initializeAI()
  }

  /**
   * AIシステム初期化
   */
  private async initializeAI(): Promise<void> {
    try {
      // 補助金データの前処理・キャッシュ化
      await this.loadAndPreprocessSubsidies()
      
      // 業界埋め込みベクトル構築
      await this.buildIndustryEmbeddings()
      
      // TF-IDFモデル構築
      await this.buildTfIdfModel()
      
      console.log('AI Matching Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize AI Matching Service:', error)
    }
  }

  /**
   * メイン：AI補助金マッチング実行
   */
  async performAIMatching(
    organizationId: string,
    includeHistorical: boolean = false
  ): Promise<MatchingResult[]> {
    try {
      // 企業プロファイル取得
      const companyProfile = await this.getCompanyProfile(organizationId)
      if (!companyProfile) {
        throw new Error('Company profile not found')
      }

      // 企業特徴ベクトル生成
      const companyFeatures = await this.generateCompanyFeatureVector(companyProfile)

      // アクティブな補助金取得
      const activeSubsidies = await this.getActiveSubsidies()

      // 各補助金とのマッチングスコア計算
      const matchingResults: MatchingResult[] = []

      for (const subsidy of activeSubsidies) {
        const matchResult = await this.calculateMatchingScore(
          companyProfile,
          companyFeatures,
          subsidy
        )

        if (matchResult.overall_score > 0.3) { // 閾値以上のみ保持
          matchingResults.push(matchResult)
        }
      }

      // スコア順にソート
      matchingResults.sort((a, b) => b.overall_score - a.overall_score)

      // 結果をデータベースに保存
      await this.saveMatchingResults(organizationId, matchingResults)

      // 高スコアマッチの通知トリガー
      await this.triggerHighScoreNotifications(organizationId, matchingResults)

      return matchingResults

    } catch (error) {
      console.error('AI matching failed:', error)
      throw error
    }
  }

  /**
   * 企業特徴ベクトル生成
   */
  private async generateCompanyFeatureVector(profile: CompanyProfile): Promise<AIFeatureVector> {
    // 1. 業界ベクトル
    const industryVector = this.industryEmbeddings.get(profile.industry_code) || 
                          this.generateDefaultIndustryVector()

    // 2. 企業規模ベクトル
    const sizeVector = this.generateSizeVector(profile.employee_count, profile.annual_revenue)

    // 3. ニーズベクトル（自然言語処理）
    const needsVector = await this.generateNeedsVector(profile.business_profile)

    // 4. 技術レベルベクトル
    const techVector = this.generateTechVector(profile.it_maturity_level, profile.business_profile)

    // 5. 財務ベクトル
    const financialVector = this.generateFinancialVector(profile.annual_revenue)

    // 6. 経験ベクトル（過去の補助金履歴）
    const experienceVector = this.generateExperienceVector(profile.subsidy_history)

    return {
      industry_vector: industryVector,
      size_vector: sizeVector,
      needs_vector: needsVector,
      tech_vector: techVector,
      financial_vector: financialVector,
      experience_vector: experienceVector
    }
  }

  /**
   * マッチングスコア計算（コア）
   */
  private async calculateMatchingScore(
    profile: CompanyProfile,
    features: AIFeatureVector,
    subsidy: SubsidyData
  ): Promise<MatchingResult> {
    
    // 1. 業界適合度
    const industryScore = this.calculateIndustryMatch(
      profile.industry_code,
      subsidy.target_industries
    )

    // 2. 企業規模適合度
    const sizeScore = this.calculateSizeMatch(
      profile.employee_count,
      profile.annual_revenue,
      subsidy.target_company_size
    )

    // 3. ニーズ適合度（意味解析）
    const needsScore = await this.calculateNeedsMatch(
      features.needs_vector,
      subsidy.description,
      subsidy.keywords
    )

    // 4. 技術適合度
    const technicalScore = this.calculateTechnicalFit(
      features.tech_vector,
      subsidy.requirements
    )

    // 5. 過去成功確率（履歴分析）
    const historicalScore = this.calculateHistoricalSuccess(
      features.experience_vector,
      subsidy.id
    )

    // 重み付き総合スコア計算
    const weights = {
      industry: 0.25,
      size: 0.20,
      needs: 0.25,
      technical: 0.20,
      historical: 0.10
    }

    const overallScore = 
      industryScore * weights.industry +
      sizeScore * weights.size +
      needsScore * weights.needs +
      technicalScore * weights.technical +
      historicalScore * weights.historical

    // 理由コード生成
    const reasonCodes = this.generateReasonCodes({
      industryScore,
      sizeScore,
      needsScore,
      technicalScore,
      historicalScore
    })

    // AI説明文生成
    const explanation = this.generateExplanation(profile, subsidy, {
      industryScore,
      sizeScore,
      needsScore,
      technicalScore,
      historicalScore
    })

    // 推奨アクション生成
    const recommendedActions = this.generateRecommendedActions(subsidy, overallScore)

    return {
      subsidy_id: subsidy.id,
      overall_score: Math.round(overallScore * 10000) / 10000, // 小数点4桁
      category_scores: {
        industry_match: industryScore,
        size_match: sizeScore,
        needs_match: needsScore,
        technical_fit: technicalScore,
        historical_success: historicalScore
      },
      reason_codes: reasonCodes,
      explanation,
      recommended_actions: recommendedActions,
      confidence_level: overallScore > 0.8 ? 'high' : overallScore > 0.6 ? 'medium' : 'low'
    }
  }

  /**
   * 業界適合度計算
   */
  private calculateIndustryMatch(companyIndustry: string, targetIndustries: string[]): number {
    if (targetIndustries.length === 0) return 0.5 // 制限なし

    // 完全一致
    if (targetIndustries.includes(companyIndustry)) return 1.0

    // 類似業界チェック（業界コード近似）
    const similarIndustries = this.getSimilarIndustries(companyIndustry)
    const intersection = targetIndustries.filter(t => similarIndustries.includes(t))
    
    if (intersection.length > 0) return 0.7

    return 0.1 // 非対象業界
  }

  /**
   * 企業規模適合度計算
   */
  private calculateSizeMatch(
    employeeCount: number,
    revenue: number,
    targetSizes: string[]
  ): number {
    if (targetSizes.length === 0) return 1.0

    const companySize = this.categorizeCompanySize(employeeCount, revenue)
    
    if (targetSizes.includes(companySize)) return 1.0

    // 隣接サイズカテゴリは部分スコア
    const adjacentSizes = this.getAdjacentSizes(companySize)
    const hasAdjacent = targetSizes.some(t => adjacentSizes.includes(t))
    
    return hasAdjacent ? 0.6 : 0.2
  }

  /**
   * ニーズ適合度計算（自然言語処理）
   */
  private async calculateNeedsMatch(
    companyNeedsVector: number[],
    subsidyDescription: string,
    subsidyKeywords: string[]
  ): Promise<number> {
    // TF-IDF類似度計算
    const subsidyTerms = this.tokenizer.tokenize(subsidyDescription.toLowerCase()) || []
    const allTerms = [...subsidyTerms, ...subsidyKeywords.map(k => k.toLowerCase())]
    
    this.tfidf.addDocument(allTerms)
    const subsidyVector = this.tfidf.listTerms(this.tfidf.documents.length - 1)
    
    // コサイン類似度計算
    const similarity = this.calculateCosineSimilarity(companyNeedsVector, 
      subsidyVector.map(term => term.tfidf))
    
    return Math.min(similarity, 1.0)
  }

  /**
   * 技術適合度計算
   */
  private calculateTechnicalFit(techVector: number[], requirements: string[]): number {
    if (requirements.length === 0) return 1.0

    // 技術要件の難易度分析
    const complexity = this.analyzeRequirementComplexity(requirements)
    const companyTechLevel = this.vectorToTechLevel(techVector)

    if (companyTechLevel >= complexity) return 1.0
    if (companyTechLevel >= complexity - 1) return 0.7
    if (companyTechLevel >= complexity - 2) return 0.4

    return 0.1
  }

  /**
   * 過去成功確率計算
   */
  private calculateHistoricalSuccess(
    experienceVector: number[],
    subsidyId: string
  ): number {
    const baseSuccess = 0.5 // ベースライン成功率

    // 過去の類似補助金成功経験
    const similarExperience = experienceVector[0] || 0
    
    // 申請経験の豊富さ
    const applicationExperience = experienceVector[1] || 0
    
    // 成功率計算
    return Math.min(baseSuccess + similarExperience * 0.3 + applicationExperience * 0.2, 1.0)
  }

  /**
   * 理由コード生成
   */
  private generateReasonCodes(scores: Record<string, number>): string[] {
    const codes: string[] = []

    if (scores.industryScore > 0.8) codes.push('perfect_industry_match')
    if (scores.sizeScore > 0.8) codes.push('ideal_company_size')
    if (scores.needsScore > 0.8) codes.push('high_needs_alignment')
    if (scores.technicalScore > 0.8) codes.push('technical_capability_match')
    if (scores.historicalScore > 0.7) codes.push('proven_track_record')

    if (scores.industryScore < 0.3) codes.push('industry_mismatch_risk')
    if (scores.sizeScore < 0.3) codes.push('size_eligibility_concern')

    return codes
  }

  /**
   * AI説明文生成
   */
  private generateExplanation(
    profile: CompanyProfile,
    subsidy: SubsidyData,
    scores: Record<string, number>
  ): string {
    const strengths: string[] = []
    const concerns: string[] = []

    if (scores.industryScore > 0.8) {
      strengths.push(`${profile.industry_name}は対象業界に完全適合`)
    }
    if (scores.needsScore > 0.7) {
      strengths.push('事業ニーズと補助金目的が高度に一致')
    }
    if (scores.technicalScore > 0.7) {
      strengths.push('技術要件を満たす十分な能力を保有')
    }

    if (scores.sizeScore < 0.5) {
      concerns.push('企業規模が対象範囲と一部不一致')
    }
    if (scores.technicalScore < 0.5) {
      concerns.push('一部技術要件で追加準備が必要')
    }

    let explanation = `${subsidy.name}との適合分析結果: `
    
    if (strengths.length > 0) {
      explanation += `【強み】${strengths.join('、')}。`
    }
    
    if (concerns.length > 0) {
      explanation += `【注意点】${concerns.join('、')}。`
    }

    return explanation
  }

  /**
   * 推奨アクション生成
   */
  private generateRecommendedActions(subsidy: SubsidyData, score: number): string[] {
    const actions: string[] = []

    if (score > 0.8) {
      actions.push('即座に申請準備を開始することを強く推奨')
      actions.push('必要書類の準備リストを確認')
    } else if (score > 0.6) {
      actions.push('詳細な eligibility criteria の確認')
      actions.push('申請前の事前相談を検討')
    } else if (score > 0.4) {
      actions.push('要件充足のための事前準備が必要')
      actions.push('専門コンサルタントへの相談を推奨')
    }

    // 締切に基づく緊急度
    const daysToDeadline = this.calculateDaysToDeadline(subsidy.application_end)
    if (daysToDeadline <= 30) {
      actions.unshift('⚠️ 申請締切が近づいています - 優先対応必要')
    }

    return actions
  }

  /**
   * リアルタイム監視・通知システム
   */
  async triggerHighScoreNotifications(
    organizationId: string,
    results: MatchingResult[]
  ): Promise<void> {
    const highScoreMatches = results.filter(r => r.overall_score > 0.7)

    for (const match of highScoreMatches) {
      await this.sendRealtimeNotification(organizationId, {
        type: 'high_match_subsidy',
        subsidy_id: match.subsidy_id,
        score: match.overall_score,
        confidence: match.confidence_level,
        actions: match.recommended_actions
      })
    }
  }

  /**
   * リアルタイム通知送信
   */
  private async sendRealtimeNotification(
    organizationId: string,
    notificationData: any
  ): Promise<void> {
    try {
      await this.supabase
        .from('realtime_notifications')
        .insert({
          organization_id: organizationId,
          notification_type: notificationData.type,
          title: `新しい高適合補助金を発見`,
          message: `適合度${Math.round(notificationData.score * 100)}%の補助金が見つかりました`,
          data: notificationData,
          priority: notificationData.score > 0.9 ? 'urgent' : 'high',
          channels: ['in_app', 'email']
        })

      // WebSocket通知もトリガー
      await this.triggerWebSocketNotification(organizationId, notificationData)

    } catch (error) {
      console.error('Failed to send realtime notification:', error)
    }
  }

  private async triggerWebSocketNotification(
    organizationId: string,
    data: any
  ): Promise<void> {
    // WebSocket実装は環境に応じて調整
    // Supabase Realtime or Socket.IO等
  }

  /**
   * ヘルパーメソッド
   */
  private getSimilarIndustries(industryCode: string): string[] {
    // 業界類似性マップ（簡略版）
    const similarityMap: Record<string, string[]> = {
      '39': ['37', '38', '40'], // 情報通信業
      '09': ['08', '10', '11'], // 製造業
      // 他の業界も同様に定義
    }
    return similarityMap[industryCode] || []
  }

  private categorizeCompanySize(employees: number, revenue: number): string {
    if (employees <= 20 || revenue <= 300000000) return 'small'
    if (employees <= 300 || revenue <= 3000000000) return 'medium'
    return 'large'
  }

  private getAdjacentSizes(size: string): string[] {
    const sizeOrder = ['small', 'medium', 'large']
    const index = sizeOrder.indexOf(size)
    const adjacent: string[] = []
    
    if (index > 0) adjacent.push(sizeOrder[index - 1])
    if (index < sizeOrder.length - 1) adjacent.push(sizeOrder[index + 1])
    
    return adjacent
  }

  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * (vec2[i] || 0), 0)
    const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0))
    const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0))
    
    if (norm1 === 0 || norm2 === 0) return 0
    return dotProduct / (norm1 * norm2)
  }

  private calculateDaysToDeadline(deadline: string): number {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // その他のヘルパーメソッドは実装簡略化のため省略
  private generateDefaultIndustryVector(): number[] { return [0.5, 0.5, 0.5] }
  private generateSizeVector(employees: number, revenue: number): number[] { return [employees/1000, revenue/1000000000] }
  private async generateNeedsVector(profile: any): Promise<number[]> { return [0.5, 0.5, 0.5] }
  private generateTechVector(level: number, profile: any): number[] { return [level/5, 0.5] }
  private generateFinancialVector(revenue: number): number[] { return [Math.min(revenue/10000000000, 1)] }
  private generateExperienceVector(history: any[]): number[] { return [history.length/10, 0.5] }
  private analyzeRequirementComplexity(requirements: string[]): number { return 3 }
  private vectorToTechLevel(vector: number[]): number { return vector[0] * 5 }

  private async loadAndPreprocessSubsidies(): Promise<void> {}
  private async buildIndustryEmbeddings(): Promise<void> {}
  private async buildTfIdfModel(): Promise<void> {}
  private async getCompanyProfile(orgId: string): Promise<CompanyProfile | null> { return null }
  private async getActiveSubsidies(): Promise<SubsidyData[]> { return [] }
  private async saveMatchingResults(orgId: string, results: MatchingResult[]): Promise<void> {}
}