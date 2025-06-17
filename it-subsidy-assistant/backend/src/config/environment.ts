import { logger } from '@/utils/logger';

export interface Environment {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DATABASE_URL: string;
  
  JWT_SECRET: string;
  JWT_EXPIRE_TIME: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRE_TIME: string;
  
  BCRYPT_SALT_ROUNDS: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  
  CORS_ORIGIN: string;
  CORS_CREDENTIALS: boolean;
  
  MAX_FILE_SIZE: number;
  UPLOAD_DIR: string;
  
  LOG_LEVEL: string;
  LOG_FILE: string;
  
  PDF_TEMP_DIR: string;
}

export const validateEnvironment = (): Environment => {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.error('JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    logger.error('JWT_REFRESH_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3001', 10),
    API_VERSION: process.env.API_VERSION || 'v1',
    
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    DATABASE_URL: process.env.DATABASE_URL!,
    
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRE_TIME: process.env.JWT_EXPIRE_TIME || '1h',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    JWT_REFRESH_EXPIRE_TIME: process.env.JWT_REFRESH_EXPIRE_TIME || '7d',
    
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
    
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === 'true',
    
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
    
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE: process.env.LOG_FILE || './logs/app.log',
    
    PDF_TEMP_DIR: process.env.PDF_TEMP_DIR || './temp/pdf'
  };
};

export const env = validateEnvironment();