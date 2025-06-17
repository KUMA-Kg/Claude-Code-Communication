import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { supabaseService } from '@/config/database';
import { DocumentTemplate, GeneratedDocument, DocumentGenerateRequest } from '@/types/document';
import { logger } from '@/utils/logger';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { env } from '@/config/environment';

export class DocumentModel {
  public static async getAllTemplates(): Promise<DocumentTemplate[]> {
    try {
      const { data, error } = await supabaseService
        .from('document_templates')
        .select(`
          id, name, description, subsidy_types, required_fields,
          template_content, estimated_time, created_at, updated_at, is_active
        `)
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error('Failed to get document templates:', error);
        return [];
      }

      return data?.map(this.mapDatabaseTemplateToTemplate) || [];
    } catch (error) {
      logger.error('DocumentModel.getAllTemplates error:', error);
      return [];
    }
  }

  public static async getTemplateById(id: string): Promise<DocumentTemplate | null> {
    try {
      const { data, error } = await supabaseService
        .from('document_templates')
        .select(`
          id, name, description, subsidy_types, required_fields,
          template_content, estimated_time, created_at, updated_at, is_active
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapDatabaseTemplateToTemplate(data);
    } catch (error) {
      logger.error('DocumentModel.getTemplateById error:', error);
      return null;
    }
  }

  public static async createDocument(
    userId: string,
    request: DocumentGenerateRequest
  ): Promise<GeneratedDocument> {
    try {
      const documentId = uuidv4();
      const fileName = PDFGenerator.generateFileName(request.templateId, userId);
      const filePath = path.join(env.PDF_TEMP_DIR, fileName);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const { data, error } = await supabaseService
        .from('generated_documents')
        .insert({
          id: documentId,
          user_id: userId,
          template_id: request.templateId,
          subsidy_id: request.subsidyId,
          input_data: request,
          status: 'pending',
          file_path: filePath,
          download_url: PDFGenerator.getDownloadUrl(fileName),
          preview_url: PDFGenerator.getPreviewUrl(fileName),
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error || !data) {
        logger.error('Failed to create document record:', error);
        throw new Error('Failed to create document record');
      }

      const generatedDocument = this.mapDatabaseDocumentToDocument(data);

      this.processDocumentGeneration(generatedDocument.id, request);

      return generatedDocument;

    } catch (error) {
      logger.error('DocumentModel.createDocument error:', error);
      throw error;
    }
  }

  public static async getDocumentById(id: string, userId: string): Promise<GeneratedDocument | null> {
    try {
      const { data, error } = await supabaseService
        .from('generated_documents')
        .select(`
          id, user_id, template_id, subsidy_id, input_data, status,
          file_path, download_url, preview_url, expires_at,
          created_at, updated_at
        `)
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapDatabaseDocumentToDocument(data);
    } catch (error) {
      logger.error('DocumentModel.getDocumentById error:', error);
      return null;
    }
  }

  public static async getUserDocuments(userId: string): Promise<GeneratedDocument[]> {
    try {
      const { data, error } = await supabaseService
        .from('generated_documents')
        .select(`
          id, user_id, template_id, subsidy_id, input_data, status,
          file_path, download_url, preview_url, expires_at,
          created_at, updated_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to get user documents:', error);
        return [];
      }

      return data?.map(this.mapDatabaseDocumentToDocument) || [];
    } catch (error) {
      logger.error('DocumentModel.getUserDocuments error:', error);
      return [];
    }
  }

  public static async updateDocumentStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    filePath?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (filePath) {
        updateData.file_path = filePath;
      }

      const { error } = await supabaseService
        .from('generated_documents')
        .update(updateData)
        .eq('id', id);

      if (error) {
        logger.error('Failed to update document status:', error);
      }
    } catch (error) {
      logger.error('DocumentModel.updateDocumentStatus error:', error);
    }
  }

  public static async deleteExpiredDocuments(): Promise<void> {
    try {
      const { data, error } = await supabaseService
        .from('generated_documents')
        .select('id, file_path')
        .lt('expires_at', new Date().toISOString());

      if (error) {
        logger.error('Failed to get expired documents:', error);
        return;
      }

      if (data && data.length > 0) {
        for (const doc of data) {
          if (doc.file_path) {
            await PDFGenerator.cleanup(doc.file_path);
          }
        }

        const { error: deleteError } = await supabaseService
          .from('generated_documents')
          .delete()
          .lt('expires_at', new Date().toISOString());

        if (deleteError) {
          logger.error('Failed to delete expired documents:', deleteError);
        } else {
          logger.info(`Deleted ${data.length} expired documents`);
        }
      }
    } catch (error) {
      logger.error('DocumentModel.deleteExpiredDocuments error:', error);
    }
  }

  private static async processDocumentGeneration(
    documentId: string,
    request: DocumentGenerateRequest
  ): Promise<void> {
    try {
      await this.updateDocumentStatus(documentId, 'processing');

      const template = await this.getTemplateById(request.templateId);
      if (!template) {
        await this.updateDocumentStatus(documentId, 'failed');
        throw new Error('Template not found');
      }

      const fileName = PDFGenerator.generateFileName(request.templateId, documentId);
      const filePath = path.join(env.PDF_TEMP_DIR, fileName);

      await PDFGenerator.generateDocument(template, request, filePath);

      await this.updateDocumentStatus(documentId, 'completed', filePath);

      logger.info(`Document generation completed: ${documentId}`);

    } catch (error) {
      logger.error('Document generation failed:', error);
      await this.updateDocumentStatus(documentId, 'failed');
    }
  }

  private static mapDatabaseTemplateToTemplate(dbTemplate: any): DocumentTemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      description: dbTemplate.description,
      subsidyTypes: dbTemplate.subsidy_types,
      requiredFields: dbTemplate.required_fields,
      templateContent: dbTemplate.template_content,
      estimatedTime: dbTemplate.estimated_time,
      createdAt: new Date(dbTemplate.created_at),
      updatedAt: new Date(dbTemplate.updated_at),
      isActive: dbTemplate.is_active
    };
  }

  private static mapDatabaseDocumentToDocument(dbDocument: any): GeneratedDocument {
    return {
      id: dbDocument.id,
      userId: dbDocument.user_id,
      templateId: dbDocument.template_id,
      subsidyId: dbDocument.subsidy_id,
      inputData: dbDocument.input_data,
      status: dbDocument.status,
      filePath: dbDocument.file_path,
      downloadUrl: dbDocument.download_url,
      previewUrl: dbDocument.preview_url,
      expiresAt: dbDocument.expires_at ? new Date(dbDocument.expires_at) : undefined,
      createdAt: new Date(dbDocument.created_at),
      updatedAt: new Date(dbDocument.updated_at)
    };
  }
}