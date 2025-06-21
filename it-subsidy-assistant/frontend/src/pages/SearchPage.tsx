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
    <div className="page-container">
      <div className="hero-section">
        <div className="container">
          <h1 className="hero-title">
            補助金検索
          </h1>
          <p className="hero-subtitle">
            あなたの企業に最適な補助金を見つけましょう
          </p>
        </div>
      </div>

      <div className="container">
        <div className="section">
          <div className="card mb-xl">
            <div className="card-body">
              <SearchFilters
                filters={searchParams}
                onFiltersChange={handleFiltersChange}
                onSearch={handleSearch}
                isLoading={isSearching}
              />
            </div>
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
    </div>
  );
};