import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: string;
  question: string;
  placeholder?: string;
  required: boolean;
  helpText?: string;
  type?: 'text' | 'textarea' | 'number' | 'select';
  options?: string[];
}

const ImprovedAIDocumentGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSubsidy, setSelectedSubsidy] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDocument, setEditedDocument] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const defaultApiKey = ''; // APIキーは環境変数または設定画面から取得してください
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || defaultApiKey);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  // APIキーが設定されていることを確実にする
  React.useEffect(() => {
    if (!apiKey) {
      setApiKey(defaultApiKey);
      localStorage.setItem('openai_api_key', defaultApiKey);
    }
  }, []);

  const subsidyTypes = [
    { id: 'it-donyu', name: 'IT導入補助金2025', description: '業務効率化のためのITツール導入支援' },
    { id: 'monozukuri', name: 'ものづくり補助金', description: '革新的な製品・サービス開発支援' },
    { id: 'jizokuka', name: '小規模事業者持続化補助金', description: '販路開拓・生産性向上支援' },
    { id: 'jigyou-saikouchiku', name: '事業再構築補助金', description: '事業転換・新分野展開支援' }
  ];

  const questionsByType: Record<string, Question[]> = {
    'it-donyu': [
      { id: 'companyName', question: '会社名', placeholder: '株式会社サンプル', required: true },
      { id: 'businessOverview', question: '事業概要', placeholder: '製造業向けの業務管理システムの開発・販売', required: true, type: 'textarea' },
      { id: 'challenge', question: '解決したい業務課題', placeholder: '受注管理の効率化、在庫管理の自動化など', required: true, type: 'textarea' },
      { id: 'budget', question: '投資予定額', placeholder: '300万円', required: true }
    ],
    'monozukuri': [
      { id: 'companyName', question: '会社名', placeholder: '株式会社サンプル製作所', required: true },
      { id: 'businessOverview', question: '事業概要', placeholder: '精密機械部品の製造・加工', required: true, type: 'textarea' },
      { id: 'innovation', question: '開発したい製品・技術', placeholder: 'AIを活用した自動検査システム', required: true, type: 'textarea' },
      { id: 'investment', question: '設備投資額', placeholder: '2,000万円', required: true }
    ],
    'jizokuka': [
      { id: 'companyName', question: '会社名・屋号', placeholder: '〇〇商店', required: true },
      { id: 'businessOverview', question: '事業概要', placeholder: '地域密着型の食品小売業', required: true, type: 'textarea' },
      { id: 'salesGoal', question: 'やりたいこと・目標', placeholder: 'ECサイト開設、新商品開発など', required: true, type: 'textarea' },
      { id: 'budget', question: '活用予定額', placeholder: '100万円', required: true }
    ],
    'jigyou-saikouchiku': [
      { id: 'companyName', question: '会社名', placeholder: '株式会社〇〇', required: true },
      { id: 'currentBusiness', question: '現在の事業内容', placeholder: '飲食店経営（居酒屋3店舗）', required: true, type: 'textarea' },
      { id: 'newBusiness', question: '新事業の内容', placeholder: 'デリバリー専門店、冷凍食品製造販売', required: true, type: 'textarea' },
      { id: 'investmentPlan', question: '投資計画', placeholder: '設備投資1,500万円、運転資金500万円', required: true }
    ]
  };

  const handleApiKeySave = () => {
    if (apiKey) {
      localStorage.setItem('openai_api_key', apiKey);
      setShowApiKeyDialog(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const getRequiredQuestionsCount = () => {
    const questions = questionsByType[selectedSubsidy] || [];
    return questions.filter(q => q.required).length;
  };

  const getAnsweredRequiredCount = () => {
    const questions = questionsByType[selectedSubsidy] || [];
    return questions.filter(q => q.required && answers[q.id]).length;
  };

  const canProceed = () => {
    if (currentStep === 0) return selectedSubsidy !== '';
    if (currentStep === 1) {
      const requiredCount = getRequiredQuestionsCount();
      const answeredCount = getAnsweredRequiredCount();
      return answeredCount === requiredCount;
    }
    return true;
  };

  const parseGeneratedText = (text: string) => {
    // 生成されたテキストを表示用にセクションに分ける簡単なパーサー
    const sections = [];
    const lines = text.split('\n');
    let currentSection = { title: '申請書類', content: '' };
    
    for (const line of lines) {
      if (line.match(/^[#*]|^\d+\.|^【|^■/)) {
        // 新しいセクションの開始
        if (currentSection.content.trim()) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/^[#*\d.【■\s]+/, '').replace(/】$/, ''),
          content: ''
        };
      } else if (line.trim()) {
        currentSection.content += line + '\n';
      }
    }
    
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }
    
    return sections.length > 0 ? sections : [{ title: '申請書類', content: text }];
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // APIキーの確認
    console.log('APIキー確認:', {
      apiKeyExists: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'なし'
    });
    
    try {
      const response = await fetch('http://localhost:3001/v1/ai-document/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          subsidyType: selectedSubsidy,
          subsidyName: subsidyTypes.find(s => s.id === selectedSubsidy)?.name || '',
          answers,
          companyData: {
            companyName: answers.companyName || '',
            businessOverview: answers.businessOverview || ''
          },
          apiKey: apiKey
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'AI生成に失敗しました');
      }

      const data = await response.json();
      // AIから返される文書は文字列として扱う
      const documentObject = {
        projectTitle: `${subsidyTypes.find(s => s.id === selectedSubsidy)?.name || ''} 申請書`,
        fullText: data.document || data.content || '文書が生成されませんでした',
        sections: parseGeneratedText(data.document || data.content || '')
      };
      setGeneratedDocument(documentObject);
      setEditedDocument(documentObject); // 編集用のコピーも作成
      setCurrentStep(2);
      
      // セッションストレージに保存
      sessionStorage.setItem('ai_generated_document', JSON.stringify(data.document));
      sessionStorage.setItem('subsidy_answers', JSON.stringify(answers));
      
    } catch (error) {
      console.error('生成エラー詳細:', error);
      
      // より詳細なエラー情報を表示
      let errorMessage = '文書生成中にエラーが発生しました。';
      if (error instanceof Error) {
        errorMessage += `\n詳細: ${error.message}`;
      }
      
      // デバッグ情報をコンソールに出力
      console.log('リクエストURL:', 'http://localhost:3001/v1/ai-document/generate');
      console.log('リクエストボディ:', JSON.stringify({
        subsidyType: selectedSubsidy,
        subsidyName: subsidyTypes.find(s => s.id === selectedSubsidy)?.name || '',
        answers,
        commonData: {
          companyName: answers.companyName || '',
          businessOverview: answers.businessOverview || ''
        }
      }, null, 2));
      console.log('APIキー存在:', !!apiKey);
      
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditToggle = () => {
    if (!isEditing && generatedDocument) {
      // 編集モードに入る時に編集用データを確実に初期化
      setEditedDocument({
        ...generatedDocument,
        sections: generatedDocument.sections ? [...generatedDocument.sections] : []
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSectionEdit = (sectionIndex: number, newContent: string) => {
    if (!editedDocument) return;
    
    const updatedSections = [...editedDocument.sections];
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      content: newContent
    };
    
    setEditedDocument({
      ...editedDocument,
      sections: updatedSections
    });
  };

  const handleTitleEdit = (newTitle: string) => {
    if (!editedDocument) return;
    
    setEditedDocument({
      ...editedDocument,
      projectTitle: newTitle
    });
  };

  const handleSaveEdits = () => {
    setGeneratedDocument(editedDocument);
    setIsEditing(false);
    // セッションストレージも更新
    sessionStorage.setItem('ai_generated_document', JSON.stringify(editedDocument));
  };

  const handleDownload = () => {
    const documentToDownload = isEditing ? editedDocument : generatedDocument;
    if (!documentToDownload) return;

    let content = '';
    
    if (documentToDownload.sections && documentToDownload.sections.length > 0) {
      content = `${documentToDownload.projectTitle || '補助金申請書'}\n\n`;
      documentToDownload.sections.forEach((section: any) => {
        content += `【${section.title}】\n${section.content}\n\n`;
      });
    } else {
      content = documentToDownload.fullText || '申請書が生成されませんでした。';
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSubsidy}_申請書_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (showApiKeyDialog) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
        }}>
          <h2 style={{ marginBottom: '16px' }}>APIキーの設定</h2>
          <p style={{ marginBottom: '24px', color: '#6b7280' }}>
            AI文書生成機能を利用するには、OpenAI APIキーが必要です。
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              marginBottom: '16px'
            }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleApiKeySave}
              disabled={!apiKey}
              style={{
                flex: 1,
                padding: '12px',
                background: apiKey ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: apiKey ? 'pointer' : 'not-allowed'
              }}
            >
              保存して続ける
            </button>
            <button
              onClick={() => navigate(-1)}
              style={{
                flex: 1,
                padding: '12px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '40px 20px',
      position: 'relative'
    }}>
      {/* グレーアウトオーバーレイ */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '24px',
            filter: 'grayscale(100%)',
            opacity: 0.5
          }}>
            🔒
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: '#1f2937'
          }}>
            この機能は現在利用できません
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '32px',
            lineHeight: 1.6
          }}>
            AI文書生成機能は、補助金診断を完了してからご利用ください。<br />
            まずはトップページから診断を開始してください。
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '16px 48px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }}
          >
            診断を開始する →
          </button>
        </div>
      </div>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        filter: 'blur(3px)',
        opacity: 0.3,
        pointerEvents: 'none'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '40px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          AI補助金申請書作成
        </h1>

        {/* ステップインジケーター */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '40px',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '10%',
            right: '10%',
            height: '2px',
            background: '#e5e7eb',
            zIndex: 0
          }} />
          {['補助金選択', '情報入力', 'AI生成・編集'].map((step, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 1,
                position: 'relative'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: currentStep >= index ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {index + 1}
              </div>
              <span style={{
                marginTop: '8px',
                fontSize: '14px',
                color: currentStep >= index ? '#4c51bf' : '#9ca3af'
              }}>
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* ステップ0: 補助金選択 */}
        {currentStep === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginBottom: '24px' }}>補助金を選択してください</h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {subsidyTypes.map(subsidy => (
                <div
                  key={subsidy.id}
                  onClick={() => setSelectedSubsidy(subsidy.id)}
                  style={{
                    padding: '20px',
                    border: `2px solid ${selectedSubsidy === subsidy.id ? '#667eea' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: selectedSubsidy === subsidy.id ? '#f0f4ff' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <h3 style={{ marginBottom: '8px', color: '#1f2937' }}>{subsidy.name}</h3>
                  <p style={{ margin: 0, color: '#6b7280' }}>{subsidy.description}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setCurrentStep(1)}
                disabled={!canProceed()}
                style={{
                  padding: '12px 32px',
                  background: canProceed() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: canProceed() ? 'pointer' : 'not-allowed'
                }}
              >
                次へ進む
              </button>
            </div>
          </div>
        )}

        {/* ステップ1: 情報入力 */}
        {currentStep === 1 && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginBottom: '8px' }}>必要な情報を入力してください</h2>
            <p style={{ marginBottom: '24px', color: '#6b7280' }}>
              必須項目: {getAnsweredRequiredCount()}/{getRequiredQuestionsCount()}
            </p>
            
            <div style={{ display: 'grid', gap: '24px' }}>
              {questionsByType[selectedSubsidy]?.map(question => (
                <div key={question.id}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    {question.question}
                    {question.required && <span style={{ color: '#ef4444' }}> *</span>}
                  </label>
                  {question.helpText && (
                    <p style={{ marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                      {question.helpText}
                    </p>
                  )}
                  {question.type === 'textarea' ? (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder={question.placeholder}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '16px',
                        resize: 'vertical'
                      }}
                    />
                  ) : (
                    <input
                      type={question.type || 'text'}
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder={question.placeholder}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setCurrentStep(0)}
                style={{
                  padding: '12px 32px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                戻る
              </button>
              <button
                onClick={handleGenerate}
                disabled={!canProceed() || isGenerating}
                style={{
                  padding: '12px 32px',
                  background: canProceed() && !isGenerating ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: canProceed() && !isGenerating ? 'pointer' : 'not-allowed'
                }}
              >
                {isGenerating ? 'AI生成中...' : 'AIで文書生成'}
              </button>
            </div>
          </div>
        )}

        {/* ステップ2: AI生成結果 */}
        {currentStep === 2 && generatedDocument && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2>AI生成済み申請書類</h2>
              <button
                onClick={handleEditToggle}
                style={{
                  padding: '8px 16px',
                  background: isEditing ? '#ef4444' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isEditing ? '📝 編集中' : '✏️ 編集'}
              </button>
            </div>
            
            <div style={{
              background: '#f9fafb',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '24px',
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              {/* タイトル編集 */}
              {isEditing ? (
                <input
                  type="text"
                  value={editedDocument?.projectTitle || ''}
                  onChange={(e) => handleTitleEdit(e.target.value)}
                  style={{
                    width: '100%',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: '16px',
                    padding: '8px',
                    border: '2px solid #667eea',
                    borderRadius: '6px',
                    background: 'white'
                  }}
                />
              ) : (
                <h3 style={{ marginBottom: '16px', color: '#1f2937' }}>
                  {generatedDocument.projectTitle || '補助金申請書'}
                </h3>
              )}
              
              {/* セクション表示・編集 */}
              {(isEditing ? editedDocument : generatedDocument)?.sections && (isEditing ? editedDocument : generatedDocument).sections.length > 0 ? (
                (isEditing ? editedDocument : generatedDocument).sections.map((section: any, index: number) => (
                  <div key={index} style={{ marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '8px', color: '#374151', fontWeight: '600' }}>
                      {section.title}
                    </h4>
                    {isEditing ? (
                      <textarea
                        value={section.content}
                        onChange={(e) => handleSectionEdit(index, e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: '120px',
                          padding: '12px',
                          border: '2px solid #667eea',
                          borderRadius: '8px',
                          fontSize: '14px',
                          lineHeight: 1.6,
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                      />
                    ) : (
                      <div 
                        style={{ 
                          whiteSpace: 'pre-wrap', 
                          lineHeight: 1.8, 
                          color: '#4b5563',
                          padding: '12px',
                          background: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        {section.content}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: 1.8, 
                  color: '#4b5563',
                  padding: '16px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  {(isEditing ? editedDocument : generatedDocument)?.fullText || '申請書が生成されませんでした。'}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setCurrentStep(1)}
                style={{
                  padding: '12px 32px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                入力に戻る
              </button>
              
              {isEditing && (
                <button
                  onClick={handleSaveEdits}
                  style={{
                    padding: '12px 32px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  💾 保存
                </button>
              )}
              
              <button
                onClick={handleDownload}
                style={{
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📥 ダウンロード
              </button>
              
              <button
                onClick={() => navigate('/completion')}
                style={{
                  padding: '12px 32px',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🚀 次へ進む
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovedAIDocumentGenerator;