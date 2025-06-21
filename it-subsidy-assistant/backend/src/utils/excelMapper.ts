import { logger } from './logger';

export interface FieldMapping {
  fieldId: string;
  label: string;
  cellReference: string;
  sheetName?: string;
  format?: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  required?: boolean;
  validation?: FieldValidation;
  dependencies?: string[];
}

export interface FieldValidation {
  type?: 'string' | 'number' | 'email' | 'phone' | 'postal_code' | 'corporate_number';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: (value: any) => string | null;
}

export interface ExcelTemplate {
  fileName: string;
  displayName: string;
  sheetNames: string[];
  mappings: FieldMapping[];
  formulaRules?: FormulaRule[];
  conditionalLogic?: ConditionalLogic[];
}

export interface FormulaRule {
  cellReference: string;
  formula: string;
  dependencies: string[];
}

export interface ConditionalLogic {
  condition: (formData: Record<string, any>) => boolean;
  actions: {
    showFields?: string[];
    hideFields?: string[];
    requiredFields?: string[];
    optionalFields?: string[];
  };
}

/**
 * Excel書類フィールドマッピング定義
 */
export class ExcelMapper {
  private static templates: Record<string, ExcelTemplate[]> = {
    'it-donyu': [
      {
        fileName: 'it2025_chingin_houkoku.xlsx',
        displayName: '賃金報告書',
        sheetNames: ['賃金報告書'],
        mappings: [
          {
            fieldId: 'company_name',
            label: '申請者名（法人名/屋号）',
            cellReference: 'C4',
            format: 'text',
            required: true,
            validation: { 
              type: 'string', 
              maxLength: 100, 
              minLength: 1 
            }
          },
          {
            fieldId: 'corporate_number',
            label: '法人番号',
            cellReference: 'C5',
            format: 'text',
            required: false,
            validation: { 
              type: 'corporate_number',
              pattern: '^\\d{13}$' 
            }
          },
          {
            fieldId: 'representative_title',
            label: '代表者役職',
            cellReference: 'C6',
            format: 'text',
            required: true,
            validation: { 
              type: 'string', 
              maxLength: 20 
            }
          },
          {
            fieldId: 'representative_name',
            label: '代表者氏名',
            cellReference: 'C7',
            format: 'text',
            required: true,
            validation: { 
              type: 'string', 
              maxLength: 50 
            }
          },
          {
            fieldId: 'employee_count',
            label: '直近決算期の従業員数',
            cellReference: 'C10',
            format: 'number',
            required: true,
            validation: { 
              type: 'number', 
              min: 1, 
              max: 9999 
            }
          },
          {
            fieldId: 'current_avg_salary',
            label: '直近決算期の平均給与額',
            cellReference: 'C11',
            format: 'currency',
            required: true,
            validation: { 
              type: 'number', 
              min: 0 
            }
          },
          {
            fieldId: 'planned_avg_salary',
            label: '事業計画期間終了時の平均給与額',
            cellReference: 'C12',
            format: 'currency',
            required: true,
            validation: { 
              type: 'number', 
              min: 0 
            },
            dependencies: ['current_avg_salary']
          }
        ],
        formulaRules: [
          {
            cellReference: 'C13',
            formula: '(C12-C11)/C11',
            dependencies: ['current_avg_salary', 'planned_avg_salary']
          }
        ]
      },
      {
        fileName: 'it2025_jisshinaiyosetsumei_cate5.xlsx',
        displayName: '実施内容説明書（デジタル化基盤導入枠）',
        sheetNames: ['実施内容説明書'],
        mappings: [
          {
            fieldId: 'it_tool_name',
            label: 'ITツール名',
            cellReference: 'B3',
            format: 'text',
            required: true,
            validation: { 
              type: 'string', 
              maxLength: 100 
            }
          },
          {
            fieldId: 'it_provider_name',
            label: 'ITツール提供事業者名',
            cellReference: 'B4',
            format: 'text',
            required: true,
            validation: { 
              type: 'string', 
              maxLength: 100 
            }
          },
          {
            fieldId: 'current_issues',
            label: '導入前の課題・問題点',
            cellReference: 'B7',
            format: 'text',
            required: true,
            validation: { 
              type: 'string', 
              maxLength: 500 
            }
          },
          {
            fieldId: 'expected_effects',
            label: '導入により期待される効果',
            cellReference: 'B10',
            format: 'text',
            required: true,
            validation: { 
              type: 'string', 
              maxLength: 500 
            }
          },
          {
            fieldId: 'usage_method',
            label: '具体的な活用方法',
            cellReference: 'B13',
            format: 'text',
            required: true,
            validation: { 
              type: 'string', 
              maxLength: 800 
            }
          },
          {
            fieldId: 'productivity_target',
            label: '生産性向上の定量的目標',
            cellReference: 'B16',
            format: 'text',
            required: true,
            validation: { 
              type: 'string', 
              maxLength: 200 
            }
          },
          {
            fieldId: 'implementation_schedule',
            label: '導入スケジュール',
            cellReference: 'B19',
            format: 'text',
            required: true,
            validation: { 
              type: 'string', 
              maxLength: 100 
            }
          }
        ]
      },
      {
        fileName: 'it2025_kakakusetsumei_cate5.xlsx',
        displayName: '価格説明書（デジタル化基盤導入枠）',
        sheetNames: ['価格説明書'],
        mappings: [
          {
            fieldId: 'software_cost',
            label: 'ソフトウェア費用',
            cellReference: 'C5',
            format: 'currency',
            required: true,
            validation: { 
              type: 'number', 
              min: 0 
            }
          },
          {
            fieldId: 'implementation_cost',
            label: '導入関連費用',
            cellReference: 'C6',
            format: 'currency',
            required: false,
            validation: { 
              type: 'number', 
              min: 0 
            }
          },
          {
            fieldId: 'service_cost',
            label: '役務費用',
            cellReference: 'C7',
            format: 'currency',
            required: false,
            validation: { 
              type: 'number', 
              min: 0 
            }
          },
          {
            fieldId: 'maintenance_cost',
            label: '保守費用（年額）',
            cellReference: 'C8',
            format: 'currency',
            required: false,
            validation: { 
              type: 'number', 
              min: 0 
            }
          }
        ],
        formulaRules: [
          {
            cellReference: 'C10',
            formula: 'C5+C6+C7+C8',
            dependencies: ['software_cost', 'implementation_cost', 'service_cost', 'maintenance_cost']
          },
          {
            cellReference: 'C12',
            formula: 'C5+C6+C7',
            dependencies: ['software_cost', 'implementation_cost', 'service_cost']
          },
          {
            cellReference: 'C13',
            formula: 'MIN(C12*0.5, 4500000)',
            dependencies: ['software_cost', 'implementation_cost', 'service_cost']
          }
        ]
      }
    ],
    'monozukuri': [
      {
        fileName: 'CAGR算出ツール_20250314.xlsx',
        displayName: 'CAGR算出ツール',
        sheetNames: ['CAGR算出'],
        mappings: [
          {
            fieldId: 'base_year_revenue',
            label: '基準年度売上高',
            cellReference: 'C5',
            format: 'currency',
            required: true,
            validation: { 
              type: 'number', 
              min: 1000 
            }
          },
          {
            fieldId: 'year1_target',
            label: '1年後売上高目標',
            cellReference: 'C6',
            format: 'currency',
            required: true,
            validation: { 
              type: 'number', 
              min: 1000 
            }
          },
          {
            fieldId: 'year2_target',
            label: '2年後売上高目標',
            cellReference: 'C7',
            format: 'currency',
            required: true,
            validation: { 
              type: 'number', 
              min: 1000 
            }
          },
          {
            fieldId: 'year3_target',
            label: '3年後売上高目標',
            cellReference: 'C8',
            format: 'currency',
            required: true,
            validation: { 
              type: 'number', 
              min: 1000 
            }
          },
          {
            fieldId: 'year5_target',
            label: '5年後売上高目標',
            cellReference: 'C9',
            format: 'currency',
            required: true,
            validation: { 
              type: 'number', 
              min: 1000 
            }
          }
        ],
        formulaRules: [
          {
            cellReference: 'E10',
            formula: 'POWER(C8/C5, 1/3) - 1',
            dependencies: ['base_year_revenue', 'year3_target']
          },
          {
            cellReference: 'E11',
            formula: 'POWER(C9/C5, 1/5) - 1',
            dependencies: ['base_year_revenue', 'year5_target']
          }
        ]
      }
    ],
    'jizokuka': [
      {
        fileName: 'r3i_y3e.xlsx',
        displayName: '様式3 補助事業計画書',
        sheetNames: ['補助事業計画書'],
        mappings: [
          {
            fieldId: 'subsidy_project_name',
            label: '補助事業名',
            cellReference: 'B3',
            format: 'text',
            required: true,
            validation: { 
              type: 'string', 
              maxLength: 30 
            }
          },
          {
            fieldId: 'sales_expansion_plan',
            label: '販路開拓等の取組内容',
            cellReference: 'B5',
            format: 'text',
            required: true,
            validation: { 
              type: 'string', 
              maxLength: 2000 
            }
          },
          {
            fieldId: 'project_effects',
            label: '補助事業の効果',
            cellReference: 'B22',
            format: 'text',
            required: true,
            validation: { 
              type: 'string', 
              maxLength: 500 
            }
          }
        ]
      }
    ]
  };

  /**
   * 補助金タイプに対応するテンプレート一覧を取得
   */
  static getTemplates(subsidyType: string): ExcelTemplate[] {
    return this.templates[subsidyType] || [];
  }

  /**
   * 特定のファイルのマッピング情報を取得
   */
  static getMapping(subsidyType: string, fileName: string): ExcelTemplate | null {
    const templates = this.getTemplates(subsidyType);
    return templates.find(template => template.fileName === fileName) || null;
  }

  /**
   * フィールド情報を取得
   */
  static getFieldInfo(subsidyType: string, fileName: string, fieldId: string): FieldMapping | null {
    const mapping = this.getMapping(subsidyType, fileName);
    if (!mapping) return null;
    
    return mapping.mappings.find(field => field.fieldId === fieldId) || null;
  }

  /**
   * フォームデータの検証
   */
  static validateFormData(subsidyType: string, formData: Record<string, any>): ValidationResult {
    const templates = this.getTemplates(subsidyType);
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const missingFields: string[] = [];

    for (const template of templates) {
      for (const field of template.mappings) {
        const value = formData[field.fieldId];
        
        // 必須フィールドチェック
        if (field.required && (value === undefined || value === null || value === '')) {
          missingFields.push(field.fieldId);
          errors.push({
            fieldId: field.fieldId,
            fileName: template.fileName,
            message: `必須フィールド「${field.label}」が入力されていません`,
            severity: 'error'
          });
          continue;
        }

        // バリデーション実行
        if (value !== undefined && value !== null && value !== '' && field.validation) {
          const validationError = this.validateField(field, value);
          if (validationError) {
            errors.push({
              fieldId: field.fieldId,
              fileName: template.fileName,
              message: validationError,
              severity: 'error'
            });
          }
        }

        // 依存関係チェック
        if (field.dependencies) {
          const dependencyWarning = this.checkDependencies(field, formData);
          if (dependencyWarning) {
            warnings.push({
              fieldId: field.fieldId,
              fileName: template.fileName,
              message: dependencyWarning,
              severity: 'warning'
            });
          }
        }
      }
    }

    // 補助金タイプ特有の複合バリデーション
    const customValidation = this.performCustomValidation(subsidyType, formData);
    errors.push(...customValidation.errors);
    warnings.push(...customValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields
    };
  }

  /**
   * 個別フィールドの検証
   */
  private static validateField(field: FieldMapping, value: any): string | null {
    const validation = field.validation!;

    // 型チェック
    switch (validation.type) {
      case 'number':
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(numValue)) {
          return `${field.label}は数値で入力してください`;
        }
        if (validation.min !== undefined && numValue < validation.min) {
          return `${field.label}は${validation.min}以上で入力してください`;
        }
        if (validation.max !== undefined && numValue > validation.max) {
          return `${field.label}は${validation.max}以下で入力してください`;
        }
        break;

      case 'string':
        const strValue = value.toString();
        if (validation.minLength && strValue.length < validation.minLength) {
          return `${field.label}は${validation.minLength}文字以上で入力してください`;
        }
        if (validation.maxLength && strValue.length > validation.maxLength) {
          return `${field.label}は${validation.maxLength}文字以下で入力してください`;
        }
        break;

      case 'email':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value.toString())) {
          return `${field.label}の形式が正しくありません`;
        }
        break;

      case 'phone':
        const phonePattern = /^[\d\-\(\)\+\s]+$/;
        if (!phonePattern.test(value.toString())) {
          return `${field.label}の形式が正しくありません`;
        }
        break;

      case 'postal_code':
        const postalPattern = /^\d{3}-?\d{4}$/;
        if (!postalPattern.test(value.toString())) {
          return `${field.label}は「123-4567」の形式で入力してください`;
        }
        break;

      case 'corporate_number':
        const corporatePattern = /^\d{13}$/;
        if (!corporatePattern.test(value.toString())) {
          return `${field.label}は13桁の数字で入力してください`;
        }
        break;
    }

    // パターンチェック
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value.toString())) {
        return `${field.label}の形式が正しくありません`;
      }
    }

    // カスタムバリデーション
    if (validation.customValidator) {
      return validation.customValidator(value);
    }

    return null;
  }

  /**
   * 依存関係チェック
   */
  private static checkDependencies(field: FieldMapping, formData: Record<string, any>): string | null {
    if (!field.dependencies) return null;

    for (const depFieldId of field.dependencies) {
      const depValue = formData[depFieldId];
      
      if (depValue === undefined || depValue === null || depValue === '') {
        return `${field.label}を入力する前に、関連する項目を入力してください`;
      }

      // 特定の依存関係チェック
      if (field.fieldId === 'planned_avg_salary' && depFieldId === 'current_avg_salary') {
        const currentSalary = parseFloat(formData.current_avg_salary) || 0;
        const plannedSalary = parseFloat(formData.planned_avg_salary) || 0;
        
        if (plannedSalary <= currentSalary) {
          return '計画給与額は現在の給与額より高く設定することを推奨します';
        }
      }
    }

    return null;
  }

  /**
   * 補助金タイプ特有のカスタム検証
   */
  private static performCustomValidation(subsidyType: string, formData: Record<string, any>): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    switch (subsidyType) {
      case 'it-donyu':
        // IT導入補助金特有の検証
        const totalCost = (formData.software_cost || 0) + (formData.implementation_cost || 0) + (formData.service_cost || 0);
        if (totalCost < 300000) {
          errors.push({
            fieldId: 'total_cost',
            fileName: 'it2025_kakakusetsumei_cate5.xlsx',
            message: 'IT導入補助金の最低申請額は30万円です',
            severity: 'error'
          });
        }
        if (totalCost > 4500000) {
          warnings.push({
            fieldId: 'total_cost',
            fileName: 'it2025_kakakusetsumei_cate5.xlsx',
            message: 'IT導入補助金の上限額は450万円です',
            severity: 'warning'
          });
        }
        break;

      case 'monozukuri':
        // ものづくり補助金特有の検証
        const baseRevenue = formData.base_year_revenue || 0;
        const year3Revenue = formData.year3_target || 0;
        if (year3Revenue > 0 && baseRevenue > 0) {
          const cagr = Math.pow(year3Revenue / baseRevenue, 1/3) - 1;
          if (cagr < 0.05) {
            warnings.push({
              fieldId: 'year3_target',
              fileName: 'CAGR算出ツール_20250314.xlsx',
              message: '3年間のCAGRが5%未満です。成長性を見直すことを推奨します',
              severity: 'warning'
            });
          }
        }
        break;

      case 'jizokuka':
        // 小規模事業者持続化補助金特有の検証
        const projectName = formData.subsidy_project_name || '';
        if (projectName.length > 0 && projectName.length < 5) {
          warnings.push({
            fieldId: 'subsidy_project_name',
            fileName: 'r3i_y3e.xlsx',
            message: '補助事業名はより具体的に記載することを推奨します',
            severity: 'warning'
          });
        }
        break;
    }

    return { errors, warnings };
  }
}

// 型定義
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  missingFields: string[];
}

export interface ValidationError {
  fieldId: string;
  fileName: string;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  fieldId: string;
  fileName: string;
  message: string;
  severity: 'warning';
}