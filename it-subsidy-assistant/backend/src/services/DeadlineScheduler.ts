import { supabaseService } from '@/config/database';
import { logger } from '@/utils/logger';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { CronJob } from 'cron';

export interface SubsidySchedule {
  id: string;
  subsidyId: string;
  scheduleType: 'application' | 'submission' | 'result' | 'grant';
  roundNumber?: number;
  roundName?: string;
  startDate: Date;
  endDate: Date;
  notificationDate?: Date;
  status: 'scheduled' | 'open' | 'closed' | 'extended' | 'cancelled';
  autoUpdateEnabled: boolean;
  sourceUrl?: string;
  lastCheckedAt?: Date;
}

export interface DeadlineAlert {
  id: string;
  userId: string;
  subsidyId: string;
  scheduleId?: string;
  alertType: 'email' | 'push' | 'both';
  daysBefore: number[];
  isActive: boolean;
}

export class DeadlineScheduler {
  private static cronJobs: Map<string, CronJob> = new Map();

  /**
   * 締切日程の自動更新システムを初期化
   */
  public static initialize(): void {
    // 毎日午前2時に実行
    const dailyUpdateJob = new CronJob(
      '0 2 * * *',
      async () => {
        await this.updateAllSchedules();
        await this.checkDeadlineAlerts();
      },
      null,
      true,
      'Asia/Tokyo'
    );

    this.cronJobs.set('daily_update', dailyUpdateJob);
    logger.info('DeadlineScheduler initialized');
  }

  /**
   * 全補助金の締切日程を更新
   */
  public static async updateAllSchedules(): Promise<void> {
    try {
      // 自動更新が有効な補助金を取得
      const { data: subsidies, error } = await supabaseService
        .from('subsidies')
        .select('id, name, contact_website, subsidy_type')
        .eq('is_active', true)
        .eq('status', 'active');

      if (error) {
        logger.error('Failed to fetch subsidies for update:', error);
        return;
      }

      for (const subsidy of subsidies || []) {
        try {
          await this.updateSubsidySchedule(subsidy);
        } catch (error) {
          logger.error(`Failed to update schedule for ${subsidy.id}:`, error);
        }
      }

      // 補助金ステータスを更新
      await this.updateSubsidyStatuses();
    } catch (error) {
      logger.error('DeadlineScheduler.updateAllSchedules error:', error);
    }
  }

  /**
   * 個別補助金の締切日程を更新
   */
  private static async updateSubsidySchedule(subsidy: any): Promise<void> {
    // 補助金タイプごとの更新処理
    const updaters: Record<string, (subsidy: any) => Promise<any>> = {
      'it-donyu': this.updateITDonyuSchedule,
      'jizokuka': this.updateJizokukaSchedule,
      'jigyou-saikouchiku': this.updateJigyouSaikouchikuSchedule,
      'monozukuri': this.updateMonozukuriSchedule
    };

    const updater = updaters[subsidy.subsidy_type];
    if (!updater) {
      logger.warn(`No updater found for subsidy type: ${subsidy.subsidy_type}`);
      return;
    }

    const scheduleData = await updater.call(this, subsidy);
    if (!scheduleData) {
      return;
    }

    // スケジュールを更新
    for (const schedule of scheduleData) {
      await this.upsertSchedule({
        ...schedule,
        subsidyId: subsidy.id,
        lastCheckedAt: new Date()
      });
    }

    // 更新ログを記録
    await supabaseService
      .from('auto_update_logs')
      .insert({
        update_type: 'schedule_update',
        target_table: 'subsidy_schedules',
        target_id: subsidy.id,
        new_data: { schedules: scheduleData },
        update_source: 'deadline_scheduler',
        status: 'success'
      });
  }

  /**
   * IT導入補助金の締切日程を取得
   */
  private static async updateITDonyuSchedule(subsidy: any): Promise<any[]> {
    try {
      const url = subsidy.contact_website || 'https://www.it-hojo.jp/schedule/';
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      const schedules: any[] = [];
      
      // スケジュールテーブルを解析（実際のサイト構造に合わせて調整が必要）
      $('.schedule-table tr').each((index, element) => {
        if (index === 0) return; // ヘッダー行をスキップ
        
        const cells = $(element).find('td');
        if (cells.length >= 3) {
          const roundName = $(cells[0]).text().trim();
          const applicationPeriod = $(cells[1]).text().trim();
          const resultDate = $(cells[2]).text().trim();
          
          // 日付をパース（形式: 2025年4月1日～2025年6月30日）
          const periodMatch = applicationPeriod.match(/(\d{4})年(\d{1,2})月(\d{1,2})日～(\d{4})年(\d{1,2})月(\d{1,2})日/);
          if (periodMatch) {
            schedules.push({
              scheduleType: 'application',
              roundName,
              startDate: new Date(
                parseInt(periodMatch[1]),
                parseInt(periodMatch[2]) - 1,
                parseInt(periodMatch[3])
              ),
              endDate: new Date(
                parseInt(periodMatch[4]),
                parseInt(periodMatch[5]) - 1,
                parseInt(periodMatch[6])
              ),
              status: 'scheduled',
              autoUpdateEnabled: true,
              sourceUrl: url
            });
          }
        }
      });
      
      return schedules;
    } catch (error) {
      logger.error('Failed to update IT導入補助金 schedule:', error);
      return [];
    }
  }

