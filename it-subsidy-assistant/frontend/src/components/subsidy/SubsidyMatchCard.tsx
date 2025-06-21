import React from 'react';
import { motion } from 'framer-motion';
import { SubsidyMatch } from '../../types/subsidy';
import { useNavigate } from 'react-router-dom';

interface SubsidyMatchCardProps {
  subsidy: SubsidyMatch;
  isSelected: boolean;
  onSelect: (subsidyId: string) => void;
  rank: number;
}

const SubsidyMatchCard: React.FC<SubsidyMatchCardProps> = ({ subsidy, isSelected, onSelect, rank }) => {
  const navigate = useNavigate();

  const handleDetailClick = () => {
    sessionStorage.setItem('selectedSubsidy', subsidy.id);
    navigate('/document-requirements');
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 70) return '#2196F3';
    if (score >= 50) return '#FF9800';
    return '#9E9E9E';
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  return (
    <motion.div
      className={`subsidy-match-card ${isSelected ? 'selected' : ''}`}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      style={{
        borderColor: isSelected ? subsidy.color : '#e5e7eb',
        backgroundColor: isSelected ? `${subsidy.color}10` : '#ffffff'
      }}
    >
      <div className="subsidy-card-header">
        <div className="subsidy-card-title-wrapper">
          <h3 className="subsidy-card-title">
            {getRankIcon(rank)} {subsidy.name}
          </h3>
          <div className="subsidy-card-match-score" style={{ backgroundColor: getMatchScoreColor(subsidy.matchScore) }}>
            <span className="match-score-label">マッチ度</span>
            <span className="match-score-value">{subsidy.matchScore}%</span>
          </div>
        </div>
      </div>

      <p className="subsidy-card-description">{subsidy.description}</p>

      <div className="subsidy-card-details">
        <div className="subsidy-detail-item">
          <span className="detail-label">最大補助額</span>
          <span className="detail-value" style={{ color: subsidy.color }}>{subsidy.maxAmount}</span>
        </div>
        <div className="subsidy-detail-item">
          <span className="detail-label">補助率</span>
          <span className="detail-value">{subsidy.subsidyRate}</span>
        </div>
        <div className="subsidy-detail-item">
          <span className="detail-label">申請期間</span>
          <span className="detail-value">{subsidy.applicationPeriod}</span>
        </div>
      </div>

      <div className="subsidy-card-features">
        <h4 className="features-title">主な支援内容</h4>
        <ul className="features-list">
          {subsidy.features.map((feature, index) => (
            <li key={index} className="feature-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: subsidy.color }}>
                <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="subsidy-card-actions">
        <button
          className="btn btn-ghost btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(subsidy.id);
          }}
        >
          {isSelected ? (
            <>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 10L8 13L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              選択済み
            </>
          ) : (
            <>比較に追加</>
          )}
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleDetailClick}
          style={{ backgroundColor: subsidy.color }}
        >
          この補助金で申請を進める
        </button>
      </div>
    </motion.div>
  );
};

export default SubsidyMatchCard;