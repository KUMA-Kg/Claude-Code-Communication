import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '@/config/environment';
import { JWTPayload, User } from '@/types/auth';
import { logger } from './logger';

export class JWTManager {
  private static readonly ACCESS_TOKEN_EXPIRES_IN = env.JWT_EXPIRE_TIME;
  private static readonly REFRESH_TOKEN_EXPIRES_IN = env.JWT_REFRESH_EXPIRE_TIME;

  public static generateAccessToken(user: User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN as string,
      issuer: 'it-subsidy-assistant',
      audience: 'it-subsidy-assistant-client'
    } as jwt.SignOptions);
  }

  public static generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  public static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        issuer: 'it-subsidy-assistant',
        audience: 'it-subsidy-assistant-client'
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        logger.error('JWT verification error:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  public static verifyRefreshToken(token: string): string {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { tokenId: string };
      return decoded.tokenId;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        logger.error('Refresh token verification error:', error);
        throw new Error('Refresh token verification failed');
      }
    }
  }

  public static hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public static generateRefreshTokenJWT(tokenId: string): string {
    return jwt.sign(
      { tokenId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN as string } as jwt.SignOptions
    );
  }

  public static getTokenExpirationTime(): number {
    const timeValue = this.ACCESS_TOKEN_EXPIRES_IN;
    
    if (timeValue.endsWith('h')) {
      return parseInt(timeValue.slice(0, -1)) * 3600;
    } else if (timeValue.endsWith('m')) {
      return parseInt(timeValue.slice(0, -1)) * 60;
    } else if (timeValue.endsWith('s')) {
      return parseInt(timeValue.slice(0, -1));
    } else if (timeValue.endsWith('d')) {
      return parseInt(timeValue.slice(0, -1)) * 86400;
    }
    
    return 3600; // Default to 1 hour
  }

  public static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }
}