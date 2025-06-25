/**
 * Phase 1 認証ルート
 * シンプルな認証エンドポイント
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { generateToken, generateCSRFToken, sanitizeInput } from '../middleware/basicSecurityMiddleware';

const router = Router();

// メモリ内のユーザーストア（Phase 1用）
interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
}

const users = new Map<string, User>();

// デモユーザーの作成
const createDemoUser = async () => {
  const hashedPassword = await bcrypt.hash('demo123', 10);
  users.set('demo@example.com', {
    id: '1',
    email: 'demo@example.com',
    password: hashedPassword,
    role: 'user',
    createdAt: new Date(),
  });
};

// 初期化
createDemoUser();

/**
 * ユーザー登録
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 入力検証
    if (!email || !password) {
      return res.status(400).json({ error: 'メールアドレスとパスワードは必須です' });
    }

    // メールフォーマット検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '有効なメールアドレスを入力してください' });
    }

    // パスワード強度チェック
    if (password.length < 8) {
      return res.status(400).json({ error: 'パスワードは8文字以上必要です' });
    }

    // 既存ユーザーチェック
    if (users.has(email)) {
      return res.status(409).json({ error: 'このメールアドレスは既に登録されています' });
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザー作成
    const newUser: User = {
      id: Date.now().toString(),
      email: sanitizeInput(email),
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
    };

    users.set(email, newUser);

    // トークン生成
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // CSRFトークン生成
    const csrfToken = generateCSRFToken();

    res.status(201).json({
      message: 'ユーザー登録が完了しました',
      token,
      csrfToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'ユーザー登録中にエラーが発生しました' });
  }
});

/**
 * ログイン
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 入力検証
    if (!email || !password) {
      return res.status(400).json({ error: 'メールアドレスとパスワードは必須です' });
    }

    // ユーザー検索
    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    // パスワード検証
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    // トークン生成
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // CSRFトークン生成
    const csrfToken = generateCSRFToken();

    res.json({
      message: 'ログインに成功しました',
      token,
      csrfToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'ログイン中にエラーが発生しました' });
  }
});

/**
 * CSRFトークン取得
 */
router.get('/csrf-token', (req: Request, res: Response) => {
  const csrfToken = generateCSRFToken();
  res.json({ csrfToken });
});

/**
 * ヘルスチェック
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;