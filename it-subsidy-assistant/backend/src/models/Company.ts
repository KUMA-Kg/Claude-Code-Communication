import { supabase } from '@/config/supabase';
import { logger } from '@/utils/logger';

export interface Company {
  id?: string;
  user_id: string;
  corporate_number?: string;
  name: string;
  name_kana?: string;
  postal_code?: string;
  prefecture?: string;
  city?: string;
  address?: string;
  phone?: string;
  fax?: string;
  website?: string;
  email?: string;
  representative_name?: string;
  representative_title?: string;
  established_date?: string;
  capital_amount?: number;
  employee_count?: number;
  annual_revenue?: number;
  fiscal_year_end?: string;
  industry_code?: string;
  is_sme?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyCreateInput {
  corporate_number?: string;
  name: string;
  name_kana?: string;
  postal_code?: string;
  prefecture?: string;
  city?: string;
  address?: string;
  phone?: string;
  fax?: string;
  website?: string;
  email?: string;
  representative_name?: string;
  representative_title?: string;
  established_date?: string;
  capital_amount?: number;
  employee_count?: number;
  annual_revenue?: number;
  fiscal_year_end?: string;
  industry_code?: string;
}

export interface CompanyUpdateInput extends Partial<CompanyCreateInput> {
  is_active?: boolean;
}

export class CompanyModel {
  /**
   * 企業情報を作成
   */
  static async create(userId: string, data: CompanyCreateInput): Promise<Company> {
    try {
      // 中小企業判定ロジック
      const isSme = this.checkSmeStatus(data);

      const { data: company, error } = await supabase
        .from('companies')
        .insert({
          ...data,
          user_id: userId,
          is_sme: isSme
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create company:', error);
        throw new Error(`Failed to create company: ${error.message}`);
      }

      return company;
    } catch (error) {
      logger.error('CompanyModel.create error:', error);
      throw error;
    }
  }

  /**
   * ユーザーの企業一覧を取得
   */
  static async findByUserId(userId: string): Promise<Company[]> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch companies:', error);
        throw new Error(`Failed to fetch companies: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('CompanyModel.findByUserId error:', error);
      throw error;
    }
  }

  /**
   * 企業情報を取得
   */
  static async findById(id: string, userId: string): Promise<Company | null> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Failed to fetch company:', error);
        throw new Error(`Failed to fetch company: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('CompanyModel.findById error:', error);
      throw error;
    }
  }

  /**
   * 法人番号で企業情報を検索
   */
  static async findByCorporateNumber(
    corporateNumber: string,
    userId: string
  ): Promise<Company | null> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('corporate_number', corporateNumber)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Failed to fetch company by corporate number:', error);
        throw new Error(`Failed to fetch company: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('CompanyModel.findByCorporateNumber error:', error);
      throw error;
    }
  }

  /**
   * 企業情報を更新
   */
  static async update(
    id: string,
    userId: string,
    data: CompanyUpdateInput
  ): Promise<Company> {
    try {
      // 中小企業判定が必要な場合は再計算
      if (data.capital_amount !== undefined || data.employee_count !== undefined) {
        const currentCompany = await this.findById(id, userId);
        if (currentCompany) {
          const checkData = { ...currentCompany, ...data };
          data.is_sme = this.checkSmeStatus(checkData);
        }
      }

      const { data: company, error } = await supabase
        .from('companies')
        .update(data)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update company:', error);
        throw new Error(`Failed to update company: ${error.message}`);
      }

      return company;
    } catch (error) {
      logger.error('CompanyModel.update error:', error);
      throw error;
    }
  }

  /**
   * 企業情報を削除（論理削除）
   */
  static async delete(id: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to delete company:', error);
        throw new Error(`Failed to delete company: ${error.message}`);
      }
    } catch (error) {
      logger.error('CompanyModel.delete error:', error);
      throw error;
    }
  }

  /**
   * 中小企業判定
   * 中小企業基本法に基づく判定ロジック
   */
  private static checkSmeStatus(data: any): boolean {
    const capitalAmount = data.capital_amount || 0;
    const employeeCount = data.employee_count || 0;
    const industryCode = data.industry_code || '';

    // 製造業・建設業・運輸業
    if (industryCode.startsWith('E') || industryCode.startsWith('D')) {
      return capitalAmount <= 30000 || employeeCount <= 300;
    }
    
    // 卸売業
    if (industryCode.startsWith('I')) {
      return capitalAmount <= 10000 || employeeCount <= 100;
    }
    
    // サービス業
    if (industryCode.startsWith('G') || industryCode.startsWith('H') || 
        industryCode.startsWith('K') || industryCode.startsWith('L') ||
        industryCode.startsWith('M') || industryCode.startsWith('N') ||
        industryCode.startsWith('O') || industryCode.startsWith('P') ||
        industryCode.startsWith('Q') || industryCode.startsWith('R')) {
      return capitalAmount <= 5000 || employeeCount <= 100;
    }
    
    // 小売業
    if (industryCode.startsWith('J')) {
      return capitalAmount <= 5000 || employeeCount <= 50;
    }

    // その他の業種はサービス業の基準を適用
    return capitalAmount <= 5000 || employeeCount <= 100;
  }
}