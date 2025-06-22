import { ComprehensiveFormData } from '../types/documentForm';

// Field mapping configuration for different subsidy types
export interface FieldMapping {
  formField: string;
  documentField: string;
  documentType: 'excel' | 'word';
  cellReference?: string; // For Excel
  placeholder?: string; // For Word
  transform?: (value: any) => any;
}

// IT導入補助金 field mappings
export const ITSubsidyFieldMappings: FieldMapping[] = [
  // 基本情報
  {
    formField: 'companyInfo.companyName',
    documentField: '事業者名',
    documentType: 'excel',
    cellReference: 'B5',
  },
  {
    formField: 'companyInfo.companyNameKana',
    documentField: '事業者名カナ',
    documentType: 'excel',
    cellReference: 'B6',
  },
  {
    formField: 'companyInfo.corporateNumber',
    documentField: '法人番号',
    documentType: 'excel',
    cellReference: 'B7',
  },
  {
    formField: 'companyInfo.establishmentDate',
    documentField: '設立年月日',
    documentType: 'excel',
    cellReference: 'B8',
    transform: (date: string) => new Date(date).toLocaleDateString('ja-JP'),
  },
  {
    formField: 'companyInfo.capital',
    documentField: '資本金',
    documentType: 'excel',
    cellReference: 'B9',
    transform: (value: number) => value.toLocaleString('ja-JP'),
  },
  // 所在地
  {
    formField: 'addressInfo.postalCode',
    documentField: '郵便番号',
    documentType: 'excel',
    cellReference: 'B11',
  },
  {
    formField: 'addressInfo.prefecture',
    documentField: '都道府県',
    documentType: 'excel',
    cellReference: 'B12',
  },
  {
    formField: 'addressInfo.city',
    documentField: '市区町村',
    documentType: 'excel',
    cellReference: 'B13',
  },
  {
    formField: 'addressInfo.address1',
    documentField: '番地',
    documentType: 'excel',
    cellReference: 'B14',
  },
  // 代表者情報
  {
    formField: 'representativeInfo.representativeName',
    documentField: '代表者氏名',
    documentType: 'excel',
    cellReference: 'B16',
  },
  {
    formField: 'representativeInfo.contactEmail',
    documentField: 'メールアドレス',
    documentType: 'excel',
    cellReference: 'B18',
  },
  {
    formField: 'representativeInfo.contactPhone',
    documentField: '電話番号',
    documentType: 'excel',
    cellReference: 'B19',
  },
  // 事業情報
  {
    formField: 'businessInfo.employeeCount',
    documentField: '従業員数',
    documentType: 'excel',
    cellReference: 'B21',
  },
  {
    formField: 'businessInfo.annualRevenue',
    documentField: '売上高',
    documentType: 'excel',
    cellReference: 'B22',
    transform: (value: number) => value.toLocaleString('ja-JP'),
  },
  // IT導入計画
  {
    formField: 'itImplementation.itToolName',
    documentField: 'ITツール名',
    documentType: 'excel',
    cellReference: 'B25',
  },
  {
    formField: 'itImplementation.vendorName',
    documentField: 'IT導入支援事業者名',
    documentType: 'excel',
    cellReference: 'B26',
  },
  {
    formField: 'itImplementation.implementationCost',
    documentField: '導入費用',
    documentType: 'excel',
    cellReference: 'B27',
    transform: (value: number) => value.toLocaleString('ja-JP'),
  },
];

// ものづくり補助金 field mappings
export const MonozukuriFieldMappings: FieldMapping[] = [
  // Word document mappings
  {
    formField: 'companyInfo.companyName',
    documentField: '申請者名',
    documentType: 'word',
    placeholder: '{{申請者名}}',
  },
  {
    formField: 'projectPlan.projectTitle',
    documentField: '事業計画名',
    documentType: 'word',
    placeholder: '{{事業計画名}}',
  },
  {
    formField: 'projectPlan.currentIssues',
    documentField: '現状の課題',
    documentType: 'word',
    placeholder: '{{現状の課題}}',
  },
  {
    formField: 'projectPlan.solutionApproach',
    documentField: '課題解決のアプローチ',
    documentType: 'word',
    placeholder: '{{課題解決のアプローチ}}',
  },
  {
    formField: 'equipmentInvestment.equipmentName',
    documentField: '導入設備名',
    documentType: 'word',
    placeholder: '{{導入設備名}}',
  },
  {
    formField: 'equipmentInvestment.totalPrice',
    documentField: '設備投資額',
    documentType: 'word',
    placeholder: '{{設備投資額}}',
    transform: (value: number) => `${value.toLocaleString('ja-JP')}円`,
  },
];

// 持続化補助金 field mappings
export const JizokukaFieldMappings: FieldMapping[] = [
  // 様式1（申請書）
  {
    formField: 'companyInfo.companyName',
    documentField: '申請者名',
    documentType: 'word',
    placeholder: '{{申請者名}}',
  },
  {
    formField: 'addressInfo.postalCode',
    documentField: '郵便番号',
    documentType: 'word',
    placeholder: '{{郵便番号}}',
  },
  {
    formField: 'addressInfo.prefecture',
    documentField: '都道府県',
    documentType: 'word',
    placeholder: '{{都道府県}}',
  },
  // 様式2（経営計画書）
  {
    formField: 'businessInfo.businessDescription',
    documentField: '事業内容',
    documentType: 'word',
    placeholder: '{{事業内容}}',
  },
  {
    formField: 'marketExpansion.targetMarket',
    documentField: 'ターゲット市場',
    documentType: 'word',
    placeholder: '{{ターゲット市場}}',
  },
  {
    formField: 'marketExpansion.marketingStrategy',
    documentField: 'マーケティング戦略',
    documentType: 'word',
    placeholder: '{{マーケティング戦略}}',
  },
  // 様式3（補助事業計画書）- Excel
  {
    formField: 'projectPlan.projectTitle',
    documentField: '補助事業名',
    documentType: 'excel',
    cellReference: 'C5',
  },
  {
    formField: 'expenses.subsidyRequestAmount',
    documentField: '補助金申請額',
    documentType: 'excel',
    cellReference: 'F15',
    transform: (value: number) => value.toLocaleString('ja-JP'),
  },
];

// Helper function to get field value from nested object
export const getFieldValue = (data: ComprehensiveFormData, fieldPath: string): any => {
  const keys = fieldPath.split('.');
  let value: any = data;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }

  return value;
};

// Apply field mappings to generate document data
export const applyFieldMappings = (
  formData: ComprehensiveFormData,
  mappings: FieldMapping[]
): { excel: Record<string, any>; word: Record<string, any> } => {
  const excelData: Record<string, any> = {};
  const wordData: Record<string, any> = {};

  for (const mapping of mappings) {
    const value = getFieldValue(formData, mapping.formField);
    if (value !== undefined) {
      const transformedValue = mapping.transform ? mapping.transform(value) : value;

      if (mapping.documentType === 'excel' && mapping.cellReference) {
        excelData[mapping.cellReference] = transformedValue;
      } else if (mapping.documentType === 'word' && mapping.placeholder) {
        wordData[mapping.placeholder] = transformedValue;
      }
    }
  }

  return { excel: excelData, word: wordData };
};

// Get appropriate field mappings based on subsidy type
export const getFieldMappingsForSubsidy = (subsidyType: string): FieldMapping[] => {
  if (subsidyType.includes('IT導入補助金')) {
    return ITSubsidyFieldMappings;
  } else if (subsidyType.includes('ものづくり補助金')) {
    return MonozukuriFieldMappings;
  } else if (subsidyType.includes('持続化補助金')) {
    return JizokukaFieldMappings;
  }

  return [];
};

// Validate required fields are filled
export const validateRequiredFields = (
  formData: ComprehensiveFormData,
  subsidyType: string
): { isValid: boolean; missingFields: string[] } => {
  const mappings = getFieldMappingsForSubsidy(subsidyType);
  const missingFields: string[] = [];

  for (const mapping of mappings) {
    const value = getFieldValue(formData, mapping.formField);
    if (value === undefined || value === '' || value === null) {
      missingFields.push(mapping.formField);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

// Generate document filename based on subsidy type and timestamp
export const generateDocumentFilename = (
  subsidyType: string,
  documentType: 'excel' | 'word' | 'pdf'
): string => {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  let prefix = '';

  if (subsidyType.includes('IT導入補助金')) {
    prefix = 'IT導入補助金申請書';
  } else if (subsidyType.includes('ものづくり補助金')) {
    prefix = 'ものづくり補助金事業計画書';
  } else if (subsidyType.includes('持続化補助金')) {
    prefix = '持続化補助金申請書';
  }

  const extension = documentType === 'excel' ? 'xlsx' : documentType === 'word' ? 'docx' : 'pdf';
  return `${prefix}_${timestamp}.${extension}`;
};