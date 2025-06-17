import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './environment';
import { logger } from '@/utils/logger';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private supabaseClient: SupabaseClient;
  private supabaseServiceClient: SupabaseClient;

  private constructor() {
    try {
      this.supabaseClient = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_ANON_KEY,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: false
          }
        }
      );

      this.supabaseServiceClient = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      logger.info('✅ Database connection established');
    } catch (error) {
      logger.error('❌ Failed to establish database connection:', error);
      throw error;
    }
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getClient(): SupabaseClient {
    return this.supabaseClient;
  }

  public getServiceClient(): SupabaseClient {
    return this.supabaseServiceClient;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        logger.error('Database health check failed:', error);
        return false;
      }
      
      logger.info('✅ Database health check passed');
      return true;
    } catch (error) {
      logger.error('Database health check error:', error);
      return false;
    }
  }

  public async testConnection(): Promise<void> {
    try {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        throw new Error(`Database connection test failed: ${error.message}`);
      }

      logger.info('✅ Database connection test successful');
    } catch (error) {
      logger.error('❌ Database connection test failed:', error);
      throw error;
    }
  }
}

export const db = DatabaseConnection.getInstance();
export const supabase = db.getClient();
export const supabaseService = db.getServiceClient();