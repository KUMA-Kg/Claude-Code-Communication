import React, { useState, useEffect } from 'react';

// シンプルな補助金診断アプリ
export default function SimpleSubsidyApp() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [view, setView] = useState<'questionnaire' | 'subsidyList' | 'detailForm' | 'result'>('questionnaire');
  const [selectedSubsidy, setSelectedSubsidy] = useState<string>('');
  const [formData, setFormData] = useState<any>({});

  // ダークモード設定
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    document.body.classList.toggle('dark-mode');
  };

  // 6つの基本質問
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

  // 補助金リスト
  const subsidies = [
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

  // 補助金別の詳細質問
  const detailQuestions: { [key: string]: any[] } = {
    'it-donyu': [
      { id: 'companyName', label: '法人名', type: 'text', required: true },
      { id: 'representativeName', label: '代表者氏名', type: 'text', required: true },
      { id: 'contactEmail', label: 'メールアドレス', type: 'email', required: true },
      { id: 'itToolCategory', label: '導入予定のITツールカテゴリ', type: 'select', required: true,
        options: ['会計ソフト', 'CRM・SFA', 'グループウェア', 'ECサイト', 'その他'] },
      { id: 'implementationPurpose', label: 'IT導入の目的と期待効果', type: 'textarea', required: true },
      { id: 'implementationCost', label: '導入予定費用（万円）', type: 'number', required: true }
    ],
    'monozukuri': [
      { id: 'companyName', label: '法人名', type: 'text', required: true },
      { id: 'representativeName', label: '代表者氏名', type: 'text', required: true },
      { id: 'contactEmail', label: 'メールアドレス', type: 'email', required: true },
      { id: 'projectTitle', label: '事業計画名', type: 'text', required: true },
      { id: 'innovationType', label: '革新的サービスの内容', type: 'textarea', required: true },
      { id: 'expectedOutcome', label: '期待される成果・効果', type: 'textarea', required: true },
      { id: 'totalProjectCost', label: '事業総額（万円）', type: 'number', required: true }
    ],
    'jizokuka': [
      { id: 'companyName', label: '法人名', type: 'text', required: true },
      { id: 'representativeName', label: '代表者氏名', type: 'text', required: true },
      { id: 'contactEmail', label: 'メールアドレス', type: 'email', required: true },
      { id: 'currentIssues', label: '現在の経営課題', type: 'textarea', required: true },
      { id: 'expansionStrategy', label: '販路開拓の取組内容', type: 'textarea', required: true },
      { id: 'expectedResults', label: '期待される効果', type: 'textarea', required: true },
      { id: 'totalCost', label: '補助事業に要する経費総額（万円）', type: 'number', required: true }
    ]
  };

  // 質問への回答
  const handleAnswer = (value: string) => {
    const currentQuestion = questions[currentStep];
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 6問完了したら補助金リストへ
      setView('subsidyList');
    }
  };

  // 補助金選択
  const handleSelectSubsidy = (subsidyId: string) => {
    setSelectedSubsidy(subsidyId);
    setView('detailForm');
  };

  // 詳細フォーム送信
  const handleDetailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setView('result');
  };

  // エクスポート（簡易版）
  const handleExport = async (format: 'excel' | 'pdf') => {
    const data = {
      basicInfo: answers,
      selectedSubsidy: subsidies.find(s => s.id === selectedSubsidy),
      detailData: formData
    };

    // 簡易的なダウンロード処理
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `補助金申請書_${new Date().toLocaleDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`${format.toUpperCase()}形式での出力機能は準備中です。一時的にJSON形式でダウンロードしました。`);
  };

  // スタイル
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: darkMode ? '#1a1a1a' : '#f9fafb',
      color: darkMode ? '#ffffff' : '#111827',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      transition: 'all 0.3s ease'
    },
    header: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '40px',
      padding: '20px',
      backgroundColor: darkMode ? '#2a2a2a' : 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    content: {
      maxWidth: '800px',
      margin: '0 auto'
    },
    card: {
      backgroundColor: darkMode ? '#2a2a2a' : 'white',
      padding: '32px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginBottom: '24px'
    },
    button: {
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: '500',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: darkMode ? '#4a4a4a' : '#e5e7eb',
      color: darkMode ? '#ffffff' : '#374151'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      backgroundColor: darkMode ? '#4a4a4a' : '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '32px'
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#3b82f6',
      transition: 'width 0.3s ease'
    },
    input: {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      border: `1px solid ${darkMode ? '#4a4a4a' : '#e5e7eb'}`,
      borderRadius: '8px',
      backgroundColor: darkMode ? '#3a3a3a' : 'white',
      color: darkMode ? '#ffffff' : '#111827',
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      fontSize: '14px'
    }
  };

  // レンダリング
  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>IT補助金アシスタント</h1>
        <button
          onClick={toggleDarkMode}
          style={{
            ...styles.button,
            ...styles.secondaryButton,
            padding: '8px 16px'
          }}
        >
          {darkMode ? '☀️' : '🌙'} {darkMode ? 'ライトモード' : 'ダークモード'}
        </button>
      </div>

      <div style={styles.content}>
        {/* 質問フェーズ */}
        {view === 'questionnaire' && (
          <div style={styles.card}>
            <h2 style={{ fontSize: '28px', marginBottom: '24px', textAlign: 'center' }}>
              補助金診断
            </h2>

            {/* プログレスバー */}
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${((currentStep + 1) / questions.length) * 100}%`
                }}
              />
            </div>

            <p style={{ textAlign: 'center', marginBottom: '32px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
              質問 {currentStep + 1} / {questions.length}
            </p>

            <h3 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
              {questions[currentStep].question}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {questions[currentStep].options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  style={{
                    ...styles.button,
                    ...styles.secondaryButton,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? '#4a4a4a' : '#e5e7eb';
                    e.currentTarget.style.color = darkMode ? '#ffffff' : '#374151';
                  }}
                >
                  <span>{option.label}</span>
                  <span>→</span>
                </button>
              ))}
            </div>

            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                  marginTop: '24px'
                }}
              >
                ← 前の質問に戻る
              </button>
            )}
          </div>
        )}

        {/* 補助金リスト */}
        {view === 'subsidyList' && (
          <div>
            <h2 style={{ fontSize: '32px', marginBottom: '32px', textAlign: 'center' }}>
              おすすめの補助金
            </h2>

            {subsidies.map((subsidy) => (
              <div key={subsidy.id} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '24px', marginBottom: '8px', color: '#3b82f6' }}>
                      {subsidy.name}
                    </h3>
                    <p style={{ color: darkMode ? '#9ca3af' : '#6b7280', marginBottom: '16px' }}>
                      {subsidy.description}
                    </p>
                  </div>
                  <div style={{
                    backgroundColor: subsidy.matchScore >= 90 ? '#10b981' : '#f59e0b',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontWeight: 'bold'
                  }}>
                    マッチ度 {subsidy.matchScore}%
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <span style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>最大補助額</span>
                    <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>{subsidy.maxAmount}</p>
                  </div>
                  <div>
                    <span style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>補助率</span>
                    <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>{subsidy.subsidyRate}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectSubsidy(subsidy.id)}
                  style={{
                    ...styles.button,
                    ...styles.primaryButton,
                    width: '100%'
                  }}
                >
                  この補助金で申請を進める →
                </button>
              </div>
            ))}

            <button
              onClick={() => {
                setCurrentStep(0);
                setAnswers({});
                setView('questionnaire');
              }}
              style={{
                ...styles.button,
                ...styles.secondaryButton,
                display: 'block',
                margin: '0 auto'
              }}
            >
              最初からやり直す
            </button>
          </div>
        )}

        {/* 詳細フォーム */}
        {view === 'detailForm' && (
          <div style={styles.card}>
            <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>
              {subsidies.find(s => s.id === selectedSubsidy)?.name} 申請情報入力
            </h2>

            <form onSubmit={handleDetailSubmit}>
              {detailQuestions[selectedSubsidy]?.map((question) => (
                <div key={question.id} style={{ marginBottom: '20px' }}>
                  <label style={styles.label}>
                    {question.label}
                    {question.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                  </label>
                  
                  {question.type === 'text' || question.type === 'email' || question.type === 'number' ? (
                    <input
                      type={question.type}
                      required={question.required}
                      value={formData[question.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [question.id]: e.target.value })}
                      style={styles.input}
                    />
                  ) : question.type === 'select' ? (
                    <select
                      required={question.required}
                      value={formData[question.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [question.id]: e.target.value })}
                      style={styles.input}
                    >
                      <option value="">選択してください</option>
                      {question.options.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : question.type === 'textarea' ? (
                    <textarea
                      required={question.required}
                      value={formData[question.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [question.id]: e.target.value })}
                      style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
                    />
                  ) : null}
                </div>
              ))}

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setView('subsidyList')}
                  style={{
                    ...styles.button,
                    ...styles.secondaryButton
                  }}
                >
                  戻る
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.button,
                    ...styles.primaryButton
                  }}
                >
                  申請書を作成
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 結果画面 */}
        {view === 'result' && (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>
                申請書類の準備が完了しました！
              </h2>
              <p style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '18px' }}>
                以下のボタンから申請書類をダウンロードできます
              </p>
            </div>

            <div style={{ backgroundColor: darkMode ? '#3a3a3a' : '#f3f4f6', padding: '24px', borderRadius: '8px', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>申請内容サマリー</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <span style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>選択した補助金：</span>
                  <strong>{subsidies.find(s => s.id === selectedSubsidy)?.name}</strong>
                </div>
                <div>
                  <span style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>法人名：</span>
                  <strong>{formData.companyName}</strong>
                </div>
                <div>
                  <span style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>申請日：</span>
                  <strong>{new Date().toLocaleDateString('ja-JP')}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px' }}>
              <button
                onClick={() => handleExport('excel')}
                style={{
                  ...styles.button,
                  backgroundColor: '#10b981',
                  color: 'white'
                }}
              >
                📊 Excel形式でダウンロード
              </button>
              <button
                onClick={() => handleExport('pdf')}
                style={{
                  ...styles.button,
                  backgroundColor: '#ef4444',
                  color: 'white'
                }}
              >
                📄 PDF形式でダウンロード
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setView('detailForm');
                }}
                style={{
                  ...styles.button,
                  ...styles.secondaryButton
                }}
              >
                内容を修正する
              </button>
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setAnswers({});
                  setFormData({});
                  setSelectedSubsidy('');
                  setView('questionnaire');
                }}
                style={{
                  ...styles.button,
                  ...styles.primaryButton
                }}
              >
                新規申請を開始
              </button>
            </div>

            <div style={{ 
              marginTop: '32px', 
              padding: '16px', 
              backgroundColor: darkMode ? '#1e3a8a' : '#dbeafe',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ color: darkMode ? '#93c5fd' : '#1e40af', margin: 0 }}>
                💡 申請書類の作成後は、各補助金の公式サイトから正式な申請手続きを行ってください
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}