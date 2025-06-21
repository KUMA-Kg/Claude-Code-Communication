import React from 'react';
import { SubsidyDiagnosisFlow } from './components/SubsidyDiagnosisFlow';

function SimpleApp() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ backgroundColor: 'white', padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1f2937' }}>
            IT補助金アシスタント
          </h1>
        </div>
      </header>
      
      <SubsidyDiagnosisFlow />
    </div>
  );
}

export default SimpleApp;