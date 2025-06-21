import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { getEnv } from '@/config/environment';

const env = getEnv();

/**
 * Secure file upload middleware with validation and virus scanning
 */

// Allowed file types for document uploads
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// File type to extension mapping
const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
};

// Maximum file sizes by type (in bytes)
const MAX_FILE_SIZES: Record<string, number> = {
  'application/pdf': 10 * 1024 * 1024, // 10MB
  'image/jpeg': 5 * 1024 * 1024, // 5MB
  'image/jpg': 5 * 1024 * 1024, // 5MB
  'image/png': 5 * 1024 * 1024, // 5MB
  'application/msword': 10 * 1024 * 1024, // 10MB
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 10 * 1024 * 1024, // 10MB
  'application/vnd.ms-excel': 10 * 1024 * 1024, // 10MB
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 10 * 1024 * 1024 // 10MB
};

/**
 * Generate secure filename with hash
 */
function generateSecureFilename(originalname: string, userId: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(`${userId}-${timestamp}-${random}`)
    .digest('hex')
    .substring(0, 32);
  
  const ext = path.extname(originalname).toLowerCase();
  return `${timestamp}-${hash}${ext}`;
}

/**
 * Validate file content matches MIME type
 */
async function validateFileContent(buffer: Buffer, mimeType: string): Promise<boolean> {
  // Basic magic number validation
  const magicNumbers: Record<string, Buffer[]> = {
    'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])], // %PDF
    'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
    'image/jpg': [Buffer.from([0xFF, 0xD8, 0xFF])],
    'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
    'application/msword': [Buffer.from([0xD0, 0xCF, 0x11, 0xE0])],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      Buffer.from([0x50, 0x4B, 0x03, 0x04])
    ],
    'application/vnd.ms-excel': [Buffer.from([0xD0, 0xCF, 0x11, 0xE0])],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
      Buffer.from([0x50, 0x4B, 0x03, 0x04])
    ]
  };

  const validMagicNumbers = magicNumbers[mimeType];
  if (!validMagicNumbers) return false;

  return validMagicNumbers.some(magic => 
    buffer.slice(0, magic.length).equals(magic)
  );
}

/**
 * Sanitize filename to prevent path traversal
 */
function sanitizeFilename(filename: string): string {
  // Remove any path components
  const basename = path.basename(filename);
  // Remove special characters except dots and hyphens
  return basename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

/**
 * Configure multer storage
 */
const storage = multer.memoryStorage();

/**
 * Multer file filter
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    logger.warn(`Rejected file upload: Invalid MIME type ${file.mimetype}`);
    return cb(new Error(`ファイルタイプ ${file.mimetype} は許可されていません`));
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const expectedExt = MIME_TO_EXT[file.mimetype];
  if (ext !== expectedExt) {
    logger.warn(`Rejected file upload: Extension mismatch ${ext} vs ${expectedExt}`);
    return cb(new Error('ファイルの拡張子が正しくありません'));
  }

  cb(null, true);
};

/**
 * Create multer upload instance
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE || 10 * 1024 * 1024, // Default 10MB
    files: 5 // Maximum 5 files per request
  }
});

/**
 * Post-upload validation middleware
 */
export async function validateUploadedFile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.file ? [req.file] : Object.values(req.files || {}).flat();
    const user = (req as any).user;

    for (const file of files) {
      // Validate file size by type
      const maxSize = MAX_FILE_SIZES[file.mimetype];
      if (file.size > maxSize) {
        logger.warn(`File too large: ${file.size} > ${maxSize}`);
        return res.status(400).json({
          error: 'File too large',
          message: `ファイルサイズが上限（${maxSize / 1024 / 1024}MB）を超えています`
        });
      }

      // Validate file content matches MIME type
      const isValidContent = await validateFileContent(file.buffer, file.mimetype);
      if (!isValidContent) {
        logger.warn(`File content validation failed for ${file.originalname}`);
        return res.status(400).json({
          error: 'Invalid file content',
          message: 'ファイルの内容が正しくありません'
        });
      }

      // Scan for malware (placeholder - integrate with actual antivirus service)
      const isSafe = await scanForMalware(file.buffer);
      if (!isSafe) {
        logger.error(`Malware detected in file ${file.originalname}`);
        return res.status(400).json({
          error: 'Security threat detected',
          message: 'セキュリティ上の問題が検出されました'
        });
      }

      // Generate secure filename
      const secureFilename = generateSecureFilename(file.originalname, user.id);
      (file as any).secureFilename = secureFilename;
      (file as any).sanitizedOriginalName = sanitizeFilename(file.originalname);

      // Log file upload
      logger.info('File upload validated', {
        userId: user.id,
        originalName: file.originalname,
        secureFilename,
        size: file.size,
        mimeType: file.mimetype
      });
    }

    next();
  } catch (error) {
    logger.error('File validation error:', error);
    return res.status(500).json({
      error: 'File validation failed',
      message: 'ファイルの検証中にエラーが発生しました'
    });
  }
}

/**
 * Placeholder for malware scanning
 * In production, integrate with ClamAV or similar service
 */
async function scanForMalware(buffer: Buffer): Promise<boolean> {
  // TODO: Implement actual malware scanning
  // For now, check for common malware signatures
  const malwareSignatures = [
    Buffer.from([0x4D, 0x5A]), // PE executable
    Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
    Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*') // EICAR test
  ];

  for (const signature of malwareSignatures) {
    if (buffer.includes(signature)) {
      return false;
    }
  }

  return true;
}

/**
 * Clean up uploaded files on error
 */
export function cleanupFiles(files: Express.Multer.File[]) {
  // Since we're using memory storage, no cleanup needed
  // If using disk storage, implement file deletion here
}

/**
 * Rate limit file uploads per user
 */
const uploadCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitUploads(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user;
  if (!user) return next();

  const now = Date.now();
  const userLimit = uploadCounts.get(user.id);
  const hourInMs = 60 * 60 * 1000;

  if (!userLimit || now > userLimit.resetTime) {
    uploadCounts.set(user.id, {
      count: 1,
      resetTime: now + hourInMs
    });
    return next();
  }

  if (userLimit.count >= 50) { // 50 uploads per hour
    logger.warn(`Upload rate limit exceeded for user ${user.id}`);
    return res.status(429).json({
      error: 'Too many uploads',
      message: '1時間あたりのアップロード上限に達しました'
    });
  }

  userLimit.count++;
  next();
}

/**
 * Generate secure download URL with expiration
 */
export function generateSecureDownloadUrl(
  fileId: string,
  userId: string,
  expiresIn: number = 3600 // 1 hour
): string {
  const timestamp = Date.now() + (expiresIn * 1000);
  const data = `${fileId}-${userId}-${timestamp}`;
  const signature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(data)
    .digest('hex');

  return `/api/v1/documents/download/${fileId}?expires=${timestamp}&signature=${signature}`;
}