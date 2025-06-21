import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubsidySearchParams, Subsidy } from '../types/api';
import { subsidyApi } from '../lib/api';

export const useSubsidySearch = () => {
  const [searchParams, setSearchParams] = useState<SubsidySearchParams>({
    page: 1,
    limit: 20,
  });
  const [allSubsidies, setAllSubsidies] = useState<Subsidy[]>([]);
  
  const queryClient = useQueryClient();

  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
    refetch: executeSearch,
  } = useQuery({
    queryKey: ['subsidySearch', searchParams],
    queryFn: () => subsidyApi.search(searchParams),
    enabled: false, // Manual trigger
  });

  // Favorites query
  const {
    data: favorites = [],
    isLoading: isLoadingFavorites,
  } = useQuery({
    queryKey: ['favorites'],
    queryFn: subsidyApi.getFavorites,
  });

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: subsidyApi.addToFavorites,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: subsidyApi.removeFromFavorites,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const handleSearch = useCallback(() => {
    setSearchParams(prev => ({ ...prev, page: 1 }));
    setAllSubsidies([]);
    executeSearch();
  }, [executeSearch]);

  const handleLoadMore = useCallback(() => {
    if (searchResults && searchResults.pagination && searchResults.pagination.page < searchResults.pagination.totalPages) {
      setSearchParams(prev => ({
        ...prev,
        page: prev.page! + 1,
      }));
      executeSearch().then((result) => {
        if (result.data) {
          setAllSubsidies(prev => [...prev, ...result.data.subsidies]);
        }
      });
    }
  }, [searchResults, executeSearch]);

  const handleFiltersChange = useCallback((newFilters: SubsidySearchParams) => {
    setSearchParams(newFilters);
  }, []);

  const handleFavoriteToggle = useCallback((subsidyId: string) => {
    const isFavorite = Array.isArray(favorites) && favorites.some((fav: any) => fav.id === subsidyId);
    
    if (isFavorite) {
      removeFromFavoritesMutation.mutate(subsidyId);
    } else {
      addToFavoritesMutation.mutate(subsidyId);
    }
  }, [favorites, addToFavoritesMutation, removeFromFavoritesMutation]);

  // Combine initial search results with loaded more results
  const displaySubsidies = searchResults?.pagination.page === 1 
    ? searchResults.subsidies 
    : allSubsidies.length > 0 
      ? allSubsidies 
      : searchResults?.subsidies || [];

  const favoriteIds = Array.isArray(favorites) ? favorites.map((fav: any) => fav.id) : [];

  return {
    // Search state
    searchParams,
    subsidies: displaySubsidies,
    pagination: searchResults?.pagination,
    isSearching,
    searchError,
    
    // Favorites state
    favorites,
    favoriteIds,
    isLoadingFavorites,
    
    // Actions
    handleSearch,
    handleLoadMore,
    handleFiltersChange,
    handleFavoriteToggle,
    
    // Mutation states
    isAddingToFavorites: addToFavoritesMutation.isPending,
    isRemovingFromFavorites: removeFromFavoritesMutation.isPending,
  };
};