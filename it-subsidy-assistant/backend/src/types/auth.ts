export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface UserCreateInput {
  email: string;
  password: string;
  name: string;
  role?: 'user' | 'admin';
}

export interface UserUpdateInput {
  email?: string;
  name?: string;
  role?: 'user' | 'admin';
  isActive?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    refreshToken: string;
    user: Omit<User, 'password'>;
  };
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    token: string;
    expiresIn: number;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}