  /**
   * 持続化補助金の締切日程を取得（実装例）
   */
  private static async updateJizokukaSchedule(subsidy: any): Promise<any[]> {
    // 実際のスクレイピング実装は省略
    // APIやRSSフィードがある場合はそちらを優先
    return [];
  }

  /**
   * 事業再構築補助金の締切日程を取得（実装例）
   */
  private static async updateJigyouSaikouchikuSchedule(subsidy: any): Promise<any[]> {
    return [];
  }

  /**
   * ものづくり補助金の締切日程を取得（実装例）
   */
  private static async updateMonozukuriSchedule(subsidy: any): Promise<any[]> {
    return [];
  }

  /**
   * スケジュールの作成または更新
   */
  private static async upsertSchedule(schedule: Partial<SubsidySchedule>): Promise<void> {
    try {
      const { error } = await supabaseService
        .from('subsidy_schedules')
        .upsert({
          ...schedule,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'subsidy_id,schedule_type,round_name'
        });

      if (error) {
        logger.error('Failed to upsert schedule:', error);
      }
    } catch (error) {
      logger.error('DeadlineScheduler.upsertSchedule error:', error);
    }
  }

  /**
   * 補助金のステータスを自動更新
   */
  private static async updateSubsidyStatuses(): Promise<void> {
    try {
      // PostgreSQL関数を呼び出し
      const { error } = await supabaseService.rpc('update_subsidy_status');
      
      if (error) {
        logger.error('Failed to update subsidy statuses:', error);
      }
    } catch (error) {
      logger.error('DeadlineScheduler.updateSubsidyStatuses error:', error);
    }
  }

  /**
   * 締切アラートをチェックして通知を送信
   */
  public static async checkDeadlineAlerts(): Promise<void> {
    try {
      const now = new Date();
      
      // アクティブなアラートを取得
      const { data: alerts, error } = await supabaseService
        .from('deadline_alerts')
        .select(`
          *,
          users (email, name),
          subsidies (name, subsidy_type),
          subsidy_schedules (
            schedule_type,
            round_name,
            start_date,
            end_date
          )
        `)
        .eq('is_active', true);

      if (error) {
        logger.error('Failed to fetch deadline alerts:', error);
        return;
      }

      for (const alert of alerts || []) {
        const schedule = alert.subsidy_schedules;
        if (!schedule) continue;

        const endDate = new Date(schedule.end_date);
        const daysUntilDeadline = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // 設定された日数前に通知
        if (alert.days_before.includes(daysUntilDeadline)) {
          await this.sendDeadlineNotification(alert, daysUntilDeadline);
        }
      }
    } catch (error) {
      logger.error('DeadlineScheduler.checkDeadlineAlerts error:', error);
    }
  }

  /**
   * 締切通知を送信
   */
  private static async sendDeadlineNotification(
    alert: any,
    daysUntilDeadline: number
  ): Promise<void> {
    try {
      const notification = {
        userId: alert.user_id,
        type: 'deadline_alert',
        title: `${alert.subsidies.name} 締切まであと${daysUntilDeadline}日`,
        message: `${alert.subsidy_schedules.round_name || ''}の申請締切が近づいています。`,
        metadata: {
          subsidyId: alert.subsidy_id,
          scheduleId: alert.schedule_id,
          daysRemaining: daysUntilDeadline
        }
      };

      // 通知を送信（実際の実装は通知サービスに依存）
      if (alert.alert_type === 'email' || alert.alert_type === 'both') {
        // メール送信
        logger.info(`Sending email notification to ${alert.users.email}`);
      }

      if (alert.alert_type === 'push' || alert.alert_type === 'both') {
        // プッシュ通知
        logger.info(`Sending push notification to user ${alert.user_id}`);
      }

      // リアルタイムチャンネルに通知
      await supabaseService
        .channel(`user:${alert.user_id}`)
        .send({
          type: 'broadcast',
          event: 'deadline_alert',
          payload: notification
        });
    } catch (error) {
      logger.error('Failed to send deadline notification:', error);
    }
  }

  /**
   * 特定のユーザーのアラート設定を管理
   */
  public static async setUserAlert(
    userId: string,
    subsidyId: string,
    settings: Partial<DeadlineAlert>
  ): Promise<string | null> {
    try {
      const { data, error } = await supabaseService
        .from('deadline_alerts')
        .upsert({
          user_id: userId,
          subsidy_id: subsidyId,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Failed to set user alert:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      logger.error('DeadlineScheduler.setUserAlert error:', error);
      return null;
    }
  }

  /**
   * クリーンアップ
   */
  public static shutdown(): void {
    this.cronJobs.forEach(job => job.stop());
    this.cronJobs.clear();
    logger.info('DeadlineScheduler shutdown');
  }
}