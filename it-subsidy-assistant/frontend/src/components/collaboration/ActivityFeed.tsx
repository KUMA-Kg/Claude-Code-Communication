import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  LogIn, 
  LogOut, 
  Edit3, 
  MessageSquare, 
  PenTool, 
  StickyNote,
  User
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  color: string;
}

interface Activity {
  id: string;
  roomId: string;
  userId: string;
  type: 'join' | 'leave' | 'edit' | 'comment' | 'whiteboard' | 'annotation';
  description: string;
  timestamp: number;
  metadata?: any;
}

interface ActivityFeedProps {
  activities: Activity[];
  users: User[];
}

const activityIcons = {
  join: LogIn,
  leave: LogOut,
  edit: Edit3,
  comment: MessageSquare,
  whiteboard: PenTool,
  annotation: StickyNote
};

const activityColors = {
  join: 'text-green-600',
  leave: 'text-red-600',
  edit: 'text-blue-600',
  comment: 'text-purple-600',
  whiteboard: 'text-orange-600',
  annotation: 'text-yellow-600'
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, users }) => {
  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  return (
    <div className="space-y-3 p-4">
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          まだアクティビティがありません
        </div>
      ) : (
        activities.map(activity => {
          const user = getUserById(activity.userId);
          const Icon = activityIcons[activity.type];
          const colorClass = activityColors[activity.type];

          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`mt-1 ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900">
                  <span className="font-medium">
                    {user?.name || 'Unknown User'}
                  </span>
                  <span className="text-gray-600 ml-1">
                    {activity.description}
                  </span>
                </div>
                
                {activity.metadata && activity.type === 'comment' && (
                  <div className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    "{activity.metadata.text}"
                  </div>
                )}
                
                <div className="mt-1 text-xs text-gray-500">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                    locale: ja
                  })}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};