import { JWTManager } from '@/utils/jwt';
import { User } from '@/types/auth';
import jwt from 'jsonwebtoken';

describe('JWTManager', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = JWTManager.generateAccessToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload in token', () => {
      const token = JWTManager.generateAccessToken(mockUser);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
      expect(decoded.iss).toBe('it-subsidy-assistant');
      expect(decoded.aud).toBe('it-subsidy-assistant-client');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a random refresh token', () => {
      const token1 = JWTManager.generateRefreshToken();
      const token2 = JWTManager.generateRefreshToken();
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(128); // 64 bytes as hex = 128 chars
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', () => {
      const token = JWTManager.generateAccessToken(mockUser);
      const decoded = JWTManager.verifyAccessToken(token);
      
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        JWTManager.verifyAccessToken('invalid-token');
      }).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        { userId: mockUser.id, email: mockUser.email, role: mockUser.role },
        process.env.JWT_SECRET!,
        { 
          expiresIn: '-1s',
          issuer: 'it-subsidy-assistant',
          audience: 'it-subsidy-assistant-client'
        }
      );
      
      expect(() => {
        JWTManager.verifyAccessToken(expiredToken);
      }).toThrow('Token expired');
    });
  });

  describe('hashRefreshToken', () => {
    it('should generate consistent hash for same token', () => {
      const token = 'test-refresh-token';
      const hash1 = JWTManager.hashRefreshToken(token);
      const hash2 = JWTManager.hashRefreshToken(token);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 hex = 64 chars
    });

    it('should generate different hashes for different tokens', () => {
      const token1 = 'test-refresh-token-1';
      const token2 = 'test-refresh-token-2';
      const hash1 = JWTManager.hashRefreshToken(token1);
      const hash2 = JWTManager.hashRefreshToken(token2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'test-token';
      const header = `Bearer ${token}`;
      const extracted = JWTManager.extractTokenFromHeader(header);
      
      expect(extracted).toBe(token);
    });

    it('should return null for invalid header format', () => {
      expect(JWTManager.extractTokenFromHeader('Invalid header')).toBeNull();
      expect(JWTManager.extractTokenFromHeader('Bearer')).toBeNull();
      expect(JWTManager.extractTokenFromHeader('Token test-token')).toBeNull();
    });

    it('should return null for undefined header', () => {
      expect(JWTManager.extractTokenFromHeader(undefined)).toBeNull();
    });
  });

  describe('getTokenExpirationTime', () => {
    it('should return correct expiration time', () => {
      const expirationTime = JWTManager.getTokenExpirationTime();
      expect(expirationTime).toBe(3600); // 1 hour default
    });
  });
});