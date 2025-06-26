import React, { useState, useEffect } from 'react';
import { Building2, Users, TrendingUp, FileText, Calculator } from 'lucide-react';

interface MonozukuriDataFormProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

export const MonozukuriDataForm: React.FC<MonozukuriDataFormProps> = ({
  onComplete,
  initialData
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // プロジェクト情報
    projectName: '',
    projectSummary: '',
    projectStartDate: '',
    projectEndDate: '',
    
    // 賃金関連情報
    currentMinimumWage: '',
    plannedMinimumWage: '',
    wageIncreaseAmount: '30',
    currentTotalSalary: '',
    salaryIncreaseRate: '6.0',
    implementationDate: '補助事業実施年度の翌年度末まで',
    
    // 従業員情報
    employees: [] as Array<{
      name: string;
      furigana: string;
      birthDate: string;
      gender: string;
      address: string;
      employmentType: string;
      hireDate: string;
      jobType: string;
      wage: string;
    }>,
    
    // 経費情報
    totalEligibleExpenses: '',
    subsidyAmount: '',
    expenseBreakdown: [] as Array<{
      category: string;
      description: string;
      unitPrice: string;
      quantity: string;
      amount: string;
    }>
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [initialData]);

  const steps = [
    {
      title: 'プロジェクト基本情報',
      icon: <Building2 size={24} />,
      fields: [
        { key: 'projectName', label: '補助事業名', required: true, placeholder: '例：高精度加工設備導入による生産性向上事業' },
        { key: 'projectSummary', label: '事業概要', required: true, type: 'textarea', placeholder: '事業の目的と内容を簡潔に記入' },
        { key: 'projectStartDate', label: '事業開始予定日', required: true, type: 'date' },
        { key: 'projectEndDate', label: '事業終了予定日', required: true, type: 'date' }
      ]
    },
    {
      title: '賃金引上げ計画',
      icon: <TrendingUp size={24} />,
      fields: [
        { key: 'currentMinimumWage', label: '現在の事業場内最低賃金（時給）', required: true, type: 'number', placeholder: '1000' },
        { key: 'wageIncreaseAmount', label: '賃金引上げ額（円）', required: true, type: 'number', placeholder: '30' },
        { key: 'plannedMinimumWage', label: '引上げ後の最低賃金（時給）', required: true, type: 'number', placeholder: '1030' },
        { key: 'currentTotalSalary', label: '現在の給与総額（年額・円）', required: true, type: 'number', placeholder: '50000000' },
        { key: 'salaryIncreaseRate', label: '給与総額引上げ率（％）', required: true, type: 'number', placeholder: '6.0' }
      ]
    },
    {
      title: '従業員情報',
      icon: <Users size={24} />,
      component: 'EmployeeList'
    },
    {
      title: '経費計画',
      icon: <Calculator size={24} />,
      component: 'ExpenseBreakdown'
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    
    if (currentStepData.fields) {
      currentStepData.fields.forEach(field => {
        if (field.required && !formData[field.key as keyof typeof formData]) {
          newErrors[field.key] = `${field.label}は必須項目です`;
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // データを保存して完了
        const completeData = {
          ...formData,
          plannedTotalSalary: Math.round(parseFloat(formData.currentTotalSalary) * (1 + parseFloat(formData.salaryIncreaseRate) / 100))
        };
        localStorage.setItem('monozukuriData', JSON.stringify(completeData));
        onComplete(completeData);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addEmployee = () => {
    setFormData(prev => ({
      ...prev,
      employees: [...prev.employees, {
        name: '',
        furigana: '',
        birthDate: '',
        gender: '',
        address: '',
        employmentType: '',
        hireDate: '',
        jobType: '',
        wage: ''
      }]
    }));
  };

  const updateEmployee = (index: number, field: string, value: string) => {
    const newEmployees = [...formData.employees];
    newEmployees[index] = { ...newEmployees[index], [field]: value };
    setFormData(prev => ({ ...prev, employees: newEmployees }));
  };

  const removeEmployee = (index: number) => {
    setFormData(prev => ({
      ...prev,
      employees: prev.employees.filter((_, i) => i !== index)
    }));
  };

  const addExpense = () => {
    setFormData(prev => ({
      ...prev,
      expenseBreakdown: [...prev.expenseBreakdown, {
        category: '',
        description: '',
        unitPrice: '',
        quantity: '',
        amount: ''
      }]
    }));
  };

  const updateExpense = (index: number, field: string, value: string) => {
    const newExpenses = [...formData.expenseBreakdown];
    newExpenses[index] = { ...newExpenses[index], [field]: value };
    
    // 金額を自動計算
    if (field === 'unitPrice' || field === 'quantity') {
      const unitPrice = field === 'unitPrice' ? value : newExpenses[index].unitPrice;
      const quantity = field === 'quantity' ? value : newExpenses[index].quantity;
      if (unitPrice && quantity) {
        newExpenses[index].amount = String(parseFloat(unitPrice) * parseFloat(quantity));
      }
    }
    
    setFormData(prev => ({ ...prev, expenseBreakdown: newExpenses }));
  };

  const removeExpense = (index: number) => {
    setFormData(prev => ({
      ...prev,
      expenseBreakdown: prev.expenseBreakdown.filter((_, i) => i !== index)
    }));
  };

  const renderEmployeeList = () => (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748' }}>従業員一覧</h3>
        <button
          onClick={addEmployee}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
            background: '#48bb78',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          従業員を追加
        </button>
      </div>

      {formData.employees.length === 0 ? (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          background: '#f7fafc',
          borderRadius: '8px',
          border: '2px dashed #e2e8f0'
        }}>
          <Users size={48} style={{ margin: '0 auto 16px', color: '#a0aec0' }} />
          <p style={{ color: '#718096', marginBottom: '16px' }}>従業員情報がまだ登録されていません</p>
          <button
            onClick={addEmployee}
            style={{
              padding: '8px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#48bb78',
              background: 'white',
              border: '2px solid #48bb78',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            最初の従業員を追加
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formData.employees.map((employee, index) => (
            <div key={index} style={{
              padding: '16px',
              background: '#f7fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontWeight: '600', color: '#4a5568' }}>従業員 {index + 1}</h4>
                <button
                  onClick={() => removeEmployee(index)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '14px',
                    color: '#e53e3e',
                    background: 'white',
                    border: '1px solid #e53e3e',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  削除
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <input
                  placeholder="氏名"
                  value={employee.name}
                  onChange={(e) => updateEmployee(index, 'name', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <input
                  placeholder="フリガナ"
                  value={employee.furigana}
                  onChange={(e) => updateEmployee(index, 'furigana', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="date"
                  placeholder="生年月日"
                  value={employee.birthDate}
                  onChange={(e) => updateEmployee(index, 'birthDate', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <select
                  value={employee.gender}
                  onChange={(e) => updateEmployee(index, 'gender', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">性別を選択</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
                <input
                  placeholder="住所"
                  value={employee.address}
                  onChange={(e) => updateEmployee(index, 'address', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    gridColumn: 'span 2'
                  }}
                />
                <select
                  value={employee.employmentType}
                  onChange={(e) => updateEmployee(index, 'employmentType', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">雇用形態</option>
                  <option value="正社員">正社員</option>
                  <option value="契約社員">契約社員</option>
                  <option value="パート・アルバイト">パート・アルバイト</option>
                </select>
                <input
                  type="date"
                  placeholder="入社年月日"
                  value={employee.hireDate}
                  onChange={(e) => updateEmployee(index, 'hireDate', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <input
                  placeholder="職種"
                  value={employee.jobType}
                  onChange={(e) => updateEmployee(index, 'jobType', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <input
                  placeholder="時給/月給"
                  value={employee.wage}
                  onChange={(e) => updateEmployee(index, 'wage', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderExpenseBreakdown = () => (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748' }}>経費内訳</h3>
        <button
          onClick={addExpense}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
            background: '#48bb78',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          経費を追加
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
          補助対象経費合計（円）
        </label>
        <input
          type="number"
          value={formData.totalEligibleExpenses}
          onChange={(e) => handleInputChange('totalEligibleExpenses', e.target.value)}
          placeholder="10000000"
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: '2px solid #e2e8f0',
            borderRadius: '8px'
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
          補助金申請額（円）
        </label>
        <input
          type="number"
          value={formData.subsidyAmount}
          onChange={(e) => handleInputChange('subsidyAmount', e.target.value)}
          placeholder="6666666"
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: '2px solid #e2e8f0',
            borderRadius: '8px'
          }}
        />
      </div>

      {formData.expenseBreakdown.length === 0 ? (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          background: '#f7fafc',
          borderRadius: '8px',
          border: '2px dashed #e2e8f0'
        }}>
          <Calculator size={48} style={{ margin: '0 auto 16px', color: '#a0aec0' }} />
          <p style={{ color: '#718096', marginBottom: '16px' }}>経費内訳がまだ登録されていません</p>
          <button
            onClick={addExpense}
            style={{
              padding: '8px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#48bb78',
              background: 'white',
              border: '2px solid #48bb78',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            最初の経費を追加
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formData.expenseBreakdown.map((expense, index) => (
            <div key={index} style={{
              padding: '16px',
              background: '#f7fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontWeight: '600', color: '#4a5568' }}>経費項目 {index + 1}</h4>
                <button
                  onClick={() => removeExpense(index)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '14px',
                    color: '#e53e3e',
                    background: 'white',
                    border: '1px solid #e53e3e',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  削除
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <select
                  value={expense.category}
                  onChange={(e) => updateExpense(index, 'category', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">経費区分を選択</option>
                  <option value="機械装置・システム構築費">機械装置・システム構築費</option>
                  <option value="技術導入費">技術導入費</option>
                  <option value="専門家経費">専門家経費</option>
                  <option value="運搬費">運搬費</option>
                  <option value="クラウドサービス利用費">クラウドサービス利用費</option>
                  <option value="原材料費">原材料費</option>
                  <option value="外注費">外注費</option>
                  <option value="知的財産権等関連経費">知的財産権等関連経費</option>
                </select>
                <input
                  placeholder="内容・仕様"
                  value={expense.description}
                  onChange={(e) => updateExpense(index, 'description', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="number"
                  placeholder="単価（円）"
                  value={expense.unitPrice}
                  onChange={(e) => updateExpense(index, 'unitPrice', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="number"
                  placeholder="数量"
                  value={expense.quantity}
                  onChange={(e) => updateExpense(index, 'quantity', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <div style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  background: '#edf2f7',
                  gridColumn: 'span 2'
                }}>
                  金額: {expense.amount ? `¥${parseInt(expense.amount).toLocaleString()}` : '自動計算されます'}
                </div>
              </div>
            </div>
          ))}
          
          {formData.expenseBreakdown.length > 0 && (
            <div style={{
              padding: '16px',
              background: '#667eea',
              color: 'white',
              borderRadius: '8px',
              textAlign: 'right',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              合計金額: ¥{formData.expenseBreakdown.reduce((sum, exp) => sum + (parseInt(exp.amount) || 0), 0).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '32px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '32px', color: '#2d3748' }}>
        ものづくり補助金 必要データ入力
      </h2>

      {/* プログレスバー */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
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

      {/* フォーム内容 */}
      <div style={{ marginBottom: '40px' }}>
        {currentStepData.component === 'EmployeeList' ? (
          renderEmployeeList()
        ) : currentStepData.component === 'ExpenseBreakdown' ? (
          renderExpenseBreakdown()
        ) : currentStepData.fields ? (
          currentStepData.fields.map((field) => (
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
              
              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.key as keyof typeof formData]}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: errors[field.key] ? '2px solid #e53e3e' : '2px solid #e2e8f0',
                    borderRadius: '8px',
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
                    borderRadius: '8px'
                  }}
                />
              )}
              
              {errors[field.key] && (
                <p style={{ marginTop: '4px', fontSize: '14px', color: '#e53e3e' }}>
                  {errors[field.key]}
                </p>
              )}
            </div>
          ))
        ) : null}
      </div>

      {/* ナビゲーションボタン */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
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
                cursor: 'pointer'
              }}
            >
              戻る
            </button>
          )}
        </div>

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
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}
        >
          {currentStep === steps.length - 1 ? '保存して完了' : '次へ'}
        </button>
      </div>
    </div>
  );
};

export default MonozukuriDataForm;