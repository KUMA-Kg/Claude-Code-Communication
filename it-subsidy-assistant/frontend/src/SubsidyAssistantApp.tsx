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
    'jizokuka': '小規模事業者持続化補助金'
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
    'jizokuka': '小規模事業者持続化補助金'
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

const DocumentInputForm: React.FC = () => {
  const navigate = useNavigate();
  const { subsidyType } = useParams<{ subsidyType?: string }>();
  const [useComprehensiveForm, setUseComprehensiveForm] = useState(true); // デフォルトで詳細フォームを使用
  const [formData, setFormData] = useState<CompanyData>({});
  
  // URLパラメータがある場合はそれを使用、なければsessionStorageから取得
  const selectedSubsidy = subsidyType || sessionStorage.getItem('selectedSubsidy') || '';
  const requiredDocuments = JSON.parse(sessionStorage.getItem('requiredDocuments') || '[]');
  const documentAnswers = JSON.parse(sessionStorage.getItem('documentRequirements') || '{}');
  
  const subsidyNames = {
    'it-donyu': 'IT導入裍助金2025',
    'monozukuri': 'ものづくり裍助金',
    'jizokuka': '小規模事業者持続化裍助金'
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
    ]
  };

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
    const commonStyles = {
      width: '100%',
      padding: '12px',
      border: '2px solid var(--bg-tertiary)',
      borderRadius: 'var(--border-radius)',
      fontSize: '16px',
      background: 'var(--bg-primary)',
      transition: 'all var(--transition-normal)',
      outline: 'none'
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            rows={4}
            style={{
              ...commonStyles,
              resize: 'vertical',
              minHeight: '100px'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--bg-tertiary)'}
          />
        );
      case 'select':
        return (
          <select
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            style={commonStyles}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--bg-tertiary)'}
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
            style={commonStyles}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--bg-tertiary)'}
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
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            marginBottom: '12px' 
          }}>
            {subsidyNames[selectedSubsidy as keyof typeof subsidyNames]} 申請書作成
          </h2>
          <p style={{ 
            fontSize: '18px',
            color: 'var(--text-secondary)' 
          }}>
            申請に必要な情報を入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 基本情報セクション */}
          <div className="card-modern" style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🏢 基本情報
            </h3>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              {baseFields.map((field) => (
                <div key={field.id} className="form-group">
                  <label className="form-label">
                    {field.label}
                    {field.required && <span style={{ color: 'var(--danger-color)', marginLeft: '4px' }}>*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>

          {/* 補助金固有情報セクション */}
          {subsidySpecificFields[selectedSubsidy] && subsidySpecificFields[selectedSubsidy].length > 0 && (
            <div className="card-modern" style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📝 補助金固有情報
              </h3>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                {subsidySpecificFields[selectedSubsidy].map((field: any) => (
                  <div key={field.id} className="form-group">
                    <label className="form-label">
                      {field.label}
                      {field.required && <span style={{ color: 'var(--danger-color)', marginLeft: '4px' }}>*</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => navigate(`/required-documents/${selectedSubsidy}`)}
              style={{
                padding: '16px 40px',
                background: 'white',
                color: 'var(--text-primary)',
                border: '2px solid var(--bg-tertiary)',
                borderRadius: 'var(--border-radius)',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all var(--transition-normal)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-color)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--bg-tertiary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ← 戻る
            </button>
            <button
              type="submit"
              className="btn-gradient"
              style={{
                padding: '16px 40px',
                fontSize: '18px',
                fontWeight: '600'
              }}
            >
              書類を生成する →
            </button>
          </div>
        </form>
      </div>
    </div>
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