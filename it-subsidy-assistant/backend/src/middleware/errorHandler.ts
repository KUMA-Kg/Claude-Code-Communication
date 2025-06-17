import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any[];
  isOperational?: boolean;
}

export class ApiError extends Error implements AppError {
  public statusCode: number;
  public code: string;
  public details?: any[];
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    details?: any[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_SERVER_ERROR',
  details?: any[]
): ApiError => {
  return new ApiError(message, statusCode, code, details);
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = uuidv4();
  
  const errorResponse = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Something went wrong',
      details: err.details || undefined
    },
    requestId
  };

  const statusCode = err.statusCode || 500;

  logger.error('Error occurred:', {
    requestId,
    error: err.message,
    stack: err.stack,
    statusCode,
    code: err.code,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  if (statusCode >= 500) {
    logger.error('Server error details:', {
      requestId,
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers
    });
  }

  res.status(statusCode).json(errorResponse);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = createError(
    `Resource not found: ${req.originalUrl}`,
    404,
    'NOT_FOUND'
  );
  next(error);
};

export const validationErrorHandler = (errors: any[]): ApiError => {
  const details = errors.map(error => ({
    field: error.path || error.param,
    message: error.msg || error.message,
    value: error.value
  }));

  return createError(
    'Validation failed',
    400,
    'VALIDATION_ERROR',
    details
  );
};

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});