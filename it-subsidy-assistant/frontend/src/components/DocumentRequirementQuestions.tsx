import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DocumentRequirementQuestionsProps {
  subsidyType: string;
  subsidyName: string;
  onComplete?: (requiredDocuments: any[]) => void;
}

interface RequirementAnswer {
  [key: string]: string | boolean;
}

const DocumentRequirementQuestions: React.FC<DocumentRequirementQuestionsProps> = ({ subsidyType, subsidyName, onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<RequirementAnswer>({});

  // 補助金ごとの資料判定設問
  const questionsBySubsidy: Record<string, Array<{
    id: string;
    question: string;
    type: 'radio' | 'select';
    options: Array<{ value: string; label: string }>;
    required: boolean;
  }>> = {
    'it-donyu': [
      {
        id: 'business_duration',
        question: '創業からの年数を教えてください',
        type: 'radio',
        options: [
          { value: 'under_1year', label: '1年未満' },
          { value: '1_2years', label: '1年以上2年未満' },
          { value: '2_3years', label: '2年以上3年未満' },
          { value: 'over_3years', label: '3年以上' }
        ],
        required: true
      },
      {
        id: 'it_tool_type',
        question: '導入予定のITツールの種類を選択してください',
        type: 'select',
        options: [
          { value: 'software', label: 'ソフトウェア（クラウドサービス含む）' },
          { value: 'hardware', label: 'ハードウェア' },
          { value: 'both', label: 'ソフトウェア＋ハードウェア' },
          { value: 'consulting', label: 'ITコンサルティング' }
        ],
        required: true
      },
      {
        id: 'it_vendor_selected',
        question: 'IT導入支援事業者は決定していますか？',
        type: 'radio',
        options: [
          { value: 'yes', label: 'はい（決定済み）' },
          { value: 'considering', label: '検討中' },
          { value: 'no', label: 'いいえ（未定）' }
        ],
        required: true
      },
      {
        id: 'labor_productivity_plan',
        question: '労働生産性向上の具体的な計画はありますか？',
        type: 'radio',
        options: [
          { value: 'detailed', label: '詳細な計画あり' },
          { value: 'rough', label: '概要レベルの計画あり' },
          { value: 'none', label: 'これから策定' }
        ],
        required: true
      }
    ],
    'monozukuri': [
      {
        id: 'business_duration',
        question: '創業からの年数を教えてください',
        type: 'radio',
        options: [
          { value: 'under_3years', label: '3年未満' },
          { value: '3_5years', label: '3年以上5年未満' },
          { value: '5_10years', label: '5年以上10年未満' },
          { value: 'over_10years', label: '10年以上' }
        ],
        required: true
      },
      {
        id: 'innovation_type',
        question: '実施予定の革新的取組を選択してください',
        type: 'select',
        options: [
          { value: 'new_product', label: '新商品（試作品）開発' },
          { value: 'new_service', label: '新サービス開発' },
          { value: 'new_process', label: '生産プロセス改善' },
          { value: 'new_delivery', label: '新たな提供方式の導入' }
        ],
        required: true
      },
      {
        id: 'support_organization',
        question: '認定経営革新等支援機関との連携状況は？',
        type: 'radio',
        options: [
          { value: 'contracted', label: '既に契約済み' },
          { value: 'negotiating', label: '交渉中' },
          { value: 'searching', label: '探している' },
          { value: 'unknown', label: '支援機関について知らない' }
        ],
        required: true
      },
      {
        id: 'wage_increase_plan',
        question: '賃金引上げ計画はありますか？',
        type: 'radio',
        options: [
          { value: 'yes_documented', label: 'あり（文書化済み）' },
          { value: 'yes_planning', label: 'あり（計画中）' },
          { value: 'considering', label: '検討中' },
          { value: 'no', label: 'なし' }
        ],
        required: true
      }
    ],
    'jizokuka': [
      {
        id: 'business_type',
        question: '事業形態を選択してください',
        type: 'radio',
        options: [
          { value: 'corporation', label: '法人' },
          { value: 'individual', label: '個人事業主' }
        ],
        required: true
      },
      {
        id: 'chamber_membership',
        question: '商工会・商工会議所の会員ですか？',
        type: 'radio',
        options: [
          { value: 'member', label: '会員である' },
          { value: 'applying', label: '入会申請中' },
          { value: 'non_member', label: '非会員' }
        ],
        required: true
      },
      {
        id: 'business_plan_status',
        question: '経営計画書の作成状況は？',
        type: 'radio',
        options: [
          { value: 'completed', label: '作成済み' },
          { value: 'in_progress', label: '作成中' },
          { value: 'with_support', label: '支援を受けながら作成中' },
          { value: 'not_started', label: '未着手' }
        ],
        required: true
      },
      {
        id: 'sales_channel_type',
        question: '販路開拓の主な方法は？',
        type: 'select',
        options: [
          { value: 'website', label: 'ウェブサイト制作・改修' },
          { value: 'advertising', label: '広告・宣伝' },
          { value: 'exhibition', label: '展示会・商談会' },
          { value: 'new_product', label: '新商品開発' },
          { value: 'multiple', label: '複数の方法を組み合わせ' }
        ],
        required: true
      }
    ]
  };

  const questions = questionsBySubsidy[subsidyType] || [];
  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  // 必要書類判定ロジック
  const determineRequiredDocuments = (subsidyType: string, answers: RequirementAnswer) => {
    const baseDocuments = {
      'it-donyu': [
        { id: 'application_form', name: '交付申請書', required: true },
        { id: 'business_plan', name: '事業計画書', required: true },
        { id: 'expense_breakdown', name: '経費内訳書', required: true },
        { id: 'quotation', name: '見積書', required: true }
      ],
      'monozukuri': [
        { id: 'application_form', name: '交付申請書', required: true },
        { id: 'business_plan', name: '事業計画書', required: true },
        { id: 'wage_increase_plan', name: '賃上げ計画書', required: true },
        { id: 'financial_statements', name: '決算書', required: true }
      ],
      'jizokuka': [
        { id: 'application_form', name: '様式1 申請書', required: true },
        { id: 'management_plan', name: '様式2 経営計画書', required: true },
        { id: 'project_plan', name: '様式3 補助事業計画書', required: true }
      ]
    };

    let documents = [...(baseDocuments[subsidyType as keyof typeof baseDocuments] || [])];

    // 回答に基づく追加書類の判定
    if (subsidyType === 'it-donyu') {
      if (answers.business_duration === 'under_1year') {
        documents.push({ id: 'startup_docs', name: '創業関連書類', required: true });
      }
      if (answers.it_vendor_selected === 'no') {
        documents.push({ id: 'vendor_selection', name: 'IT導入支援事業者選定理由書', required: true });
      }
    }

    if (subsidyType === 'monozukuri') {
      if (answers.support_organization === 'unknown') {
        documents.push({ id: 'support_org_info', name: '認定経営革新等支援機関情報', required: true });
      }
      if (answers.wage_increase_plan === 'no') {
        documents.push({ id: 'wage_explanation', name: '賃上げ計画説明書', required: true });
      }
    }

    if (subsidyType === 'jizokuka') {
      if (answers.chamber_membership === 'non_member') {
        documents.push({ id: 'chamber_application', name: '商工会議所入会申込書', required: true });
      }
      if (answers.business_plan_status === 'not_started') {
        documents.push({ id: 'plan_support', name: '経営計画書作成支援依頼書', required: true });
      }
    }

    return documents;
  };

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 回答を保存して次の画面へ
      const finalAnswers = { ...answers, [currentQuestion.id]: value };
      sessionStorage.setItem('documentRequirements', JSON.stringify(finalAnswers));
      
      // 必要書類を判定
      const requiredDocuments = determineRequiredDocuments(subsidyType, finalAnswers);
      
      if (onComplete) {
        onComplete(requiredDocuments);
      } else {
        navigate('/input-form');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/subsidy-list');
    }
  };

  if (questions.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <p>この補助金の設問が見つかりません</p>
        <button onClick={() => navigate('/subsidy-list')}>戻る</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
      <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>{subsidyName}</h2>
      <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '32px' }}>
        必要書類を判定するための質問にお答えください
      </p>
      
      {/* 進捗バー */}
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

      {/* 質問カード */}
      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '22px', marginBottom: '24px' }}>
          {currentQuestion.question}
        </h3>

        {currentQuestion.type === 'radio' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentQuestion.options.map((option) => (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  border: '2px solid',
                  borderColor: answers[currentQuestion.id] === option.value ? '#2563eb' : '#e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option.value}
                  checked={answers[currentQuestion.id] === option.value}
                  onChange={(e) => handleAnswer(e.target.value)}
                  style={{ marginRight: '12px', width: '20px', height: '20px' }}
                />
                <span style={{ fontSize: '16px' }}>{option.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <select
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">選択してください</option>
            {currentQuestion.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ナビゲーションボタン */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
        <button
          onClick={handleBack}
          style={{
            padding: '12px 24px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {currentStep === 0 ? '補助金選択に戻る' : '前の質問へ'}
        </button>
        
        {currentStep === questions.length - 1 && answers[currentQuestion.id] && (
          <button
            onClick={() => handleAnswer(answers[currentQuestion.id] as string)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            申請書作成へ進む
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentRequirementQuestions;