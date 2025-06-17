import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subsidyApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { 
  ArrowLeft, 
  Heart, 
  HeartFilled, 
  Calendar, 
  DollarSign, 
  Building, 
  FileText,
  Phone,
  Mail,
  Globe,
  CheckCircle
} from 'lucide-react';

export const SubsidyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: subsidy,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['subsidy', id],
    queryFn: () => subsidyApi.getById(id!),
    enabled: !!id,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: subsidyApi.getFavorites,
  });

  const addToFavoritesMutation = useMutation({
    mutationFn: subsidyApi.addToFavorites,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const removeFromFavoritesMutation = useMutation({
    mutationFn: subsidyApi.removeFromFavorites,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !subsidy) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            補助金が見つかりませんでした
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            指定された補助金の情報を取得できませんでした
          </p>
          <Button onClick={() => navigate('/search')} variant="primary">
            検索に戻る
          </Button>
        </div>
      </div>
    );
  }

  const isFavorite = favorites.some(fav => fav.id === subsidy.id);

  const handleFavoriteToggle = () => {
    if (isFavorite) {
      removeFromFavoritesMutation.mutate(subsidy.id);
    } else {
      addToFavoritesMutation.mutate(subsidy.id);
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          onClick={() => navigate(-1)}
          variant="secondary"
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          戻る
        </Button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-3 py-1 rounded-full">
                {subsidy.category}
              </span>
              {subsidy.matchScore && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  マッチング率: {Math.round(subsidy.matchScore * 100)}%
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {subsidy.name}
            </h1>
            {subsidy.description && (
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {subsidy.description}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleFavoriteToggle}
              variant={isFavorite ? "danger" : "secondary"}
              className="flex items-center"
            >
              {isFavorite ? (
                <HeartFilled className="w-4 h-4 mr-1" />
              ) : (
                <Heart className="w-4 h-4 mr-1" />
              )}
              {isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
            </Button>
            
            <Button
              onClick={() => navigate('/document/create', { 
                state: { subsidyId: subsidy.id } 
              })}
              variant="primary"
              className="flex items-center"
            >
              <FileText className="w-4 h-4 mr-1" />
              申請資料を作成
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              基本情報
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <DollarSign className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">補助金額</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatAmount(subsidy.subsidyAmount.min)} ～ {formatAmount(subsidy.subsidyAmount.max)}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-gray-400 mr-3 mt-0.5 text-lg font-bold">%</span>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">補助率</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {Math.round(subsidy.subsidyRate * 100)}%
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">申請期間</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatDate(subsidy.applicationPeriod.start)} ～ {formatDate(subsidy.applicationPeriod.end)}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Building className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">主催組織</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {subsidy.organizer || '未指定'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Eligible Companies */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              対象企業
            </h2>
            <div className="flex flex-wrap gap-2">
              {subsidy.eligibleCompanies.map((company, index) => (
                <span
                  key={index}
                  className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>

          {/* Eligible Expenses */}
          {subsidy.eligibleExpenses && subsidy.eligibleExpenses.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                対象経費
              </h2>
              <ul className="space-y-2">
                {subsidy.eligibleExpenses.map((expense, index) => (
                  <li key={index} className="flex items-center text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    {expense}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              申請要件
            </h2>
            <ul className="space-y-2">
              {subsidy.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  {requirement}
                </li>
              ))}
            </ul>
          </div>

          {/* Application Flow */}
          {subsidy.applicationFlow && subsidy.applicationFlow.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                申請の流れ
              </h2>
              <div className="space-y-3">
                {subsidy.applicationFlow.map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          {subsidy.contactInfo && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                お問い合わせ
              </h3>
              <div className="space-y-3">
                {subsidy.contactInfo.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <a
                      href={`tel:${subsidy.contactInfo.phone}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {subsidy.contactInfo.phone}
                    </a>
                  </div>
                )}
                {subsidy.contactInfo.email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <a
                      href={`mailto:${subsidy.contactInfo.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {subsidy.contactInfo.email}
                    </a>
                  </div>
                )}
                {subsidy.contactInfo.website && (
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 text-gray-400 mr-2" />
                    <a
                      href={subsidy.contactInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      公式サイト
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Card */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              申請を始めませんか？
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
              この補助金に申請するための資料を自動生成できます。
            </p>
            <Button
              onClick={() => navigate('/document/create', { 
                state: { subsidyId: subsidy.id } 
              })}
              variant="primary"
              size="sm"
              className="w-full"
            >
              申請資料を作成
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};