import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from '../components/dashboard/StatCard';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { QuickActions } from '../components/dashboard/QuickActions';
import { subsidyApi } from '../lib/api';
import { Search, Heart, FileText, TrendingUp } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: subsidyApi.getFavorites,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          ダッシュボード
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          IT補助金申請の進捗と最新情報をご確認ください
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="お気に入り補助金"
          value={favorites.length}
          icon={Heart}
          description="保存済み"
        />
        <StatCard
          title="検索回数"
          value="12"
          icon={Search}
          trend={{ value: 15, isPositive: true }}
          description="今月"
        />
        <StatCard
          title="作成資料数"
          value="3"
          icon={FileText}
          trend={{ value: 8, isPositive: true }}
          description="今月作成"
        />
        <StatCard
          title="マッチング率"
          value="85%"
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
          description="平均"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
      </div>

      {/* Recent Favorites */}
      {favorites.length > 0 && (
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              最近のお気に入り
            </h3>
            <div className="space-y-3">
              {favorites.slice(0, 3).map((favorite) => (
                <div
                  key={favorite.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 text-red-500 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {favorite.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Intl.NumberFormat('ja-JP', {
                          style: 'currency',
                          currency: 'JPY',
                          minimumFractionDigits: 0,
                        }).format(favorite.subsidyAmount.min)} ～ {' '}
                        {new Intl.NumberFormat('ja-JP', {
                          style: 'currency',
                          currency: 'JPY',
                          minimumFractionDigits: 0,
                        }).format(favorite.subsidyAmount.max)}
                      </p>
                    </div>
                  </div>
                  <button
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                    onClick={() => window.location.href = `/subsidy/${favorite.id}`}
                  >
                    詳細を見る
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};