import documentFieldMapping from '../data/document-field-mapping.json';
import documentFieldSpecs from '../data/document-field-specifications.json';

interface FieldMapping {
  field_id: string;
  source: string;
  default?: any;
  type?: string;
  calculation?: string;
  mapping?: { [key: string]: string };
  array_mapping?: { [key: string]: string };
  object_mapping?: { [key: string]: string };
  conditional?: {
    field: string;
    value: string;
  };
}

interface DocumentMapping {
  document_name: string;
  required_fields: FieldMapping[];
}

interface CollectedData {
  [documentId: string]: {
    [fieldId: string]: any;
  };
}

export class DocumentDataCollector {
  private fieldMapping: any;
  private fieldSpecs: any;

  constructor() {
    this.fieldMapping = documentFieldMapping;
    this.fieldSpecs = documentFieldSpecs.document_field_specifications;
  }

  /**
   * すべての書類に必要なデータを収集
   */
  collectAllDocumentData(
    subsidyType: string,
    companyData: any,
    questionnaireData: any,
    documentIds: string[]
  ): CollectedData {
    const collectedData: CollectedData = {};
    
    const subsidyMapping = this.fieldMapping[subsidyType];
    if (!subsidyMapping) {
      console.warn(`No mapping found for subsidy type: ${subsidyType}`);
      return collectedData;
    }

    documentIds.forEach(docId => {
      const docMapping = subsidyMapping[docId];
      if (docMapping) {
        collectedData[docId] = this.collectDocumentData(
          docMapping,
          companyData,
          questionnaireData
        );
      }
    });

    return collectedData;
  }

  /**
   * 特定の書類に必要なデータを収集
   */
  private collectDocumentData(
    docMapping: DocumentMapping,
    companyData: any,
    questionnaireData: any
  ): { [fieldId: string]: any } {
    const documentData: { [fieldId: string]: any } = {};

    docMapping.required_fields.forEach(fieldMapping => {
      const value = this.extractFieldValue(
        fieldMapping,
        companyData,
        questionnaireData,
        documentData
      );

      // 条件付きフィールドのチェック
      if (fieldMapping.conditional) {
        const conditionField = documentData[fieldMapping.conditional.field];
        if (conditionField !== fieldMapping.conditional.value) {
          return; // 条件を満たさない場合はスキップ
        }
      }

      if (value !== undefined && value !== null) {
        documentData[fieldMapping.field_id] = value;
      }
    });

    return documentData;
  }

  /**
   * フィールドの値を抽出
   */
  private extractFieldValue(
    fieldMapping: FieldMapping,
    companyData: any,
    questionnaireData: any,
    currentDocumentData: any
  ): any {
    switch (fieldMapping.source) {
      case 'auto':
        return this.getAutoValue(fieldMapping);
      
      case 'calculated':
        return this.calculateValue(fieldMapping, companyData, currentDocumentData);
      
      default:
        return this.getDataValue(fieldMapping, companyData, questionnaireData);
    }
  }

  /**
   * 自動生成される値を取得
   */
  private getAutoValue(fieldMapping: FieldMapping): any {
    if (fieldMapping.default === 'current_date') {
      return new Date().toISOString().split('T')[0];
    }
    return fieldMapping.default;
  }

  /**
   * 計算値を取得
   */
  private calculateValue(
    fieldMapping: FieldMapping,
    companyData: any,
    currentDocumentData: any
  ): any {
    if (!fieldMapping.calculation) return null;

    const calculation = fieldMapping.calculation;
    
    // 簡易的な計算式の評価
    if (calculation.includes('*')) {
      // 賃金上昇率の計算など
      const match = calculation.match(/(\w+)\s*\*\s*\(1\s*\+\s*(\w+)\s*\/\s*100\)/);
      if (match) {
        const baseField = match[1];
        const rateField = match[2];
        const baseValue = currentDocumentData[baseField] || companyData[baseField];
        const rateValue = currentDocumentData[rateField] || companyData[rateField];
        
        if (baseValue && rateValue) {
          return Math.round(baseValue * (1 + rateValue / 100));
        }
      }
    } else if (calculation.includes('length')) {
      // 配列の長さ
      const match = calculation.match(/(\w+)\.length/);
      if (match) {
        const arrayField = match[1];
        const arrayValue = currentDocumentData[arrayField] || companyData[arrayField];
        return Array.isArray(arrayValue) ? arrayValue.length : 0;
      }
    } else if (calculation.includes('sum')) {
      // 合計値の計算
      const match = calculation.match(/sum\((\w+)\.(\w+)\)/);
      if (match) {
        const arrayField = match[1];
        const sumField = match[2];
        const arrayValue = currentDocumentData[arrayField] || companyData[arrayField];
        
        if (Array.isArray(arrayValue)) {
          return arrayValue.reduce((sum, item) => sum + (item[sumField] || 0), 0);
        }
      }
    } else if (calculation.includes('average')) {
      // 平均値の計算
      const match = calculation.match(/average\((\w+)\.(\w+)\)/);
      if (match) {
        const arrayField = match[1];
        const avgField = match[2];
        const arrayValue = currentDocumentData[arrayField] || companyData[arrayField];
        
        if (Array.isArray(arrayValue) && arrayValue.length > 0) {
          const sum = arrayValue.reduce((total, item) => total + (item[avgField] || 0), 0);
          return Math.round(sum / arrayValue.length * 10) / 10;
        }
      }
    }

    return null;
  }

  /**
   * データから値を取得
   */
  private getDataValue(
    fieldMapping: FieldMapping,
    companyData: any,
    questionnaireData: any
  ): any {
    const source = fieldMapping.source;
    let value = null;

    // データソースから値を取得
    if (source.startsWith('companyData.')) {
      const key = source.replace('companyData.', '');
      value = this.getNestedValue(companyData, key);
    } else if (source.startsWith('questionnaireData.')) {
      const key = source.replace('questionnaireData.', '');
      value = this.getNestedValue(questionnaireData, key);
    }

    // マッピングがある場合は変換
    if (value && fieldMapping.mapping && fieldMapping.mapping[value]) {
      return fieldMapping.mapping[value];
    }

    // 配列マッピング
    if (value && fieldMapping.type === 'array' && fieldMapping.array_mapping) {
      return this.mapArrayValues(value, fieldMapping.array_mapping);
    }

    // オブジェクトマッピング
    if (value && fieldMapping.type === 'object' && fieldMapping.object_mapping) {
      return this.mapObjectValues(value, fieldMapping.object_mapping);
    }

    return value;
  }

  /**
   * ネストされたオブジェクトから値を取得
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }
    
    return value;
  }

  /**
   * 配列の値をマッピング
   */
  private mapArrayValues(array: any[], mapping: { [key: string]: string }): any[] {
    return array.map(item => {
      const mappedItem: any = {};
      Object.entries(mapping).forEach(([targetKey, sourceKey]) => {
        if (item[sourceKey] !== undefined) {
          mappedItem[targetKey] = item[sourceKey];
        }
      });
      return mappedItem;
    });
  }

  /**
   * オブジェクトの値をマッピング
   */
  private mapObjectValues(obj: any, mapping: { [key: string]: string }): any {
    const mappedObj: any = {};
    Object.entries(mapping).forEach(([targetKey, sourceKey]) => {
      if (obj[sourceKey] !== undefined) {
        mappedObj[targetKey] = obj[sourceKey];
      }
    });
    return mappedObj;
  }

  /**
   * 書類ごとの必要フィールド一覧を取得
   */
  getRequiredFields(subsidyType: string, documentId: string): string[] {
    const subsidyMapping = this.fieldMapping[subsidyType];
    if (!subsidyMapping || !subsidyMapping[documentId]) {
      return [];
    }

    return subsidyMapping[documentId].required_fields
      .map((field: FieldMapping) => {
        if (field.source.startsWith('companyData.')) {
          return field.source.replace('companyData.', '');
        } else if (field.source.startsWith('questionnaireData.')) {
          return field.source.replace('questionnaireData.', '');
        }
        return null;
      })
      .filter((field: string | null) => field !== null);
  }

  /**
   * 不足しているフィールドを検出
   */
  getMissingFields(
    subsidyType: string,
    documentId: string,
    companyData: any,
    questionnaireData: any
  ): string[] {
    const requiredFields = this.getRequiredFields(subsidyType, documentId);
    const missingFields: string[] = [];

    requiredFields.forEach(field => {
      const value = this.getNestedValue(companyData, field) || 
                   this.getNestedValue(questionnaireData, field);
      if (!value) {
        missingFields.push(field);
      }
    });

    return missingFields;
  }
}