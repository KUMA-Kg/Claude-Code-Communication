import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CollaborativeWorkspace } from './CollaborativeWorkspace';
import { ActivityFeed } from './ActivityFeed';
import { PresenceIndicators } from './PresenceIndicators';
import { WhiteboardCanvas } from './WhiteboardCanvas';
import { VideoChat } from './VideoChat';
import { useCollaboration } from '../../hooks/useCollaboration';
import { Button } from '../ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { 
  Users, 
  MessageSquare, 
  PenTool, 
  Video, 
  Activity,
  Settings,
  Share2
} from 'lucide-react';

export const CollaborationHub: React.FC = () => {
  const { subsidyId } = useParams<{ subsidyId: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('workspace');
  const [showVideoChat, setShowVideoChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    roomId,
    users,
    activities,
    isConnected,
    joinRoom,
    leaveRoom,
    sendCursorPosition,
    selectElement
  } = useCollaboration();

  useEffect(() => {
    if (subsidyId && user) {
      joinRoom(subsidyId, user);
    }

    return () => {
      if (roomId) {
        leaveRoom();
      }
    };
  }, [subsidyId, user]);

  const handleShare = async () => {
    if (roomId) {
      const shareUrl = `${window.location.origin}/collaborate/${roomId}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('コラボレーションリンクをコピーしました！');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">コラボレーションハブに接続中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">
              コラボレーションハブ
            </h1>
            <PresenceIndicators users={users} />
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVideoChat(!showVideoChat)}
              className="flex items-center gap-2"
            >
              <Video className="h-4 w-4" />
              ビデオ通話
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              共有
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Main Workspace */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="px-6 pt-4">
              <TabsTrigger value="workspace" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                ワークスペース
              </TabsTrigger>
              <TabsTrigger value="whiteboard" className="flex items-center gap-2">
                <PenTool className="h-4 w-4" />
                ホワイトボード
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                チャット
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workspace" className="flex-1 p-6">
              <CollaborativeWorkspace
                subsidyId={subsidyId!}
                users={users}
                onCursorMove={sendCursorPosition}
                onElementSelect={selectElement}
              />
            </TabsContent>

            <TabsContent value="whiteboard" className="flex-1 p-6">
              <WhiteboardCanvas
                roomId={roomId!}
                users={users}
              />
            </TabsContent>

            <TabsContent value="chat" className="flex-1 p-6">
              <div className="h-full bg-white rounded-lg shadow-sm p-4">
                <p className="text-gray-500">チャット機能は準備中です</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Activity Feed */}
        <div className="w-80 bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              アクティビティ
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ActivityFeed activities={activities} users={users} />
          </div>
        </div>
      </div>

      {/* Video Chat Overlay */}
      {showVideoChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px]">
            <VideoChat
              roomId={roomId!}
              users={users}
              onClose={() => setShowVideoChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};