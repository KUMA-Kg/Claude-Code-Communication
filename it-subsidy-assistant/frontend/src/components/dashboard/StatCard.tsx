import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className = '',
}) => {
  return (
    <div className={`stat-card ${className}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <p className="stat-card-label">
            {title}
          </p>
          <p className="stat-card-value">
            {value}
          </p>
          {description && (
            <p className="caption mt-sm">
              {description}
            </p>
          )}
          {trend && (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 'var(--spacing-sm)' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: trend.isPositive ? 'var(--color-success)' : 'var(--color-error)'
                }}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="caption" style={{ marginLeft: 'var(--spacing-xs)' }}>
                前月比
              </span>
            </div>
          )}
        </div>
        <div style={{ marginLeft: 'var(--spacing-md)' }}>
          <div className="stat-card-icon">
            <Icon style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
      </div>
    </div>
  );
};