import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = createError(
    `Resource not found: ${req.method} ${req.originalUrl}`,
    404,
    'NOT_FOUND'
  );
  next(error);
};