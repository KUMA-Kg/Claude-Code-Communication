import React from 'react';
import { Clock, Heart, FileText, Search } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'search' | 'favorite' | 'document' | 'view';
  title: string;
  description: string;
  timestamp: string;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
  isLoading?: boolean;
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'search':
      return Search;
    case 'favorite':
      return Heart;
    case 'document':
      return FileText;
    case 'view':
      return Clock;
    default:
      return Clock;
  }
};

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'search':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
    case 'favorite':
      return 'text-red-600 bg-red-100 dark:bg-red-900';
    case 'document':
      return 'text-green-600 bg-green-100 dark:bg-green-900';
    case 'view':
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
  }
};

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities = [],
  isLoading = false,
}) => {
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'たった今';
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}時間前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}日前`;
    
    return time.toLocaleDateString('ja-JP');
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          最近のアクティビティ
        </h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const defaultActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'search',
      title: '補助金を検索',
      description: 'IT導入補助金で検索',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'favorite',
      title: 'お気に入りに追加',
      description: 'IT導入補助金2025をお気に入りに追加',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'document',
      title: '申請資料を作成',
      description: '事業計画書テンプレートで資料を生成',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        最近のアクティビティ
      </h3>
      
      {displayActivities.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">
            まだアクティビティがありません
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayActivities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            
            return (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {activity.description}
                  </p>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {formatTimeAgo(activity.timestamp)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};