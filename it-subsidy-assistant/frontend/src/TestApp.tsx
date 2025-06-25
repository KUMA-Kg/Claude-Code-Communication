import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import InnovativeFeaturesDemo from './pages/InnovativeFeaturesDemo';
import VisualNavigatorDemo from './pages/VisualNavigatorDemo';
import DocumentMagicStudioPage from './pages/DocumentMagicStudioPage';
import { QuantumMatchingDemo } from './pages/QuantumMatchingDemo';
import BiometricAuthDemo from './pages/BiometricAuthDemo';

function TestApp() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <header style={{ backgroundColor: 'white', padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h1 style={{ margin: 0, fontSize: '24px', cursor: 'pointer' }}>IT補助金アシストツール - デモ</h1>
            </Link>
            
            <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Link to="/innovative-demo" style={{ 
                textDecoration: 'none', 
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500'
              }}>
                🚀 革新的機能デモ
              </Link>
              <Link to="/visual-navigator" style={{ 
                textDecoration: 'none', 
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500'
              }}>
                🎯 3Dナビゲーター
              </Link>
              <Link to="/document-magic" style={{ 
                textDecoration: 'none', 
                color: '#ec4899',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500'
              }}>
                🎨 Document Magic
              </Link>
              <Link to="/quantum-matching-demo" style={{ 
                textDecoration: 'none', 
                color: '#06b6d4',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500'
              }}>
                ⚛️ Quantum Engine
              </Link>
              <Link to="/biometric-auth" style={{ 
                textDecoration: 'none', 
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500'
              }}>
                🔐 バイオメトリクス
              </Link>
            </nav>
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/innovative-demo" element={<InnovativeFeaturesDemo />} />
            <Route path="/visual-navigator" element={<VisualNavigatorDemo />} />
            <Route path="/document-magic" element={<DocumentMagicStudioPage />} />
            <Route path="/quantum-matching-demo" element={<QuantumMatchingDemo />} />
            <Route path="/biometric-auth" element={<BiometricAuthDemo />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

const HomePage = () => (
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
    <h2 style={{ fontSize: '32px', marginBottom: '24px', textAlign: 'center' }}>
      IT補助金アシスタント - 革新的機能デモ
    </h2>
    
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
        path="/quantum-matching-demo"
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

const DemoCard = ({ emoji, title, description, path, color }: any) => {
  const navigate = useNavigate();
  
  return (
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
      onClick={() => navigate(path)}
    >
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{emoji}</div>
      <h3 style={{ fontSize: '20px', marginBottom: '12px', color }}>{title}</h3>
      <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
        {description}
      </p>
      <button
        style={{
          marginTop: '20px',
          backgroundColor: color,
          color: 'white',
          padding: '10px 24px',
          fontSize: '14px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        デモを体験
      </button>
    </div>
  );
};


export default TestApp;