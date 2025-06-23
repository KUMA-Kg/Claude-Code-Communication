import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subsidyDetailedQuestions } from '../data/subsidy-questions-detailed';

interface Question {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'radio' | 'date' | 'multiselect';
  question: string;
  required: boolean;
  hint?: string;
  maxLength?: number;
  unit?: string;
  options?: Array<{ value: string; label: string; description?: string }>;
  aiGenerated?: boolean; // AI生成されたフィールドかどうか
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

interface SavedProject {
  id: string;
  createdAt: string;
  subsidyType: string;
  subsidyName: string;
  companyData: any;
  questionnaireData: any;
  status: 'draft' | 'completed';
}

const EnhancedInputForm: React.FC<{
  isLoggedIn: boolean;
  saveProject: (project: SavedProject) => void;
}> = ({ isLoggedIn, saveProject }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<any>({});
  const [questionnaire, setQuestionnaire] = useState<SubsidyQuestionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<{[key: string]: string}>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const selectedSubsidy = sessionStorage.getItem('selectedSubsidy') || '';
  const questionnaireData = JSON.parse(sessionStorage.getItem('questionnaireAnswers') || '{}');

  useEffect(() => {
    loadQuestionnaire();
    generateAIContent();
  }, [selectedSubsidy, questionnaireData]);

  const loadQuestionnaire = () => {
    try {
      setLoading(true);
      
      const questions = subsidyDetailedQuestions[selectedSubsidy];
      if (!questions) {
        const debugQuestionnaire: SubsidyQuestionnaire = {
          title: '申請書作成フォーム',
          description: '以下の項目を入力してください。AIが自動生成した内容は編集可能です。',
          sections: [{
            id: 'company-info',
            title: '事業者情報',
            required: true,
            questions: [
              {
                id: 'companyName',
                type: 'text',
                question: '事業者名',
                required: true,
                hint: '正式な法人名・屋号を入力してください'
              },
              {
                id: 'representativeName',
                type: 'text',
                question: '代表者氏名',
                required: true
              },
              {
                id: 'businessDescription',
                type: 'textarea',
                question: '事業内容',
                required: true,
                hint: 'AI生成されたサンプル文章を編集できます',
                aiGenerated: true
              },
              {
                id: 'projectPlan',
                type: 'textarea',
                question: '事業計画',
                required: true,
                hint: '具体的な事業計画を記載してください',
                aiGenerated: true
              }
            ]
          }]
        };
        setQuestionnaire(debugQuestionnaire);
        setLoading(false);
        return;
      }

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
        description: '必要な情報を入力してください。AIが生成した文章は編集可能です。',
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
            options: q.options,
            aiGenerated: q.type === 'textarea' // テキストエリアはAI生成として扱う
          }))
        }))
      };
      
      setQuestionnaire(questionnaire);
      
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

  const generateAIContent = () => {
    // AIコンテンツのシミュレーション
    const aiContent: {[key: string]: string} = {
      businessDescription: `${questionnaireData.businessType === 'manufacturing' ? '製造業' : 
                           questionnaireData.businessType === 'retail' ? '小売業' : 
                           questionnaireData.businessType === 'service' ? 'サービス業' : 
                           questionnaireData.businessType === 'it' ? 'IT関連事業' : '各種事業'}を営む事業者として、
地域密着型のサービスを提供しており、顧客満足度の向上と事業の持続的成長を目指しています。
現在の主な課題である${questionnaireData.currentChallenges === 'efficiency' ? '業務効率化' : 
                    questionnaireData.currentChallenges === 'sales' ? '売上拡大' : 
                    questionnaireData.currentChallenges === 'cost' ? 'コスト削減' : 
                    questionnaireData.currentChallenges === 'innovation' ? '新商品・サービス開発' : '人材育成・確保'}に取り組み、
競争力の強化を図っています。`,
      
      projectPlan: `本事業では、${questionnaireData.budgetRange === 'under-500k' ? '50万円未満' : 
                   questionnaireData.budgetRange === '500k-1m' ? '50万円〜100万円' : 
                   questionnaireData.budgetRange === '1m-3m' ? '100万円〜300万円' : 
                   questionnaireData.budgetRange === '3m-5m' ? '300万円〜500万円' : '500万円以上'}の予算を活用し、
${questionnaireData.currentChallenges === 'efficiency' ? 'デジタル化による業務効率向上' : 
  questionnaireData.currentChallenges === 'sales' ? '新規顧客獲得と売上拡大' : 
  questionnaireData.currentChallenges === 'cost' ? '運営コストの最適化' : 
  questionnaireData.currentChallenges === 'innovation' ? '革新的サービスの開発' : '人材力強化'}を実現します。

具体的には以下の取り組みを行います：
1. 現状分析と課題の明確化
2. 最適なソリューションの導入
3. 効果測定と継続的改善
4. 地域貢献と持続可能な成長の実現

期待される効果として、売上向上、顧客満足度向上、業務効率化が見込まれます。`
    };
    
    setAiGeneratedContent(aiContent);
    
    // フォームデータにAI生成コンテンツを設定
    setFormData(prev => ({
      ...prev,
      ...aiContent
    }));
  };

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

  const regenerateAIContent = (fieldId: string) => {
    // AI再生成のシミュレーション
    const regeneratedContent = {
      businessDescription: `革新的な${questionnaireData.businessType === 'manufacturing' ? '製造技術' : 
                          questionnaireData.businessType === 'retail' ? '販売手法' : 
                          questionnaireData.businessType === 'service' ? 'サービス提供' : 
                          questionnaireData.businessType === 'it' ? 'IT技術' : '事業手法'}により、
市場のニーズに応える高品質なサービスを提供しています。持続可能な経営と社会貢献を両立させながら、
地域経済の発展に寄与する企業として成長を続けています。`,
      
      projectPlan: `デジタル変革を通じた事業革新により、競争優位性を確立します。
顧客体験の向上と業務プロセスの最適化を同時に実現し、持続的な成長基盤を構築します。

【実施内容】
• デジタル技術の戦略的導入
• 顧客接点の強化とサービス品質向上
• データ活用による経営効率化
• 人材育成とスキルアップ

【期待効果】
• 売上30%向上
• 業務効率50%改善
• 顧客満足度向上
• 地域貢献の拡大`
    };

    const newContent = regeneratedContent[fieldId as keyof typeof regeneratedContent];
    if (newContent) {
      setAiGeneratedContent(prev => ({
        ...prev,
        [fieldId]: newContent
      }));
      handleChange(fieldId, newContent);
    }
  };

  const renderField = (question: Question) => {
    const isAIField = question.aiGenerated && aiGeneratedContent[question.id];
    
    switch (question.type) {
      case 'text':
      case 'date':
        return (
          <div style={{ position: 'relative' }}>
            <input
              type={question.type}
              required={question.required}
              value={formData[question.id] || ''}
              onChange={(e) => handleChange(question.id, e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              placeholder={question.hint}
            />
          </div>
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
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              placeholder={question.hint}
            />
            {question.unit && (
              <span style={{ 
                padding: '12px 16px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                fontSize: '16px',
                color: '#6b7280'
              }}>
                {question.unit}
              </span>
            )}
          </div>
        );
        
      case 'textarea':
        return (
          <div style={{ position: 'relative' }}>
            {isAIField && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                padding: '8px 12px',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #3b82f6'
              }}>
                <span style={{ 
                  fontSize: '14px', 
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🤖 AI生成コンテンツ（編集可能）
                </span>
                <button
                  type="button"
                  onClick={() => regenerateAIContent(question.id)}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 再生成
                </button>
              </div>
            )}
            <textarea
              required={question.required}
              rows={6}
              maxLength={question.maxLength}
              value={formData[question.id] || ''}
              onChange={(e) => handleChange(question.id, e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: isAIField ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                resize: 'vertical',
                minHeight: '120px',
                outline: 'none',
                backgroundColor: isAIField ? '#f8fafc' : 'white'
              }}
              placeholder={question.hint}
            />
            {question.maxLength && (
              <div style={{ 
                textAlign: 'right', 
                fontSize: '12px', 
                color: '#6b7280',
                marginTop: '4px'
              }}>
                {(formData[question.id] || '').length} / {question.maxLength}
              </div>
            )}
          </div>
        );
        
      case 'select':
        return (
          <select
            required={question.required}
            value={formData[question.id] || ''}
            onChange={(e) => handleChange(question.id, e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: 'white',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="">選択してください</option>
            {question.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', marginBottom: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
        <p style={{ color: '#6b7280' }}>AIが申請書を準備しています...</p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (error || !questionnaire) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ 
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <p style={{ color: '#dc2626', margin: 0 }}>
            {error || '申請書の読み込みに失敗しました'}
          </p>
        </div>
        <button
          onClick={() => navigate('/subsidy-list')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          補助金選択に戻る
        </button>
      </div>
    );
  }

  const currentSection = questionnaire.sections[currentStep];
  const isLastStep = currentStep === questionnaire.sections.length - 1;

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f0f9ff',
      padding: '20px 0',
      position: 'relative'
    }}>
      {/* 戻るボタン */}
      <div style={{ 
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            backgroundColor: 'white',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '12px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: '500',
            color: '#1e40af',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = '#1e40af';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ← トップページに戻る
        </button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '60px' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
          }}>
            📝
          </div>
          <h1 style={{ 
            fontSize: '36px', 
            color: '#1e40af',
            marginBottom: '16px',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {questionnaire.title}
          </h1>
          <p style={{ 
            fontSize: '20px', 
            color: '#6b7280',
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px'
          }}>
            {questionnaire.description}
          </p>
          
          {/* プログレスインジケーター */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {questionnaire.sections.map((_, index) => {
              const isActive = currentStep === index;
              const isCompleted = index < currentStep;
              
              return (
                <React.Fragment key={index}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? '#22c55e' : isActive ? '#3b82f6' : '#d1d5db',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <span style={{
                      fontSize: '12px',
                      color: isActive ? '#3b82f6' : isCompleted ? '#22c55e' : '#6b7280',
                      fontWeight: isActive ? 'bold' : 'normal',
                      textAlign: 'center'
                    }}>
                      ステップ{index + 1}
                    </span>
                  </div>
                  
                  {index < questionnaire.sections.length - 1 && (
                    <div style={{
                      width: '40px',
                      height: '2px',
                      backgroundColor: isCompleted ? '#22c55e' : '#d1d5db',
                      marginTop: '-20px'
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <p style={{ color: '#6b7280', fontSize: '16px', fontWeight: '500' }}>
            ステップ {currentStep + 1} / {questionnaire.sections.length}
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            marginBottom: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#3b82f6',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                📋
              </div>
              <h2 style={{ 
                fontSize: '28px', 
                margin: 0,
                color: '#1e40af',
                fontWeight: 'bold'
              }}>
                {currentSection.title}
                {currentSection.required && <span style={{ color: '#ef4444', marginLeft: '8px' }}>*</span>}
              </h2>
            </div>
            <p style={{ 
              color: '#6b7280', 
              marginBottom: '32px',
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              以下の項目を入力してください。必須項目は * で表示されています。
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {currentSection.questions.map((question) => (
                <div key={question.id}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    fontSize: '16px',
                    color: '#374151'
                  }}>
                    {question.question}
                    {question.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                  </label>
                  {renderField(question)}
                  {question.hint && !question.aiGenerated && (
                    <p style={{ marginTop: '6px', fontSize: '14px', color: '#6b7280' }}>
                      💡 {question.hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* ナビゲーションボタン */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={() => {
                if (currentStep > 0) {
                  setCurrentStep(currentStep - 1);
                } else {
                  navigate('/');
                }
              }}
              style={{
                padding: '16px 24px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              ← {currentStep > 0 ? '前のステップ' : 'トップページに戻る'}
            </button>
            
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              alignItems: 'center',
              padding: '8px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              {questionnaire.sections.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: index === currentStep ? '#3b82f6' : 
                                     index < currentStep ? '#10b981' : '#d1d5db',
                    transition: 'all 0.3s',
                    boxShadow: index === currentStep ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none'
                  }}
                />
              ))}
            </div>
            
            {isLastStep ? (
              <button
                type="submit"
                style={{
                  padding: '16px 32px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(0, 0, 0, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
              >
                🚀 申請書を作成
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                style={{
                  padding: '16px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(0, 0, 0, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
              >
                次のステップ →
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedInputForm;