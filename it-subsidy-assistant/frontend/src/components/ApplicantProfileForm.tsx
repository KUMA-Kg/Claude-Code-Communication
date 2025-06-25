import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ApplicantProfileFormProps {
  onComplete: (data: any) => void;
  onSkip?: () => void;
  isUpdate?: boolean;
}

export const ApplicantProfileForm: React.FC<ApplicantProfileFormProps> = ({
  onComplete,
  onSkip,
  isUpdate = false
}) => {
  const [formData, setFormData] = useState({
    // 会社基本情報
    companyName: '',
    companyNameKana: '',
    corporateNumber: '',
    establishmentDate: '',
    capital: '',
    employeeCount: '',
    
    // 代表者情報
    representativeName: '',
    representativeNameKana: '',
    representativeTitle: '代表取締役',
    
    // 連絡先情報
    postalCode: '',
    address: '',
    phoneNumber: '',
    email: '',
    website: '',
    
    // 事業内容
    businessType: '',
    mainBusiness: '',
    
    // 財務情報（任意）
    lastYearRevenue: '',
    lastYearProfit: '',
    currentYearRevenueExpected: ''
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 既存データを読み込み
  useEffect(() => {
    const savedData = localStorage.getItem('applicantProfile');
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);

  const steps = [
    {
      title: '会社基本情報',
      fields: [
        { key: 'companyName', label: '会社名', required: true, placeholder: '株式会社〇〇' },
        { key: 'companyNameKana', label: '会社名（カナ）', required: true, placeholder: 'カブシキガイシャ〇〇' },
        { key: 'corporateNumber', label: '法人番号', required: false, placeholder: '13桁の数字' },
        { key: 'establishmentDate', label: '設立年月', required: true, type: 'month', placeholder: '2000-01' },
        { key: 'capital', label: '資本金（万円）', required: true, type: 'number', placeholder: '1000' },
        { key: 'employeeCount', label: '従業員数', required: true, type: 'number', placeholder: '25' }
      ]
    },
    {
      title: '代表者情報',
      fields: [
        { key: 'representativeName', label: '代表者氏名', required: true, placeholder: '山田太郎' },
        { key: 'representativeNameKana', label: '代表者氏名（カナ）', required: true, placeholder: 'ヤマダタロウ' },
        { key: 'representativeTitle', label: '役職', required: true, placeholder: '代表取締役' }
      ]
    },
    {
      title: '連絡先情報',
      fields: [
        { key: 'postalCode', label: '郵便番号', required: true, placeholder: '123-4567' },
        { key: 'address', label: '住所', required: true, placeholder: '東京都千代田区〇〇1-2-3' },
        { key: 'phoneNumber', label: '電話番号', required: true, placeholder: '03-1234-5678' },
        { key: 'email', label: 'メールアドレス', required: true, type: 'email', placeholder: 'info@example.com' },
        { key: 'website', label: 'ウェブサイト', required: false, type: 'url', placeholder: 'https://example.com' }
      ]
    },
    {
      title: '事業内容',
      fields: [
        { 
          key: 'businessType', 
          label: '業種', 
          required: true, 
          type: 'select',
          options: [
            { value: '製造業', label: '製造業' },
            { value: '小売業', label: '小売業' },
            { value: '卸売業', label: '卸売業' },
            { value: 'サービス業', label: 'サービス業' },
            { value: '建設業', label: '建設業' },
            { value: '飲食業', label: '飲食業' },
            { value: 'IT・通信業', label: 'IT・通信業' },
            { value: 'その他', label: 'その他' }
          ]
        },
        { 
          key: 'mainBusiness', 
          label: '主な事業内容', 
          required: true, 
          type: 'textarea',
          placeholder: '具体的な事業内容を記入してください（例：精密機械部品の製造・販売）'
        }
      ]
    },
    {
      title: '財務情報（任意）',
      fields: [
        { key: 'lastYearRevenue', label: '前年度売上高（万円）', required: false, type: 'number', placeholder: '5000' },
        { key: 'lastYearProfit', label: '前年度営業利益（万円）', required: false, type: 'number', placeholder: '500' },
        { key: 'currentYearRevenueExpected', label: '今年度売上見込（万円）', required: false, type: 'number', placeholder: '6000' }
      ]
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    currentStepData.fields.forEach(field => {
      if (field.required && !formData[field.key as keyof typeof formData]) {
        newErrors[field.key] = `${field.label}は必須項目です`;
      }
      // メールアドレスの検証
      if (field.type === 'email' && formData[field.key as keyof typeof formData]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.key as keyof typeof formData])) {
          newErrors[field.key] = '正しいメールアドレスを入力してください';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // 保存して完了
        localStorage.setItem('applicantProfile', JSON.stringify(formData));
        onComplete(formData);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // エラーをクリア
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '40px auto',
      padding: '40px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
    }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h2 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {isUpdate ? '申請者情報の更新' : '申請者情報の登録'}
        </h2>
        <p style={{ color: '#718096' }}>
          {isUpdate ? '最新の情報に更新してください' : '補助金申請に必要な基本情報を入力してください'}
        </p>
      </div>

      {/* プログレスバー */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '14px', color: '#718096' }}>
            ステップ {currentStep + 1} / {steps.length}
          </span>
          <span style={{ fontSize: '14px', color: '#667eea', fontWeight: '600' }}>
            {currentStepData.title}
          </span>
        </div>
        <div style={{
          height: '8px',
          background: '#e2e8f0',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* フォーム */}
      <div style={{ marginBottom: '40px' }}>
        {currentStepData.fields.map((field) => (
          <div key={field.key} style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#4a5568'
            }}>
              {field.label}
              {field.required && <span style={{ color: '#e53e3e' }}> *</span>}
            </label>
            
            {field.type === 'select' ? (
              <select
                value={formData[field.key as keyof typeof formData]}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: errors[field.key] ? '2px solid #e53e3e' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  background: 'white'
                }}
              >
                <option value="">選択してください</option>
                {field.options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                value={formData[field.key as keyof typeof formData]}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: errors[field.key] ? '2px solid #e53e3e' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  resize: 'vertical'
                }}
              />
            ) : (
              <input
                type={field.type || 'text'}
                value={formData[field.key as keyof typeof formData]}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: errors[field.key] ? '2px solid #e53e3e' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            )}
            
            {errors[field.key] && (
              <p style={{ 
                marginTop: '4px',
                fontSize: '14px',
                color: '#e53e3e'
              }}>
                {errors[field.key]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ボタン */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#667eea',
                background: 'white',
                border: '2px solid #667eea',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              戻る
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          {onSkip && currentStep === 0 && (
            <button
              onClick={onSkip}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#718096',
                background: '#f7fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              スキップ
            </button>
          )}
          
          <button
            onClick={handleNext}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
          >
            {currentStep === steps.length - 1 ? (
              <>
                <CheckCircle2 size={20} style={{ marginRight: '8px', display: 'inline' }} />
                {isUpdate ? '更新完了' : '登録完了'}
              </>
            ) : (
              '次へ'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantProfileForm;