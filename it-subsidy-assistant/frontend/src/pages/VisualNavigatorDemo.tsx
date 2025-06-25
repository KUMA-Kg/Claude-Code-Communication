import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EnhancedVisualAINavigator from '../components/visual-navigator/EnhancedVisualAINavigator';
import { CompanyProfile } from '../types/navigator';
import { Building2, ChevronRight, Sparkles, BarChart3, Zap } from 'lucide-react';

const VisualNavigatorDemo: React.FC = () => {
  const navigate = useNavigate();
  const [showNavigator, setShowNavigator] = useState(false);
  const [selectedSubsidy, setSelectedSubsidy] = useState<string | null>(null);
  
  // デモ用の企業プロファイル
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    companySize: 15,
    industry: 'manufacturing',
    annualRevenue: 100000000,
    currentChallenges: ['efficiency', 'digitalization', 'cost_reduction'],
    investmentBudget: 5000000,
    digitalizationLevel: 'basic',
    previousSubsidies: [],
  });

  const handleSubsidySelect = (subsidyId: string) => {
    setSelectedSubsidy(subsidyId);
    console.log('Selected subsidy:', subsidyId);
  };

  const handleProfileUpdate = (field: keyof CompanyProfile, value: any) => {
    setCompanyProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const subsidyInfo = {
    'it-donyu': {
      title: 'IT導入補助金2025',
      description: 'デジタル化による生産性向上を支援',
      benefits: ['最大450万円の補助', '補助率最大3/4', 'クラウドサービス利用料も対象'],
    },
    'monozukuri': {
      title: 'ものづくり補助金',
      description: '革新的な製品・サービス開発を支援',
      benefits: ['最大1,250万円の補助', '試作品開発も対象', '設備投資に最適'],
    },
    'jizokuka': {
      title: '小規模事業者持続化補助金',
      description: '小規模事業者の販路開拓を支援',
      benefits: ['最大200万円の補助', '幅広い経費が対象', '申請書類が比較的簡単'],
    },
    'jigyosaikochiku': {
      title: '事業再構築補助金',
      description: '事業転換・新分野展開を支援',
      benefits: ['最大1.5億円の補助', '大規模な事業転換に対応', '建物費も補助対象'],
    },
    'shoene': {
      title: '省エネ補助金',
      description: '省エネルギー設備の導入を支援',
      benefits: ['最大1,000万円の補助', 'エネルギーコスト削減', '環境負荷低減'],
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* ヘッダー */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Visual AI Navigator</h1>
            </div>
            <button
              onClick={() => navigate('/integrated-demo')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              統合デモに戻る
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!showNavigator ? (
          <div className="space-y-8">
            {/* イントロダクション */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">
                3D空間で最適な補助金を探索
              </h2>
              <p className="text-lg text-gray-200 mb-6">
                あなたの企業情報を入力すると、AIが最適な補助金への経路を3D空間で可視化します。
                インタラクティブな体験で、複雑な補助金制度を直感的に理解できます。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 p-4 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-blue-400 mb-2" />
                  <h3 className="font-semibold mb-1">AIマッチング</h3>
                  <p className="text-sm text-gray-300">
                    企業データを分析し、最適な補助金を自動推奨
                  </p>
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                  <Zap className="w-8 h-8 text-yellow-400 mb-2" />
                  <h3 className="font-semibold mb-1">3Dビジュアライゼーション</h3>
                  <p className="text-sm text-gray-300">
                    補助金の関係性を立体的に表現
                  </p>
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                  <Building2 className="w-8 h-8 text-green-400 mb-2" />
                  <h3 className="font-semibold mb-1">インタラクティブ体験</h3>
                  <p className="text-sm text-gray-300">
                    マウス操作で自由に探索可能
                  </p>
                </div>
              </div>
            </div>

            {/* 企業プロファイル入力 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">
                企業プロファイル設定
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    従業員数
                  </label>
                  <input
                    type="number"
                    value={companyProfile.companySize}
                    onChange={(e) => handleProfileUpdate('companySize', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    業種
                  </label>
                  <select
                    value={companyProfile.industry}
                    onChange={(e) => handleProfileUpdate('industry', e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="manufacturing">製造業</option>
                    <option value="retail">小売業</option>
                    <option value="service">サービス業</option>
                    <option value="it">IT・情報通信業</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    年間売上高（円）
                  </label>
                  <input
                    type="number"
                    value={companyProfile.annualRevenue}
                    onChange={(e) => handleProfileUpdate('annualRevenue', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    投資予算（円）
                  </label>
                  <input
                    type="number"
                    value={companyProfile.investmentBudget}
                    onChange={(e) => handleProfileUpdate('investmentBudget', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    デジタル化レベル
                  </label>
                  <select
                    value={companyProfile.digitalizationLevel}
                    onChange={(e) => handleProfileUpdate('digitalizationLevel', e.target.value as any)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="none">未導入</option>
                    <option value="basic">基本的</option>
                    <option value="intermediate">中級</option>
                    <option value="advanced">高度</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    現在の課題（複数選択可）
                  </label>
                  <div className="space-y-2">
                    {['efficiency', 'digitalization', 'cost_reduction', 'sales_expansion'].map(challenge => (
                      <label key={challenge} className="flex items-center gap-2 text-sm text-gray-200">
                        <input
                          type="checkbox"
                          checked={companyProfile.currentChallenges.includes(challenge)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleProfileUpdate('currentChallenges', [...companyProfile.currentChallenges, challenge]);
                            } else {
                              handleProfileUpdate('currentChallenges', companyProfile.currentChallenges.filter(c => c !== challenge));
                            }
                          }}
                          className="rounded border-white/20 bg-white/10 text-blue-400 focus:ring-blue-400"
                        />
                        {challenge === 'efficiency' ? '業務効率化' :
                         challenge === 'digitalization' ? 'デジタル化' :
                         challenge === 'cost_reduction' ? 'コスト削減' :
                         '販路拡大'}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setShowNavigator(true)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  3Dナビゲーターを起動
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 3Dナビゲーター */}
            <EnhancedVisualAINavigator
              companyProfile={companyProfile}
              onSubsidySelect={handleSubsidySelect}
            />

            {/* 選択された補助金の詳細 */}
            {selectedSubsidy && subsidyInfo[selectedSubsidy as keyof typeof subsidyInfo] && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-3">
                  {subsidyInfo[selectedSubsidy as keyof typeof subsidyInfo].title}
                </h3>
                <p className="text-gray-200 mb-4">
                  {subsidyInfo[selectedSubsidy as keyof typeof subsidyInfo].description}
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold">主な特徴：</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {subsidyInfo[selectedSubsidy as keyof typeof subsidyInfo].benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => navigate(`/subsidy/${selectedSubsidy}`)}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    詳細を見る
                  </button>
                  <button
                    onClick={() => navigate(`/diagnosis?subsidy=${selectedSubsidy}`)}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    診断を開始
                  </button>
                </div>
              </div>
            )}

            {/* 操作説明 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-3">操作方法</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                <div>
                  <strong>回転：</strong> マウスドラッグ
                </div>
                <div>
                  <strong>ズーム：</strong> マウスホイール
                </div>
                <div>
                  <strong>選択：</strong> ノードをクリック
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setShowNavigator(false)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                プロファイル設定に戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualNavigatorDemo;