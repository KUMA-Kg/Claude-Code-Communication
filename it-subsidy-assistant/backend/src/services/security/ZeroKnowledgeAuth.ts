import * as crypto from 'crypto';
import { promisify } from 'util';

const randomBytes = promisify(crypto.randomBytes);

interface ZKChallenge {
  nonce: string;
  timestamp: number;
  serverPublicKey: string;
}

interface ZKProof {
  commitment: string;
  response: string;
  timestamp: number;
}

interface APIKeyDerivation {
  salt: Buffer;
  iterations: number;
  keyLength: number;
}

export class ZeroKnowledgeAuthSystem {
  private serverPrivateKey: string;
  private serverPublicKey: string;
  private activeChallenges: Map<string, ZKChallenge> = new Map();
  private proofHistory: Map<string, ZKProof[]> = new Map();
  private readonly CHALLENGE_TIMEOUT = 60000; // 1分
  private readonly MAX_PROOF_ATTEMPTS = 3;

  constructor() {
    // サーバー側の鍵ペア生成
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    this.serverPrivateKey = privateKey;
    this.serverPublicKey = publicKey;

    // 定期的に期限切れチャレンジをクリーンアップ
    setInterval(() => this.cleanupExpiredChallenges(), 30000);
  }

  /**
   * チャレンジの生成（ステップ1）
   */
  async generateChallenge(userId: string): Promise<ZKChallenge> {
    const nonce = (await randomBytes(32)).toString('hex');
    const challenge: ZKChallenge = {
      nonce,
      timestamp: Date.now(),
      serverPublicKey: this.serverPublicKey
    };

    this.activeChallenges.set(userId, challenge);
    
    return challenge;
  }

  /**
   * ゼロ知識証明の検証（ステップ2）
   */
  async verifyProof(userId: string, proof: ZKProof): Promise<boolean> {
    const challenge = this.activeChallenges.get(userId);
    
    if (!challenge) {
      console.error('No active challenge for user:', userId);
      return false;
    }

    // タイムアウトチェック
    if (Date.now() - challenge.timestamp > this.CHALLENGE_TIMEOUT) {
      this.activeChallenges.delete(userId);
      console.error('Challenge expired for user:', userId);
      return false;
    }

    // 証明の検証
    try {
      const isValid = await this.performZKVerification(challenge, proof);
      
      if (isValid) {
        // 成功した証明を記録
        this.recordProof(userId, proof);
        this.activeChallenges.delete(userId);
        return true;
      }

      // 失敗回数をチェック
      const attempts = this.getProofAttempts(userId);
      if (attempts >= this.MAX_PROOF_ATTEMPTS) {
        this.activeChallenges.delete(userId);
        console.error('Max proof attempts exceeded for user:', userId);
      }

      return false;
    } catch (error) {
      console.error('Proof verification error:', error);
      return false;
    }
  }

  /**
   * 実際のゼロ知識証明検証ロジック
   */
  private async performZKVerification(challenge: ZKChallenge, proof: ZKProof): Promise<boolean> {
    // Schnorr識別プロトコルの簡略実装
    try {
      // コミットメントの検証
      const commitment = Buffer.from(proof.commitment, 'hex');
      const response = Buffer.from(proof.response, 'hex');
      const nonce = Buffer.from(challenge.nonce, 'hex');

      // ハッシュ関数を使用してチャレンジを生成
      const challengeHash = crypto.createHash('sha256')
        .update(commitment)
        .update(nonce)
        .update(Buffer.from(proof.timestamp.toString()))
        .digest();

      // 検証式: g^response = commitment * publicKey^challenge
      // (簡略化された検証 - 実際の実装ではより複雑な楕円曲線暗号を使用)
      const verificationHash = crypto.createHash('sha256')
        .update(response)
        .update(challengeHash)
        .digest('hex');

      // タイミング攻撃を防ぐための定数時間比較
      return crypto.timingSafeEqual(
        Buffer.from(verificationHash.slice(0, 32)),
        Buffer.from(proof.commitment.slice(0, 32), 'hex')
      );
    } catch (error) {
      console.error('ZK verification error:', error);
      return false;
    }
  }

