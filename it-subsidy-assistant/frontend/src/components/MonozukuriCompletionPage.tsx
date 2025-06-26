import React from 'react';
import { useNavigate } from 'react-router-dom';
import SubsidyFlowApp from './SubsidyFlowApp';

const MonozukuriCompletionPage: React.FC = () => {
  const navigate = useNavigate();

  // ものづくり補助金の申請フロー全体を表示
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      {/* AI申請書作成プロモーション */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '32px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '20px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>✨</span>
                かんたん10問でAI申請書作成
              </h3>
              <p style={{ margin: 0, fontSize: '15px', opacity: 0.95, lineHeight: '1.6' }}>
                質問に答えるだけで、専門知識不要！<br/>
                AIが最適な申請書を自動作成します。作成時間を<strong>90%削減</strong>できます。
              </p>
            </div>
            <button
              onClick={() => navigate('/minimal-form/monozukuri')}
              style={{
                padding: '12px 28px',
                backgroundColor: 'white',
                color: '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              今すぐ申請書を作成 →
            </button>
          </div>
        </div>

        {/* ページ説明 */}
        <div style={{ 
          backgroundColor: '#e0f2fe', 
          padding: '16px 20px', 
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #0284c7'
        }}>
          <p style={{ margin: 0, fontSize: '16px', color: '#0c4a6e' }}>
            📌 <strong>このページでは補助金提出までの工程・スケジュールの確認と補助金資料の作成ができるよ</strong>
          </p>
        </div>
      </div>
      
      <SubsidyFlowApp />
    </div>
  );
};

export default MonozukuriCompletionPage;