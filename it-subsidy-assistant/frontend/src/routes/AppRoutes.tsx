import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AuthPage } from '../pages/AuthPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DiagnosisFlowWithSession } from '../components/DiagnosisFlowWithSession';
import { IntegratedDemoPage } from '../pages/IntegratedDemoPage';
import { Layout } from '../components/layout/Layout';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 公開ルート */}
      <Route path="/auth" element={<AuthPage />} />
      
      {/* メインアプリケーション */}
      <Route path="/" element={<Layout />}>
        {/* ホーム（診断フロー） */}
        <Route index element={<DiagnosisFlowWithSession />} />
        <Route path="diagnosis" element={<DiagnosisFlowWithSession />} />
        
        {/* 保護されたルート */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="sessions" element={<DashboardPage />} />
          <Route path="documents" element={<DashboardPage />} />
          <Route path="settings" element={<DashboardPage />} />
        </Route>
        
        {/* デモページ */}
        <Route path="demo/integrated" element={<IntegratedDemoPage />} />
      </Route>
      
      {/* 404リダイレクト */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};