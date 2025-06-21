import React from 'react';
import { Target, CheckCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { styles } from '../styles';

interface SubsidyMatch {
  subsidyType: string;
  subsidyName: string;
  score: number;
  matchLevel: 'high' | 'medium' | 'low';
  description: string;
  icon: string;
}

interface AkinatorAnswer {
  questionId: string;
  selectedValue: string;
}

interface SubsidyMatchResultProps {
  matches: SubsidyMatch[];
  answers: AkinatorAnswer[];
  onSelectSubsidy: (subsidyType: string) => void;
  onRetake: () => void;
}

const SubsidyMatchResult: React.FC<SubsidyMatchResultProps> = ({
  matches,
  answers,
  onSelectSubsidy,
  onRetake
}) => {
  const getMatchIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <CheckCircle size={24} color="#16a34a" />;
      case 'medium':
        return <AlertTriangle size={24} color="#eab308" />;
      case 'low':
        return <Info size={24} color="#6b7280" />;
      default:
        return <Info size={24} color="#6b7280" />;
    }
  };

  const getMatchStyles = (level: string) => {
    switch (level) {
      case 'high':
        return { borderColor: '#16a34a', backgroundColor: '#f0fdf4' };
      case 'medium':
        return { borderColor: '#eab308', backgroundColor: '#fefce8' };
      case 'low':
        return { borderColor: '#d1d5db', backgroundColor: '#f9fafb' };
      default:
        return { borderColor: '#d1d5db', backgroundColor: '#f9fafb' };
    }
  };

  const getMatchText = (level: string) => {
    switch (level) {
      case 'high':
        return '高適合';
      case 'medium':
        return '中適合';
      case 'low':
        return '低適合';
      default:
        return '適合度不明';
    }
  };

  const topMatch = matches[0];
  const hasHighMatch = matches.some(match => match.matchLevel === 'high');

  return (
    <div style={{ ...styles.container, maxWidth: '1200px' }}>
      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ ...styles.flex.center, gap: '12px', marginBottom: '16px' }}>
          <Target size={32} color="#2563eb" />
          <h1 style={styles.text.title}>判定結果</h1>
        </div>
        <p style={styles.text.subtitle}>
          あなたの事業に最適な補助金をお見つけしました
        </p>
      </div>

      {/* 結果サマリー */}
      <div style={{
        ...styles.card,
        background: 'linear-gradient(to right, #eff6ff, #e0e7ff)',
        marginBottom: '32px'
      }}>
        <div style={styles.flex.between}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>最適な補助金</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '48px' }}>{topMatch.icon}</span>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>{topMatch.subsidyName}</h3>
                <p style={{ color: '#6b7280' }}>{topMatch.description}</p>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#2563eb', marginBottom: '4px' }}>
              {topMatch.score}点
            </div>
            <div style={{
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: topMatch.matchLevel === 'high' ? '#dcfce7' : topMatch.matchLevel === 'medium' ? '#fef3c7' : '#f3f4f6',
              color: topMatch.matchLevel === 'high' ? '#166534' : topMatch.matchLevel === 'medium' ? '#92400e' : '#4b5563'
            }}>
              {getMatchText(topMatch.matchLevel)}
            </div>
          </div>
        </div>
      </div>

      {/* 全体結果 */}
      <div style={{ ...styles.grid, marginBottom: '32px' }}>
        {matches.map((match, index) => {
          const matchStyles = getMatchStyles(match.matchLevel);
          return (
            <div
              key={match.subsidyType}
              style={{
                ...styles.selectableCard,
                ...matchStyles,
                cursor: 'pointer'
              }}
              onClick={() => onSelectSubsidy(match.subsidyType)}
            >
              <div style={{ ...styles.flex.between, marginBottom: '16px' }}>
                <span style={{ fontSize: '36px' }}>{match.icon}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getMatchIcon(match.matchLevel)}
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{match.score}</span>
                </div>
              </div>
              
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                {match.subsidyName}
              </h3>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                {match.description}
              </p>
              
              <div style={styles.flex.between}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: match.matchLevel === 'high' ? '#dcfce7' : match.matchLevel === 'medium' ? '#fef3c7' : '#f3f4f6',
                  color: match.matchLevel === 'high' ? '#166534' : match.matchLevel === 'medium' ? '#92400e' : '#4b5563'
                }}>
                  {getMatchText(match.matchLevel)}
                </span>
                
                {index === 0 && (
                  <span style={{
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: '500'
                  }}>
                    おすすめ
                  </span>
                )}
              </div>

              <button style={{
                ...styles.button.secondary,
                width: '100%',
                marginTop: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid #e5e7eb'
              }}>
                <span>詳細を確認</span>
                <ArrowRight size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* 判定根拠 */}
      <div style={{ ...styles.card, marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>判定の根拠</h3>
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr', gap: '16px' }}>
          <div>
            <h4 style={{ fontWeight: '500', color: '#111827', marginBottom: '8px' }}>あなたの回答</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {answers.map((answer, index) => (
                <div key={answer.questionId} style={{ fontSize: '14px', color: '#6b7280' }}>
                  <span style={{ fontWeight: '500' }}>Q{index + 1}:</span> {answer.selectedValue}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontWeight: '500', color: '#111827', marginBottom: '8px' }}>適合度の詳細</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {matches.map((match) => (
                <div key={match.subsidyType} style={{ ...styles.flex.between, fontSize: '14px' }}>
                  <span style={{ color: '#6b7280' }}>{match.subsidyName}</span>
                  <span style={{ fontWeight: '500' }}>{match.score}点</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* アクション */}
      <div style={{ display: 'flex', flexDirection: window.innerWidth > 640 ? 'row' : 'column', justifyContent: 'center', gap: '16px' }}>
        {hasHighMatch ? (
          <button
            onClick={() => onSelectSubsidy(topMatch.subsidyType)}
            style={{ ...styles.button.primary, padding: '16px 32px' }}
          >
            <span>{topMatch.subsidyName}で申請を進める</span>
            <ArrowRight size={20} />
          </button>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              明確な適合補助金が見つかりませんでした。<br />
              条件を見直すか、詳細相談をおすすめします。
            </p>
            <button
              onClick={() => onSelectSubsidy(topMatch.subsidyType)}
              style={{ ...styles.button.primary, backgroundColor: '#4b5563' }}
            >
              それでも{topMatch.subsidyName}で進める
            </button>
          </div>
        )}
        
        <button
          onClick={onRetake}
          style={styles.button.secondary}
        >
          質問をやり直す
        </button>
      </div>

      {/* 注意事項 */}
      <div style={{
        marginTop: '32px',
        backgroundColor: '#fef3c7',
        border: '1px solid #fcd34d',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <AlertTriangle size={20} color="#f59e0b" style={{ marginTop: '2px' }} />
          <div style={{ fontSize: '14px', color: '#92400e' }}>
            <p style={{ fontWeight: '500', marginBottom: '4px' }}>ご注意</p>
            <p>この判定は目安です。実際の申請には詳細な要件確認が必要です。正式な申請前に、各補助金の公募要領をご確認ください。</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubsidyMatchResult;