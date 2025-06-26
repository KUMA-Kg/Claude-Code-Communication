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
      <SubsidyFlowApp />
    </div>
  );
};

export default MonozukuriCompletionPage;