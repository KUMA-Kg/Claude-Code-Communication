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
    <div>
      <h3 className="heading-4 mb-lg">検索条件</h3>
      
      <div className="grid grid-cols-3 md:grid-cols-1 gap-md mb-lg">
        <div className="form-group">
          <label className="form-label">企業規模</label>
          <select
            value={filters.companySize || ''}
            onChange={handleInputChange('companySize')}
            className="form-select"
          >
            <option value="">選択してください</option>
            <option value="小規模事業者">小規模事業者</option>
            <option value="中小企業">中小企業</option>
            <option value="中堅企業">中堅企業</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">業種</label>
          <select
            value={filters.industry || ''}
            onChange={handleInputChange('industry')}
            className="form-select"
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

        <div className="form-group">
          <label className="form-label">地域</label>
          <select
            value={filters.region || ''}
            onChange={handleInputChange('region')}
            className="form-select"
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

        <div className="form-group">
          <label className="form-label">申請期限</label>
          <select
            value={filters.deadline || ''}
            onChange={handleInputChange('deadline')}
            className="form-select"
          >
            <option value="">選択してください</option>
            <option value="1month">1ヶ月以内</option>
            <option value="3months">3ヶ月以内</option>
            <option value="6months">6ヶ月以内</option>
            <option value="1year">1年以内</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          onClick={onSearch}
          variant="primary"
          size="lg"
          isLoading={isLoading}
          style={{ paddingLeft: 'var(--spacing-xl)', paddingRight: 'var(--spacing-xl)' }}
        >
          検索
        </Button>
      </div>
    </div>
  );
};