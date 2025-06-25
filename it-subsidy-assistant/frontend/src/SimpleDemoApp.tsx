import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';

// シンプルなホームページ
const HomePage = () => (
  <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
    <h1 style={{ fontSize: '32px', marginBottom: '24px', textAlign: 'center' }}>
      IT補助金アシスタント - 革新的機能デモ
    </h1>
    
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
      gap: '24px',
      marginTop: '48px'
    }}>
      <DemoCard
        emoji="🎯"
        title="Visual AI Navigator"
        description="3D空間での直感的な補助金選択体験"
        path="/visual-navigator"
        color="#3b82f6"
      />
      <DemoCard
        emoji="🎨"
        title="Document Magic Studio"
        description="ドラッグ&ドロップで90%時間削減"
        path="/document-magic"
        color="#ec4899"
      />
      <DemoCard
        emoji="⚛️"
        title="Quantum Matching Engine"
        description="量子コンピューティング概念による99%精度マッチング"
        path="/quantum-matching"
        color="#06b6d4"
      />
      <DemoCard
        emoji="🔐"
        title="AI Biometric Auth"
        description="パスワードレスの未来型認証"
        path="/biometric-auth"
        color="#8b5cf6"
      />
    </div>
  </div>
);

// デモカードコンポーネント
const DemoCard = ({ emoji, title, description, path, color }: any) => (
  <Link to={path} style={{ textDecoration: 'none' }}>
    <div
      style={{
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s',
        border: '2px solid transparent',
        textAlign: 'center'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'transparent';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{emoji}</div>
      <h3 style={{ fontSize: '20px', marginBottom: '12px', color }}>{title}</h3>
      <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
        {description}
      </p>
    </div>
  </Link>
);

// 各デモページ（シンプル版）
const VisualNavigatorPage = () => (
  <DemoPageLayout title="Visual AI Navigator" emoji="🎯">
    <p>3D補助金選択体験のデモページです。</p>
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#f3f4f6', 
      borderRadius: '8px',
      textAlign: 'center',
      marginTop: '20px' 
    }}>
      <p>🚀 React Three Fiberによる3D可視化</p>
      <p>🤖 AIによる最適パス提案</p>
      <p>✨ インタラクティブな操作体験</p>
    </div>
  </DemoPageLayout>
);

const DocumentMagicPage = () => (
  <DemoPageLayout title="Document Magic Studio" emoji="🎨">
    <p>AI駆動のドキュメント作成ツールのデモページです。</p>
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#fef3c7', 
      borderRadius: '8px',
      textAlign: 'center',
      marginTop: '20px' 
    }}>
      <p>📝 ドラッグ&ドロップ編集</p>
      <p>🎯 AI自動補完</p>
      <p>⚡ 90%時間削減</p>
    </div>
  </DemoPageLayout>
);

const QuantumMatchingPage = () => (
  <DemoPageLayout title="Quantum Matching Engine" emoji="⚛️">
    <p>量子アルゴリズムによるマッチングエンジンのデモページです。</p>
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#e0f2fe', 
      borderRadius: '8px',
      textAlign: 'center',
      marginTop: '20px' 
    }}>
      <p>🔬 量子コンピューティング概念</p>
      <p>📊 99%の精度</p>
      <p>⚡ リアルタイム処理</p>
    </div>
  </DemoPageLayout>
);

const BiometricAuthPage = () => (
  <DemoPageLayout title="AI Biometric Authentication" emoji="🔐">
    <p>パスワードレス認証システムのデモページです。</p>
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#f3e8ff', 
      borderRadius: '8px',
      textAlign: 'center',
      marginTop: '20px' 
    }}>
      <p>👤 顔認証</p>
      <p>🎤 音声認証</p>
      <p>⌨️ 行動バイオメトリクス</p>
    </div>
  </DemoPageLayout>
);

// デモページレイアウト
const DemoPageLayout = ({ title, emoji, children }: any) => (
  <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
    <Link to="/" style={{ 
      textDecoration: 'none', 
      color: '#6b7280',
      display: 'inline-block',
      marginBottom: '20px'
    }}>
      ← ホームに戻る
    </Link>
    <h1 style={{ fontSize: '32px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <span style={{ fontSize: '48px' }}>{emoji}</span>
      {title}
    </h1>
    {children}
  </div>
);

// メインアプリコンポーネント
function SimpleDemoApp() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/visual-navigator" element={<VisualNavigatorPage />} />
          <Route path="/document-magic" element={<DocumentMagicPage />} />
          <Route path="/quantum-matching" element={<QuantumMatchingPage />} />
          <Route path="/biometric-auth" element={<BiometricAuthPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default SimpleDemoApp;