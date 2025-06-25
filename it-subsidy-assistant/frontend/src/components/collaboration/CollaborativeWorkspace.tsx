import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useCollaboration } from '../../hooks/useCollaboration';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  MessageSquare, 
  Edit3, 
  Save, 
  Lock, 
  Unlock,
  AlertCircle
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  color: string;
  cursor?: { x: number; y: number };
  activeElement?: string;
}

interface CollaborativeWorkspaceProps {
  subsidyId: string;
  users: User[];
  onCursorMove: (cursor: { x: number; y: number }) => void;
  onElementSelect: (elementId: string) => void;
}

interface Section {
  id: string;
  title: string;
  content: string;
  locked: boolean;
  lockedBy?: string;
}

export const CollaborativeWorkspace: React.FC<CollaborativeWorkspaceProps> = ({
  subsidyId,
  users,
  onCursorMove,
  onElementSelect
}) => {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const { sendDocumentChange, addAnnotation } = useCollaboration();
  
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'overview',
      title: '事業概要',
      content: '',
      locked: false
    },
    {
      id: 'objectives',
      title: '事業目的',
      content: '',
      locked: false
    },
    {
      id: 'implementation',
      title: '実施計画',
      content: '',
      locked: false
    },
    {
      id: 'budget',
      title: '予算計画',
      content: '',
      locked: false
    }
  ]);

  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!workspaceRef.current) return;
      
      const rect = workspaceRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      onCursorMove({ x, y });
    };

    const workspace = workspaceRef.current;
    if (workspace) {
      workspace.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (workspace) {
        workspace.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [onCursorMove]);

  const handleSectionClick = (sectionId: string) => {
    onElementSelect(sectionId);
    
    // Check if section is locked by another user
    const section = sections.find(s => s.id === sectionId);
    const lockedByOther = section?.locked && section.lockedBy !== 'current-user';
    
    if (!lockedByOther) {
      setEditingSection(sectionId);
      // Lock the section
      setSections(prev => prev.map(s => 
        s.id === sectionId 
          ? { ...s, locked: true, lockedBy: 'current-user' }
          : s
      ));
    }
  };

  const handleSave = (sectionId: string, newContent: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId 
        ? { ...s, content: newContent, locked: false, lockedBy: undefined }
        : s
    ));
    setEditingSection(null);
    
    // Send change to server
    sendDocumentChange({
      type: 'section-update',
      sectionId,
      content: newContent
    });
  };

  const handleAddComment = (sectionId: string, comment: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    addAnnotation({
      userId: 'current-user',
      elementId: sectionId,
      text: comment,
      position: { x: 0, y: 0 }
    });
  };

  return (
    <div 
      ref={workspaceRef}
      className="relative space-y-6 p-4 bg-gray-50 rounded-lg min-h-[600px]"
    >
      {/* Other users' cursors */}
      {users.filter(u => u.cursor).map(user => (
        <motion.div
          key={user.id}
          className="absolute pointer-events-none z-50"
          style={{
            left: `${user.cursor!.x}%`,
            top: `${user.cursor!.y}%`,
          }}
          animate={{
            left: `${user.cursor!.x}%`,
            top: `${user.cursor!.y}%`,
          }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
        >
          <div className="relative">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
            >
              <path
                d="M5.5 3.5L19.5 12L12 12L12 19.5L5.5 3.5Z"
                fill={user.color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>
            <div 
              className="absolute top-5 left-6 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Sections */}
      {sections.map(section => {
        const isEditing = editingSection === section.id;
        const lockedByOther = section.locked && section.lockedBy !== 'current-user';
        const activeUser = users.find(u => u.activeElement === section.id);

        return (
          <Card 
            key={section.id}
            className={`p-6 transition-all ${
              activeUser ? 'ring-2' : ''
            } ${lockedByOther ? 'opacity-75' : ''}`}
            style={{
              borderColor: activeUser?.color,
              boxShadow: activeUser ? `0 0 0 2px ${activeUser.color}20` : undefined
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {section.title}
                {section.locked && (
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    {lockedByOther ? (
                      <>
                        <Lock className="h-3 w-3" />
                        編集中: {users.find(u => u.id === section.lockedBy)?.name}
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3 w-3" />
                        編集中
                      </>
                    )}
                  </span>
                )}
              </h3>
              
              <div className="flex items-center gap-2">
                {!isEditing && !lockedByOther && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSectionClick(section.id)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const comment = prompt('コメントを入力してください');
                    if (comment) {
                      handleAddComment(section.id, comment);
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  defaultValue={section.content}
                  autoFocus
                  onBlur={(e) => handleSave(section.id, e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      const textarea = e.currentTarget.parentElement?.parentElement?.querySelector('textarea');
                      if (textarea) {
                        handleSave(section.id, textarea.value);
                      }
                    }}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    保存
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-gray-700 whitespace-pre-wrap">
                {section.content || (
                  <span className="text-gray-400 italic">
                    クリックして編集を開始
                  </span>
                )}
              </div>
            )}

            {lockedByOther && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  このセクションは{users.find(u => u.id === section.lockedBy)?.name}が編集中です
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};