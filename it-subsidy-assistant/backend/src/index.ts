import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { rateLimitMiddleware } from '@/middleware/rateLimit';
import { authRoutes } from '@/routes/auth';
import { subsidyRoutes } from '@/routes/subsidies';
import { documentRoutes } from '@/routes/documents';
import { companyRoutes } from '@/routes/companies';
import { eligibilityRoutes } from '@/routes/eligibility';
import { documentsRequiredRoutes } from '@/routes/documents-required';
import { scheduleRoutes } from '@/routes/schedules';
import { diagnosisRoutes } from '@/routes/diagnosis';
import { formRoutes } from '@/routes/forms';
import { exportRoutes } from '@/routes/export';
// import excelRoutes from '@/routes/excel';
// import excelDownloadRoutes from '@/routes/excel-download';
import { logger } from '@/utils/logger';
import { validateEnvironment } from '@/config/environment';
import { loadEnvironment } from '@/utils/loadEnv';

// Load environment variables with proper precedence
loadEnvironment();

// Debug: check if environment variables are loaded
console.log('Current working directory:', process.cwd());
console.log('Environment variables check:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
  JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'SET' : 'NOT SET',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'
});

validateEnvironment();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: process.env.CORS_CREDENTIALS === 'true'
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

app.use(rateLimitMiddleware);

app.get('/health', (_, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || 'v1',
    environment: NODE_ENV
  });
});

app.use(`/${process.env.API_VERSION || 'v1'}/auth`, authRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/subsidies`, subsidyRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/documents`, documentRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/companies`, companyRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/eligibility`, eligibilityRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/required-documents`, documentsRequiredRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/schedules`, scheduleRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/diagnosis`, diagnosisRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/forms`, formRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/export`, exportRoutes);
// app.use(`/${process.env.API_VERSION || 'v1'}/excel`, excelRoutes);
// app.use('/api/excel-download', excelDownloadRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/health`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;