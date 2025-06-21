export interface Schedule {
  id: string;
  application_id: string;
  schedule_type: 'deadline' | 'meeting' | 'submission' | 'review' | 'notification';
  title: string;
  description?: string;
  scheduled_date: string;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
  reminder_enabled: boolean;
  reminder_minutes: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  application?: {
    id: string;
    status: string;
    subsidy_id: string;
    company: {
      id: string;
      name: string;
      user_id: string;
    };
    subsidy: {
      id: string;
      name: string;
    };
  };
  reminders?: ScheduleReminder[];
}

export interface ScheduleInput {
  application_id: string;
  schedule_type: 'deadline' | 'meeting' | 'submission' | 'review' | 'notification';
  title: string;
  description?: string;
  scheduled_date: string;
  location?: string;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
  reminder_enabled?: boolean;
  reminder_minutes?: number;
}

export interface ScheduleReminder {
  id: string;
  schedule_id: string;
  reminder_type: 'email' | 'push' | 'in_app';
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface ScheduleFilters {
  applicationId?: string;
  scheduleType?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}