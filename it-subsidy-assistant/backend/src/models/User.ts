import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { supabaseService } from '@/config/database';
import { User, UserCreateInput, UserUpdateInput, RefreshToken } from '@/types/auth';
import { logger } from '@/utils/logger';
import { env } from '@/config/environment';

export class UserModel {
  public static async create(userData: UserCreateInput): Promise<User> {
    try {
      const { email, password, name, role = 'user' } = userData;

      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
      const userId = uuidv4();

      const { data, error } = await supabaseService
        .from('users')
        .insert({
          id: userId,
          email,
          password_hash: hashedPassword,
          name,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        })
        .select('id, email, name, role, created_at, updated_at, last_login_at, is_active')
        .single();

      if (error) {
        logger.error('Failed to create user:', error);
        throw new Error('Failed to create user');
      }

      return this.mapDatabaseUserToUser(data);
    } catch (error) {
      logger.error('UserModel.create error:', error);
      throw error;
    }
  }

  public static async findById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseService
        .from('users')
        .select('id, email, name, role, created_at, updated_at, last_login_at, is_active')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapDatabaseUserToUser(data);
    } catch (error) {
      logger.error('UserModel.findById error:', error);
      return null;
    }
  }

  public static async findByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseService
        .from('users')
        .select('id, email, name, role, created_at, updated_at, last_login_at, is_active')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapDatabaseUserToUser(data);
    } catch (error) {
      logger.error('UserModel.findByEmail error:', error);
      return null;
    }
  }

  public static async findByEmailWithPassword(email: string): Promise<(User & { passwordHash: string }) | null> {
    try {
      const { data, error } = await supabaseService
        .from('users')
        .select('id, email, password_hash, name, role, created_at, updated_at, last_login_at, is_active')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        ...this.mapDatabaseUserToUser(data),
        passwordHash: data.password_hash
      };
    } catch (error) {
      logger.error('UserModel.findByEmailWithPassword error:', error);
      return null;
    }
  }

  public static async update(id: string, updateData: UserUpdateInput): Promise<User | null> {
    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      };

      if (updateData.email) updates.email = updateData.email;
      if (updateData.name) updates.name = updateData.name;
      if (updateData.role) updates.role = updateData.role;
      if (updateData.isActive !== undefined) updates.is_active = updateData.isActive;

      const { data, error } = await supabaseService
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, email, name, role, created_at, updated_at, last_login_at, is_active')
        .single();

      if (error || !data) {
        logger.error('Failed to update user:', error);
        return null;
      }

      return this.mapDatabaseUserToUser(data);
    } catch (error) {
      logger.error('UserModel.update error:', error);
      return null;
    }
  }

  public static async updateLastLogin(id: string): Promise<void> {
    try {
      const { error } = await supabaseService
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        logger.error('Failed to update last login:', error);
      }
    } catch (error) {
      logger.error('UserModel.updateLastLogin error:', error);
    }
  }

  public static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Password verification error:', error);
      return false;
    }
  }

  public static async createRefreshToken(userId: string, tokenHash: string): Promise<RefreshToken> {
    try {
      const tokenId = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const { data, error } = await supabaseService
        .from('refresh_tokens')
        .insert({
          id: tokenId,
          user_id: userId,
          token_hash: tokenHash,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
          is_revoked: false
        })
        .select()
        .single();

      if (error || !data) {
        logger.error('Failed to create refresh token:', error);
        throw new Error('Failed to create refresh token');
      }

      return {
        id: data.id,
        userId: data.user_id,
        tokenHash: data.token_hash,
        expiresAt: new Date(data.expires_at),
        createdAt: new Date(data.created_at),
        isRevoked: data.is_revoked
      };
    } catch (error) {
      logger.error('UserModel.createRefreshToken error:', error);
      throw error;
    }
  }

  public static async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    try {
      const { data, error } = await supabaseService
        .from('refresh_tokens')
        .select()
        .eq('token_hash', tokenHash)
        .eq('is_revoked', false)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        tokenHash: data.token_hash,
        expiresAt: new Date(data.expires_at),
        createdAt: new Date(data.created_at),
        isRevoked: data.is_revoked
      };
    } catch (error) {
      logger.error('UserModel.findRefreshToken error:', error);
      return null;
    }
  }

  public static async revokeRefreshToken(tokenHash: string): Promise<void> {
    try {
      const { error } = await supabaseService
        .from('refresh_tokens')
        .update({ is_revoked: true })
        .eq('token_hash', tokenHash);

      if (error) {
        logger.error('Failed to revoke refresh token:', error);
      }
    } catch (error) {
      logger.error('UserModel.revokeRefreshToken error:', error);
    }
  }

  public static async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    try {
      const { error } = await supabaseService
        .from('refresh_tokens')
        .update({ is_revoked: true })
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to revoke all user refresh tokens:', error);
      }
    } catch (error) {
      logger.error('UserModel.revokeAllUserRefreshTokens error:', error);
    }
  }

  public static async cleanupExpiredTokens(): Promise<void> {
    try {
      const { error } = await supabaseService
        .from('refresh_tokens')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        logger.error('Failed to cleanup expired tokens:', error);
      } else {
        logger.info('Expired refresh tokens cleaned up successfully');
      }
    } catch (error) {
      logger.error('UserModel.cleanupExpiredTokens error:', error);
    }
  }

  private static mapDatabaseUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
      lastLoginAt: dbUser.last_login_at ? new Date(dbUser.last_login_at) : undefined,
      isActive: dbUser.is_active
    };
  }
}