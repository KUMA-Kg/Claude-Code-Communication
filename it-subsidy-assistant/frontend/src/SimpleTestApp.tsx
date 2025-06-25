import React from 'react';

function SimpleTestApp() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>IT補助金アシスタント - テスト画面</h1>
      <p>この画面が表示されていれば、Reactアプリは正常に動作しています。</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>デモページリンク</h2>
        <ul>
          <li><a href="/visual-navigator">🎯 Visual AI Navigator</a></li>
          <li><a href="/document-magic">🎨 Document Magic Studio</a></li>
          <li><a href="/quantum-matching-demo">⚛️ Quantum Matching Engine</a></li>
          <li><a href="/biometric-auth">🔐 AI Biometric Auth</a></li>
        </ul>
      </div>
    </div>
  );
}

export default SimpleTestApp;