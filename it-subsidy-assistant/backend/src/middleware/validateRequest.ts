import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '@/utils/logger';

/**
 * Zodスキーマを使用したリクエストバリデーションミドルウェア
 */
export const validateRequest = <T extends z.ZodType<any, any>>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // リクエストボディをバリデート
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Request validation failed:', error.errors);
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        logger.error('Unexpected validation error:', error);
        res.status(500).json({
          error: 'Internal server error during validation',
        });
      }
    }
  };
};