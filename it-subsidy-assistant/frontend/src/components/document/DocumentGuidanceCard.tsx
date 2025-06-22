import React from 'react';
import { MapPin, Clock, AlertCircle, FileText } from 'lucide-react';

interface DocumentInfo {
  name: string;
  icon: string;
  description: string;
  location: string;
  note?: string;
  processingTime?: string;
  fee?: string;
}

interface DocumentGuidanceCardProps {
  document: DocumentInfo;
  isChecked?: boolean;
  onCheck?: (checked: boolean) => void;
}

const DocumentGuidanceCard: React.FC<DocumentGuidanceCardProps> = ({
  document,
  isChecked = false,
  onCheck
}) => {
  return (
    <div className={`
      bg-white rounded-lg border-2 transition-all duration-200
      ${isChecked ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'}
      p-5 shadow-sm hover:shadow-md
    `}>
      <div className="flex items-start gap-4">
        {/* アイコン */}
        <div className="text-3xl flex-shrink-0">{document.icon}</div>
        
        {/* メインコンテンツ */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {document.name}
            </h3>
            {onCheck && (
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => onCheck(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            )}
          </div>
          
          {/* 説明 */}
          <p className="text-gray-600 text-sm mb-3">
            {document.description}
          </p>
          
          {/* 取得場所 */}
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              取得場所: {document.location}
            </span>
          </div>
          
          {/* 処理時間 */}
          {document.processingTime && (
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                処理時間: {document.processingTime}
              </span>
            </div>
          )}
          
          {/* 手数料 */}
          {document.fee && (
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800">
                手数料: {document.fee}
              </span>
            </div>
          )}
          
          {/* 注意事項 */}
          {document.note && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  {document.note}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentGuidanceCard;