import documentFieldSpecs from '../data/document-field-specifications.json';

interface OldFormData {
  [documentId: string]: {
    [questionIndex: string]: string;
  };
}

interface NewFormData {
  [documentId: string]: {
    [fieldId: string]: any;
  };
}

interface DocumentField {
  field_name: string;
  field_id: string;
  type: string;
  required: boolean;
  description: string;
  item_fields?: DocumentField[];
  fields?: DocumentField[];
}

/**
 * 旧形式のフォームデータを新しいフィールド仕様に基づいたデータ形式に変換
 */
export class FormDataMapper {
  private specs: any;

  constructor() {
    this.specs = documentFieldSpecs.document_field_specifications;
  }

  /**
   * 旧形式から新形式へのマッピング
   */
  mapOldToNew(oldFormData: OldFormData, subsidyType: string, documentIds: string[]): NewFormData {
    const newFormData: NewFormData = {};
    const subsidyInfo = this.specs[subsidyType];
    
    if (!subsidyInfo) {
      console.warn(`Subsidy type ${subsidyType} not found in specifications`);
      return newFormData;
    }

    documentIds.forEach(docId => {
      const docSpec = subsidyInfo.documents[docId];
      if (!docSpec) {
        console.warn(`Document ${docId} not found for subsidy ${subsidyType}`);
        return;
      }

      const oldDocData = oldFormData[docId] || {};
      const newDocData: { [fieldId: string]: any } = {};

      // テンプレート質問のインデックスとフィールドIDをマッピング
      docSpec.fields.forEach((field: DocumentField, index: number) => {
        const oldValue = oldDocData[index.toString()];
        if (oldValue !== undefined) {
          newDocData[field.field_id] = this.convertValue(oldValue, field.type);
        }
      });

      newFormData[docId] = newDocData;
    });

    return newFormData;
  }

  /**
   * 新形式から旧形式へのマッピング（互換性のため）
   */
  mapNewToOld(newFormData: NewFormData, subsidyType: string): OldFormData {
    const oldFormData: OldFormData = {};
    const subsidyInfo = this.specs[subsidyType];
    
    if (!subsidyInfo) {
      return oldFormData;
    }

    Object.entries(newFormData).forEach(([docId, docData]) => {
      const docSpec = subsidyInfo.documents[docId];
      if (!docSpec) {
        return;
      }

      const oldDocData: { [questionIndex: string]: string } = {};
      
      docSpec.fields.forEach((field: DocumentField, index: number) => {
        const newValue = docData[field.field_id];
        if (newValue !== undefined) {
          oldDocData[index.toString()] = this.convertToString(newValue, field.type);
        }
      });

      oldFormData[docId] = oldDocData;
    });

    return oldFormData;
  }

  /**
   * 値を適切な型に変換
   */
  private convertValue(value: string, type: string): any {
    switch (type) {
      case 'number':
        return parseInt(value, 10) || 0;
      case 'checkbox':
        return value.toLowerCase() === 'true' || value === '1' || value === 'はい';
      case 'date':
      case 'month':
        return value; // ISO形式の文字列として保持
      case 'array':
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      case 'object':
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }
      default:
        return value;
    }
  }

  /**
   * 値を文字列に変換
   */
  private convertToString(value: any, type: string): string {
    switch (type) {
      case 'checkbox':
        return value ? 'はい' : '';
      case 'array':
      case 'object':
        return JSON.stringify(value);
      default:
        return String(value || '');
    }
  }

  /**
   * 特定のドキュメントのフィールド情報を取得
   */
  getDocumentFields(subsidyType: string, docId: string): DocumentField[] | null {
    const subsidyInfo = this.specs[subsidyType];
    if (!subsidyInfo || !subsidyInfo.documents[docId]) {
      return null;
    }
    return subsidyInfo.documents[docId].fields;
  }

  /**
   * フィールドの検証
   */
  validateField(value: any, field: DocumentField): { valid: boolean; error?: string } {
    // 必須チェック
    if (field.required && !value) {
      return { valid: false, error: `${field.field_name}は必須項目です` };
    }

    // 型別の検証
    switch (field.type) {
      case 'text':
      case 'textarea':
        if (field.max_length && String(value).length > field.max_length) {
          return { valid: false, error: `${field.field_name}は${field.max_length}文字以内で入力してください` };
        }
        if (field.pattern && !new RegExp(field.pattern).test(String(value))) {
          return { valid: false, error: `${field.field_name}の形式が正しくありません` };
        }
        break;
      
      case 'number':
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return { valid: false, error: `${field.field_name}は数値で入力してください` };
        }
        if (field.min !== undefined && numValue < field.min) {
          return { valid: false, error: `${field.field_name}は${field.min}以上で入力してください` };
        }
        if (field.max !== undefined && numValue > field.max) {
          return { valid: false, error: `${field.field_name}は${field.max}以下で入力してください` };
        }
        break;
      
      case 'select':
      case 'radio':
        if (field.options && !field.options.includes(String(value))) {
          return { valid: false, error: `${field.field_name}の選択値が正しくありません` };
        }
        break;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          return { valid: false, error: `${field.field_name}のメールアドレス形式が正しくありません` };
        }
        break;
      
      case 'tel':
        const telRegex = /^[0-9-]+$/;
        if (!telRegex.test(String(value))) {
          return { valid: false, error: `${field.field_name}の電話番号形式が正しくありません` };
        }
        break;
    }

    return { valid: true };
  }
}