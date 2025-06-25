import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';

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
import healthRoutes from '@/routes/health';
import diagnosisSessionRoutes from '@/routes/diagnosis-session';
import authPhase1Routes from '@/routes/auth-phase1';
import sessionsRoutes from '@/routes/sessions';
import documentMagicRoutes from '@/routes/document-magic';
import collaborationRoutes from '@/routes/collaboration';
import { aiDocumentRoutes } from './routes/ai-document-generator';
// import biometricAuthRoutes from '@/routes/biometric-auth';
// import quantumSecureRoutes from '@/routes/quantum-secure-api';
// import excelRoutes from '@/routes/excel';
// import excelDownloadRoutes from '@/routes/excel-download';
import { logger } from '@/utils/logger';
import { validateEnvironment } from '@/config/environment';
import { loadEnvironment } from '@/utils/loadEnv';
import { setupSocketIO } from '@/config/socketio';

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
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
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

// Health check routes (Worker1要求準拠)
app.use('/', healthRoutes);

// Phase 1 認証ルート
app.use(`/${process.env.API_VERSION || 'v1'}/auth-phase1`, authPhase1Routes);

app.use(`/${process.env.API_VERSION || 'v1'}/auth`, authRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/subsidies`, subsidyRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/documents`, documentRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/companies`, companyRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/eligibility`, eligibilityRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/required-documents`, documentsRequiredRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/schedules`, scheduleRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/diagnosis`, diagnosisRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/diagnosis-sessions`, diagnosisSessionRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/forms`, formRoutes);
app.use(`/${process.env.API_VERSION || 'v1'}/export`, exportRoutes);

// Worker1要求準拠 - セッション管理API
app.use('/api/sessions', sessionsRoutes);

// Document Magic Studio routes
app.use(`/${process.env.API_VERSION || 'v1'}/document-magic`, documentMagicRoutes);

// Collaboration routes
app.use(`/${process.env.API_VERSION || 'v1'}/collaboration`, collaborationRoutes);

// AI Document Generation routes
app.use(`/${process.env.API_VERSION || 'v1'}/ai-document`, aiDocumentRoutes);

// Biometric Authentication routes
// app.use(`/${process.env.API_VERSION || 'v1'}/biometric`, biometricAuthRoutes);

// Quantum-Secure API routes
// app.use(`/${process.env.API_VERSION || 'v1'}/quantum`, quantumSecureRoutes);

// app.use(`/${process.env.API_VERSION || 'v1'}/excel`, excelRoutes);
// app.use('/api/excel-download', excelDownloadRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// HTTPサーバー作成とSocket.IO統合
const httpServer = createServer(app);
const io = setupSocketIO(httpServer);

// Socket.IOインスタンスをグローバルに利用可能にする
app.set('io', io);

const server = httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/v1/health`);
  logger.info(`🔌 WebSocket server is ready`);
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