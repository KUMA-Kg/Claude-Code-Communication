import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { 
  TrendingUp, 
  Award, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';

interface MatchingResult {
  id: string;
  subsidy_id: string;
  match_score: number;
  reasons: string[];
  subsidy: {
    name: string;
    description: string;
    subsidy_amount_max: number;
    subsidy_rate: number;
    application_end: string;
    category: string;
  };
}

interface AIMatchingDashboardProps {
  questionnaireData?: Record<string, any>;
  onSelectSubsidy?: (subsidyId: string) => void;
}

export const AIMatchingDashboard: React.FC<AIMatchingDashboardProps> = ({
  questionnaireData,
  onSelectSubsidy
}) => {
  const { user } = useAuth();
  const [matchingResults, setMatchingResults] = useState<MatchingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'amount' | 'deadline'>('score');

  // リアルタイムでマッチング結果を取得
  const { data: realtimeResults, refetch } = useRealtimeData({
    table: 'matching_results',
    filter: user ? `user_id.eq.${user.id}` : undefined,
    select: `
      id,
      matched_subsidies,
      created_at,
      subsidies:subsidy_id (
        id,
        name,
        description,
        subsidy_amount_max,
        subsidy_rate,
        application_end,
        category
      )
    `,
    onInsert: (payload) => {
      console.log('新しいマッチング結果:', payload.new);
      processMatchingResults([payload.new]);
    }
  });

  // マッチング結果の処理
  const processMatchingResults = (results: any[]) => {
    if (!results || results.length === 0) return;

    const latestResult = results[0];
    if (latestResult.matched_subsidies) {
      const processed = latestResult.matched_subsidies.map((match: any) => ({
        id: `${latestResult.id}-${match.subsidy_id}`,
        subsidy_id: match.subsidy_id,
        match_score: match.match_score,
        reasons: match.reasons,
        subsidy: match.subsidy // バックエンドで結合される
      }));
      setMatchingResults(processed);
    }
  };

  useEffect(() => {
    if (realtimeResults) {
      processMatchingResults(realtimeResults);
    }
  }, [realtimeResults]);

  // AIマッチング実行
  const runAIMatching = async () => {
    if (!user || !questionnaireData) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-matching', {
        body: {
          user_id: user.id,
          questionnaire_data: questionnaireData
        }
      });

      if (error) throw error;

      // 結果はリアルタイムで更新される
      console.log('AIマッチング開始:', data);
    } catch (error) {
      console.error('AIマッチングエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // フィルタリングとソート
  const filteredResults = matchingResults
    .filter(result => {
      if (filter === 'all') return true;
      if (filter === 'high') return result.match_score >= 80;
      if (filter === 'medium') return result.match_score >= 60 && result.match_score < 80;
      if (filter === 'low') return result.match_score < 60;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.match_score - a.match_score;
      if (sortBy === 'amount') return b.subsidy.subsidy_amount_max - a.subsidy.subsidy_amount_max;
      if (sortBy === 'deadline') {
        return new Date(a.subsidy.application_end).getTime() - new Date(b.subsidy.application_end).getTime();
      }
      return 0;
    });

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return '#16a34a'; // green
    if (score >= 60) return '#d97706'; // orange
    return '#dc2626'; // red
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return '高適合';
    if (score >= 60) return '中適合';
    return '低適合';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return '締切済み';
    if (days === 0) return '本日締切';
    if (days <= 7) return `あと${days}日`;
    return date.toLocaleDateString('ja-JP');
  };

  const exportResults = () => {
    const csvData = filteredResults.map(result => ({
      補助金名: result.subsidy.name,
      マッチ度: `${result.match_score}%`,
      最大補助額: formatCurrency(result.subsidy.subsidy_amount_max),
      補助率: `${result.subsidy.subsidy_rate * 100}%`,
      締切: formatDeadline(result.subsidy.application_end),
      理由: result.reasons.join('; ')
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `マッチング結果_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="ai-matching-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <TrendingUp className="title-icon" />
            AIマッチング結果
          </h1>
          <p className="dashboard-subtitle">
            あなたの回答に基づいて最適な補助金をAIが分析しました
          </p>
        </div>

        <div className="header-actions">
          <button
            onClick={runAIMatching}
            disabled={loading || !questionnaireData}
            className="refresh-button"
          >
            <RefreshCw className={`refresh-icon ${loading ? 'spinning' : ''}`} />
            {loading ? '分析中...' : '再分析'}
          </button>

          {filteredResults.length > 0 && (
            <button onClick={exportResults} className="export-button">
              <Download className="export-icon" />
              CSV出力
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-controls">
        <div className="filter-controls">
          <div className="filter-group">
            <Filter className="filter-icon" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">すべて表示</option>
              <option value="high">高適合 (80%以上)</option>
              <option value="medium">中適合 (60-79%)</option>
              <option value="low">低適合 (60%未満)</option>
            </select>
          </div>

          <div className="sort-group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="score">適合度順</option>
              <option value="amount">補助額順</option>
              <option value="deadline">締切順</option>
            </select>
          </div>
        </div>

        <div className="results-summary">
          <span className="results-count">
            {filteredResults.length}件の結果
          </span>
        </div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="loading-overlay"
          >
            <div className="loading-content">
              <div className="loading-spinner-large" />
              <p>AIが最適な補助金を分析中...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="results-grid">
        <AnimatePresence>
          {filteredResults.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ delay: index * 0.1 }}
              className="result-card"
              onClick={() => onSelectSubsidy?.(result.subsidy_id)}
            >
              <div className="card-header">
                <div className="match-score-badge" style={{ backgroundColor: getMatchScoreColor(result.match_score) }}>
                  <Award className="badge-icon" />
                  <span className="score-value">{result.match_score}%</span>
                  <span className="score-label">{getMatchScoreLabel(result.match_score)}</span>
                </div>

                <div className="subsidy-info">
                  <h3 className="subsidy-name">{result.subsidy.name}</h3>
                  <p className="subsidy-category">{result.subsidy.category}</p>
                </div>
              </div>

              <div className="card-content">
                <div className="subsidy-details">
                  <div className="detail-item">
                    <DollarSign className="detail-icon" />
                    <span className="detail-label">最大補助額</span>
                    <span className="detail-value">
                      {formatCurrency(result.subsidy.subsidy_amount_max)}
                    </span>
                  </div>

                  <div className="detail-item">
                    <CheckCircle className="detail-icon" />
                    <span className="detail-label">補助率</span>
                    <span className="detail-value">
                      {(result.subsidy.subsidy_rate * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="detail-item">
                    <Clock className="detail-icon" />
                    <span className="detail-label">締切</span>
                    <span className={`detail-value ${new Date(result.subsidy.application_end) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'urgent' : ''}`}>
                      {formatDeadline(result.subsidy.application_end)}
                    </span>
                  </div>
                </div>

                <div className="match-reasons">
                  <h4 className="reasons-title">
                    <AlertCircle className="reasons-icon" />
                    適合理由
                  </h4>
                  <ul className="reasons-list">
                    {result.reasons.map((reason, idx) => (
                      <li key={idx} className="reason-item">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="card-footer">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSubsidy?.(result.subsidy_id);
                  }}
                  className="select-button"
                >
                  この補助金で申請する
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredResults.length === 0 && !loading && (
        <div className="empty-state">
          <TrendingUp className="empty-icon" />
          <h3>マッチング結果がありません</h3>
          <p>質問票にご回答いただき、AIマッチングを実行してください。</p>
          {questionnaireData && (
            <button onClick={runAIMatching} className="retry-button">
              AIマッチングを実行
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .ai-matching-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background-color: #f8fafc;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          background: white;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          flex: 1;
        }

        .dashboard-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .title-icon {
          width: 32px;
          height: 32px;
          color: #3b82f6;
        }

        .dashboard-subtitle {
          color: #6b7280;
          font-size: 1.1rem;
          line-height: 1.6;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .refresh-button, .export-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-button {
          background: #3b82f6;
          color: white;
        }

        .refresh-button:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .export-button {
          background: #10b981;
          color: white;
        }

        .export-button:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .refresh-icon.spinning {
          animation: spin 1s linear infinite;
        }

        .dashboard-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .filter-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .filter-group, .sort-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-icon {
          width: 20px;
          height: 20px;
          color: #6b7280;
        }

        .filter-select, .sort-select {
          padding: 0.5rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          cursor: pointer;
        }

        .filter-select:focus, .sort-select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .results-summary {
          color: #6b7280;
          font-weight: 500;
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .loading-content {
          background: white;
          padding: 3rem;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .loading-spinner-large {
          width: 48px;
          height: 48px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .result-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.3s;
          cursor: pointer;
          overflow: hidden;
        }

        .result-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .match-score-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          color: white;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .badge-icon {
          width: 16px;
          height: 16px;
        }

        .score-value {
          font-size: 1.1rem;
          font-weight: 700;
        }

        .score-label {
          font-size: 0.875rem;
        }

        .subsidy-name {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .subsidy-category {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .card-content {
          padding: 1.5rem;
        }

        .subsidy-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .detail-icon {
          width: 18px;
          height: 18px;
          color: #3b82f6;
          flex-shrink: 0;
        }

        .detail-label {
          color: #6b7280;
          font-size: 0.875rem;
          flex: 1;
        }

        .detail-value {
          font-weight: 600;
          color: #1f2937;
        }

        .detail-value.urgent {
          color: #dc2626;
        }

        .match-reasons {
          background: #fef7ff;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e879f9;
        }

        .reasons-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #7c3aed;
          margin-bottom: 0.75rem;
        }

        .reasons-icon {
          width: 16px;
          height: 16px;
        }

        .reasons-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .reason-item {
          padding: 0.25rem 0;
          color: #6b46c1;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .reason-item:before {
          content: "• ";
          color: #8b5cf6;
          font-weight: bold;
          margin-right: 0.5rem;
        }

        .card-footer {
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
          background: #f8fafc;
        }

        .select-button {
          width: 100%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .select-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          color: #9ca3af;
          margin: 0 auto 1rem;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #6b7280;
          margin-bottom: 2rem;
        }

        .retry-button {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.875rem 2rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .retry-button:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .ai-matching-dashboard {
            padding: 1rem;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
          }

          .header-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .dashboard-controls {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .filter-controls {
            flex-wrap: wrap;
          }

          .results-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};