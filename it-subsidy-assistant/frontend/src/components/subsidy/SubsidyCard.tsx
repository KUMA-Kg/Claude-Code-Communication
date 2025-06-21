import React from 'react';
import { Heart, ExternalLink, Calendar, DollarSign } from 'lucide-react';
import { Subsidy } from '../../types/api';
import { Button } from '../ui/Button';

interface SubsidyCardProps {
  subsidy: Subsidy;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export const SubsidyCard: React.FC<SubsidyCardProps> = ({
  subsidy,
  isFavorite = false,
  onFavoriteToggle,
  onViewDetails,
}) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMatchScoreColor = (score?: number) => {
    if (!score) return 'var(--color-gray-500)';
    if (score >= 0.8) return 'var(--color-success)';
    if (score >= 0.6) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  return (
    <div className="subsidy-card">
      <div className="subsidy-card-header">
        <div>
          <h3 className="subsidy-card-title">
            {subsidy.name}
          </h3>
          <span className="badge badge-primary">
            {subsidy.category}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          {subsidy.matchScore && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: getMatchScoreColor(subsidy.matchScore),
                marginRight: 'var(--spacing-xs)'
              }}></div>
              <span className="caption">
                {Math.round(subsidy.matchScore * 100)}%
              </span>
            </div>
          )}
          
          {onFavoriteToggle && (
            <button
              onClick={() => onFavoriteToggle(subsidy.id)}
              className="btn-ghost btn-sm"
              style={{ padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-full)' }}
              aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
            </button>
          )}
        </div>
      </div>

      {subsidy.description && (
        <p className="subsidy-card-description">
          {subsidy.description}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }} className="body-small">
          <DollarSign style={{ width: '16px', height: '16px', marginRight: 'var(--spacing-sm)' }} />
          <span>
            補助金額: <strong className="subsidy-card-amount" style={{ fontSize: 'inherit' }}>
              {formatAmount(subsidy.subsidyAmount.min)} ～ {formatAmount(subsidy.subsidyAmount.max)}
            </strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }} className="body-small">
          <span style={{ width: '16px', textAlign: 'center', marginRight: 'var(--spacing-sm)' }}>%</span>
          <span>補助率: <strong>{Math.round(subsidy.subsidyRate * 100)}%</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }} className="body-small">
          <Calendar style={{ width: '16px', height: '16px', marginRight: 'var(--spacing-sm)' }} />
          <span>
            申請期限: {formatDate(subsidy.applicationPeriod.end)}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <p className="caption" style={{ marginBottom: 'var(--spacing-xs)' }}>対象企業:</p>
        <div className="subsidy-card-tags">
          {subsidy.eligibleCompanies.map((company, index) => (
            <span
              key={index}
              className="badge badge-secondary"
            >
              {company}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="caption">
          {subsidy.organizer && (
            <span>主催: {subsidy.organizer}</span>
          )}
        </div>
        
        {onViewDetails && (
          <Button
            onClick={() => onViewDetails(subsidy.id)}
            variant="primary"
            size="sm"
          >
            詳細を見る
            <ExternalLink style={{ width: '16px', height: '16px', marginLeft: 'var(--spacing-xs)', display: 'inline' }} />
          </Button>
        )}
      </div>
    </div>
  );
};