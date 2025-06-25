const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');

// 環境変数の読み込み
dotenv.config();

// Express アプリケーションの初期化
const app = express();
const PORT = process.env.PORT || 3001;

// OpenAI クライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ミドルウェアの設定
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// エラーハンドリング用のラッパー関数
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'minimal-ai-backend',
    port: PORT
  });
});

// ルートエンドポイント
app.get('/', (req, res) => {
  res.json({
    message: 'Minimal AI Backend is running',
    endpoints: {
      health: '/health',
      generate: '/api/generate'
    }
  });
});

// インテリジェント文書生成プロンプト
const generateDocumentPrompt = (answers) => {
  return `あなたは補助金申請書作成の専門家です。以下の3つの回答から、完全で説得力のある補助金申請書を生成してください。

【回答情報】
1. 事業内容: ${answers.businessDescription}
2. 申請金額: ${answers.requestAmount}円
3. 使用目的: ${answers.usagePurpose}

【生成する申請書の要件】
- 3000〜5000文字程度
- 以下の構成を含める：
  1. 申請概要
  2. 事業の現状と課題
  3. 補助金活用による改善計画
  4. 期待される効果（定量的・定性的）
  5. 実施スケジュール
  6. 資金計画
  7. まとめ

【重要な注意点】
- 説得力のある論理的な文章
- 具体的な数値や期待効果を含める
- 審査員が理解しやすい構成
- 事業の社会的意義を強調

上記の要件に従って、プロフェッショナルな補助金申請書を生成してください。`;
};

// メイン文書生成エンドポイント
app.post('/api/generate', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    // リクエストボディの検証
    const { businessDescription, requestAmount, usagePurpose } = req.body;
    
    if (!businessDescription || !requestAmount || !usagePurpose) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['businessDescription', 'requestAmount', 'usagePurpose'],
        received: Object.keys(req.body)
      });
    }

    console.log('Generating document for:', {
      businessLength: businessDescription.length,
      amount: requestAmount,
      purposeLength: usagePurpose.length
    });

    // OpenAI APIの呼び出し
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'あなたは日本の補助金申請書作成の専門家です。説得力があり、審査員に響く申請書を作成します。'
        },
        {
          role: 'user',
          content: generateDocumentPrompt(req.body)
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const generatedDocument = completion.choices[0].message.content;
    const processingTime = Date.now() - startTime;

    // 成功レスポンス
    res.status(200).json({
      success: true,
      document: generatedDocument,
      metadata: {
        wordCount: generatedDocument.length,
        processingTime: `${processingTime}ms`,
        model: 'gpt-4-turbo-preview',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating document:', error);
    
    // OpenAI API エラーの詳細なハンドリング
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'OpenAI API Error',
        message: error.response.data.error.message,
        type: error.response.data.error.type,
        code: error.response.data.error.code
      });
    }
    
    // その他のエラー
    throw error;
  }
}));

// 404エラーハンドリング
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      health: 'GET /health',
      generate: 'POST /api/generate'
    }
  });
});

// グローバルエラーハンドリング
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// サーバーの起動
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Minimal AI Backend Server Started    ║
╠════════════════════════════════════════╣
║  Port: ${PORT}                            ║
║  Health: http://localhost:${PORT}/health  ║
║  API: http://localhost:${PORT}/api/generate║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;