import React from 'react';
import { SubsidyCard } from './SubsidyCard';
import { Subsidy } from '../../types/api';
import { Button } from '../ui/Button';

interface SearchResultsProps {
  subsidies: Subsidy[];
  favorites: string[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onFavoriteToggle?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  onLoadMore?: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  subsidies,
  favorites,
  isLoading = false,
  pagination,
  onFavoriteToggle,
  onViewDetails,
  onLoadMore,
}) => {
  if (isLoading && subsidies.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (subsidies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20.055a7.962 7.962 0 01-6-2.764M3 3l1.664 1.664L21 21l-1.336 1.336L3 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          該当する補助金が見つかりませんでした
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          検索条件を変更して再度お試しください
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          検索結果
        </h2>
        {pagination && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pagination.total}件中 {Math.min(pagination.page * pagination.limit, pagination.total)}件表示
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {subsidies.map((subsidy) => (
          <SubsidyCard
            key={subsidy.id}
            subsidy={subsidy}
            isFavorite={favorites.includes(subsidy.id)}
            onFavoriteToggle={onFavoriteToggle}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>

      {pagination && pagination.page < pagination.totalPages && (
        <div className="mt-8 text-center">
          <Button
            onClick={onLoadMore}
            variant="secondary"
            size="lg"
            isLoading={isLoading}
          >
            さらに読み込む
          </Button>
        </div>
      )}
    </div>
  );
};