import { Router, Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { supabase } from '@/config/supabase';
import { asyncHandler } from '@/middleware/asyncHandler';
import { validateRequest } from '@/middleware/validateRequest';
import { authenticate, AuthenticatedRequest } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { generateExcelDocument } from '@/services/excelGenerator';
import { parseExcelData } from '@/services/excelParser';

const router = Router();

// Excel出力リクエストのスキーマ
const ExportExcelRequestSchema = z.object({
  session_id: z.string().uuid(),
  document_type: z.enum(['application_form', 'project_plan', 'budget_sheet', 'all']),
  include_instructions: z.boolean().default(true),
});

// Excel読み込みリクエストのスキーマ
const ImportExcelRequestSchema = z.object({
  session_id: z.string().uuid(),
  file_data: z.string(), // Base64エンコードされたファイルデータ
  document_type: z.enum(['application_form', 'project_plan', 'budget_sheet']),
});

// Excel出力
router.post(
  '/excel',
  authenticate,
  validateRequest(ExportExcelRequestSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { session_id, document_type, include_instructions } = req.body;
    const user_id = req.user!.id;

    // セッションとフォームデータを取得
    const { data: session, error: sessionError } = await supabase
      .from('diagnosis_sessions')
      .select(`
        *,
        form_data!inner (
          form_type,
          form_data,
          is_draft
        )
      `)
      .eq('id', session_id)
      .eq('form_data.user_id', user_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session or form data not found' });
    }

    // フォームデータを統合
    const formDataMap = session.form_data.reduce((acc: any, form: any) => {
      if (!form.is_draft) {
        acc[form.form_type] = form.form_data;
      }
      return acc;
    }, {});

    try {
      // Excelファイルを生成
      const workbook = await generateExcelDocument({
        session_id,
        document_type,
        form_data: formDataMap,
        company_info: session.company_info,
        include_instructions,
      });

      // バッファに変換
      const buffer = await workbook.xlsx.writeBuffer();

      // データベースに保存
      const { data: savedDoc, error: saveError } = await supabase
        .from('generated_documents')
        .insert({
          session_id,
          user_id,
          document_type: `excel_${document_type}`,
          file_name: `${document_type}_${new Date().toISOString().split('T')[0]}.xlsx`,
          file_data: buffer,
          metadata: {
            include_instructions,
            form_types_included: Object.keys(formDataMap),
          },
        })
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      // ファイルをレスポンスとして送信
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${savedDoc.file_name}"`
      );
      res.send(buffer);
    } catch (error) {
      logger.error('Failed to generate Excel document:', error);
      res.status(500).json({
        error: 'Failed to generate Excel document',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

// Excel読み込み
router.post(
  '/import',
  authenticate,
  validateRequest(ImportExcelRequestSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { session_id, file_data, document_type } = req.body;
    const user_id = req.user!.id;

    try {
      // Base64デコード
      const buffer = Buffer.from(file_data, 'base64');

      // Excelファイルを解析
      const parsedData = await parseExcelData({
        buffer,
        document_type,
      });

      // パースしたデータをフォームデータとして保存
      const savePromises = Object.entries(parsedData).map(([formType, formData]) => {
        return supabase
          .from('form_data')
          .upsert({
            session_id,
            user_id,
            form_type: formType,
            form_data: formData,
            is_draft: false,
          })
          .select();
      });

      const results = await Promise.all(savePromises);

      // エラーチェック
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error('Failed to save some form data');
      }

      res.json({
        success: true,
        imported_forms: Object.keys(parsedData),
        message: 'Excel data imported successfully',
      });
    } catch (error) {
      logger.error('Failed to import Excel document:', error);
      res.status(500).json({
        error: 'Failed to import Excel document',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

// 生成済みドキュメント一覧取得
router.get(
  '/documents/:sessionId',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;
    const user_id = req.user!.id;

    const { data: documents, error } = await supabase
      .from('generated_documents')
      .select('id, document_type, file_name, generated_at, metadata')
      .eq('session_id', sessionId)
      .eq('user_id', user_id)
      .order('generated_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch documents:', error);
      return res.status(500).json({
        error: 'Failed to fetch documents',
        details: error.message,
      });
    }

    res.json({
      documents,
      total: documents.length,
    });
  })
);

// 生成済みドキュメントダウンロード
router.get(
  '/download/:documentId',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { documentId } = req.params;
    const user_id = req.user!.id;

    const { data: document, error } = await supabase
      .from('generated_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user_id)
      .single();

    if (error || !document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${document.file_name}"`
    );
    res.send(document.file_data);
  })
);

export { router as exportRoutes };