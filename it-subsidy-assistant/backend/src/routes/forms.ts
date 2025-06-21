import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '@/config/supabase';
import { asyncHandler } from '@/middleware/asyncHandler';
import { validateRequest } from '@/middleware/validateRequest';
import { authenticate } from '@/middleware/auth';
import { 
  SaveFormDataRequestSchema,
  FormData,
  BasicInfoFormSchema,
  BusinessInfoFormSchema,
  ProjectPlanFormSchema
} from '@/models/FormData';
import { logger } from '@/utils/logger';

const router = Router();

// フォームデータ保存
router.post(
  '/save',
  authenticate,
  validateRequest(SaveFormDataRequestSchema),
  asyncHandler(async (req, res) => {
    const { session_id, form_type, form_data, is_draft } = req.body;
    const user_id = req.user!.id;

    // フォームタイプに応じたバリデーション
    if (!is_draft) {
      try {
        switch (form_type) {
          case 'basic_info':
            BasicInfoFormSchema.parse(form_data);
            break;
          case 'business_info':
            BusinessInfoFormSchema.parse(form_data);
            break;
          case 'project_plan':
            ProjectPlanFormSchema.parse(form_data);
            break;
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: 'Validation failed',
            details: error.errors,
          });
        }
      }
    }

    // 既存のフォームデータを確認
    const { data: existingForm } = await supabase
      .from('form_data')
      .select('id')
      .eq('session_id', session_id)
      .eq('form_type', form_type)
      .eq('user_id', user_id)
      .single();

    let result;
    if (existingForm) {
      // 更新
      result = await supabase
        .from('form_data')
        .update({
          form_data,
          is_draft,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingForm.id)
        .select()
        .single();
    } else {
      // 新規作成
      result = await supabase
        .from('form_data')
        .insert({
          session_id,
          user_id,
          form_type,
          form_data,
          is_draft,
        })
        .select()
        .single();
    }

    if (result.error) {
      logger.error('Failed to save form data:', result.error);
      return res.status(500).json({
        error: 'Failed to save form data',
        details: result.error.message,
      });
    }

    res.json({
      success: true,
      form_id: result.data.id,
      is_draft,
    });
  })
);

// フォームデータ取得
router.get(
  '/get/:sessionId/:formType',
  authenticate,
  asyncHandler(async (req, res) => {
    const { sessionId, formType } = req.params;
    const user_id = req.user!.id;

    const { data: formData, error } = await supabase
      .from('form_data')
      .select('*')
      .eq('session_id', sessionId)
      .eq('form_type', formType)
      .eq('user_id', user_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Failed to fetch form data:', error);
      return res.status(500).json({
        error: 'Failed to fetch form data',
        details: error.message,
      });
    }

    res.json({
      form_data: formData || null,
    });
  })
);

// セッションの全フォームデータ取得
router.get(
  '/session/:sessionId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const user_id = req.user!.id;

    const { data: forms, error } = await supabase
      .from('form_data')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user_id)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch session forms:', error);
      return res.status(500).json({
        error: 'Failed to fetch session forms',
        details: error.message,
      });
    }

    // フォームタイプごとにグループ化
    const formsByType = forms.reduce((acc, form) => {
      acc[form.form_type] = form;
      return acc;
    }, {} as Record<string, FormData>);

    res.json({
      forms: formsByType,
      total_forms: forms.length,
      completed_forms: forms.filter(f => !f.is_draft).length,
    });
  })
);

// フォームデータ削除
router.delete(
  '/:formId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const user_id = req.user!.id;

    const { error } = await supabase
      .from('form_data')
      .delete()
      .eq('id', formId)
      .eq('user_id', user_id);

    if (error) {
      logger.error('Failed to delete form data:', error);
      return res.status(500).json({
        error: 'Failed to delete form data',
        details: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Form data deleted successfully',
    });
  })
);

// フォームデータ一括取得（統合用）
router.post(
  '/merge/:sessionId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const user_id = req.user!.id;

    // すべてのフォームデータを取得
    const { data: forms, error } = await supabase
      .from('form_data')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user_id)
      .eq('is_draft', false);

    if (error) {
      logger.error('Failed to fetch forms for merge:', error);
      return res.status(500).json({
        error: 'Failed to fetch forms for merge',
        details: error.message,
      });
    }

    // フォームデータを統合
    const mergedData = forms.reduce((acc, form) => {
      return {
        ...acc,
        [form.form_type]: form.form_data,
      };
    }, {});

    res.json({
      merged_data: mergedData,
      form_count: forms.length,
    });
  })
);

export { router as formRoutes };