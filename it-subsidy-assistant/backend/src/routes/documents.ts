import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { DocumentModel } from '@/models/Document';
import { logger } from '@/utils/logger';
import { asyncHandler, validationErrorHandler } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { documentGenerationRateLimit } from '@/middleware/rateLimit';
import { 
  DocumentGenerateRequest, 
  DocumentGenerateResponse, 
  DocumentTemplateResponse,
  DocumentDetailResponse 
} from '@/types/document';
import fs from 'fs';
import path from 'path';

const router = Router();

const generateValidation = [
  body('templateId')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Template ID is required'),
  body('subsidyId')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Subsidy ID must be a valid string'),
  body('companyInfo.name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Company name is required'),
  body('companyInfo.representative')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Representative name is required'),
  body('companyInfo.address')
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Address is required'),
  body('companyInfo.phone')
    .isString()
    .trim()
    .matches(/^[\d\-\(\)\+\s]+$/)
    .withMessage('Valid phone number is required'),
  body('companyInfo.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('companyInfo.establishedDate')
    .isISO8601()
    .withMessage('Valid established date is required'),
  body('companyInfo.employeeCount')
    .isInt({ min: 1 })
    .withMessage('Employee count must be a positive integer'),
  body('companyInfo.capital')
    .isInt({ min: 0 })
    .withMessage('Capital must be a non-negative integer'),
  body('companyInfo.industry')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Industry is required'),
  body('businessPlan.currentChallenges')
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Current challenges must be between 10 and 2000 characters'),
  body('businessPlan.solutionApproach')
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Solution approach must be between 10 and 2000 characters'),
  body('businessPlan.expectedEffects')
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Expected effects must be between 10 and 2000 characters'),
  body('itInvestmentPlan.targetSoftware')
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Target software is required'),
  body('itInvestmentPlan.investmentAmount')
    .isInt({ min: 1 })
    .withMessage('Investment amount must be a positive integer'),
  body('itInvestmentPlan.implementationSchedule')
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Implementation schedule is required'),
  body('itInvestmentPlan.expectedROI')
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Expected ROI is required')
];

const documentIdValidation = [
  param('id')
    .isString()
    .trim()
    .isUUID()
    .withMessage('Document ID must be a valid UUID')
];

router.get('/templates', asyncHandler(async (req, res) => {
  const templates = await DocumentModel.getAllTemplates();

  const response: DocumentTemplateResponse = {
    success: true,
    data: { templates }
  };

  res.json(response);
}));

router.post('/generate', 
  authenticate, 
  documentGenerationRateLimit, 
  generateValidation, 
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const user = (req as any).user;
    const request: DocumentGenerateRequest = req.body;

    const template = await DocumentModel.getTemplateById(request.templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found'
        }
      });
    }

    logger.info('Document generation requested:', {
      userId: user.id,
      templateId: request.templateId,
      subsidyId: request.subsidyId
    });

    const document = await DocumentModel.createDocument(user.id, request);

    const response: DocumentGenerateResponse = {
      success: true,
      data: {
        documentId: document.id,
        status: document.status,
        downloadUrl: document.downloadUrl,
        previewUrl: document.previewUrl,
        expiresAt: document.expiresAt?.toISOString()
      }
    };

    res.status(201).json(response);
  })
);

router.get('/history', authenticate, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const documents = await DocumentModel.getUserDocuments(user.id);

  res.json({
    success: true,
    data: { documents }
  });
}));

router.get('/:id', 
  authenticate, 
  documentIdValidation, 
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { id } = req.params;
    const user = (req as any).user;

    const document = await DocumentModel.getDocumentById(id, user.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found'
        }
      });
    }

    const response: DocumentDetailResponse = {
      success: true,
      data: document
    };

    res.json(response);
  })
);

router.get('/:id/download', 
  authenticate, 
  documentIdValidation, 
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { id } = req.params;
    const user = (req as any).user;

    const document = await DocumentModel.getDocumentById(id, user.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found'
        }
      });
    }

    if (document.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_READY',
          message: 'Document is not ready for download'
        }
      });
    }

    if (!document.filePath || !fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Document file not found'
        }
      });
    }

    if (document.expiresAt && document.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        error: {
          code: 'DOCUMENT_EXPIRED',
          message: 'Document has expired'
        }
      });
    }

    const fileName = path.basename(document.filePath);
    
    logger.info('Document downloaded:', {
      documentId: id,
      userId: user.id,
      fileName
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      logger.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: {
            code: 'FILE_READ_ERROR',
            message: 'Failed to read document file'
          }
        });
      }
    });
  })
);

router.get('/:id/preview', 
  authenticate, 
  documentIdValidation, 
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { id } = req.params;
    const user = (req as any).user;

    const document = await DocumentModel.getDocumentById(id, user.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found'
        }
      });
    }

    if (document.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_READY',
          message: 'Document is not ready for preview'
        }
      });
    }

    if (!document.filePath || !fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Document file not found'
        }
      });
    }

    logger.info('Document previewed:', {
      documentId: id,
      userId: user.id
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      logger.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: {
            code: 'FILE_READ_ERROR',
            message: 'Failed to read document file'
          }
        });
      }
    });
  })
);

export { router as documentRoutes };