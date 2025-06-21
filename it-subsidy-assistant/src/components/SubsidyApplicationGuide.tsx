/**
 * 補助金申請ガイドコンポーネント
 * 各補助金の申請ステップ、必要書類、スケジュールを可視化
 */

import React, { useState } from 'react';

export interface SubsidyType {
  id: 'it-donyu' | 'monozukuri' | 'jizokuka';
  name: string;
  description: string;
}

export interface ApplicationStep {
  step: number;
  title: string;
  duration: string;
  tasks: string[];
}

export interface RequiredDocument {
  name: string;
  obtainFrom: string;
  obtainDays: string;
  note: string;
  category: 'required' | 'conditional' | 'optional';
}

export interface SubsidyGuideData {
  id: string;
  name: string;
  totalDays: string;
  applicationSteps: ApplicationStep[];
  requiredDocuments: RequiredDocument[];
  importantNotes: string[];
  applicationSchedule: string[];
}

const subsidyGuides: SubsidyGuideData[] = [
  {
    id: 'it-donyu',
    name: 'IT導入補助金2025',
    totalDays: '45-77日',
    applicationSteps: [
      {
        step: 1,
        title: 'IT導入支援事業者選定',
        duration: '3-5日',
        tasks: [
          'IT導入支援事業者を検索',
          '導入したいITツールの相談',
          '支援事業者との契約'
        ]
      },
      {
        step: 2,
        title: 'ITツール選定',
        duration: '2-3日',
        tasks: [
          '事前登録されたITツールから選択',
          '見積書の取得',
          '導入計画の策定'
        ]
      },
      {
        step: 3,
        title: '申請準備',
        duration: '5-7日',
        tasks: [
          '実施内容説明書の作成',
          '価格説明書の作成',
          '必要書類の収集'
        ]
      },
      {
        step: 4,
        title: '電子申請',
        duration: '1-2日',
        tasks: [
          'IT事業者ポータルから申請',
          '申請内容の最終確認',
          '申請完了'
        ]
      },
      {
        step: 5,
        title: '交付決定',
        duration: '30-60日',
        tasks: [
          '審査',
          '交付決定通知',
          '事業開始'
        ]
      }
    ],
    requiredDocuments: [
      {
        name: '履歴事項全部証明書',
        obtainFrom: '法務局',
        obtainDays: '即日-3日',
        note: '発行3ヶ月以内',
        category: 'required'
      },
      {
        name: '納税証明書（その1,その2）',
        obtainFrom: '税務署',
        obtainDays: '即日-1週間',
        note: '直近のもの',
        category: 'required'
      },
      {
        name: '決算書（2期分）',
        obtainFrom: '自社保管',
        obtainDays: '-',
        note: '貸借対照表、損益計算書',
        category: 'required'
      },
      {
        name: 'gBizIDプライム',
        obtainFrom: 'オンライン',
        obtainDays: '2-3週間',
        note: '事前取得必須',
        category: 'required'
      }
    ],
    importantNotes: [
      'IT導入支援事業者が主導して申請',
      'ITツールは事前登録されたものから選択',
      '交付決定前の発注・契約・支払いは補助対象外'
    ],
    applicationSchedule: [
      'Day 1-5: IT導入支援事業者の選定・相談',
      'Day 6-8: 導入するITツールの選定・見積取得',
      'Day 9-15: 申請書類の準備・作成',
      'Day 16-17: 電子申請（IT事業者ポータル）',
      'Day 18-77: 審査期間（30-60日）',
      'Day 78: 交付決定通知'
    ]
  },
  {
    id: 'monozukuri',
    name: 'ものづくり補助金（第20次締切）',
    totalDays: '104-135日',
    applicationSteps: [
      {
        step: 1,
        title: '事業計画策定',
        duration: '14-21日',
        tasks: [
          '革新的な事業内容の検討',
          '具体的な実施計画の策定',
          '収益計画の作成'
        ]
      },
      {
        step: 2,
        title: '見積取得',
        duration: '5-7日',
        tasks: [
          '設備・システムの見積依頼',
          '相見積の取得（50万円以上）',
          '費用対効果の検証'
        ]
      },
      {
        step: 3,
        title: '書類準備',
        duration: '7-10日',
        tasks: [
          '事業計画書の最終化',
          'CAGR算出ツールで数値計算',
          '添付書類の収集'
        ]
      },
      {
        step: 4,
        title: '加点要素準備',
        duration: '3-5日',
        tasks: [
          'パートナーシップ構築宣言',
          '賃上げ表明書の作成',
          'その他加点書類の準備'
        ]
      },
      {
        step: 5,
        title: '電子申請',
        duration: '1-2日',
        tasks: [
          'GビズIDでログイン',
          '申請フォーム入力',
          '書類アップロード'
        ]
      },
      {
        step: 6,
        title: '採択通知',
        duration: '60-90日',
        tasks: [
          '審査',
          '採択発表',
          '交付申請'
        ]
      }
    ],
    requiredDocuments: [
      {
        name: '履歴事項全部証明書',
        obtainFrom: '法務局',
        obtainDays: '即日-3日',
        note: '発行3ヶ月以内',
        category: 'required'
      },
      {
        name: '決算書（直近2期分）',
        obtainFrom: '自社保管',
        obtainDays: '-',
        note: '個人は確定申告書',
        category: 'required'
      },
      {
        name: '見積書（相見積）',
        obtainFrom: '取引先',
        obtainDays: '3-7日',
        note: '50万円以上は相見積必須',
        category: 'required'
      },
      {
        name: 'GビズIDプライム',
        obtainFrom: 'オンライン',
        obtainDays: '2-3週間',
        note: '事前取得必須',
        category: 'required'
      },
      {
        name: '事業継続力強化計画認定書',
        obtainFrom: '経済産業局',
        obtainDays: '1-2ヶ月',
        note: '加点要素',
        category: 'optional'
      },
      {
        name: 'パートナーシップ構築宣言',
        obtainFrom: 'オンライン登録',
        obtainDays: '即日',
        note: '加点要素',
        category: 'optional'
      }
    ],
    importantNotes: [
      '事業計画書の革新性が最重要',
      '付加価値額年率3%以上の向上が必須',
      '交付決定後に発注・契約'
    ],
    applicationSchedule: [
      'Day 1-21: 事業計画書の作成',
      'Day 22-28: 設備・システムの見積取得',
      'Day 29-38: 申請書類の準備',
      'Day 39-43: 加点要素の準備（任意）',
      'Day 44-45: 電子申請（GビズID使用）',
      'Day 46-135: 審査期間（60-90日）',
      'Day 136: 採択発表'
    ]
  },
  {
    id: 'jizokuka',
    name: '小規模事業者持続化補助金（第17回）',
    totalDays: '93-123日',
    applicationSteps: [
      {
        step: 1,
        title: '商工会相談',
        duration: '3-5日',
        tasks: [
          '事業内容の説明',
          '補助対象経費の確認',
          '申請スケジュール調整'
        ]
      },
      {
        step: 2,
        title: '経営計画作成',
        duration: '7-10日',
        tasks: [
          '様式2: 経営計画書作成',
          '様式3: 補助事業計画書作成',
          '販路開拓の具体策検討'
        ]
      },
      {
        step: 3,
        title: '事業支援計画書',
        duration: '3-5日',
        tasks: [
          '商工会/商工会議所で発行依頼',
          '計画内容の最終確認',
          '必要な修正対応'
        ]
      },
      {
        step: 4,
        title: '見積取得',
        duration: '3-5日',
        tasks: [
          '補助対象経費の見積依頼',
          '税抜10万円以上は見積書必須',
          '仕様の明確化'
        ]
      },
      {
        step: 5,
        title: '書類準備',
        duration: '5-7日',
        tasks: [
          '決算書類の準備',
          '条件付き書類の確認',
          'チェックリストで最終確認'
        ]
      },
      {
        step: 6,
        title: '電子申請',
        duration: '1日',
        tasks: [
          'Jグランツでの申請',
          'すべての書類をアップロード',
          '申請完了確認'
        ]
      },
      {
        step: 7,
        title: '採択通知',
        duration: '60-90日',
        tasks: [
          '審査',
          '採択発表',
          '交付申請手続き'
        ]
      }
    ],
    requiredDocuments: [
      {
        name: '事業支援計画書',
        obtainFrom: '商工会/商工会議所',
        obtainDays: '3-5日',
        note: '発行に相談必須',
        category: 'required'
      },
      {
        name: '貸借対照表・損益計算書',
        obtainFrom: '自社保管',
        obtainDays: '-',
        note: '法人：直近1期分',
        category: 'required'
      },
      {
        name: '確定申告書',
        obtainFrom: '自己保管',
        obtainDays: '-',
        note: '個人：第一表・第二表',
        category: 'required'
      },
      {
        name: 'GビズIDプライム',
        obtainFrom: 'オンライン',
        obtainDays: '2-3週間',
        note: '電子申請に必須',
        category: 'required'
      },
      {
        name: '事業承継診断票',
        obtainFrom: '自社作成',
        obtainDays: '1日',
        note: '代表者60歳以上',
        category: 'conditional'
      },
      {
        name: '賃金台帳',
        obtainFrom: '自社保管',
        obtainDays: '-',
        note: '賃金引上げ枠',
        category: 'conditional'
      }
    ],
    importantNotes: [
      '商工会/商工会議所の支援が必須',
      '従業員数制限（商業・サービス業5人以下、製造業等20人以下）',
      '創業枠は専用様式を使用'
    ],
    applicationSchedule: [
      'Day 1-5: 商工会/商工会議所への相談',
      'Day 6-15: 経営計画書・補助事業計画書の作成',
      'Day 16-20: 事業支援計画書の取得',
      'Day 21-25: 見積書の取得',
      'Day 26-32: その他必要書類の準備',
      'Day 33: 電子申請（Jグランツ）',
      'Day 34-123: 審査期間（60-90日）',
      'Day 124: 採択発表'
    ]
  }
];

