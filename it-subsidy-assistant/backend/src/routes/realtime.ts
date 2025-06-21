import { Router, Request, Response } from 'express';
import { param, body, validationResult } from 'express-validator';
import { RealtimeService } from '@/services/RealtimeService';
import { CompanyModel } from '@/models/Company';
import { logger } from '@/utils/logger';
import { asyncHandler, validationErrorHandler } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';

const router = Router();

// WebSocket接続情報を取得
router.get('/connection-info', authenticate, (req: Request, res: Response) => {
  const userId = req.user!.userId;
  
  // Supabaseのリアルタイム接続に必要な情報を返す
  res.json({
    success: true,
    data: {
      userId,
      connectionUrl: process.env.SUPABASE_URL?.replace('https://', 'wss://') + '/realtime/v1',
      anonKey: process.env.SUPABASE_ANON_KEY,
      channels: {
        applications: `applications:user:${userId}`,
        documents: 'documents:*',
        presence: 'presence:*',
        broadcast: 'broadcast:*'
      }
    }
  });
});

// 現在の接続状態を取得
router.get('/status', authenticate, (req: Request, res: Response) => {
  const status = RealtimeService.getConnectionStatus();
  
  res.json({
    success: true,
    data: {
      connections: status,
      total: status.length
    }
  });
});

// メッセージをブロードキャスト
router.post(
  '/applications/:applicationId/broadcast',
  authenticate,
  [
    param('applicationId').isUUID().withMessage('無効な申請IDです'),
    body('type')
      .isIn(['comment', 'status_change', 'document_upload'])
      .withMessage('無効なメッセージタイプです'),
    body('content')
      .notEmpty()
      .withMessage('メッセージ内容は必須です')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { applicationId } = req.params;
    const { type, content } = req.body;
    const userId = req.user!.userId;
    const userName = req.user!.email; // TODO: 実際の名前を取得

    await RealtimeService.broadcastApplicationMessage(applicationId, {
      type,
      userId,
      userName,
      content,
      timestamp: new Date().toISOString()
    });

    logger.info('Message broadcasted', {
      userId,
      applicationId,
      messageType: type
    });

    res.json({
      success: true,
      message: 'メッセージを送信しました'
    });
  })
);

// サブスクリプション例（SSEエンドポイント）
router.get(
  '/subscribe/applications/:companyId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const userId = req.user!.userId;

    // 権限チェック
    const company = await CompanyModel.findById(companyId, userId);
    if (!company) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'この企業の情報にアクセスする権限がありません'
        }
      });
    }

    // SSEヘッダーを設定
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 初期接続メッセージ
    res.write(`data: ${JSON.stringify({ type: 'connected', companyId })}\n\n`);

    // リアルタイムサブスクリプション
    const subscription = RealtimeService.subscribeToApplicationChanges(
      companyId,
      (payload) => {
        res.write(`data: ${JSON.stringify({
          type: 'application_change',
          ...payload
        })}\n\n`);
      }
    );

    // クライアント切断時の処理
    req.on('close', () => {
      subscription.unsubscribe();
      logger.info('SSE connection closed', { userId, companyId });
    });
  })
);

// WebSocketハンドシェイク用のエンドポイント
router.post('/websocket/auth', authenticate, (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const token = req.headers.authorization?.replace('Bearer ', '');

  // WebSocket接続用の認証トークンを生成
  // 実際の実装では、短期間有効なトークンを生成する
  const wsToken = Buffer.from(JSON.stringify({
    userId,
    expires: Date.now() + 3600000 // 1時間
  })).toString('base64');

  res.json({
    success: true,
    data: {
      wsToken,
      userId
    }
  });
});

export const realtimeRoutes = router;