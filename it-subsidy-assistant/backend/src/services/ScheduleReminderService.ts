import { ScheduleModel } from '@/models/Schedule';
import { EmailService } from '@/services/EmailService';
import { logger } from '@/utils/logger';
import { Schedule } from '@/types/schedule';

export class ScheduleReminderService {
  private static instance: ScheduleReminderService;
  private intervalId?: NodeJS.Timeout;
  private isRunning: boolean = false;

  private constructor() {}

  static getInstance(): ScheduleReminderService {
    if (!ScheduleReminderService.instance) {
      ScheduleReminderService.instance = new ScheduleReminderService();
    }
    return ScheduleReminderService.instance;
  }

  /**
   * リマインダーサービスの開始
   */
  start(intervalMinutes: number = 5): void {
    if (this.isRunning) {
      logger.warn('Schedule reminder service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting schedule reminder service');

    // 初回実行
    this.checkAndSendReminders();

    // 定期実行
    this.intervalId = setInterval(() => {
      this.checkAndSendReminders();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * リマインダーサービスの停止
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.isRunning = false;
    logger.info('Stopped schedule reminder service');
  }

  /**
   * リマインダーのチェックと送信
   */
  private async checkAndSendReminders(): Promise<void> {
    try {
      logger.debug('Checking for schedules that need reminders');

      // リマインダー送信対象のスケジュールを取得
      const schedules = await ScheduleModel.getSchedulesForReminder();

      if (schedules.length === 0) {
        logger.debug('No schedules need reminders at this time');
        return;
      }

      logger.info(`Found ${schedules.length} schedules that need reminders`);

      // 各スケジュールに対してリマインダーを送信
      for (const schedule of schedules) {
        await this.sendReminder(schedule);
      }

    } catch (error) {
      logger.error('Error checking and sending reminders:', error);
    }
  }

  /**
   * 個別のリマインダー送信
   */
  private async sendReminder(schedule: Schedule): Promise<void> {
    try {
      const email = schedule.application?.company?.email;
      const companyName = schedule.application?.company?.name;

      if (!email) {
        logger.warn(`No email found for schedule ${schedule.id}`);
        await ScheduleModel.recordReminder(
          schedule.id,
          'email',
          'failed',
          'No email address found'
        );
        return;
      }

      // メール送信
      const subject = this.generateEmailSubject(schedule);
      const body = this.generateEmailBody(schedule, companyName);

      // EmailServiceがまだ実装されていない場合のモック
      logger.info(`Sending reminder email to ${email} for schedule ${schedule.id}`);
      logger.debug(`Subject: ${subject}`);
      logger.debug(`Body: ${body}`);

      // TODO: 実際のメール送信実装
      // await EmailService.send({
      //   to: email,
      //   subject,
      //   body,
      //   type: 'schedule_reminder'
      // });

      // 送信記録
      await ScheduleModel.recordReminder(
        schedule.id,
        'email',
        'sent'
      );

      logger.info(`Successfully sent reminder for schedule ${schedule.id}`);

    } catch (error) {
      logger.error(`Error sending reminder for schedule ${schedule.id}:`, error);
      
      await ScheduleModel.recordReminder(
        schedule.id,
        'email',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * メール件名の生成
   */
  private generateEmailSubject(schedule: Schedule): string {
    const typeLabels: Record<string, string> = {
      deadline: '締切',
      meeting: '面談',
      submission: '提出',
      review: '審査',
      notification: '通知'
    };

    const typeLabel = typeLabels[schedule.schedule_type] || schedule.schedule_type;
    return `【リマインダー】${typeLabel}: ${schedule.title}`;
  }

  /**
   * メール本文の生成
   */
  private generateEmailBody(schedule: Schedule, companyName?: string): string {
    const scheduledDate = new Date(schedule.scheduled_date);
    const dateStr = scheduledDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    const timeStr = scheduledDate.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let body = `${companyName || 'お客'} 様\n\n`;
    body += `以下のスケジュールについてリマインダーをお送りします。\n\n`;
    body += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    body += `■ ${schedule.title}\n`;
    body += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    body += `日時: ${dateStr} ${timeStr}\n`;
    
    if (schedule.location) {
      body += `場所: ${schedule.location}\n`;
    }
    
    if (schedule.description) {
      body += `\n詳細:\n${schedule.description}\n`;
    }

    body += `\n補助金: ${schedule.application?.subsidy?.name || '―'}\n`;
    body += `申請ステータス: ${this.getStatusLabel(schedule.application?.status)}\n`;

    body += `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    body += `このメールは自動送信されています。\n`;
    body += `IT補助金アシストツール\n`;

    return body;
  }

  /**
   * ステータスラベルの取得
   */
  private getStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      draft: '下書き',
      submitted: '提出済み',
      under_review: '審査中',
      approved: '承認済み',
      rejected: '却下',
      completed: '完了'
    };
    return status ? (labels[status] || status) : '―';
  }
}