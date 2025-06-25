import React from 'react';
import { useNavigate } from 'react-router-dom';

export const JigyouSaikouchikuDocumentGuidePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          padding: '40px',
          borderRadius: '16px',
          marginBottom: '32px',
          boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)'
        }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>
            事業再構築補助金 申請ガイド
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.9 }}>
            ポストコロナ時代の経済社会の変化に対応するための事業再構築を支援
          </p>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            <p style={{ margin: 0, fontWeight: '600' }}>
              ⚠️ 重要：第13回公募（2025年2月7日）で新規受付終了
            </p>
          </div>
        </div>

        {/* 補助金概要 */}
        <section style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#ef4444' }}>
            📋 補助金概要
          </h2>
          
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
              対象事業者
            </h3>
            <ul style={{ lineHeight: '1.8', color: '#4b5563' }}>
              <li>中小企業（資本金・従業員数の要件あり）</li>
              <li>中堅企業（資本金10億円未満等）</li>
              <li>事業再構築指針に沿った事業計画を策定する事業者</li>
            </ul>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
              補助上限額・補助率
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>枠</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>従業員数</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>補助上限</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>補助率</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowSpan={3} style={{ padding: '12px', border: '1px solid #e5e7eb' }}>成長枠（通常）</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>20人以下</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>1,500万円</td>
                  <td rowSpan={3} style={{ padding: '12px', border: '1px solid #e5e7eb' }}>中小1/2<br/>中堅1/3</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>21〜50人</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>3,000万円</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>51人以上</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>6,000万円</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>グリーン成長枠</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>-</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>最大1億円</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>中小1/2<br/>中堅1/3</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 必須要件 */}
        <section style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#ef4444' }}>
            ✅ 必須要件（全て満たす必要があります）
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gap: '16px' 
          }}>
            <div style={{
              padding: '20px',
              background: '#fef3c7',
              borderRadius: '8px',
              borderLeft: '4px solid #f59e0b'
            }}>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>1. 事業再構築要件</h4>
              <p style={{ margin: 0, color: '#6b7280' }}>
                事業再構築指針に示す「事業再構築」の定義に該当する事業であること
              </p>
            </div>
            
            <div style={{
              padding: '20px',
              background: '#dbeafe',
              borderRadius: '8px',
              borderLeft: '4px solid #3b82f6'
            }}>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>2. 認定支援機関要件</h4>
              <p style={{ margin: 0, color: '#6b7280' }}>
                認定経営革新等支援機関の確認を受けた事業計画であること
              </p>
            </div>
            
            <div style={{
              padding: '20px',
              background: '#d1fae5',
              borderRadius: '8px',
              borderLeft: '4px solid #10b981'
            }}>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>3. 付加価値額要件</h4>
              <p style={{ margin: 0, color: '#6b7280' }}>
                補助事業終了後3〜5年で付加価値額を年3〜4%以上増加させること
              </p>
            </div>
          </div>
        </section>

        {/* 申請に必要な書類 */}
        <section style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#ef4444' }}>
            📄 申請に必要な書類
          </h2>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>必須書類</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
                <li>事業計画書（様式指定）</li>
                <li>認定経営革新等支援機関による確認書</li>
                <li>金融機関による確認書</li>
                <li>決算書（直近2年間）</li>
                <li>従業員数を示す書類</li>
              </ul>
            </div>
            
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>該当する場合に必要な書類</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
                <li>成長枠：市場拡大要件を説明する書類</li>
                <li>グリーン成長枠：グリーン成長戦略の課題解決に資することを説明する書類</li>
                <li>大規模賃金引上枠：賃金引上計画書</li>
                <li>卒業促進枠：成長に係る事業計画書</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 申請の流れ */}
        <section style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#ef4444' }}>
            🚀 申請の流れ
          </h2>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            {[
              { step: 1, title: '事前準備', desc: 'GビズIDプライムアカウントの取得、必要書類の準備' },
              { step: 2, title: '事業計画策定', desc: '認定経営革新等支援機関と連携して事業計画を策定' },
              { step: 3, title: '電子申請', desc: 'jGrants（電子申請システム）から申請' },
              { step: 4, title: '審査', desc: '書面審査・必要に応じて面接審査' },
              { step: 5, title: '採択通知', desc: '採択結果の通知、交付申請' },
              { step: 6, title: '事業実施', desc: '交付決定後、事業を実施' }
            ].map((item) => (
              <div key={item.step} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{
                  minWidth: '40px',
                  height: '40px',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {item.step}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>{item.title}</h4>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* アクションボタン */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600',
              border: '2px solid #e5e7eb',
              background: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            戻る
          </button>
          <button
            onClick={() => navigate('/input-form/jigyou-saikouchiku')}
            style={{
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
            }}
          >
            申請書類を作成する
          </button>
        </div>
      </div>
    </div>
  );
};

export default JigyouSaikouchikuDocumentGuidePage;