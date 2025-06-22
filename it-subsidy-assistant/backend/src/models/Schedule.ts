import { supabase } from '@/config/supabase';
import { Schedule, ScheduleInput, ScheduleReminder } from '@/types/schedule';

export class ScheduleModel {
  /**
   * スケジュールの作成
   */
  static async create(userId: string, scheduleData: ScheduleInput): Promise<Schedule> {
    // 申請が存在し、ユーザーがアクセス権を持っているか確認
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, company_id')
      .eq('id', scheduleData.application_id)
      .single();

    if (appError || !application) {
      throw new Error('Application not found or access denied');
    }

    // 企業がユーザーに属しているか確認
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', application.company_id)
      .eq('user_id', userId)
      .single();

    if (companyError || !company) {
      throw new Error('Access denied to this application');
    }

    const { data: schedule, error } = await supabase
      .from('schedules')
      .insert([{
        ...scheduleData,
        created_by: userId
      }])
      .select()
      .single();

    if (error) throw error;
    return schedule;
  }

  /**
   * スケジュール一覧の取得
   */
  static async findByUser(
    userId: string,
    filters?: {
      applicationId?: string;
      scheduleType?: string;
      status?: string;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<Schedule[]> {
    let query = supabase
      .from('schedules')
      .select(`
        *,
        application:applications!inner(
          id,
          status,
          subsidy_id,
          company:companies!inner(
            id,
            name,
            user_id
          ),
          subsidy:subsidies(
            id,
            name
          )
        )
      `)
      .eq('application.company.user_id', userId)
      .order('scheduled_date', { ascending: true });

    // フィルタ条件の適用
    if (filters?.applicationId) {
      query = query.eq('application_id', filters.applicationId);
    }
    if (filters?.scheduleType) {
      query = query.eq('schedule_type', filters.scheduleType);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.fromDate) {
      query = query.gte('scheduled_date', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.lte('scheduled_date', filters.toDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * スケジュール詳細の取得
   */
  static async findById(userId: string, scheduleId: string): Promise<Schedule | null> {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        application:applications!inner(
          id,
          status,
          subsidy_id,
          company:companies!inner(
            id,
            name,
            user_id
          ),
          subsidy:subsidies(
            id,
            name
          )
        ),
        reminders:schedule_reminders(
          id,
          reminder_type,
          sent_at,
          status,
          error_message,
          created_at
        )
      `)
      .eq('id', scheduleId)
      .eq('application.company.user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * スケジュールの更新
   */
  static async update(
    userId: string,
    scheduleId: string,
    updateData: Partial<ScheduleInput>
  ): Promise<Schedule> {
    // 更新権限の確認
    const existing = await this.findById(userId, scheduleId);
    if (!existing || existing.created_by !== userId) {
      throw new Error('Schedule not found or access denied');
    }

    const { data: updated, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }

  /**
   * スケジュールの削除
   */
  static async delete(userId: string, scheduleId: string): Promise<void> {
    // 削除権限の確認
    const existing = await this.findById(userId, scheduleId);
    if (!existing || existing.created_by !== userId) {
      throw new Error('Schedule not found or access denied');
    }

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) throw error;
  }

  /**
   * 今後のスケジュールの取得（ダッシュボード用）
   */
  static async getUpcoming(
    userId: string,
    limit: number = 10
  ): Promise<Schedule[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        application:applications!inner(
          id,
          status,
          company:companies!inner(
            id,
            name,
            user_id
          ),
          subsidy:subsidies(
            name
          )
        )
      `)
      .eq('application.company.user_id', userId)
      .gte('scheduled_date', now)
      .eq('status', 'scheduled')
      .order('scheduled_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * リマインダーの送信記録
   */
  static async recordReminder(
    scheduleId: string,
    reminderType: string,
    status: string,
    errorMessage?: string
  ): Promise<ScheduleReminder> {
    const { data, error } = await supabase
      .from('schedule_reminders')
      .insert([{
        schedule_id: scheduleId,
        reminder_type: reminderType,
        status,
        error_message: errorMessage,
        sent_at: status === 'sent' ? new Date().toISOString() : undefined
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * リマインダー送信対象のスケジュール取得
   */
  static async getSchedulesForReminder(): Promise<Schedule[]> {
    const now = new Date();
    
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        application:applications(
          id,
          company:companies(
            email,
            name
          )
        ),
        reminders:schedule_reminders(
          id,
          status
        )
      `)
      .eq('status', 'scheduled')
      .eq('reminder_enabled', true)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    // リマインダー送信時刻に達したスケジュールをフィルタリング
    return (data || []).filter(schedule => {
      const scheduleDate = new Date(schedule.scheduled_date);
      const reminderTime = new Date(scheduleDate.getTime() - schedule.reminder_minutes * 60 * 1000);
      
      // まだリマインダーが送信されていない
      const notSent = !schedule.reminders?.some((r: any) => r.status === 'sent');
      
      // リマインダー送信時刻に達している
      const timeReached = reminderTime <= now;
      
      return notSent && timeReached;
    });
  }
}