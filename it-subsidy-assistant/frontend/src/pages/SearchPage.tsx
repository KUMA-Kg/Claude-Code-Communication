import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchFilters } from '../components/subsidy/SearchFilters';
import { SearchResults } from '../components/subsidy/SearchResults';
import { useSubsidySearch } from '../hooks/useSubsidySearch';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    searchParams,
    subsidies,
    pagination,
    isSearching,
    favoriteIds,
    handleSearch,
    handleLoadMore,
    handleFiltersChange,
    handleFavoriteToggle,
  } = useSubsidySearch();

  const handleViewDetails = (subsidyId: string) => {
    navigate(`/subsidy/${subsidyId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            補助金検索
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            あなたの企業に最適な補助金を見つけましょう
          </p>
        </div>

        <div className="mb-8">
          <SearchFilters
            filters={searchParams}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
            isLoading={isSearching}
          />
        </div>

        <SearchResults
          subsidies={subsidies}
          favorites={favoriteIds}
          isLoading={isSearching}
          pagination={pagination}
          onFavoriteToggle={handleFavoriteToggle}
          onViewDetails={handleViewDetails}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );
};