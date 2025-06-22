/**
 * セキュアドキュメント処理ユーティリティ
 * PDF/Excel生成時のインジェクション攻撃対策
 */

import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { createHash } from 'crypto';
import { logger } from './logger';

// セキュアな値の型定義
type SecureValue = string | number | boolean | Date | null;

// ドキュメント処理設定
interface DocumentSecurityConfig {
  enableInputSanitization: boolean;
  enableOutputValidation: boolean;
  enableFormulaProtection: boolean;
  maxStringLength: number;
  allowedFileTypes: string[];
}

// デフォルト設定
const defaultConfig: DocumentSecurityConfig = {
  enableInputSanitization: true,
  enableOutputValidation: true,
  enableFormulaProtection: true,
  maxStringLength: 10000,
  allowedFileTypes: ['xlsx', 'pdf', 'docx']
};

class SecureDocumentProcessor {
  private config: DocumentSecurityConfig;
  private sanitizationLog: Array<{ field: string; original: any; sanitized: any; timestamp: Date }> = [];

  constructor(config: Partial<DocumentSecurityConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 危険な文字やパターンを検出・サニタイズ
   */
  private sanitizeInput(value: any, fieldName: string = ''): SecureValue {
    if (value === null || value === undefined) {
      return null;
    }

    // 数値型の処理
    if (typeof value === 'number') {
      // NaN、Infinity のチェック
      if (!isFinite(value)) {
        this.logSanitization(fieldName, value, 0);
        return 0;
      }
      return value;
    }

    // 真偽値の処理
    if (typeof value === 'boolean') {
      return value;
    }

    // 日付型の処理
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        this.logSanitization(fieldName, value, new Date());
        return new Date();
      }
      return value;
    }

    // 文字列の処理
    if (typeof value === 'string') {
      const original = value;
      let sanitized = value;

      // 長さ制限
      if (sanitized.length > this.config.maxStringLength) {
        sanitized = sanitized.substring(0, this.config.maxStringLength);
      }

      // Excelの危険な数式の検出と無効化
      if (this.config.enableFormulaProtection) {
        sanitized = this.sanitizeExcelFormulas(sanitized);
      }

      // PDFインジェクション対策
      sanitized = this.sanitizePDFContent(sanitized);

      // 制御文字の除去
      sanitized = this.removeControlCharacters(sanitized);

      // XMLインジェクション対策
      sanitized = this.sanitizeXMLContent(sanitized);

      // ログ記録
      if (original !== sanitized) {
        this.logSanitization(fieldName, original, sanitized);
      }

      return sanitized;
    }

    // オブジェクトや配列の場合は再帰的に処理
    if (Array.isArray(value)) {
      return value.map((item, index) => 
        this.sanitizeInput(item, `${fieldName}[${index}]`)
      );
    }

    if (typeof value === 'object') {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitizeInput(val, `${fieldName}.${key}`);
      }
      return sanitized;
    }

    // その他の型は文字列に変換してサニタイズ
    return this.sanitizeInput(String(value), fieldName);
  }

  /**
   * Excelの危険な数式の検出と無効化
   */
  private sanitizeExcelFormulas(input: string): string {
    const dangerousFormulas = [
      // 数式の開始文字
      /^[\s]*=/,
      /^[\s]*\+/,
      /^[\s]*-/,
      /^[\s]*@/,
      
      // 危険な関数
      /\b(HYPERLINK|IMPORT|WEBSERVICE|DOCUMENT|CELL|INFO|GET\.WORKSPACE)\b/gi,
      /\b(EXEC|SHELL|SYSTEM|CMD|COMMAND)\b/gi,
      /\b(DDE|EXTERNAL\.CALL|CALL)\b/gi,
      
      // ファイルパス参照
      /\[.*\]/g,
      /\\\\[^\\]+/g,
      
      // JavaScriptやVBScript
      /javascript:/gi,
      /vbscript:/gi,
      /data:/gi
    ];

    let sanitized = input;

    for (const pattern of dangerousFormulas) {
      if (pattern.test(sanitized)) {
        // 危険なパターンを検出した場合、先頭にシングルクォートを付けてテキストとして扱う
        sanitized = `'${sanitized}`;
        logger.warn('Dangerous Excel formula detected and sanitized', {
          original: input,
          sanitized: sanitized
        });
        break;
      }
    }

    return sanitized;
  }

  /**
   * PDFインジェクション対策
   */
  private sanitizePDFContent(input: string): string {
    const dangerousPatterns = [
      // PDFの危険なキーワード
      /\/JavaScript\s*</gi,
      /\/JS\s*</gi,
      /\/Action\s*</gi,
      /\/Launch\s*</gi,
      /\/URI\s*</gi,
      /\/SubmitForm\s*</gi,
      /\/ImportData\s*</gi,
      
      // スクリプトインジェクション
      /<script/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      
      // ファイルパス操作
      /\.\.\/|\.\.\\|\/\.\./g,
      /file:\/\//gi,
      /ftp:\/\//gi
    ];

    let sanitized = input;

    for (const pattern of dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    return sanitized;
  }

  /**
   * 制御文字の除去
   */
  private removeControlCharacters(input: string): string {
    // 制御文字（タブ、改行、復帰以外）を除去
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  /**
   * XMLインジェクション対策
   */
  private sanitizeXMLContent(input: string): string {
    // XML特殊文字のエスケープ
    const xmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };

    return input.replace(/[&<>"']/g, (match) => xmlEscapes[match] || match);
  }

  /**
   * サニタイゼーションログの記録
   */
  private logSanitization(field: string, original: any, sanitized: any) {
    this.sanitizationLog.push({
      field,
      original,
      sanitized,
      timestamp: new Date()
    });

    logger.info('Input sanitized', {
      field,
      originalType: typeof original,
      sanitizedType: typeof sanitized,
      changed: original !== sanitized
    });
  }

  /**
   * セキュアなExcelファイル生成
   */
  async createSecureExcel(data: Record<string, any>): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data', {
      protection: {
        selectLockedCells: false,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: false,
        autoFilter: false,
        pivotTables: false
      }
    });

    // データのサニタイズ
    const sanitizedData = this.sanitizeInput(data, 'excel_data');

    // セルデータの設定
    let row = 1;
    for (const [key, value] of Object.entries(sanitizedData as Record<string, any>)) {
      const cell = worksheet.getCell(row, 1);
      cell.value = key;
      cell.protection = { locked: true };

      const valueCell = worksheet.getCell(row, 2);
      
      // 値の型に応じて適切に設定
      if (typeof value === 'string' && value.startsWith("'")) {
        // サニタイズされた数式は文字列として設定
        valueCell.value = { text: value };
      } else {
        valueCell.value = value;
      }
      
      valueCell.protection = { locked: false };
      row++;
    }

    // ワークブックの保護
    await workbook.protection.setPassword('secure');

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  /**
   * セキュアなPDF生成
   */
  async createSecurePDF(data: Record<string, any>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          userPassword: 'view',
          ownerPassword: 'admin',
          permissions: {
            printing: 'lowResolution',
            modifying: false,
            copying: false,
            annotating: false,
            fillingForms: false,
            contentAccessibility: true,
            documentAssembly: false
          }
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // データのサニタイズ
        const sanitizedData = this.sanitizeInput(data, 'pdf_data');

        // PDFコンテンツの生成
        doc.fontSize(14).text('セキュアドキュメント', { align: 'center' });
        doc.moveDown();

        for (const [key, value] of Object.entries(sanitizedData as Record<string, any>)) {
          const sanitizedKey = String(key);
          const sanitizedValue = String(value);
          
          doc.fontSize(12)
             .text(`${sanitizedKey}: `, { continued: true })
             .text(sanitizedValue);
          doc.moveDown(0.5);
        }

        // ドキュメントの終了
        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * ファイルの整合性チェック
   */
  generateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * セキュリティレポートの生成
   */
  getSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      config: this.config,
      sanitizationCount: this.sanitizationLog.length,
      recentSanitizations: this.sanitizationLog.slice(-10),
      summary: {
        totalInputsProcessed: this.sanitizationLog.length,
        formulasBlocked: this.sanitizationLog.filter(log => 
          String(log.sanitized).startsWith("'") && !String(log.original).startsWith("'")
        ).length,
        controlCharsRemoved: this.sanitizationLog.filter(log =>
          /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(String(log.original))
        ).length
      }
    };

    return report;
  }

  /**
   * サニタイゼーションログのクリア
   */
  clearSanitizationLog() {
    this.sanitizationLog = [];
  }
}

// ユーティリティ関数のエクスポート
export const createSecureDocumentProcessor = (config?: Partial<DocumentSecurityConfig>) => {
  return new SecureDocumentProcessor(config);
};

export { SecureDocumentProcessor, DocumentSecurityConfig };