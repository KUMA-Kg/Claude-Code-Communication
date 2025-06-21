import { ScheduleInput } from '@/types/schedule';

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export function validateScheduleInput(data: ScheduleInput): ValidationResult {
  const errors: string[] = [];

  // 必須フィールドのチェック
  if (!data.application_id) {
    errors.push('Application ID is required');
  }

  if (!data.schedule_type) {
    errors.push('Schedule type is required');
  } else if (!['deadline', 'meeting', 'submission', 'review', 'notification'].includes(data.schedule_type)) {
    errors.push('Invalid schedule type');
  }

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (data.title.length > 255) {
    errors.push('Title must be 255 characters or less');
  }

  if (!data.scheduled_date) {
    errors.push('Scheduled date is required');
  } else {
    const date = new Date(data.scheduled_date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid scheduled date format');
    }
  }

  // オプションフィールドのバリデーション
  if (data.status && !['scheduled', 'completed', 'cancelled', 'postponed'].includes(data.status)) {
    errors.push('Invalid status');
  }

  if (data.location && data.location.length > 255) {
    errors.push('Location must be 255 characters or less');
  }

  if (data.reminder_minutes !== undefined) {
    if (typeof data.reminder_minutes !== 'number' || data.reminder_minutes < 0) {
      errors.push('Reminder minutes must be a positive number');
    } else if (data.reminder_minutes > 10080) { // 1週間以上
      errors.push('Reminder cannot be set more than 1 week in advance');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}