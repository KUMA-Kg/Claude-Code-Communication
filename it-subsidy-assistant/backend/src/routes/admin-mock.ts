import { Router } from 'express';
import { supabaseService } from '@/config/database';
import { asyncHandler } from '@/middleware/asyncHandler';
import { DeadlineScheduler } from '@/services/DeadlineScheduler';
import { logger } from '@/utils/logger';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * モックデータを投入
 * POST /api/subsidies/mock/load
 */
router.post(
  '/mock/load',
  asyncHandler(async (req, res) => {
    try {
      // モックデータSQLファイルを読み込み
      const mockDataPath = path.join(__dirname, '../../database/mock-data.sql');
      const mockDataSQL = fs.readFileSync(mockDataPath, 'utf-8');

      // SQL文を個別に実行（Supabaseは複数文の一括実行をサポートしていない場合がある）
      const statements = mockDataSQL
        .split(';')
        .filter(stmt => stmt.trim().length > 0)
        .map(stmt => stmt.trim() + ';');

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const statement of statements) {
        // コメント行はスキップ
        if (statement.startsWith('--') || statement.length < 10) {
          continue;
        }

        try {
          // Supabase RPCを使用してSQLを実行
          const { error } = await supabaseService.rpc('exec_sql', {
            query: statement
          });

          if (error) {
            errorCount++;
            errors.push(`Error in statement: ${statement.substring(0, 50)}... - ${error.message}`);
            logger.error('Mock data insertion error:', error);
          } else {
            successCount++;
          }
        } catch (err) {
          errorCount++;
          errors.push(`Failed to execute: ${statement.substring(0, 50)}...`);
          logger.error('Statement execution error:', err);
        }
      }

      res.json({
        message: 'Mock data loading completed',
        success: successCount,
        failed: errorCount,
        errors: errors.slice(0, 5) // 最初の5つのエラーのみ返す
      });

    } catch (error) {
      logger.error('Failed to load mock data:', error);
      res.status(500).json({
        error: 'Failed to load mock data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

/**
 * 簡易的なモックデータ投入（SQLファイルを使わない）
 * POST /api/subsidies/mock/quick-load
 */
router.post(
  '/mock/quick-load',
  asyncHandler(async (req, res) => {
    try {
      // IT導入補助金のモックデータ
      const itDonyuData = {
        id: 'it-donyu-2025',
        name: 'IT導入補助金2025',
        description: '中小企業・小規模事業者等が自社の課題やニーズに合ったITツールを導入する経費の一部を補助',
        category: 'デジタル化支援',
        organizer: '独立行政法人中小企業基盤整備機構',
        subsidy_type: 'it-donyu',
        status: 'active',
        subsidy_amount_min: 300000,
        subsidy_amount_max: 4500000,
        subsidy_rate: 0.50,
        eligible_companies: ['中小企業', '小規模事業者'],
        eligible_expenses: ['ソフトウェア費', 'クラウド利用料', '導入関連費'],
        application_start: new Date('2025-04-01'),
        application_end: new Date('2025-12-28'),
        requirements: ['IT導入支援事業者との連携必須', '交付決定後の発注・契約・支払', '効果報告書の提出（3年間）'],
        application_flow: ['IT導入支援事業者の選定', '申請書類の準備', 'gBizIDプライム取得', '電子申請'],
        contact_phone: '03-1234-5678',
        contact_email: 'info@it-hojo.jp',
        contact_website: 'https://www.it-hojo.jp',
        priority: 100,
        metadata: { renewal_date: '2025-03-15', popular_tools: ['会計ソフト', 'ECサイト'] }
      };

      // 持続化補助金のモックデータ
      const jizokukaData = {
        id: 'jizokuka-2025',
        name: '小規模事業者持続化補助金＜一般型＞',
        description: '小規模事業者が経営計画を策定して取り組む販路開拓等を支援',
        category: '販路開拓支援',
        organizer: '日本商工会議所',
        subsidy_type: 'jizokuka',
        status: 'active',
        subsidy_amount_min: 500000,
        subsidy_amount_max: 2000000,
        subsidy_rate: 0.67,
        eligible_companies: ['小規模事業者'],
        eligible_expenses: ['機械装置等費', '広報費', 'ウェブサイト関連費'],
        application_start: new Date('2025-03-15'),
        application_end: new Date('2025-06-30'),
        requirements: ['商工会・商工会議所の支援を受けて経営計画書作成'],
        application_flow: ['商工会・商工会議所へ相談', '経営計画書作成', '電子申請'],
        contact_phone: '03-2222-3333',
        contact_email: 'jizokuka@jcci.or.jp',
        contact_website: 'https://r3.jizokukahojokin.info',
        priority: 90,
        metadata: { special_frame: ['賃金引上げ枠', 'インボイス枠'] }
      };

      // 事業再構築補助金のモックデータ（準備中）
      const saikouchikuData = {
        id: 'saikouchiku-2025',
        name: '事業再構築補助金',
        description: 'ポストコロナ・ウィズコロナ時代の経済社会の変化に対応するための事業再構築を支援',
        category: '事業転換支援',
        organizer: '中小企業庁',
        subsidy_type: 'jigyou-saikouchiku',
        status: 'upcoming',
        subsidy_amount_min: 1000000,
        subsidy_amount_max: 100000000,
        subsidy_rate: 0.50,
        eligible_companies: ['中小企業', '中堅企業'],
        eligible_expenses: ['建物費', '機械装置・システム構築費'],
        application_start: new Date('2025-05-01'),
        application_end: new Date('2025-07-31'),
        requirements: ['事業再構築指針に沿った事業計画'],
        application_flow: ['事業計画策定', '認定支援機関の確認', '電子申請'],
        contact_phone: '03-3333-4444',
        contact_email: 'saikouchiku@meti.go.jp',
        contact_website: 'https://jigyou-saikouchiku.go.jp',
        priority: 95,
        metadata: { application_round: 12 }
      };

      // データを投入
      const { data: insertedData, error: insertError } = await supabaseService
        .from('subsidies')
        .upsert([itDonyuData, jizokukaData, saikouchikuData], {
          onConflict: 'id'
        })
        .select();

      if (insertError) {
        throw insertError;
      }

      // スケジュールデータも追加
      const schedules = [
        {
          subsidy_id: 'it-donyu-2025',
          schedule_type: 'application',
          round_number: 1,
          round_name: '第1次締切',
          start_date: new Date('2025-04-01'),
          end_date: new Date('2025-05-15'),
          status: 'open',
          auto_update_enabled: true
        },
        {
          subsidy_id: 'jizokuka-2025',
          schedule_type: 'application',
          round_number: 15,
          round_name: '第15回締切',
          start_date: new Date('2025-03-15'),
          end_date: new Date('2025-06-30'),
          status: 'open',
          auto_update_enabled: true
        }
      ];

      const { error: scheduleError } = await supabaseService
        .from('subsidy_schedules')
        .upsert(schedules, {
          onConflict: 'subsidy_id,schedule_type,round_name'
        });

      if (scheduleError) {
        logger.error('Schedule insertion error:', scheduleError);
      }

      res.json({
        message: 'Quick mock data loaded successfully',
        subsidies: insertedData?.length || 0,
        schedules: schedules.length
      });

    } catch (error) {
      logger.error('Failed to load quick mock data:', error);
      res.status(500).json({
        error: 'Failed to load mock data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

/**
 * 締切チェックを手動実行
 * POST /api/admin/check-deadlines
 */
router.post(
  '/check-deadlines',
  asyncHandler(async (req, res) => {
    try {
      // 締切日程の更新を実行
      await DeadlineScheduler.updateAllSchedules();
      
      // 締切アラートのチェックを実行
      await DeadlineScheduler.checkDeadlineAlerts();

      res.json({
        message: 'Deadline check completed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to check deadlines:', error);
      res.status(500).json({
        error: 'Failed to check deadlines',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

/**
 * 補助金ステータスを手動で変更（デモ用）
 * PUT /api/admin/subsidies/:id/status
 */
router.put(
  '/subsidies/:id/status',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'upcoming', 'closed', 'suspended'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses: ['active', 'upcoming', 'closed', 'suspended']
      });
    }

    const { data, error } = await supabaseService
      .from('subsidies')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update subsidy status:', error);
      return res.status(500).json({ error: 'Failed to update status' });
    }

    // WebSocketで更新を通知（実装済みの場合）
    // realtimeService.broadcastToChannel('subsidy_updates', {
    //   type: 'status_change',
    //   subsidyId: id,
    //   newStatus: status
    // });

    res.json({
      message: 'Status updated successfully',
      subsidy: data
    });
  })
);

/**
 * データベースのクリーンアップ（開発用）
 * DELETE /api/admin/cleanup
 */
router.delete(
  '/cleanup',
  asyncHandler(async (req, res) => {
    try {
      // 開発環境でのみ実行可能
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not allowed in production' });
      }

      // 各テーブルのデータを削除
      const tables = [
        'deadline_alerts',
        'subsidy_schedules',
        'question_conditions',
        'questions',
        'question_sets',
        'subsidy_industries',
        'subsidy_regions',
        'subsidies'
      ];

      const results: Record<string, any> = {};

      for (const table of tables) {
        const { error } = await supabaseService
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // 全削除

        results[table] = error ? 'failed' : 'cleaned';
        if (error) {
          logger.error(`Failed to clean ${table}:`, error);
        }
      }

      res.json({
        message: 'Cleanup completed',
        results
      });
    } catch (error) {
      logger.error('Failed to cleanup database:', error);
      res.status(500).json({ error: 'Failed to cleanup' });
    }
  })
);

export default router;