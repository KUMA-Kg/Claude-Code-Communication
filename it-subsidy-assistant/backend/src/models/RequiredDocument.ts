import { supabase } from '@/config/supabase';
import { logger } from '@/utils/logger';

export interface RequiredDocument {
  id?: string;
  document_code: string;
  name: string;
  description?: string;
  category: string;
  file_format?: string[];
  is_template_available?: boolean;
  template_url?: string;
  sample_url?: string;
  max_file_size?: number;
  is_required?: boolean;
  applicable_frames?: string[];
  conditions?: any;
  sort_order?: number;
}

export interface DocumentWithStatus extends RequiredDocument {
  is_uploaded?: boolean;
  upload_status?: 'pending' | 'uploaded' | 'approved' | 'rejected';
  uploaded_file_url?: string;
  upload_date?: string;
  rejection_reason?: string;
}

export class RequiredDocumentModel {
  /**
   * 申請枠に基づく必要書類の自動抽出
   */
  static async getRequiredDocuments(
    subsidyId: string,
    frameCode: string
  ): Promise<RequiredDocument[]> {
    try {
      // 必要書類抽出関数を呼び出し
      const { data, error } = await supabase
        .rpc('get_required_documents', {
          p_subsidy_id: subsidyId,
          p_frame_code: frameCode
        });

      if (error) {
        logger.error('Failed to get required documents:', error);
        throw new Error(`Failed to get required documents: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('RequiredDocumentModel.getRequiredDocuments error:', error);
      throw error;
    }
  }

  /**
   * カテゴリ別に必要書類を取得
   */
  static async getDocumentsByCategory(
    subsidyId: string,
    frameCode: string
  ): Promise<Record<string, RequiredDocument[]>> {
    try {
      const documents = await this.getRequiredDocuments(subsidyId, frameCode);
      
      // カテゴリ別にグループ化
      const grouped = documents.reduce((acc, doc) => {
        const category = doc.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(doc);
        return acc;
      }, {} as Record<string, RequiredDocument[]>);

      return grouped;
    } catch (error) {
      logger.error('RequiredDocumentModel.getDocumentsByCategory error:', error);
      throw error;
    }
  }

  /**
   * 書類コードで詳細を取得
   */
  static async getDocumentByCode(documentCode: string): Promise<RequiredDocument | null> {
    try {
      const { data, error } = await supabase
        .from('required_documents')
        .select('*')
        .eq('document_code', documentCode)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Failed to fetch document by code:', error);
        throw new Error(`Failed to fetch document: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('RequiredDocumentModel.getDocumentByCode error:', error);
      throw error;
    }
  }

  /**
   * 複数の書類コードで詳細を取得
   */
  static async getDocumentsByCodes(documentCodes: string[]): Promise<RequiredDocument[]> {
    try {
      const { data, error } = await supabase
        .from('required_documents')
        .select('*')
        .in('document_code', documentCodes)
        .order('sort_order');

      if (error) {
        logger.error('Failed to fetch documents by codes:', error);
        throw new Error(`Failed to fetch documents: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('RequiredDocumentModel.getDocumentsByCodes error:', error);
      throw error;
    }
  }

  /**
   * 申請に必要な書類のチェックリストを生成
   */
  static async generateDocumentChecklist(
    subsidyId: string,
    frameCode: string,
    applicationId?: string
  ): Promise<DocumentWithStatus[]> {
    try {
      const documents = await this.getRequiredDocuments(subsidyId, frameCode);
      
      // 申請IDが指定されている場合は、アップロード状況を取得
      let uploadStatuses: Record<string, any> = {};
      if (applicationId) {
        const { data: uploads } = await supabase
          .from('document_uploads')
          .select('document_code, status, file_url, created_at, rejection_reason')
          .eq('application_id', applicationId);

        if (uploads) {
          uploadStatuses = uploads.reduce((acc, upload) => {
            acc[upload.document_code] = upload;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // チェックリストを生成
      const checklist: DocumentWithStatus[] = documents.map(doc => {
        const upload = uploadStatuses[doc.document_code];
        return {
          ...doc,
          is_uploaded: !!upload,
          upload_status: upload?.status || 'pending',
          uploaded_file_url: upload?.file_url,
          upload_date: upload?.created_at,
          rejection_reason: upload?.rejection_reason
        };
      });

      return checklist;
    } catch (error) {
      logger.error('RequiredDocumentModel.generateDocumentChecklist error:', error);
      throw error;
    }
  }

  /**
   * 条件に基づく動的な必要書類の判定
   */
  static async evaluateConditionalDocuments(
    documents: RequiredDocument[],
    conditions: Record<string, any>
  ): Promise<RequiredDocument[]> {
    try {
      return documents.filter(doc => {
        // 条件が設定されていない書類は常に必要
        if (!doc.conditions || Object.keys(doc.conditions).length === 0) {
          return true;
        }

        // 条件を評価
        return this.evaluateCondition(doc.conditions, conditions);
      });
    } catch (error) {
      logger.error('RequiredDocumentModel.evaluateConditionalDocuments error:', error);
      throw error;
    }
  }

  /**
   * 条件評価ヘルパー関数
   */
  private static evaluateCondition(condition: any, context: Record<string, any>): boolean {
    if (!condition || typeof condition !== 'object') {
      return true;
    }

    // AND条件
    if (condition.and && Array.isArray(condition.and)) {
      return condition.and.every((c: any) => this.evaluateCondition(c, context));
    }

    // OR条件
    if (condition.or && Array.isArray(condition.or)) {
      return condition.or.some((c: any) => this.evaluateCondition(c, context));
    }

    // 等価条件
    if (condition.equals) {
      const [field, value] = Object.entries(condition.equals)[0];
      return context[field] === value;
    }

    // 含有条件
    if (condition.contains) {
      const [field, value] = Object.entries(condition.contains)[0];
      return Array.isArray(context[field]) && context[field].includes(value);
    }

    // 範囲条件
    if (condition.gte) {
      const [field, value] = Object.entries(condition.gte)[0];
      return context[field] >= value;
    }

    if (condition.gt) {
      const [field, value] = Object.entries(condition.gt)[0];
      return context[field] > value;
    }

    if (condition.lte) {
      const [field, value] = Object.entries(condition.lte)[0];
      return context[field] <= value;
    }

    if (condition.lt) {
      const [field, value] = Object.entries(condition.lt)[0];
      return context[field] < value;
    }

    return true;
  }
}