import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import {
  Users,
  Circle,
  MousePointer,
  MessageCircle,
  Bell,
  UserPlus,
  UserMinus,
  Edit3,
  Save,
  Eye,
  Sparkles
} from 'lucide-react';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Badge } from '@/components/ui/badge';
// import { Card } from '@/components/ui/card';
// import { useToast } from '@/components/ui/use-toast';
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from '@/components/ui/tooltip';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  isTyping?: boolean;
  currentBlock?: string;
}

interface CollaborationEvent {
  type: 'join' | 'leave' | 'edit' | 'cursor' | 'typing' | 'save';
  userId: string;
  data?: any;
  timestamp: number;
}

interface RealtimeCollaborationProps {
  documentId: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  onUserActivity?: (event: CollaborationEvent) => void;
}

export const RealtimeCollaboration: React.FC<RealtimeCollaborationProps> = ({
  documentId,
  currentUser,
  onUserActivity,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<Map<string, User>>(new Map());
  const [recentActivities, setRecentActivities] = useState<CollaborationEvent[]>([]);
  const [showActivity, setShowActivity] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  // const { toast } = useToast();
  const toast = (message: any) => console.log('Toast:', message);
  const cursorTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const userColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        documentId,
        user: currentUser,
      },
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      toast({
        title: 'リアルタイム接続確立',
        description: '他のユーザーとの共同編集が可能になりました',
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Handle user events
    newSocket.on('user:joined', (user: User) => {
      setActiveUsers(prev => new Map(prev).set(user.id, user));
      addActivity({ type: 'join', userId: user.id, timestamp: Date.now() });
      
      if (user.id !== currentUser.id) {
        toast({
          title: `${user.name}が参加しました`,
          description: '共同編集を開始します',
        });
      }
    });

    newSocket.on('user:left', (userId: string) => {
      setActiveUsers(prev => {
        const newMap = new Map(prev);
        const user = newMap.get(userId);
        if (user) {
          addActivity({ type: 'leave', userId, timestamp: Date.now() });
          toast({
            title: `${user.name}が退出しました`,
          });
        }
        newMap.delete(userId);
        return newMap;
      });
    });

    newSocket.on('user:cursor', ({ userId, cursor }: { userId: string; cursor: { x: number; y: number } }) => {
      setActiveUsers(prev => {
        const newMap = new Map(prev);
        const user = newMap.get(userId);
        if (user) {
          newMap.set(userId, { ...user, cursor });
        }
        return newMap;
      });

      // Auto-hide cursor after inactivity
      const existingTimeout = cursorTimeoutRef.current.get(userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      const timeout = setTimeout(() => {
        setActiveUsers(prev => {
          const newMap = new Map(prev);
          const user = newMap.get(userId);
          if (user) {
            newMap.set(userId, { ...user, cursor: undefined });
          }
          return newMap;
        });
      }, 5000);
      cursorTimeoutRef.current.set(userId, timeout);
    });

    newSocket.on('user:typing', ({ userId, blockId, isTyping }: { userId: string; blockId?: string; isTyping: boolean }) => {
      setActiveUsers(prev => {
        const newMap = new Map(prev);
        const user = newMap.get(userId);
        if (user) {
          newMap.set(userId, { ...user, isTyping, currentBlock: blockId });
        }
        return newMap;
      });
    });

    newSocket.on('document:updated', ({ userId, changes }: { userId: string; changes: any }) => {
      addActivity({ type: 'edit', userId, data: changes, timestamp: Date.now() });
    });

    newSocket.on('users:list', (users: User[]) => {
      const userMap = new Map<string, User>();
      users.forEach(user => {
        user.color = userColors[userMap.size % userColors.length];
        userMap.set(user.id, user);
      });
      setActiveUsers(userMap);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [documentId, currentUser, toast]);

  // Send cursor position
  const sendCursorPosition = useCallback((x: number, y: number) => {
    if (socket && isConnected) {
      socket.emit('cursor:move', { x, y });
    }
  }, [socket, isConnected]);

  // Send typing status
  const sendTypingStatus = useCallback((isTyping: boolean, blockId?: string) => {
    if (socket && isConnected) {
      socket.emit('typing:status', { isTyping, blockId });
    }
  }, [socket, isConnected]);

  // Add activity to recent list
  const addActivity = (event: CollaborationEvent) => {
    setRecentActivities(prev => [event, ...prev].slice(0, 10));
    onUserActivity?.(event);
  };

  // Handle mouse move for cursor tracking
  useEffect(() => {
    let lastSent = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSent > 50) { // Throttle to 20fps
        sendCursorPosition(e.clientX, e.clientY);
        lastSent = now;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [sendCursorPosition]);

  // Format activity message
  const formatActivity = (activity: CollaborationEvent, user?: User) => {
    if (!user) return null;
    
    switch (activity.type) {
      case 'join':
        return `${user.name}が参加しました`;
      case 'leave':
        return `${user.name}が退出しました`;
      case 'edit':
        return `${user.name}が編集中`;
      case 'save':
        return `${user.name}が保存しました`;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Active users indicator */}
      <div className="fixed top-4 right-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-2"
        >
          {/* Connection status */}
          <div title={isConnected ? 'オンライン' : 'オフライン'}>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          </div>

          {/* Active users */}
          <div className="flex -space-x-2">
            <AnimatePresence>
              {Array.from(activeUsers.values()).slice(0, 5).map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    title={`${user.name}${user.isTyping ? ' (編集中...)' : ''}`}
                    className="relative"
                  >
                    <div 
                      className="h-8 w-8 border-2 border-white rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    {user.isTyping && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1"
                      >
                        <Edit3 className="h-3 w-3 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {activeUsers.size > 5 && (
              <Avatar className="h-8 w-8 border-2 border-white bg-gray-300">
                <AvatarFallback>+{activeUsers.size - 5}</AvatarFallback>
              </Avatar>
            )}
          </div>

          {/* Activity button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowActivity(!showActivity)}
            className="relative p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <Bell className="h-5 w-5 text-gray-700" />
            {recentActivities.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {recentActivities.length}
              </span>
            )}
          </motion.button>
        </motion.div>
      </div>

      {/* Other users' cursors */}
      <AnimatePresence>
        {Array.from(activeUsers.values()).map(user => {
          if (user.id === currentUser.id || !user.cursor) return null;
          
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed pointer-events-none z-40"
              style={{
                left: user.cursor.x,
                top: user.cursor.y,
              }}
            >
              <div className="relative">
                <MousePointer
                  className="h-6 w-6"
                  style={{ color: user.color }}
                  fill={user.color}
                />
                <span
                  className="absolute top-6 left-2 text-xs font-medium px-2 py-1 rounded text-white whitespace-nowrap"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Activity panel */}
      <AnimatePresence>
        {showActivity && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-20 right-4 z-40 w-80"
          >
            <div className="p-4 shadow-xl bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                  リアルタイムアクティビティ
                </h3>
                <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">{activeUsers.size}人</span>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentActivities.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    まだアクティビティはありません
                  </p>
                ) : (
                  recentActivities.map((activity, index) => {
                    const user = activeUsers.get(activity.userId);
                    const message = formatActivity(activity, user);
                    if (!message) return null;
                    
                    return (
                      <motion.div
                        key={`${activity.userId}-${activity.timestamp}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start space-x-2 p-2 rounded-lg hover:bg-gray-50"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user?.avatar} />
                          <AvatarFallback style={{ backgroundColor: user?.color }}>
                            {user?.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm">{message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        {activity.type === 'join' && <UserPlus className="h-4 w-4 text-green-500" />}
                        {activity.type === 'leave' && <UserMinus className="h-4 w-4 text-red-500" />}
                        {activity.type === 'edit' && <Edit3 className="h-4 w-4 text-blue-500" />}
                        {activity.type === 'save' && <Save className="h-4 w-4 text-purple-500" />}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing indicators */}
      <AnimatePresence>
        {Array.from(activeUsers.values()).map(user => {
          if (user.id === currentUser.id || !user.isTyping || !user.currentBlock) return null;
          
          return (
            <motion.div
              key={`typing-${user.id}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed bottom-4 left-4 z-40"
            >
              <div
                className="flex items-center space-x-2 px-3 py-2 rounded-full text-white text-sm"
                style={{ backgroundColor: user.color }}
              >
                <div className="flex space-x-1">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                </div>
                <span>{user.name}が入力中...</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </>
  );
};