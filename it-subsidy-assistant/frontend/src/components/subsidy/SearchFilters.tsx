import React from 'react';
import { SubsidySearchParams } from '../../types/api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface SearchFiltersProps {
  filters: SubsidySearchParams;
  onFiltersChange: (filters: SubsidySearchParams) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  isLoading = false,
}) => {
  const handleInputChange = (field: keyof SubsidySearchParams) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      [field]: field === 'investmentAmount' || field === 'subsidyRate' 
        ? (value ? Number(value) : undefined) 
        : value || undefined,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">検索条件</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">企業規模</label>
          <select
            value={filters.companySize || ''}
            onChange={handleInputChange('companySize')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            <option value="小規模事業者">小規模事業者</option>
            <option value="中小企業">中小企業</option>
            <option value="中堅企業">中堅企業</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">業種</label>
          <select
            value={filters.industry || ''}
            onChange={handleInputChange('industry')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            <option value="IT">IT・情報通信業</option>
            <option value="製造業">製造業</option>
            <option value="建設業">建設業</option>
            <option value="小売業">小売業</option>
            <option value="サービス業">サービス業</option>
            <option value="その他">その他</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">地域</label>
          <select
            value={filters.region || ''}
            onChange={handleInputChange('region')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            <option value="東京都">東京都</option>
            <option value="大阪府">大阪府</option>
            <option value="愛知県">愛知県</option>
            <option value="福岡県">福岡県</option>
            <option value="北海道">北海道</option>
            <option value="その他">その他</option>
          </select>
        </div>

        <Input
          type="number"
          label="投資予定額（円）"
          value={filters.investmentAmount || ''}
          onChange={handleInputChange('investmentAmount')}
          placeholder="5000000"
          min="0"
        />

        <Input
          type="number"
          label="最低補助率（%）"
          value={filters.subsidyRate ? filters.subsidyRate * 100 : ''}
          onChange={(e) => {
            const value = e.target.value;
            onFiltersChange({
              ...filters,
              subsidyRate: value ? Number(value) / 100 : undefined,
            });
          }}
          placeholder="50"
          min="0"
          max="100"
          step="1"
        />

        <div>
          <label className="block text-sm font-medium mb-1">申請期限</label>
          <select
            value={filters.deadline || ''}
            onChange={handleInputChange('deadline')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            <option value="1month">1ヶ月以内</option>
            <option value="3months">3ヶ月以内</option>
            <option value="6months">6ヶ月以内</option>
            <option value="1year">1年以内</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onSearch}
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="px-8"
        >
          検索
        </Button>
      </div>
    </div>
  );
};