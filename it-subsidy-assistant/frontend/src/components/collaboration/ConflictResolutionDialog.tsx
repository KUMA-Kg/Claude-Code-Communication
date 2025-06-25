import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { 
  GitBranch, 
  AlertTriangle, 
  CheckCircle, 
  X,
  User,
  Clock,
  FileText,
  Merge
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Conflict {
  id: string;
  subsidyId: string;
  baseVersion: number;
  conflictingChanges: ConflictingChange[];
  timestamp: number;
}

interface ConflictingChange {
  userId: string;
  userName?: string;
  version: number;
  changes: any;
  timestamp: number;
}

interface ConflictResolutionDialogProps {
  conflict: Conflict;
  onResolve: (resolution: 'keep-mine' | 'keep-theirs' | 'merge', mergedContent?: any) => void;
  onCancel: () => void;
}

export const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  conflict,
  onResolve,
  onCancel
}) => {
  const [selectedResolution, setSelectedResolution] = useState<'keep-mine' | 'keep-theirs' | 'merge' | null>(null);
  const [showDiff, setShowDiff] = useState(true);
  const [mergedContent, setMergedContent] = useState<any>(null);

  const myChanges = conflict.conflictingChanges[1];
  const theirChanges = conflict.conflictingChanges[0];

  const renderChanges = (changes: any) => {
    if (typeof changes === 'object') {
      return (
        <pre className="text-sm bg-gray-50 p-3 rounded overflow-auto max-h-60">
          {JSON.stringify(changes, null, 2)}
        </pre>
      );
    }
    return <p className="text-sm text-gray-600">{changes}</p>;
  };

  const handleResolve = () => {
    if (!selectedResolution) return;

    if (selectedResolution === 'merge' && !mergedContent) {
      alert('マージ内容を入力してください');
      return;
    }

    onResolve(selectedResolution, mergedContent);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b bg-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    変更の競合が発生しました
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    同じ箇所に対する変更が検出されました。解決方法を選択してください。
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Version Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <GitBranch className="h-4 w-4" />
                <span>ベースバージョン: {conflict.baseVersion}</span>
                <span className="mx-2">•</span>
                <Clock className="h-4 w-4" />
                <span>
                  {formatDistanceToNow(new Date(conflict.timestamp), {
                    addSuffix: true,
                    locale: ja
                  })}
                </span>
              </div>
            </div>

            {/* Changes Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Their Changes */}
              <Card className={`p-4 ${selectedResolution === 'keep-theirs' ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <h3 className="font-semibold">
                      {theirChanges.userName || '他のユーザー'}の変更
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500">
                    バージョン {theirChanges.version}
                  </span>
                </div>
                
                <div className="mb-4">
                  {renderChanges(theirChanges.changes)}
                </div>

                <Button
                  variant={selectedResolution === 'keep-theirs' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedResolution('keep-theirs')}
                >
                  この変更を採用
                </Button>
              </Card>

              {/* My Changes */}
              <Card className={`p-4 ${selectedResolution === 'keep-mine' ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold">自分の変更</h3>
                  </div>
                  <span className="text-xs text-gray-500">
                    バージョン {myChanges.version}
                  </span>
                </div>
                
                <div className="mb-4">
                  {renderChanges(myChanges.changes)}
                </div>

                <Button
                  variant={selectedResolution === 'keep-mine' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedResolution('keep-mine')}
                >
                  この変更を採用
                </Button>
              </Card>
            </div>

            {/* Manual Merge Option */}
            <Card className={`p-4 ${selectedResolution === 'merge' ? 'ring-2 ring-green-500' : ''}`}>
              <div className="flex items-center gap-2 mb-4">
                <Merge className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold">手動でマージ</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                両方の変更を組み合わせて、新しい内容を作成します
              </p>

              {selectedResolution === 'merge' && (
                <textarea
                  className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
                  placeholder="マージした内容を入力してください..."
                  onChange={(e) => setMergedContent(e.target.value)}
                />
              )}

              <Button
                variant={selectedResolution === 'merge' ? 'default' : 'outline'}
                size="sm"
                className="w-full"
                onClick={() => setSelectedResolution('merge')}
              >
                手動でマージする
              </Button>
            </Card>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>競合を解決すると、新しいバージョンが作成されます</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onCancel}
                >
                  キャンセル
                </Button>
                <Button
                  variant="default"
                  onClick={handleResolve}
                  disabled={!selectedResolution}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  解決を確定
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};