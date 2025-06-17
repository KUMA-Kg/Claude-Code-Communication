/**
 * 検索フォームコンポーネントのテスト
 * ユーザーインタラクションと状態管理の検証
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchForm } from '../../../src/components/SearchForm';

// モックAPI関数
const mockOnSearch = jest.fn();
const mockOnReset = jest.fn();

// カスタムレンダーヘルパー
const renderSearchForm = (props = {}) => {
  const defaultProps = {
    onSearch: mockOnSearch,
    onReset: mockOnReset,
    isLoading: false,
    initialValues: {},
    ...props
  };
  
  return {
    user: userEvent.setup(),
    ...render(<SearchForm {...defaultProps} />)
  };
};

describe('SearchForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング', () => {
    test('基本的な要素が正しく表示されること', () => {
      renderSearchForm();
      
      expect(screen.getByTestId('search-form')).toBeInTheDocument();
      expect(screen.getByTestId('company-size')).toBeInTheDocument();
      expect(screen.getByTestId('industry')).toBeInTheDocument();
      expect(screen.getByTestId('investment-amount')).toBeInTheDocument();
      expect(screen.getByTestId('search-button')).toBeInTheDocument();
      expect(screen.getByTestId('reset-button')).toBeInTheDocument();
    });
    
    test('初期値が正しく設定されること', () => {
      const initialValues = {
        companySize: '中小企業',
        industry: 'IT・情報通信業',
        investmentAmount: '500000'
      };
      
      renderSearchForm({ initialValues });
      
      expect(screen.getByDisplayValue('中小企業')).toBeInTheDocument();
      expect(screen.getByDisplayValue('IT・情報通信業')).toBeInTheDocument();
      expect(screen.getByDisplayValue('500000')).toBeInTheDocument();
    });
    
    test('ローディング状態で検索ボタンが無効になること', () => {
      renderSearchForm({ isLoading: true });
      
      const searchButton = screen.getByTestId('search-button');
      expect(searchButton).toBeDisabled();
      expect(searchButton).toHaveTextContent('検索中...');
    });
  });

  describe('フォーム操作', () => {
    test('企業規模を選択できること', async () => {
      const { user } = renderSearchForm();
      
      const companySizeSelect = screen.getByTestId('company-size');
      await user.selectOptions(companySizeSelect, '小規模企業');
      
      expect(screen.getByDisplayValue('小規模企業')).toBeInTheDocument();
    });
    
    test('業種を選択できること', async () => {
      const { user } = renderSearchForm();
      
      const industrySelect = screen.getByTestId('industry');
      await user.selectOptions(industrySelect, '製造業');
      
      expect(screen.getByDisplayValue('製造業')).toBeInTheDocument();
    });
    
    test('投資額を入力できること', async () => {
      const { user } = renderSearchForm();
      
      const investmentInput = screen.getByTestId('investment-amount');
      await user.clear(investmentInput);
      await user.type(investmentInput, '1000000');
      
      expect(screen.getByDisplayValue('1000000')).toBeInTheDocument();
    });
    
    test('詳細検索オプションを展開できること', async () => {
      const { user } = renderSearchForm();
      
      const advancedToggle = screen.getByTestId('advanced-search-toggle');
      await user.click(advancedToggle);
      
      expect(screen.getByTestId('deadline-filter')).toBeVisible();
      expect(screen.getByTestId('subsidy-rate-min')).toBeVisible();
      expect(screen.getByTestId('region-filter')).toBeVisible();
    });
    
    test('検索を実行できること', async () => {
      const { user } = renderSearchForm();
      
      // フォーム入力
      await user.selectOptions(screen.getByTestId('company-size'), '中小企業');
      await user.selectOptions(screen.getByTestId('industry'), 'IT・情報通信業');
      await user.type(screen.getByTestId('investment-amount'), '500000');
      
      // 検索実行
      await user.click(screen.getByTestId('search-button'));
      
      expect(mockOnSearch).toHaveBeenCalledWith({
        companySize: '中小企業',
        industry: 'IT・情報通信業',
        investmentAmount: '500000'
      });
    });
    
    test('フォームをリセットできること', async () => {
      const { user } = renderSearchForm();
      
      // フォーム入力
      await user.selectOptions(screen.getByTestId('company-size'), '中小企業');
      await user.type(screen.getByTestId('investment-amount'), '500000');
      
      // リセット実行
      await user.click(screen.getByTestId('reset-button'));
      
      expect(mockOnReset).toHaveBeenCalled();
      expect(screen.getByTestId('company-size')).toHaveValue('');
      expect(screen.getByTestId('investment-amount')).toHaveValue('');
    });
  });

  describe('バリデーション', () => {
    test('必須項目が未入力の場合エラーが表示されること', async () => {
      const { user } = renderSearchForm();
      
      // 空の状態で検索実行
      await user.click(screen.getByTestId('search-button'));
      
      await waitFor(() => {
        expect(screen.getByText('企業規模を選択してください')).toBeInTheDocument();
        expect(screen.getByText('業種を選択してください')).toBeInTheDocument();
      });
      
      expect(mockOnSearch).not.toHaveBeenCalled();
    });
    
    test('投資額が不正な値の場合エラーが表示されること', async () => {
      const { user } = renderSearchForm();
      
      await user.selectOptions(screen.getByTestId('company-size'), '中小企業');
      await user.selectOptions(screen.getByTestId('industry'), 'IT・情報通信業');
      await user.type(screen.getByTestId('investment-amount'), '-100');
      
      await user.click(screen.getByTestId('search-button'));
      
      await waitFor(() => {
        expect(screen.getByText('投資額は正の数値を入力してください')).toBeInTheDocument();
      });
      
      expect(mockOnSearch).not.toHaveBeenCalled();
    });
    
    test('投資額の上限チェックが機能すること', async () => {
      const { user } = renderSearchForm();
      
      await user.selectOptions(screen.getByTestId('company-size'), '中小企業');
      await user.selectOptions(screen.getByTestId('industry'), 'IT・情報通信業');
      await user.type(screen.getByTestId('investment-amount'), '999999999');
      
      await user.click(screen.getByTestId('search-button'));
      
      await waitFor(() => {
        expect(screen.getByText('投資額は10億円以下で入力してください')).toBeInTheDocument();
      });
      
      expect(mockOnSearch).not.toHaveBeenCalled();
    });
    
    test('文字列が入力された投資額でエラーが表示されること', async () => {
      const { user } = renderSearchForm();
      
      await user.selectOptions(screen.getByTestId('company-size'), '中小企業');
      await user.selectOptions(screen.getByTestId('industry'), 'IT・情報通信業');
      await user.type(screen.getByTestId('investment-amount'), 'invalid');
      
      await user.click(screen.getByTestId('search-button'));
      
      await waitFor(() => {
        expect(screen.getByText('投資額は数値で入力してください')).toBeInTheDocument();
      });
      
      expect(mockOnSearch).not.toHaveBeenCalled();
    });
  });

  describe('詳細検索オプション', () => {
    test('申請期限フィルターが機能すること', async () => {
      const { user } = renderSearchForm();
      
      // 詳細検索を展開
      await user.click(screen.getByTestId('advanced-search-toggle'));
      
      // 基本項目入力
      await user.selectOptions(screen.getByTestId('company-size'), '中小企業');
      await user.selectOptions(screen.getByTestId('industry'), 'IT・情報通信業');
      await user.type(screen.getByTestId('investment-amount'), '500000');
      
      // 詳細項目入力
      await user.selectOptions(screen.getByTestId('deadline-filter'), '3ヶ月以内');
      
      await user.click(screen.getByTestId('search-button'));
      
      expect(mockOnSearch).toHaveBeenCalledWith({
        companySize: '中小企業',
        industry: 'IT・情報通信業',
        investmentAmount: '500000',
        deadlineFilter: '3ヶ月以内'
      });
    });
    
    test('補助率フィルターが機能すること', async () => {
      const { user } = renderSearchForm();
      
      await user.click(screen.getByTestId('advanced-search-toggle'));
      
      await user.selectOptions(screen.getByTestId('company-size'), '中小企業');
      await user.selectOptions(screen.getByTestId('industry'), 'IT・情報通信業');
      await user.type(screen.getByTestId('investment-amount'), '500000');
      await user.type(screen.getByTestId('subsidy-rate-min'), '50');
      
      await user.click(screen.getByTestId('search-button'));
      
      expect(mockOnSearch).toHaveBeenCalledWith({
        companySize: '中小企業',
        industry: 'IT・情報通信業',
        investmentAmount: '500000',
        subsidyRateMin: '50'
      });
    });
    
    test('地域フィルターが機能すること', async () => {
      const { user } = renderSearchForm();
      
      await user.click(screen.getByTestId('advanced-search-toggle'));
      
      await user.selectOptions(screen.getByTestId('company-size'), '中小企業');
      await user.selectOptions(screen.getByTestId('industry'), 'IT・情報通信業');
      await user.type(screen.getByTestId('investment-amount'), '500000');
      await user.selectOptions(screen.getByTestId('region-filter'), '東京都');
      
      await user.click(screen.getByTestId('search-button'));
      
      expect(mockOnSearch).toHaveBeenCalledWith({
        companySize: '中小企業',
        industry: 'IT・情報通信業',
        investmentAmount: '500000',
        region: '東京都'
      });
    });
  });

  describe('キーボード操作', () => {
    test('Enterキーで検索が実行されること', async () => {
      const { user } = renderSearchForm();
      
      await user.selectOptions(screen.getByTestId('company-size'), '中小企業');
      await user.selectOptions(screen.getByTestId('industry'), 'IT・情報通信業');
      await user.type(screen.getByTestId('investment-amount'), '500000');
      
      // Enterキーを押下
      await user.type(screen.getByTestId('investment-amount'), '{enter}');
      
      expect(mockOnSearch).toHaveBeenCalledWith({
        companySize: '中小企業',
        industry: 'IT・情報通信業',
        investmentAmount: '500000'
      });
    });
    
    test('Tabキーでフォーカス移動ができること', async () => {
      const { user } = renderSearchForm();
      
      // Tabキーでフォーカス移動
      await user.tab();
      expect(screen.getByTestId('company-size')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('industry')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('investment-amount')).toHaveFocus();
    });
  });

  describe('アクセシビリティ', () => {
    test('適切なaria-labelが設定されていること', () => {
      renderSearchForm();
      
      expect(screen.getByTestId('company-size')).toHaveAttribute('aria-label', '企業規模を選択');
      expect(screen.getByTestId('industry')).toHaveAttribute('aria-label', '業種を選択');
      expect(screen.getByTestId('investment-amount')).toHaveAttribute('aria-label', '投資額を入力');
    });
    
    test('エラーメッセージがaria-describedbyで関連付けられていること', async () => {
      const { user } = renderSearchForm();
      
      await user.click(screen.getByTestId('search-button'));
      
      await waitFor(() => {
        const companySizeField = screen.getByTestId('company-size');
        const errorMessage = screen.getByText('企業規模を選択してください');
        
        expect(companySizeField).toHaveAttribute('aria-describedby');
        expect(errorMessage).toHaveAttribute('id', companySizeField.getAttribute('aria-describedby'));
      });
    });
    
    test('必須項目がaria-requiredで示されていること', () => {
      renderSearchForm();
      
      expect(screen.getByTestId('company-size')).toHaveAttribute('aria-required', 'true');
      expect(screen.getByTestId('industry')).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('レスポンシブ対応', () => {
    test('小画面でレイアウトが適切に調整されること', () => {
      // ビューポートサイズを変更
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      window.dispatchEvent(new Event('resize'));
      
      renderSearchForm();
      
      const form = screen.getByTestId('search-form');
      expect(form).toHaveClass('search-form--mobile');
    });
    
    test('詳細検索がモバイルで適切に表示されること', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      window.dispatchEvent(new Event('resize'));
      
      const { user } = renderSearchForm();
      
      await user.click(screen.getByTestId('advanced-search-toggle'));
      
      const advancedSection = screen.getByTestId('advanced-search-section');
      expect(advancedSection).toHaveClass('advanced-search--mobile');
    });
  });

  describe('パフォーマンス', () => {
    test('フォーム再レンダリングが最小限に抑えられること', () => {
      const renderSpy = jest.fn();
      const TestComponent = (props) => {
        renderSpy();
        return <SearchForm {...props} />;
      };
      
      const { rerender } = render(
        <TestComponent onSearch={mockOnSearch} onReset={mockOnReset} />
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // 同じpropsで再レンダリング
      rerender(
        <TestComponent onSearch={mockOnSearch} onReset={mockOnReset} />
      );
      
      // React.memoが効いている場合、追加のレンダリングは発生しない
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
    
    test('大量の選択肢がある場合もスムーズに動作すること', async () => {
      const manyOptions = Array.from({ length: 1000 }, (_, i) => ({
        value: `option-${i}`,
        label: `選択肢 ${i}`
      }));
      
      const { user } = renderSearchForm({ industryOptions: manyOptions });
      
      const startTime = performance.now();
      
      const industrySelect = screen.getByTestId('industry');
      await user.click(industrySelect);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // レンダリング時間が100ms以内であることを確認
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('エラーハンドリング', () => {
    test('検索関数でエラーが発生した場合適切に処理されること', async () => {
      const errorOnSearch = jest.fn().mockRejectedValue(new Error('API Error'));
      const { user } = renderSearchForm({ onSearch: errorOnSearch });
      
      await user.selectOptions(screen.getByTestId('company-size'), '中小企業');
      await user.selectOptions(screen.getByTestId('industry'), 'IT・情報通信業');
      await user.type(screen.getByTestId('investment-amount'), '500000');
      
      await user.click(screen.getByTestId('search-button'));
      
      await waitFor(() => {
        expect(screen.getByText('検索中にエラーが発生しました')).toBeInTheDocument();
      });
    });
    
    test('ネットワークエラー時に適切なメッセージが表示されること', async () => {
      const networkError = jest.fn().mockRejectedValue(new Error('Network Error'));
      const { user } = renderSearchForm({ onSearch: networkError });
      
      await user.selectOptions(screen.getByTestId('company-size'), '中小企業');
      await user.selectOptions(screen.getByTestId('industry'), 'IT・情報通信業');
      await user.type(screen.getByTestId('investment-amount'), '500000');
      
      await user.click(screen.getByTestId('search-button'));
      
      await waitFor(() => {
        expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument();
      });
    });
  });
});