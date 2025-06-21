import React, { useState } from 'react';
import { ArrowRight, FileText, Building, Target } from 'lucide-react';
import DetailedQuestionnaireForm from './DetailedQuestionnaireForm';

// デモ用のサンプル質問データ
const sampleQuestions = {
  'IT導入補助金2025': {
    frame: '通常枠',
    sections: [
      {
        title: '企業基本情報',
        questions: [
          { id: 'company_name', type: 'text', question: '法人名・屋号を正式名称で入力してください', required: true },
          { id: 'representative_name', type: 'text', question: '代表者氏名を入力してください', required: true },
          { id: 'annual_revenue', type: 'number', question: '年間売上高（前年度実績、万円）', required: true, unit: '万円' }
        ]
      },
      {
        title: 'ITツール詳細情報',
        questions: [
          { id: 'selected_it_tool', type: 'text', question: '導入予定のITツール名', required: true, hint: 'IT導入支援事業者と相談の上決定したツール名' },
          { id: 'it_tool_category', type: 'radio', question: 'ITツールのカテゴリー', required: true, options: [
            { value: 'category_5', label: 'カテゴリー5：情報収集・分析・活用システム', description: '顧客管理、在庫管理、売上分析等' },
            { value: 'category_6', label: 'カテゴリー6：営業支援システム', description: '営業管理、顧客対応、見積作成等' }
          ]},
          { id: 'current_business_issues', type: 'textarea', question: '現在の業務における課題・問題点', required: true, hint: 'ITツール導入前の業務上の課題を具体的に記載', maxLength: 1000 }
        ]
      }
    ]
  },
  'ものづくり補助金（第20次締切）': {
    frame: 'デジタル枠',
    sections: [
      {
        title: '企業基本情報',
        questions: [
          { id: 'company_name', type: 'text', question: '法人名・屋号を正式名称で入力してください', required: true },
          { id: 'established_date', type: 'date', question: '設立年月日', required: true },
          { id: 'industry_classification', type: 'select', question: '主要業種（日本標準産業分類）', required: true, options: [
            { value: 'manufacturing', label: '製造業' },
            { value: 'information_communication', label: '情報通信業' },
            { value: 'construction', label: '建設業' }
          ]}
        ]
      },
      {
        title: '革新的な取組み詳細',
        questions: [
          { id: 'project_title', type: 'text', question: '事業計画名（プロジェクト名）', required: true, hint: '革新的な取組みを表現する分かりやすい名称', maxLength: 100 },
          { id: 'innovation_content', type: 'textarea', question: '革新性の内容', required: true, hint: '従来との違い、何が革新的なのかを明確に記載', maxLength: 1500 }
        ]
      }
    ]
  },
  '小規模事業者持続化補助金（第17回）': {
    frame: '通常枠',
    sections: [
      {
        title: '企業基本情報',
        questions: [
          { id: 'business_type', type: 'radio', question: '事業形態', required: true, options: [
            { value: 'corporation', label: '法人' },
            { value: 'individual', label: '個人事業主' }
          ]},
          { id: 'chamber_of_commerce', type: 'text', question: '所属商工会・商工会議所名', required: true, hint: '本補助金は商工会・商工会議所の支援が必須です' }
        ]
      },
      {
        title: '販路開拓・マーケティング戦略',
        questions: [
          { id: 'target_market_analysis', type: 'textarea', question: 'ターゲット市場の分析', required: true, hint: '市場規模、顧客ニーズ、市場動向等', maxLength: 1000 },
          { id: 'new_customer_strategy', type: 'textarea', question: '新規顧客獲得戦略', required: true, hint: 'どのような方法で新規顧客を獲得するか', maxLength: 1000 }
        ]
      }
    ]
  }
};

const QuestionnaireDemo: React.FC = () => {
  const [selectedSubsidy, setSelectedSubsidy] = useState<string>('');
  const [showDetailedForm, setShowDetailedForm] = useState(false);

  const subsidies = [
    {
      id: 'IT導入補助金2025',
      name: 'IT導入補助金2025',
      icon: '💻',
      description: 'ITツール導入による業務効率化',
      frame: '通常枠'
    },
    {
      id: 'ものづくり補助金（第20次締切）',
      name: 'ものづくり補助金',
      icon: '🏭',
      description: '革新的な製品・サービス開発',
      frame: 'デジタル枠'
    },
    {
      id: '小規模事業者持続化補助金（第17回）',
      name: '小規模事業者持続化補助金',
      icon: '🏪',
      description: '販路開拓・マーケティング支援',
      frame: '通常枠'
    }
  ];

  const handleSubsidySelect = (subsidyId: string) => {
    setSelectedSubsidy(subsidyId);
    setShowDetailedForm(true);
  };

  const handleComplete = (answers: any) => {
    console.log('回答完了:', answers);
    alert('質問票が完了しました！実際のアプリケーションでは、ここで書類生成処理が開始されます。');
    setShowDetailedForm(false);
    setSelectedSubsidy('');
  };

  const handleBack = () => {
    setShowDetailedForm(false);
  };

  if (showDetailedForm) {
    return (
      <DetailedQuestionnaireForm
        subsidyType={selectedSubsidy}
        selectedFrame={sampleQuestions[selectedSubsidy as keyof typeof sampleQuestions]?.frame || ''}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <FileText className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">詳細質問票デモ</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          申請枠決定後の書類作成用質問フローです。<br />
          各補助金の詳細情報を収集し、正式な申請書類を自動生成します。
        </p>
      </div>

      {/* フロー説明 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">質問フロー</h2>
        <div className="flex items-center justify-center space-x-4 overflow-x-auto">
          <div className="flex items-center space-x-2 bg-white rounded-lg px-4 py-3 shadow-sm min-w-max">
            <Target className="h-5 w-5 text-green-600" />
            <span className="font-medium">申請枠決定済み</span>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
          <div className="flex items-center space-x-2 bg-blue-600 text-white rounded-lg px-4 py-3 shadow-sm min-w-max">
            <FileText className="h-5 w-5" />
            <span className="font-medium">詳細質問回答</span>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
          <div className="flex items-center space-x-2 bg-white rounded-lg px-4 py-3 shadow-sm min-w-max">
            <Building className="h-5 w-5 text-purple-600" />
            <span className="font-medium">書類自動生成</span>
          </div>
        </div>
      </div>

      {/* 補助金選択 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          試したい補助金を選択してください
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subsidies.map((subsidy) => (
            <div
              key={subsidy.id}
              onClick={() => handleSubsidySelect(subsidy.id)}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">{subsidy.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{subsidy.name}</h3>
                <p className="text-gray-600 mb-4">{subsidy.description}</p>
                <div className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full inline-block mb-4">
                  {subsidy.frame}で申請予定
                </div>
                <div className="flex items-center justify-center space-x-2 text-blue-600 font-medium">
                  <span>詳細質問を開始</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 機能説明 */}
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">詳細質問票の特徴</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 rounded-full p-1 mt-1">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">セクション別進行</h4>
                <p className="text-gray-600 text-sm">企業情報、事業内容、資金計画等のセクションに分けて段階的に入力</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 rounded-full p-1 mt-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">動的バリデーション</h4>
                <p className="text-gray-600 text-sm">リアルタイムでの入力チェックとエラー表示</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-purple-100 rounded-full p-1 mt-1">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">進捗可視化</h4>
                <p className="text-gray-600 text-sm">現在の進捗状況をプログレスバーで表示</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-yellow-100 rounded-full p-1 mt-1">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">多様な質問形式</h4>
                <p className="text-gray-600 text-sm">テキスト、選択肢、日付、数値など用途に応じた入力フォーム</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-red-100 rounded-full p-1 mt-1">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">一時保存機能</h4>
                <p className="text-gray-600 text-sm">途中での保存が可能で、後から続きを入力可能</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-indigo-100 rounded-full p-1 mt-1">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">自動書類生成</h4>
                <p className="text-gray-600 text-sm">回答完了後、正式な申請書類を自動生成</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireDemo;