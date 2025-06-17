import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { DocumentGenerateRequest, DocumentTemplate } from '@/types/document';
import { logger } from './logger';
import { env } from '@/config/environment';

export class PDFGenerator {
  private static readonly FONT_PATH = path.join(__dirname, '../../assets/fonts');
  private static readonly OUTPUT_DIR = env.PDF_TEMP_DIR;

  public static async generateDocument(
    template: DocumentTemplate,
    data: DocumentGenerateRequest,
    outputPath: string
  ): Promise<void> {
    try {
      if (!fs.existsSync(this.OUTPUT_DIR)) {
        fs.mkdirSync(this.OUTPUT_DIR, { recursive: true });
      }

      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        },
        info: {
          Title: template.name,
          Author: 'IT補助金アシストツール',
          Subject: '申請書類',
          Creator: 'IT補助金アシストツール'
        }
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      doc.font('Helvetica');

      this.addHeader(doc, template.name);
      this.addCompanyInfo(doc, data.companyInfo);
      this.addBusinessPlan(doc, data.businessPlan);
      this.addITInvestmentPlan(doc, data.itInvestmentPlan);
      this.addFooter(doc);

      doc.end();

      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      logger.info(`PDF generated successfully: ${outputPath}`);

    } catch (error) {
      logger.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF document');
    }
  }

  private static addHeader(doc: PDFKit.PDFDocument, templateName: string): void {
    doc.fontSize(20)
       .text(templateName, 50, 50, { align: 'center' });
    
    doc.fontSize(12)
       .text(`作成日: ${new Date().toLocaleDateString('ja-JP')}`, 50, 80, { align: 'right' });
    
    doc.moveTo(50, 100)
       .lineTo(545, 100)
       .stroke();
    
    doc.moveDown(2);
  }

  private static addCompanyInfo(doc: PDFKit.PDFDocument, companyInfo: any): void {
    doc.fontSize(16)
       .text('1. 会社情報', 50, doc.y, { underline: true });
    
    doc.moveDown(1);
    
    doc.fontSize(12);
    
    const companyData = [
      ['会社名', companyInfo.name],
      ['代表者', companyInfo.representative],
      ['所在地', companyInfo.address],
      ['電話番号', companyInfo.phone],
      ['メールアドレス', companyInfo.email],
      ['設立年月日', companyInfo.establishedDate],
      ['従業員数', `${companyInfo.employeeCount}名`],
      ['資本金', `${companyInfo.capital.toLocaleString()}円`],
      ['業種', companyInfo.industry]
    ];

    companyData.forEach(([label, value], index) => {
      const y = doc.y + (index * 20);
      doc.text(`${label}:`, 70, y, { width: 100 });
      doc.text(value, 180, y, { width: 300 });
    });

    doc.moveDown(2);
  }

  private static addBusinessPlan(doc: PDFKit.PDFDocument, businessPlan: any): void {
    doc.fontSize(16)
       .text('2. 事業計画', 50, doc.y, { underline: true });
    
    doc.moveDown(1);
    doc.fontSize(12);

    doc.text('現在の課題:', 70, doc.y);
    doc.moveDown(0.5);
    doc.text(businessPlan.currentChallenges, 90, doc.y, { 
      width: 450,
      align: 'justify'
    });

    doc.moveDown(1);
    doc.text('解決アプローチ:', 70, doc.y);
    doc.moveDown(0.5);
    doc.text(businessPlan.solutionApproach, 90, doc.y, { 
      width: 450,
      align: 'justify'
    });

    doc.moveDown(1);
    doc.text('期待される効果:', 70, doc.y);
    doc.moveDown(0.5);
    doc.text(businessPlan.expectedEffects, 90, doc.y, { 
      width: 450,
      align: 'justify'
    });

    doc.moveDown(2);
  }

  private static addITInvestmentPlan(doc: PDFKit.PDFDocument, itPlan: any): void {
    doc.fontSize(16)
       .text('3. IT投資計画', 50, doc.y, { underline: true });
    
    doc.moveDown(1);
    doc.fontSize(12);

    const itData = [
      ['導入予定ソフトウェア', itPlan.targetSoftware],
      ['投資予定額', `${itPlan.investmentAmount.toLocaleString()}円`],
      ['実装スケジュール', itPlan.implementationSchedule],
      ['期待ROI', itPlan.expectedROI]
    ];

    itData.forEach(([label, value], index) => {
      const y = doc.y + (index * 25);
      doc.text(`${label}:`, 70, y, { width: 150 });
      doc.text(value, 230, y, { 
        width: 300,
        align: 'justify'
      });
    });

    doc.moveDown(3);
  }

  private static addFooter(doc: PDFKit.PDFDocument): void {
    const pageHeight = doc.page.height;
    
    doc.fontSize(10)
       .text(
         'この書類はIT補助金アシストツールにより自動生成されました。',
         50,
         pageHeight - 80,
         { align: 'center' }
       );
    
    doc.text(
      `生成日時: ${new Date().toLocaleString('ja-JP')}`,
      50,
      pageHeight - 60,
      { align: 'center' }
    );
  }

  public static generateFileName(templateId: string, userId: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${templateId}_${userId}_${timestamp}.pdf`;
  }

  public static getDownloadUrl(fileName: string): string {
    return `/documents/download/${fileName}`;
  }

  public static getPreviewUrl(fileName: string): string {
    return `/documents/preview/${fileName}`;
  }

  public static async cleanup(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        logger.info(`Cleaned up PDF file: ${filePath}`);
      }
    } catch (error) {
      logger.error('Failed to cleanup PDF file:', error);
    }
  }

  public static async cleanupExpiredFiles(): Promise<void> {
    try {
      if (!fs.existsSync(this.OUTPUT_DIR)) {
        return;
      }

      const files = await fs.promises.readdir(this.OUTPUT_DIR);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(this.OUTPUT_DIR, file);
        const stats = await fs.promises.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.promises.unlink(filePath);
          logger.info(`Cleaned up expired PDF file: ${file}`);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup expired PDF files:', error);
    }
  }
}