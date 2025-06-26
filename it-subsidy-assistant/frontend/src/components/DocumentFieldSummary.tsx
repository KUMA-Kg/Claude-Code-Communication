import React from 'react';
import { DocumentDataCollector } from '../utils/documentDataCollector';
import documentFieldSpecs from '../data/document-field-specifications.json';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface DocumentFieldSummaryProps {
  subsidyType: string;
  documentId: string;
  companyData: any;
  questionnaireData: any;
}

const DocumentFieldSummary: React.FC<DocumentFieldSummaryProps> = ({
  subsidyType,
  documentId,
  companyData,
  questionnaireData
}) => {
  const collector = new DocumentDataCollector();
  const specs = documentFieldSpecs.document_field_specifications;
  
  // 必要なフィールドを取得
  const requiredFields = collector.getRequiredFields(subsidyType, documentId);
  const missingFields = collector.getMissingFields(subsidyType, documentId, companyData, questionnaireData);
  
  // 書類の仕様を取得
  const subsidyInfo = specs[subsidyType];
  const docSpec = subsidyInfo?.documents?.[documentId];
  
  if (!docSpec) {
    return (
      <Alert className="mb-4 border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-600">
          書類の仕様が見つかりません
        </AlertDescription>
      </Alert>
    );
  }
  
  // フィールドのラベルマッピング
  const fieldLabels: { [key: string]: string } = {
    companyName: '法人名',
    representativeName: '代表者氏名',
    corporateNumber: '法人番号',
    invoiceNumber: 'インボイス番号',
    projectName: '事業計画名',
    currentAverageWage: '現在の平均賃金',
    wageIncreaseRate: '賃上げ率',
    chamberName: '商工会議所名',
    postalCode: '郵便番号',
    address: '住所',
    phoneNumber: '電話番号',
    email: 'メールアドレス',
    applicationFrame: '申請枠',
    businessType: '事業形態',
    // 追加のフィールドラベル
  };
  
  const getFieldLabel = (fieldName: string): string => {
    return fieldLabels[fieldName] || fieldName;
  };
  
  const getFieldValue = (fieldName: string): any => {
    // companyDataから値を取得
    if (companyData[fieldName] !== undefined) {
      return companyData[fieldName];
    }
    // questionnaireDataから値を取得
    if (questionnaireData[fieldName] !== undefined) {
      return questionnaireData[fieldName];
    }
    return null;
  };
  
  const completionRate = requiredFields.length > 0 
    ? Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100)
    : 0;
  
  return (
    <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl text-slate-800">
          {docSpec.document_name}
        </CardTitle>
        <CardDescription className="text-sm text-slate-600 mt-1">
          {docSpec.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 完了率セクション */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">入力完了率</span>
            <Badge 
              variant="secondary"
              className={`font-semibold ${
                completionRate === 100 
                  ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                  : 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'
              }`}
            >
              {completionRate}%
            </Badge>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full transition-all duration-300 ${
                completionRate === 100 ? 'bg-green-500' : 'bg-amber-500'
              }`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      
        {/* 必要フィールドの一覧 */}
        <div>
          <h4 className="text-base font-semibold text-slate-700 mb-3">
            必要な情報
          </h4>
          
          <div className="space-y-2">
            {requiredFields.map(field => {
              const value = getFieldValue(field);
              const isMissing = missingFields.includes(field);
              
              return (
                <div 
                  key={field}
                  className={`flex justify-between items-center p-3 rounded-lg border transition-all ${
                    isMissing 
                      ? 'bg-red-50 border-red-200 hover:border-red-300' 
                      : 'bg-green-50 border-green-200 hover:border-green-300'
                  }`}
                >
                  <span className="text-sm font-medium text-slate-700">
                    {getFieldLabel(field)}
                  </span>
                  <div className="flex items-center gap-2">
                    {isMissing ? (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600 font-medium">未入力</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-700 font-medium">
                          {typeof value === 'boolean' ? (value ? 'はい' : 'いいえ') : 
                           Array.isArray(value) ? `${value.length}件` : 
                           value || '入力済み'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        
          {missingFields.length > 0 && (
            <Alert className="mt-4 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                {missingFields.length}個の必須項目が未入力です
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentFieldSummary;