import { DocumentGenerateRequest, DocumentTemplate } from '@/types/document';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

export class PDFGenerator {
  public static async generateDocument(
    template: DocumentTemplate,
    data: DocumentGenerateRequest,
    outputPath: string
  ): Promise<void> {
    logger.info('PDF generation temporarily disabled');
    // TODO: Implement PDF generation after fixing type issues
    throw new Error('PDF generation is temporarily disabled');
  }

  public static generateFileName(templateName: string, userId?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const userPrefix = userId ? `${userId}-` : '';
    return `${userPrefix}${templateName}-${timestamp}-${uuidv4()}.pdf`;
  }

  public static getDownloadUrl(fileName: string): string {
    return `/api/v1/documents/download/${fileName}`;
  }

  public static getPreviewUrl(fileName: string): string {
    return `/api/v1/documents/preview/${fileName}`;
  }

  public static async cleanup(filePath: string): Promise<void> {
    logger.info(`Cleaning up file: ${filePath}`);
    // TODO: Implement file cleanup
  }
}