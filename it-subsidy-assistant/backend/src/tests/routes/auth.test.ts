import request from 'supertest';
import express from 'express';
import { authRoutes } from '@/routes/auth';
import { UserModel } from '@/models/User';
import { JWTManager } from '@/utils/jwt';

jest.mock('@/models/User');
jest.mock('@/utils/jwt');
jest.mock('@/config/database', () => ({
  supabaseService: {}
}));

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockJWTManager = JWTManager as jest.Mocked<typeof JWTManager>;

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      passwordHash: 'hashed-password'
    };

    it('should login successfully with valid credentials', async () => {
      mockUserModel.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockUserModel.verifyPassword.mockResolvedValue(true);
      mockUserModel.createRefreshToken.mockResolvedValue({
        id: 'token-id',
        userId: mockUser.id,
        tokenHash: 'token-hash',
        expiresAt: new Date(),
        createdAt: new Date(),
        isRevoked: false
      });
      mockUserModel.updateLastLogin.mockResolvedValue();
      mockJWTManager.generateAccessToken.mockReturnValue('access-token');
      mockJWTManager.generateRefreshToken.mockReturnValue('refresh-token');
      mockJWTManager.hashRefreshToken.mockReturnValue('token-hash');

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('access-token');
      expect(response.body.data.refreshToken).toBe('refresh-token');
      expect(response.body.data.user.email).toBe(mockUser.email);
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should return 401 for invalid email', async () => {
      mockUserModel.findByEmailWithPassword.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for invalid password', async () => {
      mockUserModel.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockUserModel.verifyPassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /auth/register', () => {
    const validRegisterData = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User'
    };

    const mockCreatedUser = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    it('should register successfully with valid data', async () => {
      mockUserModel.create.mockResolvedValue(mockCreatedUser);
      mockUserModel.createRefreshToken.mockResolvedValue({
        id: 'token-id',
        userId: mockCreatedUser.id,
        tokenHash: 'token-hash',
        expiresAt: new Date(),
        createdAt: new Date(),
        isRevoked: false
      });
      mockJWTManager.generateAccessToken.mockReturnValue('access-token');
      mockJWTManager.generateRefreshToken.mockReturnValue('refresh-token');
      mockJWTManager.hashRefreshToken.mockReturnValue('token-hash');

      const response = await request(app)
        .post('/auth/register')
        .send(validRegisterData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('access-token');
      expect(response.body.data.user.email).toBe(mockCreatedUser.email);
    });

    it('should return 409 for existing email', async () => {
      mockUserModel.create.mockRejectedValue(new Error('User with this email already exists'));

      const response = await request(app)
        .post('/auth/register')
        .send(validRegisterData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validRegisterData,
          password: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const mockRefreshToken = {
        id: 'token-id',
        userId: 'user-id',
        tokenHash: 'token-hash',
        expiresAt: new Date(Date.now() + 86400000), // 1 day from now
        createdAt: new Date(),
        isRevoked: false
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      mockJWTManager.extractTokenFromHeader.mockReturnValue('refresh-token');
      mockJWTManager.hashRefreshToken.mockReturnValue('token-hash');
      mockUserModel.findRefreshToken.mockResolvedValue(mockRefreshToken);
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockUserModel.revokeRefreshToken.mockResolvedValue();
      mockUserModel.createRefreshToken.mockResolvedValue(mockRefreshToken);
      mockJWTManager.generateAccessToken.mockReturnValue('new-access-token');
      mockJWTManager.generateRefreshToken.mockReturnValue('new-refresh-token');
      mockJWTManager.getTokenExpirationTime.mockReturnValue(3600);

      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', 'Bearer refresh-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('new-access-token');
      expect(response.body.data.expiresIn).toBe(3600);
    });

    it('should return 401 for invalid refresh token', async () => {
      mockJWTManager.extractTokenFromHeader.mockReturnValue('invalid-token');
      mockJWTManager.hashRefreshToken.mockReturnValue('invalid-hash');
      mockUserModel.findRefreshToken.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});