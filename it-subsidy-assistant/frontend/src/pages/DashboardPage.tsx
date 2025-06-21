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
    <div className="page-container">
      <div className="container">
        <div className="mb-xl">
          <h1 className="heading-2 mb-sm">
            ダッシュボード
          </h1>
          <p className="body-large" style={{ color: 'var(--color-gray-600)' }}>
            IT補助金申請の進捗と最新情報をご確認ください
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 md:grid-cols-2 gap-lg mb-xl">
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
        <div className="grid grid-cols-3 md:grid-cols-1 gap-lg">
          {/* Quick Actions */}
          <div style={{ gridColumn: 'span 1' }}>
            <QuickActions />
          </div>

          {/* Recent Activity */}
          <div style={{ gridColumn: 'span 2' }}>
            <RecentActivity />
          </div>
        </div>

        {/* Recent Favorites */}
        {favorites.length > 0 && (
          <div className="mt-xl">
            <div className="card">
              <div className="card-body">
                <h3 className="heading-5 mb-md">
                  最近のお気に入り
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                  {favorites.slice(0, 3).map((favorite) => (
                    <div
                      key={favorite.id}
                      className="card"
                      style={{ 
                        padding: 'var(--spacing-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <Heart style={{ width: '16px', height: '16px', color: 'var(--color-error)', fill: 'currentColor' }} />
                        <div>
                          <h4 className="body-regular" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                            {favorite.name}
                          </h4>
                          <p className="caption">
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
                      <a
                        href={`/subsidy/${favorite.id}`}
                        className="body-small"
                        style={{ 
                          color: 'var(--color-primary-600)',
                          fontWeight: 'var(--font-weight-medium)',
                          textDecoration: 'none'
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/subsidy/${favorite.id}`;
                        }}
                      >
                        詳細を見る
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};