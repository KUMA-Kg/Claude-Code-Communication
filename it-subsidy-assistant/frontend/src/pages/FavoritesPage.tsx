import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Heart, Calendar, DollarSign } from 'lucide-react';
import { subsidyApi } from '../lib/api';
import { Button } from '../components/ui/Button';

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    data: favorites = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['favorites'],
    queryFn: subsidyApi.getFavorites,
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            エラーが発生しました
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            お気に入りの読み込みに失敗しました
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <Heart className="w-8 h-8 mr-3 text-red-500" />
            お気に入り補助金
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            保存した補助金の一覧です
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              お気に入りはまだありません
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              補助金を検索してお気に入りに追加しましょう
            </p>
            <Button
              onClick={() => navigate('/search')}
              variant="primary"
              size="lg"
            >
              補助金を検索
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {favorite.name}
                  </h3>
                  <Heart className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" />
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span>
                      {formatAmount(favorite.subsidyAmount.min)} ～ {formatAmount(favorite.subsidyAmount.max)}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      追加日: {formatDate(favorite.addedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    onClick={() => navigate(`/subsidy/${favorite.id}`)}
                    variant="primary"
                    size="sm"
                  >
                    詳細を見る
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/document/create', { 
                      state: { subsidyId: favorite.id } 
                    })}
                    variant="secondary"
                    size="sm"
                  >
                    資料作成
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {favorites.length > 0 && (
          <div className="mt-8 text-center">
            <Button
              onClick={() => navigate('/search')}
              variant="secondary"
              size="lg"
            >
              さらに補助金を探す
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};