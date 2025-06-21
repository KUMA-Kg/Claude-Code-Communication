import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserModel } from '@/models/User';
import { JWTManager } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import { asyncHandler, validationErrorHandler } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { LoginRequest, LoginResponse, RefreshTokenResponse } from '@/types/auth';

const router = Router();

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters long')
];

router.post('/login', loginValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }

  const { email, password }: LoginRequest = req.body;

  const user = await UserModel.findByEmailWithPassword(email);
  if (!user) {
    logger.warn(`Login attempt with invalid email: ${email}`, { ip: req.ip });
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password'
      }
    });
  }

  const isValidPassword = await UserModel.verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    logger.warn(`Login attempt with invalid password for email: ${email}`, { ip: req.ip });
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password'
      }
    });
  }

  const accessToken = JWTManager.generateAccessToken(user);
  const refreshToken = JWTManager.generateRefreshToken();
  const refreshTokenHash = JWTManager.hashRefreshToken(refreshToken);

  await UserModel.createRefreshToken(user.id, refreshTokenHash);
  await UserModel.updateLastLogin(user.id);

  const { passwordHash, ...userWithoutPassword } = user;

  const response: LoginResponse = {
    success: true,
    data: {
      token: accessToken,
      refreshToken,
      user: userWithoutPassword
    },
    message: 'Login successful'
  };

  logger.info(`Successful login for user: ${user.email}`, { 
    userId: user.id, 
    ip: req.ip 
  });

  res.json(response);
}));

router.post('/register', registerValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }

  const { email, password, name } = req.body;

  try {
    const user = await UserModel.create({ email, password, name });
    
    const accessToken = JWTManager.generateAccessToken(user);
    const refreshToken = JWTManager.generateRefreshToken();
    const refreshTokenHash = JWTManager.hashRefreshToken(refreshToken);

    await UserModel.createRefreshToken(user.id, refreshTokenHash);

    const response: LoginResponse = {
      success: true,
      data: {
        token: accessToken,
        refreshToken,
        user
      },
      message: 'Registration successful'
    };

    logger.info(`New user registered: ${user.email}`, { 
      userId: user.id, 
      ip: req.ip 
    });

    res.status(201).json(response);

  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'User with this email already exists'
        }
      });
    }
    throw error;
  }
}));

router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const refreshToken = JWTManager.extractTokenFromHeader(authHeader);

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Refresh token is required'
      }
    });
  }

  const refreshTokenHash = JWTManager.hashRefreshToken(refreshToken);
  const storedToken = await UserModel.findRefreshToken(refreshTokenHash);

  if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token'
      }
    });
  }

  const user = await UserModel.findById(storedToken.userId);
  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not found or inactive'
      }
    });
  }

  await UserModel.revokeRefreshToken(refreshTokenHash);

  const newAccessToken = JWTManager.generateAccessToken(user);
  const newRefreshToken = JWTManager.generateRefreshToken();
  const newRefreshTokenHash = JWTManager.hashRefreshToken(newRefreshToken);

  await UserModel.createRefreshToken(user.id, newRefreshTokenHash);

  const response: RefreshTokenResponse = {
    success: true,
    data: {
      token: newAccessToken,
      expiresIn: JWTManager.getTokenExpirationTime()
    }
  };

  logger.info(`Token refreshed for user: ${user.email}`, { 
    userId: user.id 
  });

  res.json(response);
}));

router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const refreshToken = req.body.refreshToken;

  if (refreshToken) {
    const refreshTokenHash = JWTManager.hashRefreshToken(refreshToken);
    await UserModel.revokeRefreshToken(refreshTokenHash);
  }

  const user = (req as any).user;
  await UserModel.revokeAllUserRefreshTokens(user.id);

  logger.info(`User logged out: ${user.email}`, { 
    userId: user.id 
  });

  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  res.json({
    success: true,
    data: {
      user
    }
  });
}));

export { router as authRoutes };