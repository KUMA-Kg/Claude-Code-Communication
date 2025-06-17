import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, optionalAuth } from '@/middleware/auth';
import { JWTManager } from '@/utils/jwt';
import { UserModel } from '@/models/User';
import { User } from '@/types/auth';

jest.mock('@/utils/jwt');
jest.mock('@/models/User');

const mockJWTManager = JWTManager as jest.Mocked<typeof JWTManager>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token and set user in request', async () => {
      const token = 'valid-token';
      mockRequest.headers = { authorization: `Bearer ${token}` };

      mockJWTManager.extractTokenFromHeader.mockReturnValue(token);
      mockJWTManager.verifyAccessToken.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        iat: Date.now(),
        exp: Date.now() + 3600
      });
      mockUserModel.findById.mockResolvedValue(mockUser);

      await authenticate(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockJWTManager.extractTokenFromHeader).toHaveBeenCalledWith(`Bearer ${token}`);
      expect(mockJWTManager.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(mockUserModel.findById).toHaveBeenCalledWith(mockUser.id);
      expect((mockRequest as any).user).toBe(mockUser);
      expect((mockRequest as any).token).toBe(token);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no token provided', async () => {
      mockJWTManager.extractTokenFromHeader.mockReturnValue(null);

      await authenticate(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      const token = 'invalid-token';
      mockRequest.headers = { authorization: `Bearer ${token}` };

      mockJWTManager.extractTokenFromHeader.mockReturnValue(token);
      mockJWTManager.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user not found', async () => {
      const token = 'valid-token';
      mockRequest.headers = { authorization: `Bearer ${token}` };

      mockJWTManager.extractTokenFromHeader.mockReturnValue(token);
      mockJWTManager.verifyAccessToken.mockReturnValue({
        userId: 'nonexistent-user',
        email: 'test@example.com',
        role: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600
      });
      mockUserModel.findById.mockResolvedValue(null);

      await authenticate(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or inactive user'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    beforeEach(() => {
      (mockRequest as any).user = mockUser;
    });

    it('should allow access when user has required role', () => {
      const middleware = authorize(['user', 'admin']);
      
      middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access when user does not have required role', () => {
      const middleware = authorize(['admin']);
      
      middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access when no roles specified', () => {
      const middleware = authorize([]);
      
      middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access when user not authenticated', () => {
      delete (mockRequest as any).user;
      const middleware = authorize(['user']);
      
      middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should set user when valid token provided', async () => {
      const token = 'valid-token';
      mockRequest.headers = { authorization: `Bearer ${token}` };

      mockJWTManager.extractTokenFromHeader.mockReturnValue(token);
      mockJWTManager.verifyAccessToken.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        iat: Date.now(),
        exp: Date.now() + 3600
      });
      mockUserModel.findById.mockResolvedValue(mockUser);

      await optionalAuth(mockRequest as any, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toBe(mockUser);
      expect((mockRequest as any).token).toBe(token);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when no token provided', async () => {
      mockJWTManager.extractTokenFromHeader.mockReturnValue(null);

      await optionalAuth(mockRequest as any, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when token is invalid', async () => {
      const token = 'invalid-token';
      mockRequest.headers = { authorization: `Bearer ${token}` };

      mockJWTManager.extractTokenFromHeader.mockReturnValue(token);
      mockJWTManager.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuth(mockRequest as any, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});