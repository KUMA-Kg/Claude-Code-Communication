import React, { useState } from 'react';
import { CompanyInfo, BusinessPlan, ITInvestmentPlan } from '../../types/api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface DocumentFormProps {
  onSubmit: (data: {
    companyInfo: CompanyInfo;
    businessPlan: BusinessPlan;
    itInvestmentPlan: ITInvestmentPlan;
  }) => void;
  isLoading?: boolean;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    representative: '',
    address: '',
    phone: '',
    email: '',
    establishedDate: '',
    employeeCount: 0,
    capital: 0,
    industry: '',
  });

  const [businessPlan, setBusinessPlan] = useState<BusinessPlan>({
    currentChallenges: '',
    solutionApproach: '',
    expectedEffects: '',
  });

  const [itInvestmentPlan, setITInvestmentPlan] = useState<ITInvestmentPlan>({
    targetSoftware: '',
    investmentAmount: 0,
    implementationSchedule: '',
    expectedROI: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Company Info validation
    if (!companyInfo.name) newErrors.companyName = '会社名は必須です';
    if (!companyInfo.representative) newErrors.representative = '代表者名は必須です';
    if (!companyInfo.address) newErrors.address = '住所は必須です';
    if (!companyInfo.phone) newErrors.phone = '電話番号は必須です';
    if (!companyInfo.email) newErrors.email = 'メールアドレスは必須です';
    if (!companyInfo.establishedDate) newErrors.establishedDate = '設立年月日は必須です';
    if (!companyInfo.employeeCount || companyInfo.employeeCount <= 0) newErrors.employeeCount = '従業員数は1以上で入力してください';
    if (!companyInfo.capital || companyInfo.capital <= 0) newErrors.capital = '資本金は1以上で入力してください';
    if (!companyInfo.industry) newErrors.industry = '業種は必須です';

    // Business Plan validation
    if (!businessPlan.currentChallenges) newErrors.currentChallenges = '現在の課題は必須です';
    if (!businessPlan.solutionApproach) newErrors.solutionApproach = '解決アプローチは必須です';
    if (!businessPlan.expectedEffects) newErrors.expectedEffects = '期待される効果は必須です';

    // IT Investment Plan validation
    if (!itInvestmentPlan.targetSoftware) newErrors.targetSoftware = '対象ソフトウェアは必須です';
    if (!itInvestmentPlan.investmentAmount || itInvestmentPlan.investmentAmount <= 0) newErrors.investmentAmount = '投資金額は1以上で入力してください';
    if (!itInvestmentPlan.implementationSchedule) newErrors.implementationSchedule = '実装スケジュールは必須です';
    if (!itInvestmentPlan.expectedROI) newErrors.expectedROI = '期待ROIは必須です';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        companyInfo,
        businessPlan,
        itInvestmentPlan,
      });
    }
  };

  const updateCompanyInfo = (field: keyof CompanyInfo) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setCompanyInfo(prev => ({
      ...prev,
      [field]: field === 'employeeCount' || field === 'capital' 
        ? (value ? Number(value) : 0) 
        : value,
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateBusinessPlan = (field: keyof BusinessPlan) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setBusinessPlan(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateITInvestmentPlan = (field: keyof ITInvestmentPlan) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setITInvestmentPlan(prev => ({
      ...prev,
      [field]: field === 'investmentAmount' 
        ? (value ? Number(value) : 0) 
        : value,
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Company Information */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">企業情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="会社名"
            value={companyInfo.name}
            onChange={updateCompanyInfo('name')}
            error={errors.companyName}
            placeholder="株式会社○○"
          />
          <Input
            label="代表者名"
            value={companyInfo.representative}
            onChange={updateCompanyInfo('representative')}
            error={errors.representative}
            placeholder="山田太郎"
          />
          <div className="md:col-span-2">
            <Input
              label="住所"
              value={companyInfo.address}
              onChange={updateCompanyInfo('address')}
              error={errors.address}
              placeholder="東京都千代田区1-1-1"
            />
          </div>
          <Input
            label="電話番号"
            value={companyInfo.phone}
            onChange={updateCompanyInfo('phone')}
            error={errors.phone}
            placeholder="03-1234-5678"
          />
          <Input
            label="メールアドレス"
            type="email"
            value={companyInfo.email}
            onChange={updateCompanyInfo('email')}
            error={errors.email}
            placeholder="info@company.com"
          />
          <Input
            label="設立年月日"
            type="date"
            value={companyInfo.establishedDate}
            onChange={updateCompanyInfo('establishedDate')}
            error={errors.establishedDate}
          />
          <Input
            label="従業員数（人）"
            type="number"
            value={companyInfo.employeeCount || ''}
            onChange={updateCompanyInfo('employeeCount')}
            error={errors.employeeCount}
            placeholder="50"
            min="1"
          />
          <Input
            label="資本金（円）"
            type="number"
            value={companyInfo.capital || ''}
            onChange={updateCompanyInfo('capital')}
            error={errors.capital}
            placeholder="10000000"
            min="1"
          />
          <div>
            <label className="block text-sm font-medium mb-1">業種</label>
            <select
              value={companyInfo.industry}
              onChange={updateCompanyInfo('industry')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              <option value="IT・情報通信業">IT・情報通信業</option>
              <option value="製造業">製造業</option>
              <option value="建設業">建設業</option>
              <option value="小売業">小売業</option>
              <option value="サービス業">サービス業</option>
              <option value="その他">その他</option>
            </select>
            {errors.industry && (
              <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
            )}
          </div>
        </div>
      </div>

      {/* Business Plan */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">事業計画</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">現在の課題</label>
            <textarea
              value={businessPlan.currentChallenges}
              onChange={updateBusinessPlan('currentChallenges')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="現在直面している課題を具体的に記載してください"
            />
            {errors.currentChallenges && (
              <p className="mt-1 text-sm text-red-600">{errors.currentChallenges}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">解決アプローチ</label>
            <textarea
              value={businessPlan.solutionApproach}
              onChange={updateBusinessPlan('solutionApproach')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="課題解決のためのアプローチを記載してください"
            />
            {errors.solutionApproach && (
              <p className="mt-1 text-sm text-red-600">{errors.solutionApproach}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">期待される効果</label>
            <textarea
              value={businessPlan.expectedEffects}
              onChange={updateBusinessPlan('expectedEffects')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="導入により期待される効果を記載してください"
            />
            {errors.expectedEffects && (
              <p className="mt-1 text-sm text-red-600">{errors.expectedEffects}</p>
            )}
          </div>
        </div>
      </div>

      {/* IT Investment Plan */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">IT投資計画</h3>
        <div className="space-y-4">
          <Input
            label="対象ソフトウェア・システム"
            value={itInvestmentPlan.targetSoftware}
            onChange={updateITInvestmentPlan('targetSoftware')}
            error={errors.targetSoftware}
            placeholder="業務管理システム"
          />
          <Input
            label="投資金額（円）"
            type="number"
            value={itInvestmentPlan.investmentAmount || ''}
            onChange={updateITInvestmentPlan('investmentAmount')}
            error={errors.investmentAmount}
            placeholder="5000000"
            min="1"
          />
          <div>
            <label className="block text-sm font-medium mb-1">実装スケジュール</label>
            <textarea
              value={itInvestmentPlan.implementationSchedule}
              onChange={updateITInvestmentPlan('implementationSchedule')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="2025年6月〜8月で実装予定"
            />
            {errors.implementationSchedule && (
              <p className="mt-1 text-sm text-red-600">{errors.implementationSchedule}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">期待ROI・投資回収期間</label>
            <textarea
              value={itInvestmentPlan.expectedROI}
              onChange={updateITInvestmentPlan('expectedROI')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="投資回収期間2年、年間コスト削減500万円を想定"
            />
            {errors.expectedROI && (
              <p className="mt-1 text-sm text-red-600">{errors.expectedROI}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="px-8"
        >
          資料を生成
        </Button>
      </div>
    </form>
  );
};