import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { rateLimitMiddleware } from '@/middleware/rateLimit';
import { authRoutes } from '@/routes/auth';
import { subsidyRoutes } from '@/routes/subsidies';
import { documentRoutes } from '@/routes/documents';
import { logger } from '@/utils/logger';
import { validateEnvironment } from '@/config/environment';

dotenv.config();

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

app.get('/health', (req, res) => {
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