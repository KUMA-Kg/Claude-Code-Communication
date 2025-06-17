import React from 'react';
import { Heart, HeartFilled, ExternalLink, Calendar, DollarSign } from 'lucide-react';
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
    if (!score) return 'bg-gray-500';
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {subsidy.name}
          </h3>
          <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
            {subsidy.category}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {subsidy.matchScore && (
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${getMatchScoreColor(subsidy.matchScore)} mr-1`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(subsidy.matchScore * 100)}%
              </span>
            </div>
          )}
          
          {onFavoriteToggle && (
            <button
              onClick={() => onFavoriteToggle(subsidy.id)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
            >
              {isFavorite ? (
                <HeartFilled className="w-5 h-5 text-red-500" />
              ) : (
                <Heart className="w-5 h-5 text-gray-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {subsidy.description && (
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {subsidy.description}
        </p>
      )}

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <DollarSign className="w-4 h-4 mr-2" />
          <span>
            補助金額: {formatAmount(subsidy.subsidyAmount.min)} ～ {formatAmount(subsidy.subsidyAmount.max)}
          </span>
        </div>

        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <span className="w-4 h-4 mr-2 text-center">%</span>
          <span>補助率: {Math.round(subsidy.subsidyRate * 100)}%</span>
        </div>

        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-2" />
          <span>
            申請期限: {formatDate(subsidy.applicationPeriod.end)}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">対象企業:</p>
        <div className="flex flex-wrap gap-1">
          {subsidy.eligibleCompanies.map((company, index) => (
            <span
              key={index}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded"
            >
              {company}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {subsidy.organizer && (
            <span>主催: {subsidy.organizer}</span>
          )}
        </div>
        
        {onViewDetails && (
          <Button
            onClick={() => onViewDetails(subsidy.id)}
            variant="primary"
            size="sm"
            className="flex items-center"
          >
            詳細を見る
            <ExternalLink className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};