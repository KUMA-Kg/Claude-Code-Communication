import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CompletionPage from '../components/CompletionPage';

const TestCompletionPage: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const selectedSubsidy = sessionStorage.getItem('selectedSubsidy') || 'it-donyu';
    
    // Set test data in sessionStorage based on subsidy type
    let testFormData;
    
    if (selectedSubsidy === 'jizokuka') {
      testFormData = {
        companyName: 'さくら商店',
        companyNameKana: 'サクラショウテン',
        representativeName: '田中花子',
        contactEmail: 'hanako@sakura-shop.com',
        contactPhone: '06-1234-5678',
        businessDescription: '地域密着型の雑貨小売業',
        employeeCount: '3',
        annualRevenue: '1500',
        businessPlan: '地域顧客との信頼関係を基盤とした持続可能な経営を目指す',
        salesChannelPlan: 'SNSマーケティングとECサイト構築による販路拡大',
        targetCustomer: '地域の30-50代女性',
        expectedSalesIncrease: '30',
        investmentItems: 'ウェブサイト制作、SNS広告、ECシステム導入',
        totalBudget: '2000000',
        requestedAmount: '1000000'
      };
    } else if (selectedSubsidy === 'monozukuri') {
      testFormData = {
        companyName: '精密工業株式会社',
        companyNameKana: 'セイミツコウギョウカブシキガイシャ',
        representativeName: '佐藤次郎',
        contactEmail: 'jiro@seimitsu.co.jp',
        contactPhone: '052-1234-5678',
        businessDescription: '精密部品製造業',
        employeeCount: '25',
        annualRevenue: '80000',
        projectTitle: 'AI画像認識を活用した自動検査システムの開発',
        projectType: 'process_improvement',
        technicalContent: 'AI技術を活用した品質検査の自動化による生産性向上',
        marketAnalysis: '製造業のDX化需要の高まりにより市場拡大',
        competitiveAdvantage: '独自のAI画像認識技術による高精度検査',
        investmentPlan: '最新の検査装置とAIシステムの導入',
        totalBudget: '30000000',
        requestedAmount: '15000000'
      };
    } else {
      // IT導入補助金のテストデータ
      testFormData = {
        companyName: 'テクノ株式会社',
        companyNameKana: 'テクノカブシキガイシャ',
        corporateNumber: '1234567890123',
        representativeName: '山田太郎',
        contactEmail: 'taro@techno.co.jp',
        contactPhone: '03-1234-5678',
        capital: '10000000',
        businessDescription: 'IT関連サービス業',
        employeeCount: '20',
        annualRevenue: '100000',
        itToolName: 'クラウド型統合業務管理システム',
        itToolPurpose: '業務効率化と顧客管理の強化',
        expectedEffect: '事務作業時間の50%削減と売上10%向上',
        implementationPeriod: '2025-04-01',
        totalBudget: '5000000',
        requestedAmount: '2500000'
      };
    }
    
    const testRequiredDocuments = [
      { id: 'doc1', name: '申請書', required: true },
      { id: 'doc2', name: '事業計画書', required: true },
      { id: 'doc3', name: '見積書', required: true }
    ];
    
    sessionStorage.setItem('companyData', JSON.stringify(testFormData));
    sessionStorage.setItem('requiredDocuments', JSON.stringify(testRequiredDocuments));
    if (!sessionStorage.getItem('selectedSubsidy')) {
      sessionStorage.setItem('selectedSubsidy', 'jizokuka'); // デフォルトを小規模事業者持続化補助金に
    }
  }, []);

  return (
    <div>
      <div style={{ padding: '20px', background: '#f0f0f0', marginBottom: '20px', textAlign: 'center' }}>
        <h2>AI生成書類プレビュー機能テスト</h2>
        <p>以下は各補助金のAI生成書類プレビュー機能を確認できるテストページです</p>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          各補助金の書類をクリックすると、AIが生成した詳細な内容をプレビューできます
        </p>
        <div style={{ marginTop: '10px' }}>
          <button 
            onClick={() => {
              sessionStorage.setItem('selectedSubsidy', 'jizokuka');
              window.location.reload();
            }}
            style={{ 
              marginRight: '10px', 
              padding: '10px 20px', 
              cursor: 'pointer',
              backgroundColor: sessionStorage.getItem('selectedSubsidy') === 'jizokuka' ? '#4ade80' : '#e5e7eb'
            }}
          >
            持続化補助金
          </button>
          <button 
            onClick={() => {
              sessionStorage.setItem('selectedSubsidy', 'it-donyu');
              window.location.reload();
            }}
            style={{ 
              marginRight: '10px', 
              padding: '10px 20px', 
              cursor: 'pointer',
              backgroundColor: sessionStorage.getItem('selectedSubsidy') === 'it-donyu' ? '#4ade80' : '#e5e7eb'
            }}
          >
            IT導入補助金
          </button>
          <button 
            onClick={() => {
              sessionStorage.setItem('selectedSubsidy', 'monozukuri');
              window.location.reload();
            }}
            style={{ 
              padding: '10px 20px', 
              cursor: 'pointer',
              backgroundColor: sessionStorage.getItem('selectedSubsidy') === 'monozukuri' ? '#4ade80' : '#e5e7eb'
            }}
          >
            ものづくり補助金
          </button>
        </div>
      </div>
      
      <CompletionPage
        selectedSubsidy={sessionStorage.getItem('selectedSubsidy') || 'it-donyu'}
        formData={JSON.parse(sessionStorage.getItem('companyData') || '{}')}
        requiredDocuments={JSON.parse(sessionStorage.getItem('requiredDocuments') || '[]')}
      />
    </div>
  );
};

export default TestCompletionPage;