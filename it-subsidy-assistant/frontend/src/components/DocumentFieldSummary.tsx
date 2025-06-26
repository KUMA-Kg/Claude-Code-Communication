import React from 'react';
import { DocumentDataCollector } from '../utils/documentDataCollector';
import documentFieldSpecs from '../data/document-field-specifications.json';

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
      <div style={{ 
        padding: '16px',
        backgroundColor: '#fee2e2',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <p style={{ color: '#dc2626' }}>書類の仕様が見つかりません</p>
      </div>
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
    <div style={{
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      marginBottom: '24px'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: '600',
          marginBottom: '8px',
          color: '#1e293b'
        }}>
          {docSpec.document_name}
        </h3>
        <p style={{ 
          color: '#64748b',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          {docSpec.description}
        </p>
        
        {/* 完了率バー */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>入力完了率</span>
            <span style={{ 
              fontSize: '14px',
              fontWeight: '600',
              color: completionRate === 100 ? '#16a34a' : '#f59e0b'
            }}>
              {completionRate}%
            </span>
          </div>
          <div style={{
            height: '8px',
            backgroundColor: '#e2e8f0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${completionRate}%`,
              backgroundColor: completionRate === 100 ? '#16a34a' : '#f59e0b',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>
      
      {/* 必要フィールドの一覧 */}
      <div>
        <h4 style={{ 
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '12px',
          color: '#334155'
        }}>
          必要な情報
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {requiredFields.map(field => {
            const value = getFieldValue(field);
            const isMissing = missingFields.includes(field);
            
            return (
              <div 
                key={field}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: isMissing ? '#fef2f2' : '#f0fdf4',
                  borderRadius: '6px',
                  border: `1px solid ${isMissing ? '#fecaca' : '#bbf7d0'}`
                }}
              >
                <span style={{ 
                  fontSize: '14px',
                  color: '#475569',
                  fontWeight: '500'
                }}>
                  {getFieldLabel(field)}
                </span>
                <span style={{
                  fontSize: '14px',
                  color: isMissing ? '#dc2626' : '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {isMissing ? (
                    <>
                      <span style={{ fontSize: '16px' }}>❌</span>
                      未入力
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '16px' }}>✅</span>
                      {typeof value === 'boolean' ? (value ? 'はい' : 'いいえ') : 
                       Array.isArray(value) ? `${value.length}件` : 
                       value || '入力済み'}
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        
        {missingFields.length > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#fef3c7',
            borderRadius: '6px',
            border: '1px solid #fde68a'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#92400e',
              margin: 0
            }}>
              ⚠️ {missingFields.length}個の必須項目が未入力です
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentFieldSummary;