import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { authenticate } from './middleware/auth';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth';
import subsidiesRoutes from './routes/subsidies';
import subsidiesExtendedRoutes from './routes/subsidies-extended';
import adminMockRoutes from './routes/admin-mock';
import documentsRoutes from './routes/documents';
import companiesRoutes from './routes/companies';
import formsRoutes from './routes/forms';
import exportRoutes from './routes/export';
import excelRoutes from './routes/excel';
import excelDownloadRoutes from './routes/excel-download';
import diagnosisRoutes from './routes/diagnosis';
import eligibilityRoutes from './routes/eligibility';
import requiredDocumentsRoutes from './routes/documents-required';
import schedulesRoutes from './routes/schedules';

// Import services
import { RealtimeSubsidyService } from './services/RealtimeSubsidyService';
import { DeadlineScheduler } from './services/DeadlineScheduler';

const app = express();
export { app };

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // APIテスト用に一時的に無効化
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes - 拡張版を優先
app.use('/api/auth', authRoutes);
app.use('/api/subsidies', subsidiesExtendedRoutes); // 拡張版を先に登録
app.use('/api/subsidies', adminMockRoutes); // モックデータ管理
app.use('/api/subsidies', subsidiesRoutes); // 既存エンドポイント（フォールバック）
app.use('/api/admin', adminMockRoutes); // 管理機能
app.use('/api/companies', authenticate, companiesRoutes);
app.use('/api/documents', authenticate, documentsRoutes);
app.use('/api/documents-required', requiredDocumentsRoutes);
app.use('/api/export', authenticate, exportRoutes);
app.use('/api/forms', authenticate, formsRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/excel', authenticate, excelRoutes);
app.use('/api/excel-download', excelDownloadRoutes);
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/schedules', authenticate, schedulesRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// HTTPサーバーの作成
const httpServer = createServer(app);

// WebSocketサービスの初期化（簡易版）
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// WebSocket簡易実装（デモ用）
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // チャンネル購読
  socket.on('subscribe', (channel) => {
    socket.join(channel);
    logger.info(`Socket ${socket.id} joined channel: ${channel}`);
  });

  // 更新シミュレーション
  socket.on('simulate_update', (data) => {
    io.to('subsidy_updates').emit('subsidy_update', {
      type: 'subsidy_update',
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Extended server running on port ${PORT}`);
    logger.info(`📡 WebSocket enabled on ws://localhost:${PORT}`);
    logger.info(`🌐 API test page: http://localhost:3000/api-test.html`);
    
    // スケジューラーの初期化（デモ環境では無効化）
    if (process.env.ENABLE_SCHEDULER === 'true') {
      DeadlineScheduler.initialize();
      logger.info('📅 Deadline scheduler initialized');
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received.');
  
  httpServer.close(() => {
    logger.info('HTTP server closed.');
    
    if (process.env.ENABLE_SCHEDULER === 'true') {
      DeadlineScheduler.shutdown();
    }
    
    process.exit(0);
  });
});

export default httpServer;