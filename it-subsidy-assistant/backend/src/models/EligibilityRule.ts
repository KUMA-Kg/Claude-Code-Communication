import { supabase } from '@/config/supabase';
import { logger } from '@/utils/logger';

export interface EligibilityRule {
  id: string;
  subsidy_id: string;
  frame_code: string;
  frame_name: string;
  description?: string;
  min_amount?: number;
  max_amount?: number;
  subsidy_rate?: number;
  priority?: number;
  conditions: any;
  required_documents?: string[];
  is_active?: boolean;
}

export interface EligibilityCheckResult {
  frame_code: string;
  frame_name: string;
  description?: string;
  match_score: number;
  min_amount?: number;
  max_amount?: number;
  subsidy_rate?: number;
  is_eligible: boolean;
  required_documents?: string[];
}

export interface QuestionAnswer {
  question_id: string;
  answer: any;
}

export class EligibilityRuleModel {
  /**
   * 申請枠の自動判定
   * 3つの質問への回答に基づいて最適な申請枠を判定
   */
  static async checkEligibility(
    subsidyId: string,
    answers: Record<string, any>
  ): Promise<EligibilityCheckResult[]> {
    try {
      // 申請枠判定関数を呼び出し
      const { data, error } = await supabase
        .rpc('determine_application_frame', {
          p_subsidy_id: subsidyId,
          p_answers: answers
        });

      if (error) {
        logger.error('Failed to check eligibility:', error);
        throw new Error(`Failed to check eligibility: ${error.message}`);
      }

      // スコアが0より大きいものを適格とする
      const results: EligibilityCheckResult[] = (data || []).map((rule: any) => ({
        frame_code: rule.frame_code,
        frame_name: rule.frame_name,
        description: rule.description,
        match_score: rule.match_score,
        is_eligible: rule.match_score > 0
      }));

      // 適格な枠の詳細情報を取得
      const eligibleFrames = results.filter(r => r.is_eligible);
      if (eligibleFrames.length > 0) {
        const frameCodes = eligibleFrames.map(f => f.frame_code);
        
        const { data: ruleDetails, error: detailError } = await supabase
          .from('eligibility_rules')
          .select('frame_code, min_amount, max_amount, subsidy_rate, required_documents')
          .eq('subsidy_id', subsidyId)
          .in('frame_code', frameCodes);

        if (!detailError && ruleDetails) {
          // 詳細情報をマージ
          ruleDetails.forEach(detail => {
            const result = results.find(r => r.frame_code === detail.frame_code);
            if (result) {
              result.min_amount = detail.min_amount;
              result.max_amount = detail.max_amount;
              result.subsidy_rate = detail.subsidy_rate;
              result.required_documents = detail.required_documents;
            }
          });
        }
      }

      return results.sort((a, b) => b.match_score - a.match_score);
    } catch (error) {
      logger.error('EligibilityRuleModel.checkEligibility error:', error);
      throw error;
    }
  }

  /**
   * シンプルな3つの質問による申請枠判定
   * IT導入補助金2024に特化
   */
  static async checkEligibilitySimple(
    subsidyId: string,
    hasDigitization: boolean,
    hasSecurityInvestment: boolean,
    isInvoiceRequired: boolean
  ): Promise<EligibilityCheckResult> {
    try {
      const answers = {
        q_digitization_purpose: hasDigitization ? 'main' : 'none',
        q_has_paper_workflow: hasDigitization,
        q_paper_reduction_target: hasDigitization ? 70 : 0,
        q_security_purpose: hasSecurityInvestment ? 'main' : 'none',
        q_has_security_investment: hasSecurityInvestment,
        q_security_tool_type: hasSecurityInvestment ? ['firewall', 'edr'] : [],
        q_invoice_purpose: isInvoiceRequired,
        q_is_taxable_business: isInvoiceRequired,
        q_invoice_status: isInvoiceRequired ? 'not_registered' : 'registered'
      };

      const results = await this.checkEligibility(subsidyId, answers);
      
      // 最も高いスコアの枠を返す
      const eligible = results.find(r => r.is_eligible);
      if (eligible) {
        return eligible;
      }

      // 適格な枠がない場合は通常枠を返す
      return {
        frame_code: 'normal',
        frame_name: '通常枠',
        description: 'ITツール導入による生産性向上を目的とした基本的な申請枠',
        match_score: 100,
        min_amount: 300000,
        max_amount: 4500000,
        subsidy_rate: 0.50,
        is_eligible: true,
        required_documents: ['DOC001', 'DOC002', 'DOC003', 'DOC004', 'DOC005', 'DOC006', 'DOC011', 'DOC012']
      };
    } catch (error) {
      logger.error('EligibilityRuleModel.checkEligibilitySimple error:', error);
      throw error;
    }
  }

  /**
   * 補助金の全申請枠を取得
   */
  static async getAllFrames(subsidyId: string): Promise<EligibilityRule[]> {
    try {
      const { data, error } = await supabase
        .from('eligibility_rules')
        .select('*')
        .eq('subsidy_id', subsidyId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) {
        logger.error('Failed to fetch eligibility rules:', error);
        throw new Error(`Failed to fetch eligibility rules: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('EligibilityRuleModel.getAllFrames error:', error);
      throw error;
    }
  }

  /**
   * 特定の申請枠の詳細を取得
   */
  static async getFrameDetails(
    subsidyId: string,
    frameCode: string
  ): Promise<EligibilityRule | null> {
    try {
      const { data, error } = await supabase
        .from('eligibility_rules')
        .select('*')
        .eq('subsidy_id', subsidyId)
        .eq('frame_code', frameCode)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Failed to fetch frame details:', error);
        throw new Error(`Failed to fetch frame details: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('EligibilityRuleModel.getFrameDetails error:', error);
      throw error;
    }
  }
}