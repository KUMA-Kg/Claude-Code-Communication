/**
 * Phase 1 サーバー設定
 * 基本セキュリティを含むシンプルな実装
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { basicSecurityMiddleware } from './middleware/basicSecurityMiddleware';
import authRoutes from './routes/auth-basic';

// 環境変数の読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS設定
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// ボディパーサー
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 基本セキュリティミドルウェアの適用
app.use(basicSecurityMiddleware);

// ルート設定
app.use('/api/auth', authRoutes);

// 基本的なヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 補助金API（モック）
app.get('/api/subsidies', (req, res) => {
  const mockSubsidies = [
    {
      id: '1',
      name: 'IT導入補助金',
      category: 'IT',
      amount: '最大450万円',
      description: 'ITツール導入による業務効率化を支援',
      deadline: '2024-12-31',
      requirements: ['中小企業', 'ITツール導入計画'],
    },
    {
      id: '2',
      name: 'ものづくり補助金',
      category: '製造業',
      amount: '最大1,250万円',
      description: '革新的サービス開発・試作品開発・生産プロセス改善',
      deadline: '2024-11-30',
      requirements: ['中小企業', '事業計画書'],
    },
    {
      id: '3',
      name: '事業再構築補助金',
      category: '全業種',
      amount: '最大8,000万円',
      description: '新分野展開や業態転換など思い切った事業再構築',
      deadline: '2024-10-31',
      requirements: ['売上減少', '事業計画書', '認定支援機関の確認'],
    },
  ];

  // 検索フィルター
  const { search, category } = req.query;
  let filtered = mockSubsidies;

  if (search) {
    const searchStr = String(search).toLowerCase();
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(searchStr) ||
      s.description.toLowerCase().includes(searchStr)
    );
  }

  if (category) {
    filtered = filtered.filter(s => s.category === category);
  }

  res.json({
    subsidies: filtered,
    total: filtered.length,
  });
});

// 診断API（モック）
app.post('/api/diagnosis/start', (req, res) => {
  res.json({
    sessionId: Date.now().toString(),
    firstQuestion: {
      id: 'q1',
      text: '貴社の業種を教えてください',
      options: [
        { id: 'it', label: 'IT・ソフトウェア' },
        { id: 'manufacturing', label: '製造業' },
        { id: 'retail', label: '小売・サービス業' },
        { id: 'other', label: 'その他' },
      ],
    },
  });
});

app.post('/api/diagnosis/answer', (req, res) => {
  const { sessionId, questionId, answer } = req.body;

  // 簡易的な診断ロジック
  if (questionId === 'q1') {
    res.json({
      nextQuestion: {
        id: 'q2',
        text: '従業員数を教えてください',
        options: [
          { id: 'small', label: '1-20名' },
          { id: 'medium', label: '21-100名' },
          { id: 'large', label: '101名以上' },
        ],
      },
    });
  } else {
    // 診断完了
    res.json({
      completed: true,
      recommendations: [
        {
          subsidyId: '1',
          matchScore: 85,
          reasons: ['IT業界の企業様に最適', '従業員規模が条件に合致'],
        },
      ],
    });
  }
});

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: '指定されたエンドポイントが見つかりません',
    path: req.path,
  });
});

// エラーハンドラー
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'サーバーエラーが発生しました';
  
  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`
    🚀 Phase 1 サーバーが起動しました
    
    ポート: ${PORT}
    環境: ${process.env.NODE_ENV || 'development'}
    CORS許可: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
    
    エンドポイント:
    - GET  /api/health        ヘルスチェック
    - POST /api/auth/register ユーザー登録
    - POST /api/auth/login    ログイン
    - GET  /api/auth/csrf-token CSRFトークン取得
    - GET  /api/subsidies     補助金一覧
    - POST /api/diagnosis/start 診断開始
    - POST /api/diagnosis/answer 診断回答
  `);
});

export default app;