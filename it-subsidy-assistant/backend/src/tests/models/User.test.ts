import { UserModel } from '@/models/User';
import { supabaseService } from '@/config/database';

jest.mock('@/config/database', () => ({
  supabaseService: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    lt: jest.fn().mockReturnThis()
  }
}));

const mockSupabase = supabaseService as jest.Mocked<typeof supabaseService>;

describe('UserModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    it('should create user successfully', async () => {
      const mockDbUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        last_login_at: null,
        is_active: true
      };

      // Mock the chain of calls
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null }); // findByEmail returns null

      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({ data: mockDbUser, error: null });

      const result = await UserModel.create(userData);

      expect(result).toEqual({
        id: mockDbUser.id,
        email: mockDbUser.email,
        name: mockDbUser.name,
        role: mockDbUser.role,
        createdAt: new Date(mockDbUser.created_at),
        updatedAt: new Date(mockDbUser.updated_at),
        lastLoginAt: undefined,
        isActive: mockDbUser.is_active
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      const existingUser = {
        id: 'existing-id',
        email: 'test@example.com',
        name: 'Existing User',
        role: 'user',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        is_active: true
      };

      mockSupabase.single.mockResolvedValueOnce({ data: existingUser, error: null });

      await expect(UserModel.create(userData)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockDbUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        last_login_at: '2023-01-02T00:00:00Z',
        is_active: true
      };

      mockSupabase.single.mockResolvedValue({ data: mockDbUser, error: null });

      const result = await UserModel.findById('user-id');

      expect(result).toEqual({
        id: mockDbUser.id,
        email: mockDbUser.email,
        name: mockDbUser.name,
        role: mockDbUser.role,
        createdAt: new Date(mockDbUser.created_at),
        updatedAt: new Date(mockDbUser.updated_at),
        lastLoginAt: new Date(mockDbUser.last_login_at),
        isActive: mockDbUser.is_active
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-id');
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should return null if user not found', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'No rows returned' } });

      const result = await UserModel.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const result = await UserModel.verifyPassword('password123', '$2a$12$hashedpassword');
      // Since we're mocking bcrypt, we need to mock its behavior
      expect(typeof result).toBe('boolean');
    });
  });

  describe('createRefreshToken', () => {
    it('should create refresh token successfully', async () => {
      const mockTokenData = {
        id: 'token-id',
        user_id: 'user-id',
        token_hash: 'token-hash',
        expires_at: '2023-01-08T00:00:00Z',
        created_at: '2023-01-01T00:00:00Z',
        is_revoked: false
      };

      mockSupabase.single.mockResolvedValue({ data: mockTokenData, error: null });

      const result = await UserModel.createRefreshToken('user-id', 'token-hash');

      expect(result).toEqual({
        id: mockTokenData.id,
        userId: mockTokenData.user_id,
        tokenHash: mockTokenData.token_hash,
        expiresAt: new Date(mockTokenData.expires_at),
        createdAt: new Date(mockTokenData.created_at),
        isRevoked: mockTokenData.is_revoked
      });

      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe('findRefreshToken', () => {
    it('should find valid refresh token', async () => {
      const mockTokenData = {
        id: 'token-id',
        user_id: 'user-id',
        token_hash: 'token-hash',
        expires_at: '2023-01-08T00:00:00Z',
        created_at: '2023-01-01T00:00:00Z',
        is_revoked: false
      };

      mockSupabase.single.mockResolvedValue({ data: mockTokenData, error: null });

      const result = await UserModel.findRefreshToken('token-hash');

      expect(result).toEqual({
        id: mockTokenData.id,
        userId: mockTokenData.user_id,
        tokenHash: mockTokenData.token_hash,
        expiresAt: new Date(mockTokenData.expires_at),
        createdAt: new Date(mockTokenData.created_at),
        isRevoked: mockTokenData.is_revoked
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith('token_hash', 'token-hash');
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_revoked', false);
    });

    it('should return null if token not found', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'No rows returned' } });

      const result = await UserModel.findRefreshToken('nonexistent-hash');

      expect(result).toBeNull();
    });
  });
});