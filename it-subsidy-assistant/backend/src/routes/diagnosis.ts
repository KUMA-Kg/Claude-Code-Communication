import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { supabase } from '@/config/supabase';
import { asyncHandler } from '@/middleware/asyncHandler';
import { validateRequest } from '@/middleware/validateRequest';
import { authenticateOptional, AuthenticatedRequest } from '@/middleware/auth';
import { 
  StartDiagnosisRequestSchema,
  AnswerDiagnosisRequestSchema,
  DiagnosisSession,
  SubsidyMatchResult
} from '@/models/DiagnosisSession';
import { logger } from '@/utils/logger';
import { matchSubsidies } from '@/services/subsidyMatcher';
import { generateSessionToken } from '@/utils/sessionToken';

const router = Router();

// 診断開始
router.post(
  '/start',
  authenticateOptional,
  validateRequest(StartDiagnosisRequestSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_id, initial_data } = req.body;
    const sessionToken = generateSessionToken();
    
    // 診断セッションを作成
    const newSession: Partial<DiagnosisSession> = {
      user_id: user_id || req.user?.id || null,
      session_token: sessionToken,
      company_info: initial_data ? {
        name: initial_data.company_name,
        industry: initial_data.industry,
      } : {},
      diagnosis_data: {
        current_step: 'basic_info',
        answers: {},
        progress: 0,
      },
      status: 'in_progress',
    };

    const { data: session, error } = await supabase
      .from('diagnosis_sessions')
      .insert(newSession)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create diagnosis session:', error);
      return res.status(500).json({ 
        error: 'Failed to start diagnosis',
        details: error.message 
      });
    }

    logger.info(`Diagnosis session started: ${session.id}`);

    res.status(201).json({
      session_id: session.id,
      session_token: session.session_token,
      current_step: 'basic_info',
      progress: 0,
    });
  })
);

// 診断回答保存
router.post(
  '/answer',
  validateRequest(AnswerDiagnosisRequestSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { session_id, question_key, answer, current_step, progress } = req.body;

    // セッションの存在確認
    const { data: session, error: sessionError } = await supabase
      .from('diagnosis_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'in_progress') {
      return res.status(400).json({ error: 'Session is not in progress' });
    }

    // 回答を保存
    const { error: answerError } = await supabase
      .from('diagnosis_answers')
      .upsert({
        session_id,
        question_key,
        answer,
      });

    if (answerError) {
      logger.error('Failed to save answer:', answerError);
      return res.status(500).json({ 
        error: 'Failed to save answer',
        details: answerError.message 
      });
    }

    // セッションの診断データを更新
    const updatedDiagnosisData = {
      ...session.diagnosis_data,
      current_step: current_step || session.diagnosis_data?.current_step,
      answers: {
        ...session.diagnosis_data?.answers,
        [question_key]: answer,
      },
      progress: progress ?? session.diagnosis_data?.progress,
    };

    const { error: updateError } = await supabase
      .from('diagnosis_sessions')
      .update({
        diagnosis_data: updatedDiagnosisData,
        company_info: updateCompanyInfo(session.company_info, question_key, answer),
      })
      .eq('id', session_id);

    if (updateError) {
      logger.error('Failed to update session:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update session',
        details: updateError.message 
      });
    }

    res.json({
      success: true,
      session_id,
      current_step: updatedDiagnosisData.current_step,
      progress: updatedDiagnosisData.progress,
    });
  })
);

// 診断セッション取得
router.get(
  '/session/:sessionId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;

    const { data: session, error } = await supabase
      .from('diagnosis_sessions')
      .select(`
        *,
        diagnosis_answers (
          question_key,
          answer,
          answered_at
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      session,
      answers: session.diagnosis_answers,
    });
  })
);

// 診断完了と補助金マッチング
router.post(
  '/complete/:sessionId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;

    // セッションと回答を取得
    const { data: session, error: sessionError } = await supabase
      .from('diagnosis_sessions')
      .select(`
        *,
        diagnosis_answers (
          question_key,
          answer
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Session already completed' });
    }

    // 補助金マッチングを実行
    const matchResults = await matchSubsidies({
      company_info: session.company_info,
      diagnosis_data: session.diagnosis_data,
      answers: session.diagnosis_answers,
    });

    // セッションを完了状態に更新
    const { error: updateError } = await supabase
      .from('diagnosis_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        matched_subsidies: matchResults,
      })
      .eq('id', sessionId);

    if (updateError) {
      logger.error('Failed to complete session:', updateError);
      return res.status(500).json({ 
        error: 'Failed to complete session',
        details: updateError.message 
      });
    }

    res.json({
      session_id: sessionId,
      status: 'completed',
      matched_subsidies: matchResults,
      recommendation_count: matchResults.filter(m => m.match_score >= 70).length,
    });
  })
);