export const SubsidyApplicationGuide: React.FC = () => {
  const [selectedSubsidy, setSelectedSubsidy] = useState<string>('it-donyu');
  const currentGuide = subsidyGuides.find(g => g.id === selectedSubsidy)!;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 補助金選択タブ */}
      <div className="flex space-x-4 mb-8 border-b">
        {subsidyGuides.map(guide => (
          <button
            key={guide.id}
            onClick={() => setSelectedSubsidy(guide.id)}
            className={`px-6 py-3 font-medium transition-colors ${
              selectedSubsidy === guide.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {guide.name}
          </button>
        ))}
      </div>

      {/* ヘッダー情報 */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-2">{currentGuide.name}</h2>
        <p className="text-lg text-gray-700">
          申請準備から採択まで: <span className="font-bold text-blue-600">{currentGuide.totalDays}</span>
        </p>
      </div>

      {/* 申請ステップ */}
      <section className="mb-12">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">1</span>
          申請ステップ
        </h3>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
          {currentGuide.applicationSteps.map((step, index) => (
            <div key={step.step} className="relative flex items-start mb-8">
              <div className={`z-10 flex items-center justify-center w-16 h-16 rounded-full font-bold text-white ${
                index === 0 ? 'bg-blue-600' : 'bg-gray-400'
              }`}>
                {step.step}
              </div>
              <div className="ml-6 flex-1 bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-lg">{step.title}</h4>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {step.duration}
                  </span>
                </div>
                <ul className="space-y-2">
                  {step.tasks.map((task, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-700">{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 必要書類 */}
      <section className="mb-12">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">2</span>
          必要書類チェックリスト
        </h3>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">書類名</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">取得場所</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">取得期間</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">備考</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentGuide.requiredDocuments.map((doc, index) => (
                <tr key={index} className={doc.category === 'optional' ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {doc.category === 'required' && <span className="text-red-500 mr-2">*</span>}
                      {doc.category === 'optional' && <span className="text-blue-500 mr-2">+</span>}
                      <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{doc.obtainFrom}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{doc.obtainDays}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{doc.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 bg-gray-50 text-sm">
            <span className="text-red-500">* 必須書類</span>
            <span className="ml-4 text-blue-500">+ 加点要素（任意）</span>
          </div>
        </div>
      </section>

      {/* 申請スケジュール */}
      <section className="mb-12">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">3</span>
          申請スケジュール詳細
        </h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="space-y-3">
            {currentGuide.applicationSchedule.map((schedule, index) => (
              <div key={index} className="flex items-start">
                <span className="text-blue-600 mr-3">▶</span>
                <span className="text-gray-700">{schedule}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 重要ポイント */}
      <section className="mb-12">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <span className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">!</span>
          重要ポイント
        </h3>
        <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-6">
          <ul className="space-y-3">
            {currentGuide.importantNotes.map((note, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-600 mr-3">⚠️</span>
                <span className="text-gray-800">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* アクションボタン */}
      <div className="flex justify-center space-x-4">
        <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          この補助金の申請を開始する
        </button>
        <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
          PDFでダウンロード
        </button>
      </div>
    </div>
  );
};