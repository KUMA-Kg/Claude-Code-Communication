import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import ProgressDashboard from './components/Dashboard/ProgressDashboard';
import RequiredDocumentsList from './components/RequiredDocumentsList';
import DocumentRequirementQuestions from './components/DocumentRequirementQuestions';
import { ApplicationGuidePage } from './pages/ApplicationGuidePage';
import { subsidyDetailedQuestions } from './data/subsidy-questions-detailed';
import './styles/guide.css';

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
  [key: string]: any; // 動的フィールド用
}

interface SubsidyMatch {
  id: string;
  name: string;
  description: string;
  maxAmount: string;
  subsidyRate: string;
  matchScore: number;
}

interface SavedProject {
  id: string;
  createdAt: string;
  subsidyType: string;
  subsidyName: string;
  companyData: CompanyData;
  questionnaireData: QuestionnaireData;
  status: 'draft' | 'completed';
}

interface Question {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'radio' | 'date' | 'multiselect';
  question: string;
  required: boolean;
  hint?: string;
  maxLength?: number;
  unit?: string;
  options?: Array<{ value: string; label: string; description?: string }>;
}

interface Section {
  id: string;
  title: string;
  required: boolean;
  questions: Question[];
}

interface SubsidyQuestionnaire {
  title: string;
  description: string;
  sections: Section[];
}

// ===== メインApp =====
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

  useEffect(() => {
    // ログイン状態の確認
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setIsLoggedIn(true);
      setUserEmail(storedEmail);
      loadProjects(storedEmail);
    }
  }, []);

  const loadProjects = (email: string) => {
    const projects = localStorage.getItem(`projects_${email}`);
    if (projects) {
      setSavedProjects(JSON.parse(projects));
    }
  };

  const handleLogin = (email: string) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    localStorage.setItem('userEmail', email);
    loadProjects(email);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    localStorage.removeItem('userEmail');
    setSavedProjects([]);
  };

  const saveProject = (project: SavedProject) => {
    const updatedProjects = [...savedProjects, project];
    setSavedProjects(updatedProjects);
    localStorage.setItem(`projects_${userEmail}`, JSON.stringify(updatedProjects));
  };

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Header isLoggedIn={isLoggedIn} userEmail={userEmail} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<QuestionnaireWizard />} />
          <Route path="/subsidy-list" element={<SubsidyListPage />} />
          <Route path="/document-requirements" element={
            <DocumentRequirementQuestions 
              subsidyType={sessionStorage.getItem('selectedSubsidy') || ''} 
              subsidyName={
                sessionStorage.getItem('selectedSubsidy') === 'it-donyu' ? 'IT導入補助金2025' : 
                sessionStorage.getItem('selectedSubsidy') === 'monozukuri' ? 'ものづくり補助金' : 
                '小規模事業者持続化補助金'
              }
            />
          } />
          <Route path="/required-documents" element={
            <RequiredDocumentsList 
              subsidyType={sessionStorage.getItem('selectedSubsidy') || ''} 
              subsidyName={
                sessionStorage.getItem('selectedSubsidy') === 'it-donyu' ? 'IT導入補助金2025' : 
                sessionStorage.getItem('selectedSubsidy') === 'monozukuri' ? 'ものづくり補助金' : 
                '小規模事業者持続化補助金'
              }
            />
          } />
          <Route path="/input-form" element={<DynamicDocumentInputForm isLoggedIn={isLoggedIn} saveProject={saveProject} />} />
          <Route path="/document-output" element={<DocumentOutput isLoggedIn={isLoggedIn} />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/mypage" element={<MyPage savedProjects={savedProjects} />} />
          <Route path="/guide" element={<ApplicationGuidePage />} />
          <Route path="/dashboard" element={
            <ProgressDashboard 
              subsidyType={sessionStorage.getItem('selectedSubsidy') || ''} 
              subsidyName={
                sessionStorage.getItem('selectedSubsidy') === 'it-donyu' ? 'IT導入補助金2025' : 
                sessionStorage.getItem('selectedSubsidy') === 'monozukuri' ? 'ものづくり補助金' : 
                '小規模事業者持続化補助金'
              }
              projectData={JSON.parse(sessionStorage.getItem('companyData') || '{}')}
            />
          } />
        </Routes>
      </div>
    </Router>
  );
}