// 6つの基礎質問APIエンドポイント
router.get(
  '/basic-questions',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const basicQuestions = [
      {
        id: 'company_name',
        question: '会社名を教えてください',
        type: 'text',
        required: true,
        placeholder: '株式会社○○'
      },
      {
        id: 'industry',
        question: '業種を選択してください',
        type: 'select',
        required: true,
        options: [
          { value: 'manufacturing', label: '製造業' },
          { value: 'retail', label: '小売業' },
          { value: 'services', label: 'サービス業' },
          { value: 'it', label: 'IT・情報サービス業' },
          { value: 'construction', label: '建設業' },
          { value: 'other', label: 'その他' }
        ]
      },
      {
        id: 'employee_count',
        question: '従業員数を教えてください',
        type: 'number',
        required: true,
        placeholder: '例: 50'
      },
      {
        id: 'annual_revenue',
        question: '年間売上高を教えてください（万円）',
        type: 'number',
        required: true,
        placeholder: '例: 5000'
      },
      {
        id: 'location',
        question: '所在地を教えてください',
        type: 'select',
        required: true,
        options: [
          { value: 'tokyo', label: '東京都' },
          { value: 'osaka', label: '大阪府' },
          { value: 'kanagawa', label: '神奈川県' },
          { value: 'aichi', label: '愛知県' },
          { value: 'other', label: 'その他' }
        ]
      },
      {
        id: 'subsidy_purpose',
        question: '補助金の利用目的を教えてください',
        type: 'select',
        required: true,
        options: [
          { value: 'it_introduction', label: 'IT導入・デジタル化' },
          { value: 'equipment_investment', label: '設備投資' },
          { value: 'sales_expansion', label: '販路開拓・拡大' },
          { value: 'productivity_improvement', label: '生産性向上' },
          { value: 'other', label: 'その他' }
        ]
      }
    ];

    res.json({
      success: true,
      data: basicQuestions
    });
  })
);

// 補助金推薦APIエンドポイント
router.post(
  '/recommend-subsidy',
  validateRequest(z.object({
    answers: z.record(z.any())
  })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { answers } = req.body;

    // 回答に基づく補助金推薦ロジック
    const recommendations = calculateSubsidyRecommendations(answers);

    res.json({
      success: true,
      data: {
        recommendations,
        primary_recommendation: recommendations[0] || null,
        match_count: recommendations.length
      }
    });
  })
);

// 補助金マッチング再実行
router.post(
  '/match/:sessionId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;

    // セッションと回答を取得
    const { data: session, error } = await supabase
      .from('diagnosis_sessions')
      .select(`
        *,
        diagnosis_answers (
          question_key,
          answer
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 補助金マッチングを実行
    const matchResults = await matchSubsidies({
      company_info: session.company_info,
      diagnosis_data: session.diagnosis_data,
      answers: session.diagnosis_answers,
    });

    res.json({
      session_id: sessionId,
      matched_subsidies: matchResults,
      recommendation_count: matchResults.filter(m => m.match_score >= 70).length,
    });
  })
);

// ヘルパー関数：企業情報の更新
function updateCompanyInfo(
  currentInfo: any,
  questionKey: string,
  answer: any
): any {
  const updatedInfo = { ...currentInfo };

  switch (questionKey) {
    case 'company_name':
      updatedInfo.name = answer;
      break;
    case 'industry':
      updatedInfo.industry = answer;
      break;
    case 'employee_count':
      updatedInfo.employee_count = parseInt(answer);
      break;
    case 'annual_revenue':
      updatedInfo.annual_revenue = parseFloat(answer);
      break;
    case 'established_date':
      updatedInfo.established_date = answer;
      break;
    case 'location':
      updatedInfo.location = answer;
      break;
  }

  return updatedInfo;
}

// 補助金推薦計算関数
function calculateSubsidyRecommendations(answers: Record<string, any>) {
  const recommendations: any[] = [];

  // IT導入補助金の判定
  if (answers.subsidy_purpose === 'it_introduction' || 
      answers.industry === 'it' ||
      (answers.employee_count && parseInt(answers.employee_count) <= 300)) {
    recommendations.push({
      subsidy_type: 'it-donyu',
      name: 'IT導入補助金',
      match_score: 85,
      reason: 'IT導入目的に最適',
      max_amount: '450万円',
      application_period: '通年',
      key_benefits: [
        'ITツール導入費用の最大3/4補助',
        '生産性向上効果',
        '賃上げ効果も期待'
      ]
    });
  }

  // ものづくり補助金の判定
  if (answers.industry === 'manufacturing' ||
      answers.subsidy_purpose === 'equipment_investment' ||
      (answers.annual_revenue && parseInt(answers.annual_revenue) >= 3000)) {
    recommendations.push({
      subsidy_type: 'monozukuri',
      name: 'ものづくり補助金',
      match_score: 90,
      reason: '設備投資・製造業に最適',
      max_amount: '1250万円',
      application_period: '年数回',
      key_benefits: [
        '設備投資費用の最大2/3補助',
        '革新的な製品・サービス開発',
        '生産性向上'
      ]
    });
  }

  // 持続化補助金の判定
  if (answers.subsidy_purpose === 'sales_expansion' ||
      (answers.employee_count && parseInt(answers.employee_count) <= 20) ||
      ['retail', 'services'].includes(answers.industry)) {
    recommendations.push({
      subsidy_type: 'jizokuka',
      name: '小規模事業者持続化補助金',
      match_score: 75,
      reason: '小規模事業者の販路開拓に最適',
      max_amount: '200万円',
      application_period: '年数回',
      key_benefits: [
        '販路開拓費用の最大2/3補助',
        '広告宣伝費も対象',
        '申請しやすい'
      ]
    });
  }

  // スコア順にソート
  return recommendations.sort((a, b) => b.match_score - a.match_score);
}

export { router as diagnosisRoutes };