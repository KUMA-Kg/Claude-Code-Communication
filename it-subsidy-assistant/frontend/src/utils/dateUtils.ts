// 日付関連のユーティリティ関数

/**
 * 相対的な時間表示（例: "3分前", "2時間前", "昨日"）
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return 'たった今';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分`;
  } else if (diffInHours < 24) {
    return `${diffInHours}時間`;
  } else if (diffInDays === 1) {
    return '昨日';
  } else if (diffInDays < 7) {
    return `${diffInDays}日`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}週間`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months}ヶ月`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `${years}年`;
  }
}

/**
 * 日付を読みやすい形式にフォーマット
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'full' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      // 2024/01/01
      return d.toLocaleDateString('ja-JP');
      
    case 'long':
      // 2024年1月1日
      return d.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
    case 'full':
      // 2024年1月1日 月曜日 14:30
      return d.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
      
    default:
      return d.toLocaleDateString('ja-JP');
  }
}

/**
 * 時刻を読みやすい形式にフォーマット
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 日時を読みやすい形式にフォーマット
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 期限までの残り時間を計算
 */
export function getTimeUntil(deadline: Date | string): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
} {
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const diffInMs = d.getTime() - now.getTime();
  
  if (diffInMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true };
  }
  
  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, isExpired: false };
}

/**
 * 営業日を考慮した日付計算
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    
    // 土日を除外
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }
  
  return result;
}

/**
 * 日付の妥当性チェック
 */
export function isValidDate(date: any): boolean {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}