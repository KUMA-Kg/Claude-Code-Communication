import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SubsidyFlowApp from './SubsidyFlowApp';
import MonozukuriDataForm from './MonozukuriDataForm';
import { DocumentGenerator } from '../utils/documentGenerator';
import { Download, FileText, CheckCircle } from 'lucide-react';

const MonozukuriCompletionPage: React.FC = () => {
  const navigate = useNavigate();
  const [showDataForm, setShowDataForm] = useState(false);
  const [hasCompletedData, setHasCompletedData] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [monozukuriData, setMonozukuriData] = useState<any>(null);

  useEffect(() => {
    // 既存のデータをチェック
    const savedData = localStorage.getItem('monozukuriData');
    if (savedData) {
      setMonozukuriData(JSON.parse(savedData));
      setHasCompletedData(true);
    }
  }, []);

  const handleDataFormComplete = (data: any) => {
    setMonozukuriData(data);
    setHasCompletedData(true);
    setShowDataForm(false);
  };

  const handleGenerateDocuments = async () => {
    setIsGenerating(true);
    
    try {
      // 既存のプロファイルデータを取得
      const profileData = localStorage.getItem('applicantProfile');
      const companyData = profileData ? JSON.parse(profileData) : {};
      
      // MonozukuriDataFormで収集したデータとマージ
      const completeData = {
        ...companyData,
        ...monozukuriData
      };

      // 文書生成
      const generator = new DocumentGenerator();
      const documentIds = [
        'hojo_taisho_keihi_seiyaku',
        'chingin_hikiage_seiyaku',
        'rodosha_meibo',
        'ofuku_chingin_keikaku'
      ];
      
      await generator.generateExcel(
        'monozukuri',
        documentIds,
        {}, // formDataは空（新しい方式を使用）
        completeData,
        {} // questionnaireDataは空
      );
      
      alert('書類の生成が完了しました！');
    } catch (error) {
      console.error('Document generation error:', error);
      alert('書類生成中にエラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  if (showDataForm) {
    return <MonozukuriDataForm onComplete={handleDataFormComplete} initialData={monozukuriData} />;
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      {/* ヘッダー */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '24px 0',
        marginBottom: '32px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#2d3748' }}>
            ものづくり補助金 申請書類作成
          </h1>
          <p style={{ fontSize: '16px', color: '#718096', marginTop: '8px' }}>
            必要な情報を入力して、申請書類を自動生成します
          </p>
        </div>
      </div>

      {/* データ入力状況 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 32px', padding: '0 24px' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {hasCompletedData ? (
                <CheckCircle size={32} style={{ color: '#48bb78' }} />
              ) : (
                <FileText size={32} style={{ color: '#a0aec0' }} />
              )}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748' }}>
                  補助金申請データ
                </h3>
                <p style={{ fontSize: '14px', color: '#718096', marginTop: '4px' }}>
                  {hasCompletedData 
                    ? '必要なデータが入力されています' 
                    : 'まだデータが入力されていません'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowDataForm(true)}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                color: hasCompletedData ? '#667eea' : 'white',
                background: hasCompletedData ? 'white' : '#667eea',
                border: hasCompletedData ? '2px solid #667eea' : 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {hasCompletedData ? 'データを編集' : 'データを入力'}
            </button>
          </div>

          {hasCompletedData && monozukuriData && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: '#f7fafc',
              borderRadius: '8px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#4a5568', marginBottom: '12px' }}>
                入力済みデータ概要
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#718096' }}>プロジェクト名: </span>
                  <span style={{ color: '#2d3748', fontWeight: '500' }}>{monozukuriData.projectName}</span>
                </div>
                <div>
                  <span style={{ color: '#718096' }}>従業員数: </span>
                  <span style={{ color: '#2d3748', fontWeight: '500' }}>{monozukuriData.employees?.length || 0}名</span>
                </div>
                <div>
                  <span style={{ color: '#718096' }}>賃金引上げ額: </span>
                  <span style={{ color: '#2d3748', fontWeight: '500' }}>{monozukuriData.wageIncreaseAmount}円</span>
                </div>
                <div>
                  <span style={{ color: '#718096' }}>経費項目数: </span>
                  <span style={{ color: '#2d3748', fontWeight: '500' }}>{monozukuriData.expenseBreakdown?.length || 0}件</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 書類生成ボタン */}
      {hasCompletedData && (
        <div style={{ maxWidth: '1200px', margin: '0 auto 32px', padding: '0 24px' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748', marginBottom: '16px' }}>
              申請書類を生成
            </h3>
            <p style={{ fontSize: '14px', color: '#718096', marginBottom: '24px' }}>
              入力されたデータを基に、以下の書類を自動生成します：
            </p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '12px',
              maxWidth: '600px',
              margin: '0 auto 24px'
            }}>
              <div style={{ 
                padding: '12px', 
                background: '#f7fafc', 
                borderRadius: '8px',
                fontSize: '14px',
                color: '#4a5568'
              }}>
                補助対象経費誓約書【様式1】
              </div>
              <div style={{ 
                padding: '12px', 
                background: '#f7fafc', 
                borderRadius: '8px',
                fontSize: '14px',
                color: '#4a5568'
              }}>
                賃金引上げ計画の誓約書【様式2】
              </div>
              <div style={{ 
                padding: '12px', 
                background: '#f7fafc', 
                borderRadius: '8px',
                fontSize: '14px',
                color: '#4a5568'
              }}>
                労働者名簿
              </div>
              <div style={{ 
                padding: '12px', 
                background: '#f7fafc', 
                borderRadius: '8px',
                fontSize: '14px',
                color: '#4a5568'
              }}>
                大幅賃上げ計画書【様式4】
              </div>
            </div>
            
            <button
              onClick={handleGenerateDocuments}
              disabled={isGenerating}
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                background: isGenerating ? '#a0aec0' : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                border: 'none',
                borderRadius: '8px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(72, 187, 120, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download size={20} />
              {isGenerating ? 'Excel生成中...' : 'Excel書類をダウンロード'}
            </button>
          </div>
        </div>
      )}

      {/* 通常のフロー */}
      <div style={{ display: hasCompletedData ? 'none' : 'block' }}>
        <SubsidyFlowApp />
      </div>
    </div>
  );
};

export default MonozukuriCompletionPage;