import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Building, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  DollarSign,
  FileText,
  Users,
  MapPin,
  Hash,
  CreditCard,
  Briefcase,
  Globe,
  Shield,
  TrendingUp,
  Package,
  Target,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Types for comprehensive form data
interface ComprehensiveFormData {
  // 基本情報
  companyInfo: {
    companyName: string;
    companyNameKana: string;
    corporateNumber: string;
    establishmentDate: string;
    capital: number;
    companyType: 'kabushiki' | 'yugen' | 'gomei' | 'goshi' | 'kojin';
    fiscalYearEnd: string;
    industryCode: string;
    industryDescription: string;
  };
  
  // 所在地情報
  addressInfo: {
    postalCode: string;
    prefecture: string;
    city: string;
    address1: string;
    address2: string;
    buildingName: string;
    headquartersAddress?: {
      isSame: boolean;
      postalCode?: string;
      prefecture?: string;
      city?: string;
      address1?: string;
      address2?: string;
    };
  };
  
  // 代表者・担当者情報
  representativeInfo: {
    representativeName: string;
    representativeNameKana: string;
    representativeTitle: string;
    representativeBirthdate: string;
    contactPersonName: string;
    contactPersonNameKana: string;
    contactPersonTitle: string;
    contactPersonDepartment: string;
    contactEmail: string;
    contactPhone: string;
    contactMobile: string;
    contactFax: string;
  };
  
  // 事業情報
  businessInfo: {
    businessDescription: string;
    mainProducts: string;
    employeeCount: number;
    partTimeEmployeeCount: number;
    annualRevenue: number;
    previousYearRevenue: number;
    operatingProfit: number;
    previousOperatingProfit: number;
    websiteUrl: string;
    socialMedia: {
      twitter?: string;
      facebook?: string;
      instagram?: string;
      line?: string;
    };
  };
  
  // 銀行口座情報
  bankInfo: {
    bankName: string;
    branchName: string;
    accountType: 'futsu' | 'touza';
    accountNumber: string;
    accountHolder: string;
    accountHolderKana: string;
  };
  
  // 補助事業計画
  projectPlan: {
    projectTitle: string;
    projectObjective: string;
    currentIssues: string;
    solutionApproach: string;
    expectedResults: string;
    implementationSchedule: {
      startDate: string;
      endDate: string;
      milestones: Array<{
        date: string;
        description: string;
      }>;
    };
    kpi: Array<{
      indicator: string;
      currentValue: string;
      targetValue: string;
      measurementMethod: string;
    }>;
  };
  
  // IT導入計画（IT補助金用）
  itImplementation?: {
    itToolCategory: string;
    itToolName: string;
    vendorName: string;
    vendorContact: string;
    implementationCost: number;
    monthlyFee: number;
    licenseCount: number;
    usagePeriod: number;
    currentSystemIssues: string;
    expectedBenefits: string;
    integrationPlan: string;
    securityMeasures: string;
    dataBackupPlan: string;
    trainingPlan: string;
  };
  
  // 設備投資計画（ものづくり補助金用）
  equipmentInvestment?: {
    equipmentName: string;
    equipmentSpecification: string;
    manufacturer: string;
    modelNumber: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    installationLocation: string;
    installationDate: string;
    purpose: string;
    currentProductionCapacity: string;
    expectedProductionCapacity: string;
    maintenancePlan: string;
  };
  
  // 販路開拓計画（持続化補助金用）
  marketExpansion?: {
    targetMarket: string;
    targetCustomers: string;
    competitorAnalysis: string;
    marketingStrategy: string;
    salesChannels: string;
    pricingStrategy: string;
    promotionPlan: string;
    expectedNewCustomers: number;
    expectedSalesIncrease: number;
    brandingStrategy: string;
  };
  
  // 経費明細
  expenses: {
    items: Array<{
      category: string;
      itemName: string;
      specification: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      subsidyAmount: number;
      vendor: string;
      quotationDate: string;
      remarks: string;
    }>;
    totalAmount: number;
    subsidyRequestAmount: number;
    selfFundAmount: number;
  };
  
  // 添付書類チェック
  requiredDocuments: {
    corporateRegistry: boolean;
    taxCertificate: boolean;
    financialStatements: boolean;
    quotations: boolean;
    businessPlan: boolean;
    otherDocuments: Array<{
      name: string;
      attached: boolean;
    }>;
  };
  
  // 誓約・同意事項
  agreements: {
    termsAccepted: boolean;
    dataUsageAccepted: boolean;
    fraudDeclaration: boolean;
    duplicateApplicationDeclaration: boolean;
    informationAccuracy: boolean;
  };
}

// Form sections configuration
const formSections = [
  { id: 'company', title: '企業基本情報', icon: Building },
  { id: 'address', title: '所在地情報', icon: MapPin },
  { id: 'representative', title: '代表者・担当者情報', icon: User },
  { id: 'business', title: '事業内容', icon: Briefcase },
  { id: 'bank', title: '振込先情報', icon: CreditCard },
  { id: 'project', title: '補助事業計画', icon: Target },
  { id: 'implementation', title: '実施詳細', icon: Package },
  { id: 'expenses', title: '経費明細', icon: DollarSign },
  { id: 'documents', title: '必要書類', icon: FileText },
  { id: 'agreements', title: '誓約・確認', icon: Shield },
];

interface Props {
  subsidyType: string;
  selectedFrame?: string;
  initialData?: Partial<ComprehensiveFormData>;
  onComplete: (data: ComprehensiveFormData) => void;
  onSaveProgress?: (data: Partial<ComprehensiveFormData>) => void;
  onBack: () => void;
}

const ComprehensiveDocumentForm: React.FC<Props> = ({
  subsidyType,
  selectedFrame,
  initialData,
  onComplete,
  onSaveProgress,
  onBack
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<ComprehensiveFormData>({
    companyInfo: {
      companyName: '',
      companyNameKana: '',
      corporateNumber: '',
      establishmentDate: '',
      capital: 0,
      companyType: 'kabushiki',
      fiscalYearEnd: '',
      industryCode: '',
      industryDescription: '',
    },
    addressInfo: {
      postalCode: '',
      prefecture: '',
      city: '',
      address1: '',
      address2: '',
      buildingName: '',
      headquartersAddress: {
        isSame: true,
      },
    },
    representativeInfo: {
      representativeName: '',
      representativeNameKana: '',
      representativeTitle: '',
      representativeBirthdate: '',
      contactPersonName: '',
      contactPersonNameKana: '',
      contactPersonTitle: '',
      contactPersonDepartment: '',
      contactEmail: '',
      contactPhone: '',
      contactMobile: '',
      contactFax: '',
    },
    businessInfo: {
      businessDescription: '',
      mainProducts: '',
      employeeCount: 0,
      partTimeEmployeeCount: 0,
      annualRevenue: 0,
      previousYearRevenue: 0,
      operatingProfit: 0,
      previousOperatingProfit: 0,
      websiteUrl: '',
      socialMedia: {},
    },
    bankInfo: {
      bankName: '',
      branchName: '',
      accountType: 'futsu',
      accountNumber: '',
      accountHolder: '',
      accountHolderKana: '',
    },
    projectPlan: {
      projectTitle: '',
      projectObjective: '',
      currentIssues: '',
      solutionApproach: '',
      expectedResults: '',
      implementationSchedule: {
        startDate: '',
        endDate: '',
        milestones: [],
      },
      kpi: [],
    },
    expenses: {
      items: [],
      totalAmount: 0,
      subsidyRequestAmount: 0,
      selfFundAmount: 0,
    },
    requiredDocuments: {
      corporateRegistry: false,
      taxCertificate: false,
      financialStatements: false,
      quotations: false,
      businessPlan: false,
      otherDocuments: [],
    },
    agreements: {
      termsAccepted: false,
      dataUsageAccepted: false,
      fraudDeclaration: false,
      duplicateApplicationDeclaration: false,
      informationAccuracy: false,
    },
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize subsidy-specific fields
  useEffect(() => {
    if (subsidyType.includes('IT導入補助金')) {
      setFormData(prev => ({
        ...prev,
        itImplementation: {
          itToolCategory: '',
          itToolName: '',
          vendorName: '',
          vendorContact: '',
          implementationCost: 0,
          monthlyFee: 0,
          licenseCount: 0,
          usagePeriod: 0,
          currentSystemIssues: '',
          expectedBenefits: '',
          integrationPlan: '',
          securityMeasures: '',
          dataBackupPlan: '',
          trainingPlan: '',
        },
      }));
    } else if (subsidyType.includes('ものづくり補助金')) {
      setFormData(prev => ({
        ...prev,
        equipmentInvestment: {
          equipmentName: '',
          equipmentSpecification: '',
          manufacturer: '',
          modelNumber: '',
          quantity: 0,
          unitPrice: 0,
          totalPrice: 0,
          installationLocation: '',
          installationDate: '',
          purpose: '',
          currentProductionCapacity: '',
          expectedProductionCapacity: '',
          maintenancePlan: '',
        },
      }));
    } else if (subsidyType.includes('持続化補助金')) {
      setFormData(prev => ({
        ...prev,
        marketExpansion: {
          targetMarket: '',
          targetCustomers: '',
          competitorAnalysis: '',
          marketingStrategy: '',
          salesChannels: '',
          pricingStrategy: '',
          promotionPlan: '',
          expectedNewCustomers: 0,
          expectedSalesIncrease: 0,
          brandingStrategy: '',
        },
      }));
    }
  }, [subsidyType]);

  // Form validation
  const validateSection = (sectionId: string): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (sectionId) {
      case 'company':
        if (!formData.companyInfo.companyName) {
          newErrors['companyName'] = '法人名は必須です';
        }
        if (!formData.companyInfo.companyNameKana) {
          newErrors['companyNameKana'] = '法人名（フリガナ）は必須です';
        } else if (!/^[ァ-ヶー\s]+$/.test(formData.companyInfo.companyNameKana)) {
          newErrors['companyNameKana'] = '全角カタカナで入力してください';
        }
        if (!formData.companyInfo.corporateNumber) {
          newErrors['corporateNumber'] = '法人番号は必須です';
        } else if (!/^\d{13}$/.test(formData.companyInfo.corporateNumber)) {
          newErrors['corporateNumber'] = '13桁の数字で入力してください';
        }
        if (!formData.companyInfo.establishmentDate) {
          newErrors['establishmentDate'] = '設立年月日は必須です';
        }
        if (formData.companyInfo.capital <= 0) {
          newErrors['capital'] = '資本金を入力してください';
        }
        break;
        
      case 'address':
        if (!formData.addressInfo.postalCode) {
          newErrors['postalCode'] = '郵便番号は必須です';
        } else if (!/^\d{3}-?\d{4}$/.test(formData.addressInfo.postalCode)) {
          newErrors['postalCode'] = '正しい郵便番号を入力してください（例：123-4567）';
        }
        if (!formData.addressInfo.prefecture) {
          newErrors['prefecture'] = '都道府県は必須です';
        }
        if (!formData.addressInfo.city) {
          newErrors['city'] = '市区町村は必須です';
        }
        if (!formData.addressInfo.address1) {
          newErrors['address1'] = '番地は必須です';
        }
        break;
        
      case 'representative':
        if (!formData.representativeInfo.representativeName) {
          newErrors['representativeName'] = '代表者氏名は必須です';
        }
        if (!formData.representativeInfo.contactEmail) {
          newErrors['contactEmail'] = 'メールアドレスは必須です';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.representativeInfo.contactEmail)) {
          newErrors['contactEmail'] = '正しいメールアドレスを入力してください';
        }
        if (!formData.representativeInfo.contactPhone) {
          newErrors['contactPhone'] = '電話番号は必須です';
        } else if (!/^[\d-]+$/.test(formData.representativeInfo.contactPhone)) {
          newErrors['contactPhone'] = '正しい電話番号を入力してください';
        }
        break;
        
      case 'business':
        if (!formData.businessInfo.businessDescription) {
          newErrors['businessDescription'] = '事業内容は必須です';
        } else if (formData.businessInfo.businessDescription.length > 500) {
          newErrors['businessDescription'] = '500文字以内で入力してください';
        }
        if (formData.businessInfo.employeeCount < 0) {
          newErrors['employeeCount'] = '正社員数は0以上で入力してください';
        }
        if (formData.businessInfo.annualRevenue <= 0) {
          newErrors['annualRevenue'] = '売上高を入力してください';
        }
        break;
        
      case 'bank':
        if (!formData.bankInfo.bankName) {
          newErrors['bankName'] = '金融機関名は必須です';
        }
        if (!formData.bankInfo.branchName) {
          newErrors['branchName'] = '支店名は必須です';
        }
        if (!formData.bankInfo.accountNumber) {
          newErrors['accountNumber'] = '口座番号は必須です';
        } else if (!/^\d{7}$/.test(formData.bankInfo.accountNumber)) {
          newErrors['accountNumber'] = '7桁の数字で入力してください';
        }
        if (!formData.bankInfo.accountHolder) {
          newErrors['accountHolder'] = '口座名義人は必須です';
        }
        if (!formData.bankInfo.accountHolderKana) {
          newErrors['accountHolderKana'] = '口座名義人（カナ）は必須です';
        } else if (!/^[ァ-ヶー\s]+$/.test(formData.bankInfo.accountHolderKana)) {
          newErrors['accountHolderKana'] = '全角カタカナで入力してください';
        }
        break;
        
      case 'project':
        if (!formData.projectPlan.projectTitle) {
          newErrors['projectTitle'] = '事業計画名は必須です';
        }
        if (!formData.projectPlan.projectObjective) {
          newErrors['projectObjective'] = '事業の目的は必須です';
        }
        if (!formData.projectPlan.currentIssues) {
          newErrors['currentIssues'] = '現状の課題は必須です';
        }
        if (!formData.projectPlan.solutionApproach) {
          newErrors['solutionApproach'] = '解決方法は必須です';
        }
        if (!formData.projectPlan.expectedResults) {
          newErrors['expectedResults'] = '期待される成果は必須です';
        }
        if (!formData.projectPlan.implementationSchedule.startDate) {
          newErrors['startDate'] = '開始予定日は必須です';
        }
        if (!formData.projectPlan.implementationSchedule.endDate) {
          newErrors['endDate'] = '完了予定日は必須です';
        }
        break;
        
      case 'implementation':
        if (subsidyType.includes('IT導入補助金') && formData.itImplementation) {
          if (!formData.itImplementation.itToolCategory) {
            newErrors['itToolCategory'] = 'ITツールカテゴリは必須です';
          }
          if (!formData.itImplementation.itToolName) {
            newErrors['itToolName'] = 'ITツール名は必須です';
          }
          if (!formData.itImplementation.vendorName) {
            newErrors['vendorName'] = 'IT導入支援事業者名は必須です';
          }
          if (formData.itImplementation.implementationCost <= 0) {
            newErrors['implementationCost'] = '導入費用を入力してください';
          }
        }
        break;
        
      case 'expenses':
        if (formData.expenses.items.length === 0) {
          newErrors['expenses'] = '経費項目を1つ以上追加してください';
        } else {
          formData.expenses.items.forEach((item, index) => {
            if (!item.category) {
              newErrors[`expense_${index}_category`] = '経費区分を選択してください';
            }
            if (!item.itemName) {
              newErrors[`expense_${index}_itemName`] = '品名を入力してください';
            }
            if (item.subsidyAmount > item.totalPrice) {
              newErrors[`expense_${index}_subsidyAmount`] = '補助金申請額は金額を超えることはできません';
            }
          });
        }
        break;
        
      case 'documents':
        // Optional validation for documents
        break;
        
      case 'agreements':
        if (!Object.values(formData.agreements).every(v => v === true)) {
          newErrors['agreements'] = '全ての誓約事項に同意する必要があります';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field changes
  const handleFieldChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof ComprehensiveFormData],
        [field]: value,
      },
    }));
    
    setTouched(prev => ({
      ...prev,
      [`${section}.${field}`]: true,
    }));
  };

  // Handle section navigation
  const handleNext = () => {
    const currentSectionId = formSections[currentSection].id;
    
    if (validateSection(currentSectionId)) {
      if (currentSection < formSections.length - 1) {
        setCurrentSection(prev => prev + 1);
      } else {
        // Final submission
        onComplete(formData);
      }
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const handleSaveProgress = () => {
    if (onSaveProgress) {
      onSaveProgress(formData);
    }
  };

  // Render section content
  const renderSectionContent = () => {
    const section = formSections[currentSection];
    
    switch (section.id) {
      case 'company':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  法人名（商号） <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.companyInfo.companyName}
                  onChange={(e) => handleFieldChange('companyInfo', 'companyName', e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    errors.companyName ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="株式会社〇〇"
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-500">{errors.companyName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  法人名（フリガナ） <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.companyInfo.companyNameKana}
                  onChange={(e) => handleFieldChange('companyInfo', 'companyNameKana', e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    errors.companyNameKana ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="カブシキガイシャ〇〇"
                />
                {errors.companyNameKana && (
                  <p className="mt-1 text-sm text-red-500">{errors.companyNameKana}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  法人番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.companyInfo.corporateNumber}
                  onChange={(e) => handleFieldChange('companyInfo', 'corporateNumber', e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    errors.corporateNumber ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="1234567890123"
                  maxLength={13}
                />
                {errors.corporateNumber && (
                  <p className="mt-1 text-sm text-red-500">{errors.corporateNumber}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企業形態 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.companyInfo.companyType}
                  onChange={(e) => handleFieldChange('companyInfo', 'companyType', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="kabushiki">株式会社</option>
                  <option value="yugen">有限会社</option>
                  <option value="gomei">合名会社</option>
                  <option value="goshi">合資会社</option>
                  <option value="kojin">個人事業主</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  設立年月日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.companyInfo.establishmentDate}
                  onChange={(e) => handleFieldChange('companyInfo', 'establishmentDate', e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    errors.establishmentDate ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.establishmentDate && (
                  <p className="mt-1 text-sm text-red-500">{errors.establishmentDate}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  資本金（円） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.companyInfo.capital}
                  onChange={(e) => handleFieldChange('companyInfo', 'capital', Number(e.target.value))}
                  className={`w-full p-3 border rounded-lg ${
                    errors.capital ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="10000000"
                />
                {errors.capital && (
                  <p className="mt-1 text-sm text-red-500">{errors.capital}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  決算月
                </label>
                <select
                  value={formData.companyInfo.fiscalYearEnd}
                  onChange={(e) => handleFieldChange('companyInfo', 'fiscalYearEnd', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">選択してください</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={`${i + 1}`}>{i + 1}月</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  業種コード
                </label>
                <input
                  type="text"
                  value={formData.companyInfo.industryCode}
                  onChange={(e) => handleFieldChange('companyInfo', 'industryCode', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="日本標準産業分類コード"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                業種説明
              </label>
              <textarea
                value={formData.companyInfo.industryDescription}
                onChange={(e) => handleFieldChange('companyInfo', 'industryDescription', e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="主な事業内容を記載してください"
              />
            </div>
          </div>
        );
        
      case 'address':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">本社所在地</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  郵便番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.addressInfo.postalCode}
                  onChange={(e) => handleFieldChange('addressInfo', 'postalCode', e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    errors.postalCode ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="123-4567"
                  maxLength={8}
                />
                {errors.postalCode && (
                  <p className="mt-1 text-sm text-red-500">{errors.postalCode}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  都道府県 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.addressInfo.prefecture}
                  onChange={(e) => handleFieldChange('addressInfo', 'prefecture', e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    errors.prefecture ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">選択してください</option>
                  {[
                    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
                    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
                    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
                    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
                    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
                    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
                    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
                  ].map(pref => (
                    <option key={pref} value={pref}>{pref}</option>
                  ))}
                </select>
                {errors.prefecture && (
                  <p className="mt-1 text-sm text-red-500">{errors.prefecture}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  市区町村 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.addressInfo.city}
                  onChange={(e) => handleFieldChange('addressInfo', 'city', e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="〇〇市〇〇区"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-500">{errors.city}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  番地 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.addressInfo.address1}
                  onChange={(e) => handleFieldChange('addressInfo', 'address1', e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    errors.address1 ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="1-2-3"
                />
                {errors.address1 && (
                  <p className="mt-1 text-sm text-red-500">{errors.address1}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  建物名・部屋番号
                </label>
                <input
                  type="text"
                  value={formData.addressInfo.buildingName}
                  onChange={(e) => handleFieldChange('addressInfo', 'buildingName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="〇〇ビル 5F"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.addressInfo.headquartersAddress?.isSame}
                  onChange={(e) => handleFieldChange('addressInfo', 'headquartersAddress', {
                    ...formData.addressInfo.headquartersAddress,
                    isSame: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  登記上の本店所在地も同じ
                </span>
              </label>
            </div>
          </div>
        );
        
      case 'representative':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">代表者情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    代表者氏名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.representativeInfo.representativeName}
                    onChange={(e) => handleFieldChange('representativeInfo', 'representativeName', e.target.value)}
                    className={`w-full p-3 border rounded-lg ${
                      errors.representativeName ? 'border-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="山田 太郎"
                  />
                  {errors.representativeName && (
                    <p className="mt-1 text-sm text-red-500">{errors.representativeName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    代表者氏名（フリガナ）
                  </label>
                  <input
                    type="text"
                    value={formData.representativeInfo.representativeNameKana}
                    onChange={(e) => handleFieldChange('representativeInfo', 'representativeNameKana', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ヤマダ タロウ"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    役職
                  </label>
                  <input
                    type="text"
                    value={formData.representativeInfo.representativeTitle}
                    onChange={(e) => handleFieldChange('representativeInfo', 'representativeTitle', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="代表取締役"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生年月日
                  </label>
                  <input
                    type="date"
                    value={formData.representativeInfo.representativeBirthdate}
                    onChange={(e) => handleFieldChange('representativeInfo', 'representativeBirthdate', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">担当者情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    担当者氏名
                  </label>
                  <input
                    type="text"
                    value={formData.representativeInfo.contactPersonName}
                    onChange={(e) => handleFieldChange('representativeInfo', 'contactPersonName', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="鈴木 花子"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    担当者氏名（フリガナ）
                  </label>
                  <input
                    type="text"
                    value={formData.representativeInfo.contactPersonNameKana}
                    onChange={(e) => handleFieldChange('representativeInfo', 'contactPersonNameKana', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="スズキ ハナコ"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    部署
                  </label>
                  <input
                    type="text"
                    value={formData.representativeInfo.contactPersonDepartment}
                    onChange={(e) => handleFieldChange('representativeInfo', 'contactPersonDepartment', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="経営企画部"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    役職
                  </label>
                  <input
                    type="text"
                    value={formData.representativeInfo.contactPersonTitle}
                    onChange={(e) => handleFieldChange('representativeInfo', 'contactPersonTitle', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="課長"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.representativeInfo.contactEmail}
                    onChange={(e) => handleFieldChange('representativeInfo', 'contactEmail', e.target.value)}
                    className={`w-full p-3 border rounded-lg ${
                      errors.contactEmail ? 'border-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="contact@example.com"
                  />
                  {errors.contactEmail && (
                    <p className="mt-1 text-sm text-red-500">{errors.contactEmail}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    電話番号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.representativeInfo.contactPhone}
                    onChange={(e) => handleFieldChange('representativeInfo', 'contactPhone', e.target.value)}
                    className={`w-full p-3 border rounded-lg ${
                      errors.contactPhone ? 'border-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="03-1234-5678"
                  />
                  {errors.contactPhone && (
                    <p className="mt-1 text-sm text-red-500">{errors.contactPhone}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    携帯電話番号
                  </label>
                  <input
                    type="tel"
                    value={formData.representativeInfo.contactMobile}
                    onChange={(e) => handleFieldChange('representativeInfo', 'contactMobile', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="090-1234-5678"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    FAX番号
                  </label>
                  <input
                    type="tel"
                    value={formData.representativeInfo.contactFax}
                    onChange={(e) => handleFieldChange('representativeInfo', 'contactFax', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="03-1234-5679"
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'business':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                事業内容の詳細 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.businessInfo.businessDescription}
                onChange={(e) => handleFieldChange('businessInfo', 'businessDescription', e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="主な事業内容を具体的に記載してください（500文字以内）"
                maxLength={500}
              />
              <div className="text-sm text-gray-500 text-right mt-1">
                {formData.businessInfo.businessDescription.length}/500文字
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                主要製品・サービス
              </label>
              <textarea
                value={formData.businessInfo.mainProducts}
                onChange={(e) => handleFieldChange('businessInfo', 'mainProducts', e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="主要な製品やサービスを記載してください"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  正社員数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.businessInfo.employeeCount}
                  onChange={(e) => handleFieldChange('businessInfo', 'employeeCount', Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  パート・アルバイト数
                </label>
                <input
                  type="number"
                  value={formData.businessInfo.partTimeEmployeeCount}
                  onChange={(e) => handleFieldChange('businessInfo', 'partTimeEmployeeCount', Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  直近年度売上高（円） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.businessInfo.annualRevenue}
                  onChange={(e) => handleFieldChange('businessInfo', 'annualRevenue', Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  前年度売上高（円）
                </label>
                <input
                  type="number"
                  value={formData.businessInfo.previousYearRevenue}
                  onChange={(e) => handleFieldChange('businessInfo', 'previousYearRevenue', Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  直近年度営業利益（円）
                </label>
                <input
                  type="number"
                  value={formData.businessInfo.operatingProfit}
                  onChange={(e) => handleFieldChange('businessInfo', 'operatingProfit', Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  前年度営業利益（円）
                </label>
                <input
                  type="number"
                  value={formData.businessInfo.previousOperatingProfit}
                  onChange={(e) => handleFieldChange('businessInfo', 'previousOperatingProfit', Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                企業ウェブサイト
              </label>
              <input
                type="url"
                value={formData.businessInfo.websiteUrl}
                onChange={(e) => handleFieldChange('businessInfo', 'websiteUrl', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">SNSアカウント</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Twitter</label>
                  <input
                    type="text"
                    value={formData.businessInfo.socialMedia.twitter || ''}
                    onChange={(e) => handleFieldChange('businessInfo', 'socialMedia', {
                      ...formData.businessInfo.socialMedia,
                      twitter: e.target.value
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Facebook</label>
                  <input
                    type="text"
                    value={formData.businessInfo.socialMedia.facebook || ''}
                    onChange={(e) => handleFieldChange('businessInfo', 'socialMedia', {
                      ...formData.businessInfo.socialMedia,
                      facebook: e.target.value
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ページURL"
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'bank':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  補助金の振込先となる口座情報を正確に入力してください。
                  口座名義は申請者名と一致している必要があります。
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  金融機関名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankInfo.bankName}
                  onChange={(e) => handleFieldChange('bankInfo', 'bankName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="〇〇銀行"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  支店名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankInfo.branchName}
                  onChange={(e) => handleFieldChange('bankInfo', 'branchName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="〇〇支店"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  預金種別 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.bankInfo.accountType}
                  onChange={(e) => handleFieldChange('bankInfo', 'accountType', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="futsu">普通</option>
                  <option value="touza">当座</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  口座番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankInfo.accountNumber}
                  onChange={(e) => handleFieldChange('bankInfo', 'accountNumber', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1234567"
                  maxLength={7}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  口座名義人 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankInfo.accountHolder}
                  onChange={(e) => handleFieldChange('bankInfo', 'accountHolder', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="カブシキガイシャ〇〇"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  口座名義人（カナ） <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankInfo.accountHolderKana}
                  onChange={(e) => handleFieldChange('bankInfo', 'accountHolderKana', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="カブシキガイシャ〇〇"
                />
              </div>
            </div>
          </div>
        );
        
      case 'project':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                事業計画名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.projectPlan.projectTitle}
                onChange={(e) => handleFieldChange('projectPlan', 'projectTitle', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="DXによる業務効率化と顧客満足度向上計画"
                maxLength={100}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                事業の目的 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.projectPlan.projectObjective}
                onChange={(e) => handleFieldChange('projectPlan', 'projectObjective', e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="本事業で達成したい目的を具体的に記載してください"
                maxLength={1000}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                現状の課題 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.projectPlan.currentIssues}
                onChange={(e) => handleFieldChange('projectPlan', 'currentIssues', e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="現在抱えている課題を具体的に記載してください"
                maxLength={1000}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                解決方法 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.projectPlan.solutionApproach}
                onChange={(e) => handleFieldChange('projectPlan', 'solutionApproach', e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="どのように課題を解決するか具体的に記載してください"
                maxLength={1000}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                期待される成果 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.projectPlan.expectedResults}
                onChange={(e) => handleFieldChange('projectPlan', 'expectedResults', e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="本事業により期待される成果を具体的に記載してください"
                maxLength={1000}
              />
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">実施スケジュール</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    開始予定日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.projectPlan.implementationSchedule.startDate}
                    onChange={(e) => handleFieldChange('projectPlan', 'implementationSchedule', {
                      ...formData.projectPlan.implementationSchedule,
                      startDate: e.target.value
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    完了予定日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.projectPlan.implementationSchedule.endDate}
                    onChange={(e) => handleFieldChange('projectPlan', 'implementationSchedule', {
                      ...formData.projectPlan.implementationSchedule,
                      endDate: e.target.value
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'implementation':
        // Render based on subsidy type
        if (subsidyType.includes('IT導入補助金') && formData.itImplementation) {
          return (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">IT導入計画の詳細</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ITツールカテゴリ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.itImplementation.itToolCategory}
                    onChange={(e) => handleFieldChange('itImplementation', 'itToolCategory', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    <option value="erp">基幹システム（ERP）</option>
                    <option value="crm">顧客管理システム（CRM）</option>
                    <option value="inventory">在庫管理システム</option>
                    <option value="hr">人事・労務管理システム</option>
                    <option value="accounting">会計・財務システム</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ITツール名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.itImplementation.itToolName}
                    onChange={(e) => handleFieldChange('itImplementation', 'itToolName', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="導入予定のITツール名"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IT導入支援事業者名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.itImplementation.vendorName}
                    onChange={(e) => handleFieldChange('itImplementation', 'vendorName', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="支援事業者名"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    導入費用（円） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.itImplementation.implementationCost}
                    onChange={(e) => handleFieldChange('itImplementation', 'implementationCost', Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    月額利用料（円）
                  </label>
                  <input
                    type="number"
                    value={formData.itImplementation.monthlyFee}
                    onChange={(e) => handleFieldChange('itImplementation', 'monthlyFee', Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ライセンス数
                  </label>
                  <input
                    type="number"
                    value={formData.itImplementation.licenseCount}
                    onChange={(e) => handleFieldChange('itImplementation', 'licenseCount', Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  現在のシステムの課題 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.itImplementation.currentSystemIssues}
                  onChange={(e) => handleFieldChange('itImplementation', 'currentSystemIssues', e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="現在使用しているシステムの課題を記載してください"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  期待される効果 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.itImplementation.expectedBenefits}
                  onChange={(e) => handleFieldChange('itImplementation', 'expectedBenefits', e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ITツール導入により期待される効果を記載してください"
                />
              </div>
            </div>
          );
        }
        // Add similar implementations for ものづくり補助金 and 持続化補助金
        return <div>実施詳細セクション</div>;
        
      case 'expenses':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">経費明細</h3>
              <button
                type="button"
                onClick={() => {
                  const newItem = {
                    category: '',
                    itemName: '',
                    specification: '',
                    quantity: 1,
                    unitPrice: 0,
                    totalPrice: 0,
                    subsidyAmount: 0,
                    vendor: '',
                    quotationDate: '',
                    remarks: '',
                  };
                  handleFieldChange('expenses', 'items', [...formData.expenses.items, newItem]);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 経費を追加
              </button>
            </div>
            
            {formData.expenses.items.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">経費項目がありません。「経費を追加」ボタンから追加してください。</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.expenses.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900">経費項目 {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = formData.expenses.items.filter((_, i) => i !== index);
                          handleFieldChange('expenses', 'items', newItems);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        削除
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          経費区分
                        </label>
                        <select
                          value={item.category}
                          onChange={(e) => {
                            const newItems = [...formData.expenses.items];
                            newItems[index].category = e.target.value;
                            handleFieldChange('expenses', 'items', newItems);
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">選択してください</option>
                          <option value="software">ソフトウェア費</option>
                          <option value="hardware">ハードウェア費</option>
                          <option value="consulting">導入コンサルティング費</option>
                          <option value="training">導入研修費</option>
                          <option value="other">その他</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          品名
                        </label>
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => {
                            const newItems = [...formData.expenses.items];
                            newItems[index].itemName = e.target.value;
                            handleFieldChange('expenses', 'items', newItems);
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          数量
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...formData.expenses.items];
                            newItems[index].quantity = Number(e.target.value);
                            newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
                            handleFieldChange('expenses', 'items', newItems);
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          単価（円）
                        </label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const newItems = [...formData.expenses.items];
                            newItems[index].unitPrice = Number(e.target.value);
                            newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
                            handleFieldChange('expenses', 'items', newItems);
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          金額（円）
                        </label>
                        <input
                          type="number"
                          value={item.totalPrice}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          補助金申請額（円）
                        </label>
                        <input
                          type="number"
                          value={item.subsidyAmount}
                          onChange={(e) => {
                            const newItems = [...formData.expenses.items];
                            newItems[index].subsidyAmount = Number(e.target.value);
                            handleFieldChange('expenses', 'items', newItems);
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max={item.totalPrice}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">経費合計</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ¥{formData.expenses.items.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">補助金申請額</p>
                  <p className="text-2xl font-semibold text-blue-600">
                    ¥{formData.expenses.items.reduce((sum, item) => sum + item.subsidyAmount, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">自己負担額</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ¥{(
                      formData.expenses.items.reduce((sum, item) => sum + item.totalPrice, 0) -
                      formData.expenses.items.reduce((sum, item) => sum + item.subsidyAmount, 0)
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'documents':
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  以下の書類は申請時に必要となります。事前に準備してください。
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiredDocuments.corporateRegistry}
                  onChange={(e) => handleFieldChange('requiredDocuments', 'corporateRegistry', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">履歴事項全部証明書</p>
                  <p className="text-sm text-gray-600 mt-1">
                    法務局で取得（発行から3ヶ月以内のもの）
                  </p>
                </div>
              </label>
              
              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiredDocuments.taxCertificate}
                  onChange={(e) => handleFieldChange('requiredDocuments', 'taxCertificate', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">納税証明書</p>
                  <p className="text-sm text-gray-600 mt-1">
                    税務署で取得（その3の3）
                  </p>
                </div>
              </label>
              
              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiredDocuments.financialStatements}
                  onChange={(e) => handleFieldChange('requiredDocuments', 'financialStatements', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">決算書類</p>
                  <p className="text-sm text-gray-600 mt-1">
                    直近2期分の貸借対照表、損益計算書、製造原価報告書、販売管理費明細、個別注記表
                  </p>
                </div>
              </label>
              
              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiredDocuments.quotations}
                  onChange={(e) => handleFieldChange('requiredDocuments', 'quotations', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">見積書</p>
                  <p className="text-sm text-gray-600 mt-1">
                    補助対象経費の見積書（有効期限内のもの）
                  </p>
                </div>
              </label>
              
              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiredDocuments.businessPlan}
                  onChange={(e) => handleFieldChange('requiredDocuments', 'businessPlan', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">事業計画書</p>
                  <p className="text-sm text-gray-600 mt-1">
                    所定の様式に記載したもの
                  </p>
                </div>
              </label>
            </div>
          </div>
        );
        
      case 'agreements':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <Shield className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  以下の誓約事項をよくお読みいただき、同意の上でチェックしてください。
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreements.termsAccepted}
                  onChange={(e) => handleFieldChange('agreements', 'termsAccepted', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">公募要領・交付規程への同意</p>
                  <p className="text-sm text-gray-600 mt-1">
                    公募要領および交付規程の内容を理解し、遵守することに同意します。
                  </p>
                </div>
              </label>
              
              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreements.dataUsageAccepted}
                  onChange={(e) => handleFieldChange('agreements', 'dataUsageAccepted', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">個人情報の取り扱いへの同意</p>
                  <p className="text-sm text-gray-600 mt-1">
                    提供した情報が補助金審査および関連する行政手続きに使用されることに同意します。
                  </p>
                </div>
              </label>
              
              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreements.fraudDeclaration}
                  onChange={(e) => handleFieldChange('agreements', 'fraudDeclaration', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">不正受給に関する誓約</p>
                  <p className="text-sm text-gray-600 mt-1">
                    虚偽の申請や不正な手段による補助金の受給を行わないことを誓約します。
                  </p>
                </div>
              </label>
              
              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreements.duplicateApplicationDeclaration}
                  onChange={(e) => handleFieldChange('agreements', 'duplicateApplicationDeclaration', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">重複申請の禁止</p>
                  <p className="text-sm text-gray-600 mt-1">
                    同一の事業について、他の補助金との重複申請を行っていないことを誓約します。
                  </p>
                </div>
              </label>
              
              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreements.informationAccuracy}
                  onChange={(e) => handleFieldChange('agreements', 'informationAccuracy', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">申請内容の真実性</p>
                  <p className="text-sm text-gray-600 mt-1">
                    申請書に記載した全ての内容が真実であることを誓約します。
                  </p>
                </div>
              </label>
            </div>
            
            {Object.values(formData.agreements).every(v => v === true) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <p className="text-sm text-green-800">
                    全ての誓約事項に同意いただきました。申請を完了できます。
                  </p>
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return <div>Section content for {section.title}</div>;
    }
  };

  const progressPercentage = ((currentSection + 1) / formSections.length) * 100;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {subsidyType} - 申請書類作成
          </h1>
          <button
            onClick={handleSaveProgress}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>一時保存</span>
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Section Indicators */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto">
          {formSections.map((section, index) => {
            const Icon = section.icon;
            const isActive = index === currentSection;
            const isCompleted = index < currentSection;
            
            return (
              <div
                key={section.id}
                className={`flex items-center ${
                  index < formSections.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`flex items-center space-x-2 ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`text-sm font-medium hidden md:block ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {section.title}
                  </span>
                </div>
                {index < formSections.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Current Section */}
      <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-100 rounded-full p-3">
            {React.createElement(formSections[currentSection].icon, {
              className: "h-6 w-6 text-blue-600"
            })}
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {formSections[currentSection].title}
          </h2>
        </div>
        
        {renderSectionContent()}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>{currentSection === 0 ? '戻る' : '前へ'}</span>
        </button>
        
        <div className="text-sm text-gray-500">
          {currentSection + 1} / {formSections.length}
        </div>
        
        <button
          onClick={handleNext}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span>
            {currentSection === formSections.length - 1 ? '完了' : '次へ'}
          </span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ComprehensiveDocumentForm;