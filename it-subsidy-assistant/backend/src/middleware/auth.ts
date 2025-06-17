import { Request, Response, NextFunction } from 'express';
import { JWTManager } from '@/utils/jwt';
import { UserModel } from '@/models/User';
import { logger } from '@/utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: any;
  token?: string;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTManager.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required'
        }
      });
      return;
    }

    const decoded = JWTManager.verifyAccessToken(token);
    const user = await UserModel.findById(decoded.userId);

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or inactive user'
        }
      });
      return;
    }

    req.user = user;
    req.token = token;
    next();

  } catch (error) {
    logger.error('Authentication error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: errorMessage
      }
    });
  }
};

export const authorize = (roles: string[] = []) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTManager.extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const decoded = JWTManager.verifyAccessToken(token);
        const user = await UserModel.findById(decoded.userId);

        if (user && user.isActive) {
          req.user = user;
          req.token = token;
        }
      } catch (error) {
        logger.warn('Optional auth token verification failed:', error);
      }
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next();
  }
};