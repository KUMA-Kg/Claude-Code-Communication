import React from 'react';
import AIDocumentAssistant from '../components/AIDocumentAssistant';

const AIAssistantDemo: React.FC = () => {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* デモヘッダー */}
      <div style={{
        backgroundColor: '#8b5cf6',
        color: 'white',
        padding: '16px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>
          AI書類作成アシスタント デモ
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
          AIとの対話形式で簡単に補助金申請書を作成できます
        </p>
      </div>

      {/* 使い方ガイド */}
      <div style={{
        backgroundColor: '#f3e8ff',
        padding: '12px 24px',
        borderBottom: '1px solid #e9d5ff',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '20px' }}>💡</span>
        <div style={{ fontSize: '14px', color: '#6b21a8' }}>
          <strong>使い方:</strong> AIアシスタントの質問に答えていくだけで、申請書が自動的に作成されます。
          まずは補助金の種類を選択してください。
        </div>
      </div>

      {/* AIアシスタントコンポーネント */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <AIDocumentAssistant />
      </div>

      {/* 機能説明 */}
      <div style={{
        backgroundColor: 'white',
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        flexWrap: 'wrap'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>🤖</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>対話形式で入力</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>📄</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>リアルタイムプレビュー</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>✏️</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>いつでも修正可能</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>💾</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>複数形式でエクスポート</div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantDemo;