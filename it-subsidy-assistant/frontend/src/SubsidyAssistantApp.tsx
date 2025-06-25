import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { ModernSubsidyFlow } from './components/ModernSubsidyFlow';
import { SubsidyResults } from './components/SubsidyResults';
import CompletionPage from './components/CompletionPage';
import DocumentRequirementQuestions from './components/DocumentRequirementQuestions';
import RequiredDocumentsList from './components/RequiredDocumentsList';
import RequiredDocumentsListEnhanced from './components/RequiredDocumentsListEnhanced';
import ComprehensiveDocumentForm from './components/ComprehensiveDocumentForm';
import SmartDocumentForm from './components/SmartDocumentForm';
import { ApplicationGuidePage } from './pages/ApplicationGuidePage';
import { SimpleSubsidyDetailPage } from './pages/SimpleSubsidyDetailPage';
import TestCompletionPage from './pages/TestCompletionPage';
import MonozukuriDocumentGuidePage from './pages/MonozukuriDocumentGuidePage';
import JizokukaDocumentGuidePage from './pages/JizokukaDocumentGuidePage';
import ItDonyuDocumentGuidePage from './pages/ItDonyuDocumentGuidePage';
import JigyouSaikouchikuDocumentGuidePage from './pages/JigyouSaikouchikuDocumentGuidePage';
import DocumentUploadManager from './components/DocumentUploadManager';
import ImprovedAIDocumentGenerator from './components/ImprovedAIDocumentGenerator';
import SimplifiedQuestionForm from './components/SimplifiedQuestionForm';
import MinimalAIForm from './components/MinimalAIForm';
import MyPage from './pages/MyPage';
import './styles/modern-ui.css';

// ===== データ型定義 =====
interface QuestionnaireData {
  businessType?: string;
  employeeCount?: string;
  annualRevenue?: string;
  currentChallenges?: string;
  digitalizationLevel?: string;
  budgetRange?: string;
}

interface CompanyData {
  companyName?: string;
  companyNameKana?: string;
  corporateNumber?: string;
  establishmentDate?: string;
  capital?: string;
  representativeName?: string;
  contactEmail?: string;
  contactPhone?: string;
  businessDescription?: string;
  projectPlan?: string;
  expectedEffect?: string;
  [key: string]: any;
}

// ===== メインApp =====
function SubsidyAssistantApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // ログイン状態の確認
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setIsLoggedIn(true);
      setUserEmail(storedEmail);
    }
  }, []);

  const handleLogin = (email: string) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    localStorage.setItem('userEmail', email);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    localStorage.removeItem('userEmail');
  };

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Header isLoggedIn={isLoggedIn} userEmail={userEmail} onLogout={handleLogout} />
        <Routes>
          {/* トップページ - 6つの基礎質問 */}
          <Route path="/" element={<ModernSubsidyFlow />} />
          
          {/* 補助金マッチング結果 */}
          <Route path="/subsidy-results" element={<SubsidyResults />} />
          
          {/* 補助金詳細ページ */}
          <Route path="/subsidy/:id" element={<SimpleSubsidyDetailPage />} />
          
          {/* 補助金別の必要書類判定質問 */}
          <Route path="/document-requirements/:subsidyType" element={<DocumentRequirementsFlow />} />
          
          {/* 必要書類一覧表示 */}
          <Route path="/required-documents/:subsidyType" element={<RequiredDocumentsFlow />} />
          
          {/* 書類アップロード */}
          <Route path="/document-upload/:subsidyType" element={<DocumentUploadFlow />} />
          
          {/* AI文書生成 */}
          <Route path="/ai-document/:subsidyType" element={<AIDocumentFlow />} />
          
          {/* 簡略化された入力フォーム */}
          <Route path="/simplified-form/:subsidyType" element={<SimplifiedFormFlow />} />
          
          {/* 最小質問AIフォーム */}
          <Route path="/minimal-form/:subsidyType" element={<MinimalFormFlow />} />
          
          {/* マイページ */}
          <Route path="/mypage" element={<MyPage />} />
          
          {/* 書類入力フォーム */}
          <Route path="/input-form/:subsidyType" element={<DocumentInputForm />} />
          <Route path="/input-form" element={<DocumentInputForm />} />
          
          {/* 確認画面・Excel出力・完了ページ */}
          <Route path="/completion/:subsidyType" element={<CompletionFlow />} />
          
          {/* 申請ガイド */}
          <Route path="/guide" element={<ApplicationGuidePage />} />
          
          {/* 補助金別書類ガイド */}
          <Route path="/guide/monozukuri-documents" element={<MonozukuriDocumentGuidePage />} />
          <Route path="/guide/jizokuka-documents" element={<JizokukaDocumentGuidePage />} />
          <Route path="/guide/it-donyu-documents" element={<ItDonyuDocumentGuidePage />} />
          <Route path="/guide/jigyou-saikouchiku-documents" element={<JigyouSaikouchikuDocumentGuidePage />} />
          
          {/* AI文書生成 */}
          <Route path="/ai-document-generator" element={<ImprovedAIDocumentGenerator />} />
          
          {/* テストページ */}
          <Route path="/test-completion" element={<TestCompletionPage />} />
          
          {/* ログイン */}
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        </Routes>
      </div>
    </Router>
  );
}

// ===== ヘッダー =====
const Header: React.FC<{ 
  isLoggedIn: boolean; 
  userEmail: string; 
  onLogout: () => void 
}> = ({ isLoggedIn, userEmail, onLogout }) => {
  const navigate = useNavigate();

  return (
    <header style={{ 
      backgroundColor: 'white', 
      padding: '16px 20px', 
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
      background: 'rgba(255, 255, 255, 0.95)'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div 
          onClick={() => navigate('/')}
          style={{ 
            textDecoration: 'none', 
            color: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ 
            fontSize: '32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            💰
          </div>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              補助金アシスタント
            </h1>
            <p style={{ 
              margin: 0, 
              fontSize: '12px', 
              color: '#718096' 
            }}>
              最適な補助金を簡単診断
            </p>
          </div>
        </div>
        
        <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/mypage')}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              textDecoration: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            👤 マイページ
          </button>
          <button
            onClick={() => navigate('/guide')}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              textDecoration: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            📖 申請ガイド
          </button>
          
          {isLoggedIn ? (
            <>
              <span style={{ 
                color: '#718096', 
                fontSize: '14px',
                padding: '8px 12px',
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '8px'
              }}>
                👤 {userEmail}
              </span>
              <button
                onClick={() => {
                  onLogout();
                  navigate('/');
                }}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(245, 87, 108, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 87, 108, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 87, 108, 0.3)';
                }}
              >
                ログアウト
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
              }}
            >
              ログイン
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

// ===== 各フローのページコンポーネント =====
const DocumentRequirementsFlow: React.FC = () => {
  const navigate = useNavigate();
  const { subsidyType } = useParams<{ subsidyType?: string }>();
  const selectedSubsidy = subsidyType || sessionStorage.getItem('selectedSubsidy') || '';
  
  const subsidyNames = {
    'it-donyu': 'IT導入補助金2025',
    'monozukuri': 'ものづくり補助金',
    'jizokuka': '小規模事業者持続化補助金',
    'jigyou-saikouchiku': '事業再構築補助金'
  };

  const handleComplete = (requiredDocuments: any[]) => {
    sessionStorage.setItem('requiredDocuments', JSON.stringify(requiredDocuments));
    navigate(`/required-documents/${selectedSubsidy}`);
  };

  if (!selectedSubsidy) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h2>補助金が選択されていません</h2>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          診断を開始する
        </button>
      </div>
    );
  }

  return (
    <DocumentRequirementQuestions
      subsidyType={selectedSubsidy}
      subsidyName={subsidyNames[selectedSubsidy as keyof typeof subsidyNames]}
      onComplete={handleComplete}
    />
  );
};

const RequiredDocumentsFlow: React.FC = () => {
  const navigate = useNavigate();
  const { subsidyType } = useParams<{ subsidyType?: string }>();
  const selectedSubsidy = subsidyType || sessionStorage.getItem('selectedSubsidy') || '';
  const requiredDocuments = JSON.parse(sessionStorage.getItem('requiredDocuments') || '[]');
  
  const subsidyNames = {
    'it-donyu': 'IT導入補助金2025',
    'monozukuri': 'ものづくり補助金',
    'jizokuka': '小規模事業者持続化補助金',
    'jigyou-saikouchiku': '事業再構築補助金'
  };

  const handleProceed = () => {
    navigate(`/input-form/${selectedSubsidy}`);
  };

  if (!selectedSubsidy) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h2>補助金が選択されていません</h2>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          診断を開始する
        </button>
      </div>
    );
  }

  return (
    <RequiredDocumentsListEnhanced
      subsidyType={selectedSubsidy}
      subsidyName={subsidyNames[selectedSubsidy as keyof typeof subsidyNames]}
      requiredDocuments={requiredDocuments}
    />
  );
};

const DocumentUploadFlow: React.FC = () => {
  const navigate = useNavigate();
  const { subsidyType } = useParams<{ subsidyType?: string }>();
  const selectedSubsidy = subsidyType || sessionStorage.getItem('selectedSubsidy') || '';
  const requiredDocuments = JSON.parse(sessionStorage.getItem('requiredDocuments') || '[]');
  
  const subsidyNames = {
    'it-donyu': 'IT導入補助金2025',
    'monozukuri': 'ものづくり補助金',
    'jizokuka': '小規模事業者持続化補助金',
    'jigyou-saikouchiku': '事業再構築補助金'
  };

  const handleComplete = (uploadedFiles: any[]) => {
    // アップロードしたファイルをsessionStorageに保存
    sessionStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
    navigate(`/input-form/${selectedSubsidy}`);
  };

  if (!selectedSubsidy) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h2>補助金が選択されていません</h2>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          診断を開始する
        </button>
      </div>
    );
  }

  return (
    <DocumentUploadManager
      subsidyType={selectedSubsidy}
      subsidyName={subsidyNames[selectedSubsidy as keyof typeof subsidyNames]}
      documents={requiredDocuments}
      onComplete={handleComplete}
    />
  );
};

const DocumentInputForm: React.FC = () => {
  const navigate = useNavigate();
  const { subsidyType } = useParams<{ subsidyType?: string }>();
  
  // 簡略化されたフォームにリダイレクト
  useEffect(() => {
    const selectedSubsidy = subsidyType || sessionStorage.getItem('selectedSubsidy') || '';
    if (selectedSubsidy) {
      navigate(`/simplified-form/${selectedSubsidy}`);
    } else {
      navigate('/');
    }
  }, [subsidyType, navigate]);
  
  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc'
    }}>
      <p style={{ color: '#6b7280' }}>リダイレクト中...</p>
    </div>
  );
};

// 古いDocumentInputFormの実装を保持（必要に応じてアクセス可能）
const LegacyDocumentInputForm: React.FC = () => {
  const navigate = useNavigate();
  const { subsidyType } = useParams<{ subsidyType?: string }>();
  const [useComprehensiveForm, setUseComprehensiveForm] = useState(false); // シンプルなフォームを使用
  const [formData, setFormData] = useState<CompanyData>({});
  const [showAIContent, setShowAIContent] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<string>('');
  
  // URLパラメータがある場合はそれを使用、なければsessionStorageから取得
  const selectedSubsidy = subsidyType || sessionStorage.getItem('selectedSubsidy') || '';
  const requiredDocuments = JSON.parse(sessionStorage.getItem('requiredDocuments') || '[]');
  const documentAnswers = JSON.parse(sessionStorage.getItem('documentRequirements') || '{}');
  
  const subsidyNames = {
    'it-donyu': 'IT導入補助金2025',
    'monozukuri': 'ものづくり補助金',
    'jizokuka': '小規模事業者持続化補助金',
    'jigyou-saikouchiku': '事業再構築補助金'
  };

  // 基本的な入力フィールド
  const baseFields = [
    { id: 'companyName', label: '会社名', type: 'text', required: true },
    { id: 'companyNameKana', label: '会社名（フリガナ）', type: 'text', required: true },
    { id: 'corporateNumber', label: '法人番号', type: 'text', required: false },
    { id: 'representativeName', label: '代表者氏名', type: 'text', required: true },
    { id: 'contactEmail', label: 'メールアドレス', type: 'email', required: true },
    { id: 'contactPhone', label: '電話番号', type: 'tel', required: true },
    { id: 'capital', label: '資本金（円）', type: 'number', required: false },
    { id: 'businessDescription', label: '事業内容', type: 'textarea', required: true },
  ];

  // 補助金別の追加フィールド
  const subsidySpecificFields: Record<string, any[]> = {
    'it-donyu': [
      { id: 'employeeCount', label: '従業員数', type: 'number', required: true },
      { id: 'annualRevenue', label: '年間売上高（万円）', type: 'number', required: true },
      { id: 'itToolName', label: '導入予定のITツール名', type: 'text', required: true },
      { id: 'itToolPurpose', label: 'ITツール導入の目的', type: 'textarea', required: true },
      { id: 'expectedEffect', label: '期待される効果', type: 'textarea', required: true },
      { id: 'implementationPeriod', label: '導入予定時期', type: 'date', required: true },
      { id: 'totalBudget', label: '総投資額（円）', type: 'number', required: true },
      { id: 'requestedAmount', label: '補助金申請額（円）', type: 'number', required: true },
    ],
    'monozukuri': [
      { id: 'employeeCount', label: '従業員数', type: 'number', required: true },
      { id: 'annualRevenue', label: '年間売上高（万円）', type: 'number', required: true },
      { id: 'projectTitle', label: '事業計画名', type: 'text', required: true },
      { id: 'projectType', label: '事業類型', type: 'select', required: true, options: [
        { value: 'new_product', label: '新製品・新サービス開発' },
        { value: 'process_improvement', label: '生産プロセス改善' },
        { value: 'service_provision', label: 'サービス提供方法改善' }
      ]},
      { id: 'technicalContent', label: '技術的課題と解決方法', type: 'textarea', required: true },
      { id: 'marketAnalysis', label: '市場分析', type: 'textarea', required: true },
      { id: 'competitiveAdvantage', label: '競争優位性', type: 'textarea', required: true },
      { id: 'investmentPlan', label: '設備投資計画', type: 'textarea', required: true },
      { id: 'totalBudget', label: '総投資額（円）', type: 'number', required: true },
      { id: 'requestedAmount', label: '補助金申請額（円）', type: 'number', required: true },
    ],
    'jizokuka': [
      { id: 'employeeCount', label: '従業員数（5人以下）', type: 'number', required: true, max: 5 },
      { id: 'annualRevenue', label: '年間売上高（万円）', type: 'number', required: true },
      { id: 'businessPlan', label: '経営計画', type: 'textarea', required: true },
      { id: 'salesChannelPlan', label: '販路開拓の取組内容', type: 'textarea', required: true },
      { id: 'targetCustomer', label: 'ターゲット顧客', type: 'text', required: true },
      { id: 'expectedSalesIncrease', label: '売上増加見込み（%）', type: 'number', required: true },
      { id: 'investmentItems', label: '補助対象経費の内訳', type: 'textarea', required: true },
      { id: 'totalBudget', label: '総事業費（円）', type: 'number', required: true },
      { id: 'requestedAmount', label: '補助金申請額（円）', type: 'number', required: true },
    ],
    'jigyou-saikouchiku': [
      { id: 'employeeCount', label: '従業員数', type: 'number', required: true },
      { id: 'annualRevenue', label: '年間売上高（万円）', type: 'number', required: true },
      { id: 'restructuringPlan', label: '事業再構築計画の概要', type: 'textarea', required: true },
      { id: 'restructuringType', label: '再構築の類型', type: 'select', required: true, options: [
        { value: 'new_field', label: '新分野展開' },
        { value: 'business_conversion', label: '事業転換' },
        { value: 'industry_conversion', label: '業種転換' },
        { value: 'business_reorganization', label: '業態転換' },
        { value: 'business_restructuring', label: '事業再編' }
      ]},
      { id: 'marketStrategy', label: '新市場への参入戦略', type: 'textarea', required: true },
      { id: 'competitiveAnalysis', label: '競合分析と差別化戦略', type: 'textarea', required: true },
      { id: 'riskAnalysis', label: 'リスク分析と対策', type: 'textarea', required: true },
      { id: 'facilityPlan', label: '設備・施設計画', type: 'textarea', required: true },
      { id: 'employmentPlan', label: '雇用維持・拡大計画', type: 'textarea', required: true },
      { id: 'totalBudget', label: '総投資額（円）', type: 'number', required: true },
      { id: 'requestedAmount', label: '補助金申請額（円）', type: 'number', required: true },
    ]
  };

  // AI生成コンテンツの取得
  useEffect(() => {
    const generatedDoc = sessionStorage.getItem(`generated_document_${selectedSubsidy}`);
    const aiAnswers = sessionStorage.getItem(`ai_answers_${selectedSubsidy}`);
    
    if (generatedDoc) {
      setAiGeneratedContent(generatedDoc);
      setShowAIContent(true);
    }
    
    if (aiAnswers) {
      const answers = JSON.parse(aiAnswers);
      // AIからの回答をフォームデータにマッピング
      const mappedData: CompanyData = {};
      
      // マッピングロジック
      if (subsidyType === 'it-donyu') {
        mappedData.businessDescription = answers.company_overview || '';
        mappedData.itToolPurpose = answers.current_challenges || '';
        mappedData.itToolName = answers.it_solution || '';
        mappedData.expectedEffect = answers.expected_benefits || '';
        mappedData.implementationSchedule = answers.implementation_schedule || '';
      } else if (subsidyType === 'monozukuri') {
        mappedData.projectTitle = answers.product_overview || '';
        mappedData.technicalContent = answers.innovation_points || '';
        mappedData.marketAnalysis = answers.market_needs || '';
        mappedData.investmentPlan = answers.production_plan || '';
        mappedData.competitiveAdvantage = answers.sales_strategy || '';
      } else if (subsidyType === 'jizokuka') {
        mappedData.businessDescription = answers.business_challenge || '';
        mappedData.businessPlan = answers.improvement_plan || '';
        mappedData.targetCustomer = answers.target_customers || '';
        mappedData.salesChannelPlan = answers.uniqueness || '';
        mappedData.expectedSalesIncrease = answers.expected_results || '';
      } else if (subsidyType === 'jigyou-saikouchiku') {
        mappedData.restructuringPlan = answers.restructuring_reason || '';
        mappedData.businessDescription = answers.new_business_overview || '';
        mappedData.marketStrategy = answers.market_analysis || '';
        mappedData.competitiveAnalysis = answers.competitive_advantage || '';
        mappedData.facilityPlan = answers.investment_plan || '';
      }
      
      setFormData(prev => ({ ...prev, ...mappedData }));
    }
  }, [selectedSubsidy, subsidyType]);

  // 現在の補助金に応じたフィールドを結合
  const fields = [...baseFields, ...(subsidySpecificFields[selectedSubsidy] || [])];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('companyData', JSON.stringify(formData));
    navigate(`/completion/${selectedSubsidy}`);
  };

  const handleComprehensiveComplete = (completedFormData: any) => {
    sessionStorage.setItem('completedFormData', JSON.stringify(completedFormData));
    sessionStorage.setItem('companyData', JSON.stringify(completedFormData)); // 互換性のため
    navigate(`/completion/${selectedSubsidy}`);
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const renderField = (field: any) => {
    const fieldStyle = {
      width: '100%',
      padding: '16px 20px',
      paddingRight: field.type === 'textarea' ? '20px' : '48px',
      border: '2px solid transparent',
      borderRadius: '16px',
      fontSize: '16px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: '#f8fafc',
      color: '#1a202c',
      outline: 'none',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      ...(field.style || {})
    };

    const focusStyle = `
      :focus {
        border-color: #667eea;
        background-color: #ffffff;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05);
        transform: translateY(-1px);
      }
      :hover:not(:focus) {
        border-color: #e2e8f0;
        background-color: #ffffff;
      }
    `;

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            rows={4}
            style={fieldStyle}
            placeholder={`${field.label}を入力してください`}
          />
        );
      case 'select':
        return (
          <select
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            style={fieldStyle}
          >
            <option value="">選択してください</option>
            {field.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type={field.type}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            max={field.max}
            style={fieldStyle}
            placeholder={`${field.label}を入力してください`}
          />
        );
    }
  };

  if (!selectedSubsidy) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h2>補助金が選択されていません</h2>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          診断を開始する
        </button>
      </div>
    );
  }

  // 詳細フォームを使用する場合
  if (useComprehensiveForm) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <SmartDocumentForm
          subsidyType={selectedSubsidy}
          onComplete={handleComprehensiveComplete}
          onBack={() => navigate(`/required-documents/${selectedSubsidy}`)}
        />
      </div>
    );
  }

  // 簡易フォームを使用する場合（既存のコード）
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景アニメーション */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle at 20% 50%, rgba(248, 113, 113, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
        animation: 'bgFloat 20s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'bgPulse 8s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      
      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* プログレスバー */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(255, 255, 255, 0.2)',
          zIndex: 1000
        }}>
          <div style={{
            height: '100%',
            width: '66%',
            background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
            transition: 'width 0.5s ease',
            boxShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
          }} />
        </div>
        
        {/* ヘッダー */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '48px',
          animation: 'fadeInDown 0.6s ease-out'
        }}>
          <div style={{
            display: 'inline-block',
            padding: '16px 32px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '100px',
            marginBottom: '32px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <span style={{ 
              color: 'white', 
              fontSize: '16px', 
              fontWeight: '700',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                background: '#fbbf24',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }} />
              STEP 3 / 3 - 情報入力
            </span>
          </div>
          <h2 style={{ 
            fontSize: '48px', 
            fontWeight: '800',
            color: 'white',
            marginBottom: '16px',
            textShadow: '0 4px 16px rgba(0,0,0,0.2)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            {subsidyNames[selectedSubsidy as keyof typeof subsidyNames]}
          </h2>
          <p style={{ 
            fontSize: '22px',
            color: 'rgba(255, 255, 255, 0.95)',
            maxWidth: '600px',
            margin: '0 auto',
            fontWeight: '500',
            letterSpacing: '0.02em'
          }}>
            ✨ 申請に必要な情報を入力してください
          </p>
        </div>

        {/* AI生成コンテンツ表示 */}
        {showAIContent && aiGeneratedContent && (
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                color: 'white',
                fontSize: '20px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>✨</span>
                AIが生成した内容を反映済み
              </h3>
              <button
                type="button"
                onClick={() => setShowAIContent(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                非表示
              </button>
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '16px',
              lineHeight: '1.6',
              margin: 0
            }}>
              AIが生成した文書内容が以下のフィールドに自動的に反映されています。
              必要に応じて編集してください。
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 基本情報セクション */}
          <div style={{ 
            background: 'white',
            borderRadius: '24px',
            padding: '40px',
            marginBottom: '32px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
            animation: 'fadeInUp 0.6s ease-out',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            {/* カードの装飾要素 */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              opacity: 0.8
            }} />
            <div style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(102, 126, 234, 0.05) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            
            <h3 style={{ 
              fontSize: '32px', 
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '36px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              position: 'relative'
            }}>
              <span style={{ 
                fontSize: '40px',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
              }}>🏢</span>
              基本情報
              <span style={{
                fontSize: '14px',
                padding: '6px 12px',
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '100px',
                color: '#667eea',
                fontWeight: '600',
                marginLeft: 'auto'
              }}>
                必須項目
              </span>
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px' 
            }}>
              {baseFields.map((field) => (
                <div key={field.id} style={{ position: 'relative' }}>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#2d3748',
                    letterSpacing: '0.01em',
                    transition: 'color 0.2s ease'
                  }}>
                    {field.label}
                    {field.required && <span style={{ color: '#e53e3e', marginLeft: '4px', fontSize: '18px' }}>*</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      right: '16px',
                      transform: 'translateY(-50%)',
                      fontSize: '20px',
                      opacity: 0.3,
                      pointerEvents: 'none'
                    }}>
                      {field.type === 'email' ? '✉️' : field.type === 'tel' ? '📞' : field.type === 'number' ? '🔢' : '✏️'}
                    </div>
                    {renderField(field)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 補助金固有情報セクション */}
          {subsidySpecificFields[selectedSubsidy] && subsidySpecificFields[selectedSubsidy].length > 0 && (
            <div style={{ 
              background: 'white',
              borderRadius: '24px',
              padding: '40px',
              marginBottom: '32px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
              animation: 'fadeInUp 0.6s ease-out 0.2s',
              animationFillMode: 'both',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(0, 0, 0, 0.05)'
            }}>
              {/* カードの装飾要素 */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 50%, #fbbf24 100%)',
                opacity: 0.8
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-150px',
                left: '-150px',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(240, 147, 251, 0.05) 0%, transparent 70%)',
                borderRadius: '50%'
              }} />
              
              <h3 style={{ 
                fontSize: '32px', 
                fontWeight: '800',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '36px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                position: 'relative'
              }}>
                <span style={{ 
                  fontSize: '40px',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }}>📝</span>
                詳細情報
                <span style={{
                  fontSize: '14px',
                  padding: '6px 12px',
                  background: 'rgba(240, 147, 251, 0.1)',
                  borderRadius: '100px',
                  color: '#f093fb',
                  fontWeight: '600',
                  marginLeft: 'auto'
                }}>
                  補助金専用
                </span>
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px' 
              }}>
                {subsidySpecificFields[selectedSubsidy].map((field: any) => (
                  <div key={field.id} style={{ 
                    position: 'relative',
                    gridColumn: field.type === 'textarea' ? 'span 2' : 'span 1'
                  }}>
                    <label style={{ 
                      display: 'block',
                      marginBottom: '12px',
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#2d3748',
                      letterSpacing: '0.01em',
                      transition: 'color 0.2s ease'
                    }}>
                      {field.label}
                      {field.required && <span style={{ color: '#e53e3e', marginLeft: '4px', fontSize: '18px' }}>*</span>}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        right: '16px',
                        transform: 'translateY(-50%)',
                        fontSize: '20px',
                        opacity: 0.3,
                        pointerEvents: 'none',
                        zIndex: 1
                      }}>
                        {field.type === 'date' ? '📅' : field.type === 'number' ? '🔢' : field.type === 'textarea' ? '📝' : field.type === 'select' ? '🔽' : '✏️'}
                      </div>
                      {renderField(field)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '24px',
            padding: '32px',
            marginTop: '40px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            animation: 'fadeInUp 0.6s ease-out 0.4s',
            animationFillMode: 'both'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <p style={{
                fontSize: '16px',
                color: '#4a5568',
                margin: '0 0 8px 0'
              }}>
                ✨ すべての項目を入力したら、書類を自動生成できます
              </p>
              <p style={{
                fontSize: '14px',
                color: '#718096',
                margin: 0
              }}>
                生成された書類はExcel形式でダウンロードできます
              </p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              justifyContent: 'center'
            }}>
            <button
              type="button"
              onClick={() => navigate(`/required-documents/${selectedSubsidy}`)}
              style={{
                padding: '18px 48px',
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#667eea',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '700',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
              }}
            >
              ← 戻る
            </button>
            <button
              type="submit"
              style={{
                padding: '18px 48px',
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '700',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(250, 112, 154, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(250, 112, 154, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(250, 112, 154, 0.4)';
              }}
            >
              書類を生成する →
            </button>
          </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bgFloat {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        
        @keyframes bgPulse {
          0% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.1); opacity: 0.15; }
          100% { transform: scale(1); opacity: 0.1; }
        }
        
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        input, textarea, select {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #667eea !important;
          background-color: white !important;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05) !important;
          transform: translateY(-1px);
        }
        
        input:hover:not(:focus), textarea:hover:not(:focus), select:hover:not(:focus) {
          border-color: #e2e8f0;
          background-color: white;
        }
        
        input::placeholder, textarea::placeholder {
          color: #a0aec0;
          font-weight: 400;
        }
        
        textarea {
          resize: vertical;
          min-height: 120px;
          line-height: 1.5;
        }
        
        select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234a5568' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 48px;
        }
        
        /* フィールドラベルのアニメーション */
        label {
          transition: color 0.2s ease;
        }
        
        /* フォーカス時のラベル色変更 */
        div:focus-within > label {
          color: #667eea;
        }
        
        /* ボタンのホバーエフェクト */
        button {
          position: relative;
          overflow: hidden;
        }
        
        button::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        button:active::after {
          width: 300px;
          height: 300px;
        }
        
        /* スクロールバーのスタイリング */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </div>
  );
};

const SimplifiedFormFlow: React.FC = () => {
  const navigate = useNavigate();
  const { subsidyType } = useParams<{ subsidyType?: string }>();
  const selectedSubsidy = subsidyType || sessionStorage.getItem('selectedSubsidy') || '';
  
  const subsidyNames = {
    'it-donyu': 'IT導入補助金2025',
    'monozukuri': 'ものづくり補助金',
    'jizokuka': '小規模事業者持続化補助金',
    'jigyou-saikouchiku': '事業再構築補助金'
  };

  const handleComplete = (expandedData: any) => {
    sessionStorage.setItem('companyData', JSON.stringify(expandedData));
    navigate(`/completion/${selectedSubsidy}`);
  };

  if (!selectedSubsidy) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h2>補助金が選択されていません</h2>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          診断を開始する
        </button>
      </div>
    );
  }

  return (
    <SimplifiedQuestionForm
      subsidyType={selectedSubsidy}
      subsidyName={subsidyNames[selectedSubsidy as keyof typeof subsidyNames]}
      onComplete={handleComplete}
    />
  );
};

const MinimalFormFlow: React.FC = () => {
  const navigate = useNavigate();
  const { subsidyType } = useParams<{ subsidyType?: string }>();
  const selectedSubsidy = subsidyType || sessionStorage.getItem('selectedSubsidy') || '';
  
  const subsidyNames = {
    'it-donyu': 'IT導入補助金2025',
    'monozukuri': 'ものづくり補助金',
    'jizokuka': '小規模事業者持続化補助金',
    'jigyou-saikouchiku': '事業再構築補助金'
  };

  const handleComplete = (documentData: any) => {
    sessionStorage.setItem('companyData', JSON.stringify(documentData));
    sessionStorage.setItem('aiGeneratedDocument', JSON.stringify(documentData));
    navigate(`/completion/${selectedSubsidy}`);
  };

  if (!selectedSubsidy) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h2>補助金が選択されていません</h2>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          診断を開始する
        </button>
      </div>
    );
  }

  return (
    <MinimalAIForm
      subsidyType={selectedSubsidy}
      subsidyName={subsidyNames[selectedSubsidy as keyof typeof subsidyNames]}
      onComplete={handleComplete}
    />
  );
};

const AIDocumentFlow: React.FC = () => {
  const navigate = useNavigate();
  const { subsidyType } = useParams<{ subsidyType?: string }>();
  const selectedSubsidy = subsidyType || sessionStorage.getItem('selectedSubsidy') || '';
  const uploadedFiles = JSON.parse(sessionStorage.getItem('uploadedFiles') || '[]');
  
  const subsidyNames = {
    'it-donyu': 'IT導入補助金2025',
    'monozukuri': 'ものづくり補助金',
    'jizokuka': '小規模事業者持続化補助金',
    'jigyou-saikouchiku': '事業再構築補助金'
  };

  if (!selectedSubsidy) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h2>補助金が選択されていません</h2>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          診断を開始する
        </button>
      </div>
    );
  }

  return (
    <ImprovedAIDocumentGenerator
      subsidyType={selectedSubsidy}
      subsidyName={subsidyNames[selectedSubsidy as keyof typeof subsidyNames]}
      uploadedFiles={uploadedFiles}
    />
  );
};

const CompletionFlow: React.FC = () => {
  const { subsidyType } = useParams<{ subsidyType?: string }>();
  const selectedSubsidy = subsidyType || sessionStorage.getItem('selectedSubsidy') || '';
  const formData = JSON.parse(sessionStorage.getItem('companyData') || '{}');
  const requiredDocuments = JSON.parse(sessionStorage.getItem('requiredDocuments') || '[]');

  if (!selectedSubsidy) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h2>補助金が選択されていません</h2>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          診断を開始する
        </button>
      </div>
    );
  }

  return (
    <CompletionPage
      selectedSubsidy={selectedSubsidy}
      formData={formData}
      requiredDocuments={requiredDocuments}
    />
  );
};

// ===== ログインページ =====
const LoginPage: React.FC<{ onLogin: (email: string) => void }> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email);
      navigate('/');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '32px', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
          ログイン
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              メールアドレス
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              パスワード
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>
          
          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ログイン
          </button>
        </form>
        
        <p style={{ marginTop: '24px', textAlign: 'center', color: '#6b7280' }}>
          テスト用：任意のメールアドレスとパスワードでログインできます
        </p>
      </div>
    </div>
  );
};

export default SubsidyAssistantApp;