// ===== ヘッダー =====
const Header: React.FC<{ isLoggedIn: boolean; userEmail: string; onLogout: () => void }> = ({ isLoggedIn, userEmail, onLogout }) => {
  const navigate = useNavigate();

  return (
    <header style={{ backgroundColor: 'white', padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1 style={{ margin: 0, fontSize: '24px', cursor: 'pointer' }}>IT補助金アシストツール</h1>
        </Link>
        
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {isLoggedIn ? (
            <>
              <Link to="/guide" style={{ textDecoration: 'none', color: '#2563eb' }}>
                申請ガイド
              </Link>
              <Link to="/mypage" style={{ textDecoration: 'none', color: '#2563eb' }}>
                マイページ
              </Link>
              <Link to="/dashboard" style={{ textDecoration: 'none', color: '#2563eb' }}>
                進捗管理
              </Link>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>{userEmail}</span>
              <button
                onClick={() => {
                  onLogout();
                  navigate('/');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              to="/login"
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

// ===== 1. 質問ウィザード（トップページ） =====
const QuestionnaireWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireData>({});

  const questions = [
    {
      id: 'businessType',
      question: '事業形態を教えてください',
      options: [
        { value: 'manufacturing', label: '製造業' },
        { value: 'retail', label: '小売業' },
        { value: 'service', label: 'サービス業' },
        { value: 'it', label: 'IT関連' },
        { value: 'other', label: 'その他' }
      ]
    },
    {
      id: 'employeeCount',
      question: '従業員数を教えてください',
      options: [
        { value: '1-5', label: '1〜5名' },
        { value: '6-20', label: '6〜20名' },
        { value: '21-50', label: '21〜50名' },
        { value: '51-100', label: '51〜100名' },
        { value: '101-300', label: '101〜300名' }
      ]
    },
    {
      id: 'annualRevenue',
      question: '年間売上高を教えてください',
      options: [
        { value: 'under-10m', label: '1000万円未満' },
        { value: '10m-50m', label: '1000万〜5000万円' },
        { value: '50m-100m', label: '5000万〜1億円' },
        { value: '100m-500m', label: '1億〜5億円' },
        { value: 'over-500m', label: '5億円以上' }
      ]
    },
    {
      id: 'currentChallenges',
      question: '現在の経営課題は何ですか？',
      options: [
        { value: 'efficiency', label: '業務効率化' },
        { value: 'sales', label: '売上拡大' },
        { value: 'cost', label: 'コスト削減' },
        { value: 'innovation', label: '新商品・サービス開発' },
        { value: 'hr', label: '人材育成・確保' }
      ]
    },
    {
      id: 'digitalizationLevel',
      question: 'IT/デジタル化の現状は？',
      options: [
        { value: 'none', label: 'ほとんど導入していない' },
        { value: 'basic', label: '基本的なツールのみ' },
        { value: 'partial', label: '一部業務で活用' },
        { value: 'advanced', label: '積極的に活用中' }
      ]
    },
    {
      id: 'budgetRange',
      question: '想定している投資予算は？',
      options: [
        { value: 'under-500k', label: '50万円未満' },
        { value: '500k-1m', label: '50万〜100万円' },
        { value: '1m-3m', label: '100万〜300万円' },
        { value: '3m-5m', label: '300万〜500万円' },
        { value: 'over-5m', label: '500万円以上' }
      ]
    }
  ];

  const handleAnswer = (value: string) => {
    const currentQuestion = questions[currentStep];
    setAnswers({ ...answers, [currentQuestion.id]: value });

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      sessionStorage.setItem('questionnaireAnswers', JSON.stringify({ ...answers, [currentQuestion.id]: value }));
      navigate('/subsidy-list');
    }
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  // 初回アクセス時の説明画面
  const [hasStarted, setHasStarted] = useState(false);
  
  if (!hasStarted) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>IT補助金申請を簡単に</h2>
        <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '32px' }}>
          5〜6問の質問に答えるだけで、最適な補助金をご提案します
        </p>
        <button
          onClick={() => setHasStarted(true)}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '16px 32px',
            fontSize: '18px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          診断を開始する
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#e5e7eb', height: '8px', borderRadius: '4px' }}>
          <div
            style={{
              backgroundColor: '#2563eb',
              height: '100%',
              borderRadius: '4px',
              width: `${progress}%`,
              transition: 'width 0.3s'
            }}
          />
        </div>
        <p style={{ textAlign: 'center', marginTop: '8px', color: '#6b7280' }}>
          質問 {currentStep + 1} / {questions.length}
        </p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
          {currentQuestion.question}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              style={{
                padding: '16px',
                backgroundColor: '#f9fafb',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#eff6ff';
                e.currentTarget.style.borderColor = '#2563eb';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ===== 2. 補助金リスト =====
const SubsidyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSubsidy, setSelectedSubsidy] = useState<string>('');

  const subsidies: SubsidyMatch[] = [
    {
      id: 'it-donyu',
      name: 'IT導入補助金2025',
      description: 'ITツール導入による業務効率化・DX推進を支援',
      maxAmount: '450万円',
      subsidyRate: '最大3/4',
      matchScore: 95
    },
    {
      id: 'monozukuri',
      name: 'ものづくり補助金',
      description: '革新的な製品・サービス開発または生産プロセス改善を支援',
      maxAmount: '1,250万円',
      subsidyRate: '最大2/3',
      matchScore: 82
    },
    {
      id: 'jizokuka',
      name: '小規模事業者持続化補助金',
      description: '販路開拓・業務効率化の取り組みを支援',
      maxAmount: '200万円',
      subsidyRate: '最大3/4',
      matchScore: 78
    }
  ];

  const handleSelectSubsidy = (subsidyId: string) => {
    setSelectedSubsidy(subsidyId);
    sessionStorage.setItem('selectedSubsidy', subsidyId);
    navigate('/document-requirements');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>あなたにおすすめの補助金</h2>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>
        回答内容から、以下の補助金が活用できる可能性があります
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {subsidies.map((subsidy) => (
          <div
            key={subsidy.id}
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '2px solid',
              borderColor: selectedSubsidy === subsidy.id ? '#2563eb' : '#e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => setSelectedSubsidy(subsidy.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '20px', margin: 0 }}>{subsidy.name}</h3>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  マッチ度 {subsidy.matchScore}%
                </span>
              </div>
            </div>
            
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>{subsidy.description}</p>
            
            <div style={{ display: 'flex', gap: '32px', marginBottom: '16px' }}>
              <div>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>最大補助額</span>
                <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0' }}>{subsidy.maxAmount}</p>
              </div>
              <div>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>補助率</span>
                <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0' }}>{subsidy.subsidyRate}</p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectSubsidy(subsidy.id);
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: selectedSubsidy === subsidy.id ? '#2563eb' : '#f3f4f6',
                color: selectedSubsidy === subsidy.id ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              この補助金で申請を進める
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== 3. 動的入力フォーム（補助金ごとに異なる） =====
const DynamicDocumentInputForm: React.FC<{
  isLoggedIn: boolean;
  saveProject: (project: SavedProject) => void;
}> = ({ isLoggedIn, saveProject }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<any>({});
  const [questionnaire, setQuestionnaire] = useState<SubsidyQuestionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedSubsidy = sessionStorage.getItem('selectedSubsidy') || '';
  const questionnaireData = JSON.parse(sessionStorage.getItem('questionnaireAnswers') || '{}');

  useEffect(() => {
    // 補助金ごとの質問票を読み込む
    const loadQuestionnaire = () => {
      try {
        setLoading(true);
        
        // subsidy-questions-detailed.tsから質問を取得
        const questions = subsidyDetailedQuestions[selectedSubsidy];
        if (!questions) {
          // デバッグ用の簡単なフォーム
          const debugQuestionnaire: SubsidyQuestionnaire = {
            title: 'テストフォーム',
            description: 'デバッグ用',
            sections: [{
              id: 'test-section',
              title: 'テストセクション',
              required: true,
              questions: [
                {
                  id: 'test-text',
                  type: 'text',
                  question: 'テキスト入力',
                  required: true
                },
                {
                  id: 'test-select',
                  type: 'select',
                  question: 'セレクトボックス',
                  required: true,
                  options: [
                    { value: 'option1', label: 'オプション1' },
                    { value: 'option2', label: 'オプション2' }
                  ]
                }
              ]
            }]
          };
          setQuestionnaire(debugQuestionnaire);
          setLoading(false);
          return;
        }
        
        // 質問をセクションに分類してSubsidyQuestionnaire形式に変換
        const categorizedQuestions: { [key: string]: typeof questions } = {};
        questions.forEach(q => {
          if (!categorizedQuestions[q.category]) {
            categorizedQuestions[q.category] = [];
          }
          categorizedQuestions[q.category].push(q);
        });
        
        const subsidyNames: { [key: string]: string } = {
          'it-donyu': 'IT導入補助金2025',
          'monozukuri': 'ものづくり補助金',
          'jizokuka': '小規模事業者持続化補助金'
        };
        
        const questionnaire: SubsidyQuestionnaire = {
          title: `${subsidyNames[selectedSubsidy]} 申請書作成`,
          description: '必要な情報を入力してください。',
          sections: Object.entries(categorizedQuestions).map(([category, qs], index) => ({
            id: `section-${index}`,
            title: category,
            required: true,
            questions: qs.map(q => ({
              id: q.id,
              type: q.type as any,
              question: q.question,
              required: q.required,
              hint: q.hint,
              maxLength: q.validation?.maxLength,
              unit: q.id.includes('千円') ? '千円' : undefined,
              options: q.options
            }))
          }))
        };
        
        setQuestionnaire(questionnaire);
        
        // 基本質問の回答から一部の項目を自動入力
        const initialData: any = {};
        if (questionnaireData.employeeCount) {
          initialData.employeeCount = questionnaireData.employeeCount;
        }
        if (questionnaireData.annualRevenue) {
          initialData.annualRevenue = questionnaireData.annualRevenue;
        }
        setFormData(initialData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    loadQuestionnaire();
  }, [selectedSubsidy, questionnaireData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    sessionStorage.setItem('companyData', JSON.stringify(formData));
    
    if (isLoggedIn) {
      const project: SavedProject = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        subsidyType: selectedSubsidy,
        subsidyName: selectedSubsidy === 'it-donyu' ? 'IT導入補助金2025' : 
                     selectedSubsidy === 'monozukuri' ? 'ものづくり補助金' : 
                     '小規模事業者持続化補助金',
        companyData: formData,
        questionnaireData,
        status: 'draft'
      };
      
      saveProject(project);
    }
    
    navigate('/document-output');
  };

  const handleChange = (field: string, value: any) => {
    const newData = { ...formData };
    newData[field] = value;
    setFormData(newData);
  };

  const renderField = (question: Question) => {
    switch (question.type) {
      case 'text':
      case 'date':
        return (
          <input
            type={question.type}
            required={question.required}
            value={formData[question.id] || ''}
            onChange={(e) => handleChange(question.id, e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '16px'
            }}
            placeholder={question.hint}
          />
        );
        
      case 'number':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              required={question.required}
              value={formData[question.id] || ''}
              onChange={(e) => handleChange(question.id, e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder={question.hint}
            />
            {question.unit && <span>{question.unit}</span>}
          </div>
        );
        
      case 'textarea':
        return (
          <textarea
            required={question.required}
            rows={4}
            maxLength={question.maxLength}
            value={formData[question.id] || ''}
            onChange={(e) => handleChange(question.id, e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '16px'
            }}
            placeholder={question.hint}
          />
        );
        
      case 'select':
        const selectValue = formData[question.id] || '';
        return (
          <select
            id={question.id}
            name={question.id}
            required={question.required}
            value={selectValue}
            onChange={(e) => {
              const val = e.target.value;
              handleChange(question.id, val);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '16px',
              backgroundColor: 'white',
              cursor: 'pointer',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none'
            }}
          >
            <option value="">選択してください</option>
            {question.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
      case 'radio':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {question.options?.map((option) => (
              <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={formData[question.id] === option.value}
                  onChange={(e) => handleChange(question.id, e.target.value)}
                  required={question.required}
                />
                <div>
                  <span>{option.label}</span>
                  {option.description && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                      {option.description}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        );
        
      case 'multiselect':
        const currentValue = formData[question.id] || [];
        const selectedValues = Array.isArray(currentValue) ? currentValue : [];
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {question.options?.map((option) => {
              const isChecked = selectedValues.includes(option.value);
              const checkboxId = `${question.id}-${option.value}`;
              
              return (
                <label 
                  key={option.value} 
                  htmlFor={checkboxId}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <input
                    id={checkboxId}
                    type="checkbox"
                    value={option.value}
                    checked={isChecked}
                    onChange={() => {
                      const newValues = isChecked 
                        ? selectedValues.filter((v: string) => v !== option.value)
                        : [...selectedValues, option.value];
                      handleChange(question.id, newValues);
                    }}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <p>質問票を読み込んでいます...</p>
      </div>
    );
  }

  if (error || !questionnaire) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: '#dc2626' }}>{error || '質問票の読み込みに失敗しました'}</p>
        <button
          onClick={() => navigate('/subsidy-list')}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          補助金選択に戻る
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>{questionnaire.title}</h2>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>{questionnaire.description}</p>
      
      <form onSubmit={handleSubmit}>
        {questionnaire.sections.map((section, sectionIndex) => (
          <div
            key={section.id}
            style={{
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '24px'
            }}
          >
            <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>
              {section.title}
              {section.required && <span style={{ color: 'red', marginLeft: '8px' }}>*</span>}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {section.questions.map((question) => (
                <div key={question.id}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    {question.question}
                    {question.required && <span style={{ color: 'red', marginLeft: '4px' }}>*</span>}
                  </label>
                  {renderField(question)}
                  {question.hint && question.type !== 'text' && question.type !== 'number' && (
                    <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>
                      {question.hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/subsidy-list')}
            style={{
              padding: '12px 32px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            戻る
          </button>
          <button
            type="submit"
            style={{
              padding: '12px 32px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            申請書類を作成
          </button>
        </div>
      </form>
    </div>
  );
};

// ===== 4. 書類出力 =====
const DocumentOutput: React.FC<{ isLoggedIn: boolean }> = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');
  const questionnaireData = JSON.parse(sessionStorage.getItem('questionnaireAnswers') || '{}');
  const selectedSubsidy = sessionStorage.getItem('selectedSubsidy') || '';
  
  const subsidyName = selectedSubsidy === 'it-donyu' ? 'IT導入補助金2025' : 
                     selectedSubsidy === 'monozukuri' ? 'ものづくり補助金' : 
                     '小規模事業者持続化補助金';

  const handleDownload = async (format: 'excel' | 'pdf') => {
    try {
      const { generateExcelFile, generatePDFFile } = await import('./utils/exportUtils');
      
      const exportData = {
        companyData,
        questionnaireData,
        subsidyType: selectedSubsidy,
        subsidyName
      };
      
      if (format === 'excel') {
        generateExcelFile(exportData);
      } else if (format === 'pdf') {
        generatePDFFile(exportData);
      }
    } catch (error) {
      console.error('ダウンロードエラー:', error);
      alert(`${format.toUpperCase()}形式でのダウンロードに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  // フィールドラベルのマッピング
  const fieldLabels: { [key: string]: string } = {
    // 基本情報
    company_name: '法人名（商号）',
    companyName: '法人名（商号）',
    company_name_kana: '法人名（フリガナ）',
    companyNameKana: '法人名（フリガナ）',
    corporate_number: '法人番号',
    corporateNumber: '法人番号',
    establishment_date: '設立年月日',
    establishmentDate: '設立年月日',
    capital: '資本金',
    representative_name: '代表者氏名',
    representativeName: '代表者氏名',
    contact_person: '担当者氏名',
    contactPerson: '担当者氏名',
    contact_email: 'メールアドレス',
    contactEmail: 'メールアドレス',
    contact_phone: '電話番号',
    contactPhone: '電話番号',
    employee_count: '従業員数',
    employeeCount: '従業員数',
    annual_revenue: '年間売上高',
    annualRevenue: '年間売上高',
    
    // 事業内容
    business_description: '事業内容',
    businessDescription: '事業内容',
    main_business: '主な事業内容',
    target_customers: '主な顧客層',
    sales_area: '主な商圏',
    
    // IT導入補助金
    it_tool_category: '導入予定のITツールカテゴリ',
    implementation_purpose: 'IT導入の目的と期待効果',
    implementation_cost: '導入予定費用',
    
    // ものづくり補助金
    project_title: '事業計画名',
    project_category: '申請枠',
    innovation_type: '革新的サービスの内容',
    current_challenges: '現在の課題・問題点',
    solution_approach: '課題解決のアプローチ',
    expected_outcome: '期待される成果・効果',
    total_project_cost: '事業総額',
    subsidy_request_amount: '補助金申請額',
    equipment_cost: '機械装置・システム構築費',
    outsourcing_cost: '外注費',
    
    // 持続化補助金
    business_type: '事業形態',
    current_issues: '現在の経営課題',
    expansion_strategy: '販路開拓の取組内容',
    expected_results: '期待される効果',
    total_cost: '補助事業に要する経費総額',
    subsidy_amount: '補助金申請額',
    advertising_cost: '広報費',
    website_cost: 'ウェブサイト関連費',
    exhibition_cost: '展示会等出展費'
  };

  // カテゴリごとのフィールドグループ
  const fieldCategories = {
    basic: ['company_name', 'companyName', 'company_name_kana', 'companyNameKana', 'corporate_number', 'corporateNumber', 
            'establishment_date', 'establishmentDate', 'capital', 'representative_name', 'representativeName'],
    contact: ['contact_person', 'contactPerson', 'contact_email', 'contactEmail', 'contact_phone', 'contactPhone'],
    business: ['employee_count', 'employeeCount', 'annual_revenue', 'annualRevenue', 'business_description', 
               'businessDescription', 'main_business', 'target_customers', 'sales_area', 'business_type'],
    itSpecific: ['it_tool_category', 'implementation_purpose', 'implementation_cost'],
    monozukuriSpecific: ['project_title', 'project_category', 'innovation_type', 'current_challenges', 
                         'solution_approach', 'expected_outcome', 'total_project_cost', 'subsidy_request_amount', 
                         'equipment_cost', 'outsourcing_cost'],
    jizokukaSpecific: ['current_issues', 'expansion_strategy', 'expected_results', 'total_cost', 
                       'subsidy_amount', 'advertising_cost', 'website_cost', 'exhibition_cost']
  };

  // 値のフォーマット
  const formatValue = (key: string, value: any): string => {
    if (!value) return '未入力';
    
    if (key.includes('cost') || key.includes('amount') || key === 'capital' || key.includes('revenue')) {
      // 金額のフォーマット
      return `${Number(value).toLocaleString()} 円`;
    }
    
    if (key.includes('count')) {
      // 人数のフォーマット
      return `${value} 名`;
    }
    
    if (key.includes('date')) {
      // 日付のフォーマット
      try {
        return new Date(value).toLocaleDateString('ja-JP');
      } catch {
        return value;
      }
    }
    
    return value;
  };

  // フィールドのレンダリング
  const renderFields = (fields: string[], data: any) => {
    return fields
      .filter(field => data[field] !== undefined && data[field] !== null && data[field] !== '')
      .map(field => (
        <tr key={field} style={{ borderBottom: '1px solid #e5e7eb' }}>
          <td style={{ padding: '12px', fontWeight: '500', width: '40%' }}>
            {fieldLabels[field] || field}
          </td>
          <td style={{ padding: '12px' }}>
            {formatValue(field, data[field])}
          </td>
        </tr>
      ));
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <h2 style={{ fontSize: '28px', marginBottom: '32px' }}>申請書類プレビュー</h2>
      
      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
          {subsidyName} 申請書
        </h3>
        
        {/* 基本情報 */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '20px', marginBottom: '16px', borderBottom: '2px solid #2563eb', paddingBottom: '8px' }}>
            1. 基本情報
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {renderFields(fieldCategories.basic, companyData)}
            </tbody>
          </table>
        </div>

        {/* 連絡先情報 */}
        {renderFields(fieldCategories.contact, companyData).length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '20px', marginBottom: '16px', borderBottom: '2px solid #2563eb', paddingBottom: '8px' }}>
              2. 連絡先情報
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {renderFields(fieldCategories.contact, companyData)}
              </tbody>
            </table>
          </div>
        )}

        {/* 事業概要 */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '20px', marginBottom: '16px', borderBottom: '2px solid #2563eb', paddingBottom: '8px' }}>
            3. 事業概要
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {renderFields(fieldCategories.business, companyData)}
            </tbody>
          </table>
        </div>

        {/* 初期診断結果 */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '20px', marginBottom: '16px', borderBottom: '2px solid #2563eb', paddingBottom: '8px' }}>
            4. 初期診断結果
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontWeight: '500', width: '40%' }}>事業形態</td>
                <td style={{ padding: '12px' }}>
                  {questionnaireData.businessType === 'manufacturing' ? '製造業' :
                   questionnaireData.businessType === 'retail' ? '小売業' :
                   questionnaireData.businessType === 'service' ? 'サービス業' :
                   questionnaireData.businessType === 'it' ? 'IT関連' : 'その他'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontWeight: '500' }}>現在の経営課題</td>
                <td style={{ padding: '12px' }}>
                  {questionnaireData.currentChallenges === 'efficiency' ? '業務効率化' :
                   questionnaireData.currentChallenges === 'sales' ? '売上拡大' :
                   questionnaireData.currentChallenges === 'cost' ? 'コスト削減' :
                   questionnaireData.currentChallenges === 'innovation' ? '新商品・サービス開発' : '人材育成・確保'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontWeight: '500' }}>IT/デジタル化の現状</td>
                <td style={{ padding: '12px' }}>
                  {questionnaireData.digitalizationLevel === 'none' ? 'ほとんど導入していない' :
                   questionnaireData.digitalizationLevel === 'basic' ? '基本的なツールのみ' :
                   questionnaireData.digitalizationLevel === 'partial' ? '一部業務で活用' : '積極的に活用中'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontWeight: '500' }}>想定投資予算</td>
                <td style={{ padding: '12px' }}>
                  {questionnaireData.budgetRange === 'under-500k' ? '50万円未満' :
                   questionnaireData.budgetRange === '500k-1m' ? '50万〜100万円' :
                   questionnaireData.budgetRange === '1m-3m' ? '100万〜300万円' :
                   questionnaireData.budgetRange === '3m-5m' ? '300万〜500万円' : '500万円以上'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 補助金別の詳細情報 */}
        {selectedSubsidy === 'it-donyu' && renderFields(fieldCategories.itSpecific, companyData).length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '20px', marginBottom: '16px', borderBottom: '2px solid #2563eb', paddingBottom: '8px' }}>
              5. IT導入計画
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {renderFields(fieldCategories.itSpecific, companyData)}
              </tbody>
            </table>
          </div>
        )}

        {selectedSubsidy === 'monozukuri' && renderFields(fieldCategories.monozukuriSpecific, companyData).length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '20px', marginBottom: '16px', borderBottom: '2px solid #2563eb', paddingBottom: '8px' }}>
              5. 事業計画詳細
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {renderFields(fieldCategories.monozukuriSpecific, companyData)}
              </tbody>
            </table>
          </div>
        )}

        {selectedSubsidy === 'jizokuka' && renderFields(fieldCategories.jizokukaSpecific, companyData).length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '20px', marginBottom: '16px', borderBottom: '2px solid #2563eb', paddingBottom: '8px' }}>
              5. 販路開拓計画
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {renderFields(fieldCategories.jizokukaSpecific, companyData)}
              </tbody>
            </table>
          </div>
        )}

        {/* その他の入力項目 */}
        {(() => {
          const allDefinedFields = Object.values(fieldCategories).flat();
          const otherFields = Object.keys(companyData).filter(
            key => !allDefinedFields.includes(key) && companyData[key]
          );
          
          if (otherFields.length > 0) {
            return (
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '20px', marginBottom: '16px', borderBottom: '2px solid #2563eb', paddingBottom: '8px' }}>
                  6. その他の情報
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {renderFields(otherFields, companyData)}
                  </tbody>
                </table>
              </div>
            );
          }
          return null;
        })()}
      </div>
      
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/input-form')}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          編集に戻る
        </button>
        <button
          onClick={() => handleDownload('excel')}
          style={{
            backgroundColor: '#16a34a',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Excel形式でダウンロード
        </button>
        <button
          onClick={() => handleDownload('pdf')}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          PDF形式でダウンロード
        </button>
      </div>
    </div>
  );
};

// ===== ログインページ =====
const LoginPage: React.FC<{ onLogin: (email: string) => void }> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 簡易的なログイン処理（実際にはAPIを呼ぶ）
    if (email && password) {
      onLogin(email);
      navigate('/mypage');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>ログイン</h2>
        
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
                padding: '8px 12px',
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
                padding: '8px 12px',
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
          アカウントをお持ちでない方は
          <br />
          <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }}>
            新規登録
          </a>
        </p>
      </div>
    </div>
  );
};

// ===== マイページ =====
const MyPage: React.FC<{ savedProjects: SavedProject[] }> = ({ savedProjects }) => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <h2 style={{ fontSize: '32px', marginBottom: '32px' }}>マイページ</h2>
      
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>保存されたプロジェクト</h3>
        
        {savedProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <p style={{ marginBottom: '16px' }}>保存されたプロジェクトはありません</p>
            <button
              onClick={() => navigate('/')}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              新規申請を開始
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {savedProjects.map((project) => (
              <div
                key={project.id}
                style={{
                  padding: '20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '18px', marginBottom: '4px' }}>{project.subsidyName}</h4>
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>
                    {project.companyData.companyName} | {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      padding: '4px 8px',
                      backgroundColor: project.status === 'completed' ? '#d1fae5' : '#fef3c7',
                      color: project.status === 'completed' ? '#065f46' : '#92400e',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    {project.status === 'completed' ? '完了' : '下書き'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    // プロジェクトのデータを復元
                    sessionStorage.setItem('questionnaireAnswers', JSON.stringify(project.questionnaireData));
                    sessionStorage.setItem('selectedSubsidy', project.subsidyType);
                    sessionStorage.setItem('companyData', JSON.stringify(project.companyData));
                    navigate('/document-output');
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  詳細を見る
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '12px 32px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          新規申請を開始
        </button>
      </div>
    </div>
  );
};

export default App;