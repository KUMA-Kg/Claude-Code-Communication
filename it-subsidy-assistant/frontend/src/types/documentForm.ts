// Comprehensive form data types for document generation

export interface CompanyInfo {
  companyName: string;
  companyNameKana: string;
  corporateNumber: string;
  establishmentDate: string;
  capital: number;
  companyType: 'kabushiki' | 'yugen' | 'gomei' | 'goshi' | 'kojin';
  fiscalYearEnd: string;
  industryCode: string;
  industryDescription: string;
}

export interface AddressInfo {
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
}

export interface RepresentativeInfo {
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
}

export interface BusinessInfo {
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
}

export interface BankInfo {
  bankName: string;
  branchName: string;
  accountType: 'futsu' | 'touza';
  accountNumber: string;
  accountHolder: string;
  accountHolderKana: string;
}

export interface ProjectMilestone {
  date: string;
  description: string;
}

export interface KPI {
  indicator: string;
  currentValue: string;
  targetValue: string;
  measurementMethod: string;
}

export interface ProjectPlan {
  projectTitle: string;
  projectObjective: string;
  currentIssues: string;
  solutionApproach: string;
  expectedResults: string;
  implementationSchedule: {
    startDate: string;
    endDate: string;
    milestones: ProjectMilestone[];
  };
  kpi: KPI[];
}

export interface ITImplementation {
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
}

export interface EquipmentInvestment {
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
}

export interface MarketExpansion {
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
}

export interface ExpenseItem {
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
}

export interface Expenses {
  items: ExpenseItem[];
  totalAmount: number;
  subsidyRequestAmount: number;
  selfFundAmount: number;
}

export interface RequiredDocuments {
  corporateRegistry: boolean;
  taxCertificate: boolean;
  financialStatements: boolean;
  quotations: boolean;
  businessPlan: boolean;
  otherDocuments: Array<{
    name: string;
    attached: boolean;
  }>;
}

export interface Agreements {
  termsAccepted: boolean;
  dataUsageAccepted: boolean;
  fraudDeclaration: boolean;
  duplicateApplicationDeclaration: boolean;
  informationAccuracy: boolean;
}

export interface ComprehensiveFormData {
  companyInfo: CompanyInfo;
  addressInfo: AddressInfo;
  representativeInfo: RepresentativeInfo;
  businessInfo: BusinessInfo;
  bankInfo: BankInfo;
  projectPlan: ProjectPlan;
  itImplementation?: ITImplementation;
  equipmentInvestment?: EquipmentInvestment;
  marketExpansion?: MarketExpansion;
  expenses: Expenses;
  requiredDocuments: RequiredDocuments;
  agreements: Agreements;
}

// Validation rules for each field
export const ValidationRules = {
  companyInfo: {
    companyName: { required: true, maxLength: 100 },
    companyNameKana: { required: true, maxLength: 100, pattern: /^[ァ-ヶー\s]+$/ },
    corporateNumber: { required: true, length: 13, pattern: /^\d{13}$/ },
    establishmentDate: { required: true },
    capital: { required: true, min: 1 },
    industryCode: { pattern: /^\d{4}$/ },
  },
  addressInfo: {
    postalCode: { required: true, pattern: /^\d{3}-?\d{4}$/ },
    prefecture: { required: true },
    city: { required: true },
    address1: { required: true },
  },
  representativeInfo: {
    representativeName: { required: true },
    contactEmail: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    contactPhone: { required: true, pattern: /^[\d-]+$/ },
  },
  businessInfo: {
    businessDescription: { required: true, maxLength: 500 },
    employeeCount: { required: true, min: 0 },
    annualRevenue: { required: true, min: 0 },
  },
  bankInfo: {
    bankName: { required: true },
    branchName: { required: true },
    accountNumber: { required: true, pattern: /^\d{7}$/ },
    accountHolder: { required: true },
    accountHolderKana: { required: true, pattern: /^[ァ-ヶー\s]+$/ },
  },
  projectPlan: {
    projectTitle: { required: true, maxLength: 100 },
    projectObjective: { required: true, maxLength: 1000 },
    currentIssues: { required: true, maxLength: 1000 },
    solutionApproach: { required: true, maxLength: 1000 },
    expectedResults: { required: true, maxLength: 1000 },
  },
};

// Helper functions for form data
export const calculateTotalExpenses = (items: ExpenseItem[]): number => {
  return items.reduce((sum, item) => sum + item.totalPrice, 0);
};

export const calculateSubsidyAmount = (items: ExpenseItem[]): number => {
  return items.reduce((sum, item) => sum + item.subsidyAmount, 0);
};

export const isAllAgreementsAccepted = (agreements: Agreements): boolean => {
  return Object.values(agreements).every(value => value === true);
};

export const getRequiredFieldsForSubsidy = (subsidyType: string): string[] => {
  const baseFields = [
    'companyInfo',
    'addressInfo',
    'representativeInfo',
    'businessInfo',
    'bankInfo',
    'projectPlan',
    'expenses',
    'requiredDocuments',
    'agreements',
  ];

  if (subsidyType.includes('IT導入補助金')) {
    return [...baseFields, 'itImplementation'];
  } else if (subsidyType.includes('ものづくり補助金')) {
    return [...baseFields, 'equipmentInvestment'];
  } else if (subsidyType.includes('持続化補助金')) {
    return [...baseFields, 'marketExpansion'];
  }

  return baseFields;
};