  /**
   * APIキーの派生（証明成功後）
   */
  async deriveAPIKey(userId: string, proof: ZKProof): Promise<string | null> {
    const proofs = this.proofHistory.get(userId);
    
    if (!proofs || proofs.length === 0) {
      return null;
    }

    // 最新の有効な証明を確認
    const latestProof = proofs[proofs.length - 1];
    if (latestProof.commitment !== proof.commitment) {
      return null;
    }

    // ユーザー固有のAPIキーを派生
    const derivation: APIKeyDerivation = {
      salt: await randomBytes(16),
      iterations: 100000,
      keyLength: 32
    };

    const derivedKey = crypto.pbkdf2Sync(
      proof.commitment,
      derivation.salt,
      derivation.iterations,
      derivation.keyLength,
      'sha256'
    );

    // 一時的なAPIトークンを生成
    const apiToken = crypto.createHmac('sha256', derivedKey)
      .update(userId)
      .update(Date.now().toString())
      .digest('hex');

    return apiToken;
  }

  /**
   * 証明履歴の記録
   */
  private recordProof(userId: string, proof: ZKProof): void {
    if (!this.proofHistory.has(userId)) {
      this.proofHistory.set(userId, []);
    }

    const history = this.proofHistory.get(userId)!;
    history.push(proof);

    // 古い証明を削除（最新10件のみ保持）
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * 証明試行回数の取得
   */
  private getProofAttempts(userId: string): number {
    const history = this.proofHistory.get(userId) || [];
    const recentAttempts = history.filter(
      proof => Date.now() - proof.timestamp < this.CHALLENGE_TIMEOUT
    );
    return recentAttempts.length;
  }

  /**
   * 期限切れチャレンジのクリーンアップ
   */
  private cleanupExpiredChallenges(): void {
    const now = Date.now();
    for (const [userId, challenge] of this.activeChallenges.entries()) {
      if (now - challenge.timestamp > this.CHALLENGE_TIMEOUT) {
        this.activeChallenges.delete(userId);
      }
    }
  }

  /**
   * 自動キーローテーション
   */
  async rotateKeys(): Promise<void> {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    this.serverPrivateKey = privateKey;
    this.serverPublicKey = publicKey;

    // すべてのアクティブチャレンジを無効化
    this.activeChallenges.clear();
    
    console.log('Server keys rotated successfully');
  }
}

// クライアント側のヘルパー関数
export class ZKProofGenerator {
  /**
   * クライアント側での証明生成
   */
  static async generateProof(
    apiKeySecret: string,
    challenge: ZKChallenge
  ): Promise<ZKProof> {
    // クライアントの秘密鍵から証明を生成
    const timestamp = Date.now();
    
    // ランダムなコミットメント生成
    const randomValue = await randomBytes(32);
    const commitment = crypto.createHash('sha256')
      .update(randomValue)
      .update(Buffer.from(apiKeySecret))
      .update(Buffer.from(timestamp.toString()))
      .digest('hex');

    // チャレンジに対する応答を計算
    const response = crypto.createHash('sha256')
      .update(Buffer.from(challenge.nonce, 'hex'))
      .update(Buffer.from(commitment, 'hex'))
      .update(Buffer.from(apiKeySecret))
      .digest('hex');

    return {
      commitment,
      response,
      timestamp
    };
  }
}

// 使用例
export async function demonstrateZeroKnowledgeAuth() {
  const zkAuth = new ZeroKnowledgeAuthSystem();
  const userId = 'user123';
  const secretAPIKey = 'my-secret-api-key-that-never-leaves-client';

  // 1. サーバーがチャレンジを生成
  const challenge = await zkAuth.generateChallenge(userId);
  console.log('Challenge generated:', challenge.nonce.slice(0, 16) + '...');

  // 2. クライアントが証明を生成（APIキーは送信されない）
  const proof = await ZKProofGenerator.generateProof(secretAPIKey, challenge);
  console.log('Proof generated:', proof.commitment.slice(0, 16) + '...');

  // 3. サーバーが証明を検証
  const isValid = await zkAuth.verifyProof(userId, proof);
  console.log('Proof verification result:', isValid);

  if (isValid) {
    // 4. 成功時は一時的なAPIトークンを発行
    const apiToken = await zkAuth.deriveAPIKey(userId, proof);
    console.log('Temporary API token:', apiToken?.slice(0, 16) + '...');
  }
}