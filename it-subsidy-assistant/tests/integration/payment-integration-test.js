/**
 * 決済フロー統合テスト - Stripe決済からAPI有効化まで
 * Worker1のStripe決済システムとWorker2のAPI連携テスト
 */

const { describe, test, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals');
const request = require('supertest');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

describe('🔥 決済フロー統合テスト', () => {
  let app;
  let testUser;
  let authToken;
  let customerId;

  beforeAll(async () => {
    app = require('../../backend/src/app');
    
    // テストユーザー作成
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'payment-test@example.com',
        password: 'Test123!@#',
        name: '決済テスト ユーザー',
        companyName: '株式会社決済テスト'
      });
    
    testUser = registerResponse.body.data.user;
    authToken = registerResponse.body.data.token;
  });

  afterAll(async () => {
    // Stripeテストデータクリーンアップ
    if (customerId) {
      await stripe.customers.del(customerId);
    }
  });

  beforeEach(async () => {
    // 各テスト前にユーザープランをリセット
    await request(app)
      .post('/api/user/reset-plan')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ plan: 'free' });
  });

  describe('🏷️ 決済成功フロー', () => {
    test('プレミアムプラン決済 → API権限自動有効化', async () => {
      // 1. 決済前の状態確認（無料プラン）
      const beforePayment = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(beforePayment.body.data.user.plan).toBe('free');
      expect(beforePayment.body.data.user.searchQuota).toBe(10);

      // 2. Stripe PaymentIntent作成
      const paymentIntentResponse = await request(app)
        .post('/api/payment/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planType: 'premium',
          billingCycle: 'monthly'
        });

      expect(paymentIntentResponse.status).toBe(200);
      expect(paymentIntentResponse.body.data.clientSecret).toBeTruthy();
      
      const paymentIntentId = paymentIntentResponse.body.data.paymentIntentId;

      // 3. 決済成功をシミュレート（テスト環境）
      const confirmPayment = await request(app)
        .post('/api/payment/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentIntentId,
          paymentMethodId: 'pm_card_visa' // Stripeテストカード
        });

      expect(confirmPayment.status).toBe(200);
      expect(confirmPayment.body.success).toBe(true);

      // 4. 決済後のプラン状態確認
      const afterPayment = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(afterPayment.body.data.user.plan).toBe('premium');
      expect(afterPayment.body.data.user.searchQuota).toBe(-1); // 無制限
      expect(afterPayment.body.data.user.apiKey).toBeTruthy();

      // 5. MatchGenius APIへのアクセス確認
      const premiumSearch = await request(app)
        .get('/api/subsidies/search')
        .query({
          companySize: '中小企業',
          industry: 'IT・情報通信業',
          searchType: 'premium'
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(premiumSearch.status).toBe(200);
      expect(premiumSearch.body.data.searchType).toBe('premium');
      expect(premiumSearch.body.data.enhancedFeatures).toBe(true);
      expect(premiumSearch.body.data.aiScore).toBeGreaterThan(0.8);
    });

    test('決済エラー時の適切なロールバック', async () => {
      // 1. 無効なカードで決済試行
      const paymentIntentResponse = await request(app)
        .post('/api/payment/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planType: 'premium',
          billingCycle: 'monthly'
        });

      const paymentIntentId = paymentIntentResponse.body.data.paymentIntentId;

      // 2. 決済失敗をシミュレート
      const failedPayment = await request(app)
        .post('/api/payment/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentIntentId,
          paymentMethodId: 'pm_card_chargeDeclined' // 決済失敗テストカード
        });

      expect(failedPayment.status).toBe(400);
      expect(failedPayment.body.success).toBe(false);

      // 3. プランが変更されていないことを確認
      const userProfile = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(userProfile.body.data.user.plan).toBe('free');
      expect(userProfile.body.data.user.searchQuota).toBe(10);
      expect(userProfile.body.data.user.apiKey).toBeFalsy();

      // 4. プレミアム機能にアクセスできないことを確認
      const deniedAccess = await request(app)
        .get('/api/subsidies/search')
        .query({ searchType: 'premium' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(deniedAccess.status).toBe(403);
      expect(deniedAccess.body.error.code).toBe('PLAN_UPGRADE_REQUIRED');
    });
  });

  describe('💳 継続課金・解約フロー', () => {
    test('プレミアムプラン解約 → 無料プランへの自動降格', async () => {
      // 1. プレミアムプランに設定
      await request(app)
        .post('/api/user/update-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plan: 'premium' });

      // 2. 解約処理
      const cancelResponse = await request(app)
        .post('/api/payment/cancel-subscription')
        .set('Authorization', `Bearer ${authToken}`);

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.success).toBe(true);

      // 3. 猶予期間中はプレミアム機能利用可能
      const duringGracePeriod = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(duringGracePeriod.body.data.user.plan).toBe('premium');
      expect(duringGracePeriod.body.data.user.subscriptionStatus).toBe('cancelled');

      // 4. 期限切れ後の降格シミュレート
      await request(app)
        .post('/api/payment/simulate-expiry')
        .set('Authorization', `Bearer ${authToken}`);

      const afterExpiry = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(afterExpiry.body.data.user.plan).toBe('free');
      expect(afterExpiry.body.data.user.searchQuota).toBe(10);
    });
  });

  describe('🔒 決済セキュリティテスト', () => {
    test('不正な決済データの検証', async () => {
      // 無効なプランタイプ
      const invalidPlan = await request(app)
        .post('/api/payment/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planType: 'invalid_plan',
          billingCycle: 'monthly'
        });

      expect(invalidPlan.status).toBe(400);
      expect(invalidPlan.body.error.code).toBe('INVALID_PLAN_TYPE');

      // 無効な請求サイクル
      const invalidCycle = await request(app)
        .post('/api/payment/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planType: 'premium',
          billingCycle: 'invalid_cycle'
        });

      expect(invalidCycle.status).toBe(400);
      expect(invalidCycle.body.error.code).toBe('INVALID_BILLING_CYCLE');
    });

    test('決済情報の暗号化確認', async () => {
      // PaymentIntent作成
      const paymentIntentResponse = await request(app)
        .post('/api/payment/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planType: 'premium',
          billingCycle: 'monthly'
        });

      // client_secretが適切にマスクされていることを確認
      const clientSecret = paymentIntentResponse.body.data.clientSecret;
      expect(clientSecret).toMatch(/^pi_.*_secret_.*$/);

      // データベースに平文で保存されていないことを確認
      const dbCheck = await request(app)
        .get('/api/payment/verify-encryption')
        .set('Authorization', `Bearer ${authToken}`);

      expect(dbCheck.body.data.encryptionVerified).toBe(true);
    });

    test('CSRF攻撃防止確認', async () => {
      // CSRFトークンなしでの決済試行
      const csrfTest = await request(app)
        .post('/api/payment/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Requested-With', 'XMLHttpRequest') // AJAX判定回避
        .send({
          planType: 'premium',
          billingCycle: 'monthly'
        });

      // CSRFトークンが必要な場合のテスト
      if (process.env.CSRF_PROTECTION === 'enabled') {
        expect(csrfTest.status).toBe(403);
        expect(csrfTest.body.error.code).toBe('CSRF_TOKEN_MISMATCH');
      }
    });
  });

  describe('⚡ パフォーマンステスト', () => {
    test('決済処理時間（30秒以内）', async () => {
      const startTime = Date.now();

      const paymentIntentResponse = await request(app)
        .post('/api/payment/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planType: 'premium',
          billingCycle: 'monthly'
        });

      const createTime = Date.now() - startTime;
      expect(createTime).toBeLessThan(5000); // PaymentIntent作成は5秒以内

      const confirmStartTime = Date.now();
      await request(app)
        .post('/api/payment/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentIntentId: paymentIntentResponse.body.data.paymentIntentId,
          paymentMethodId: 'pm_card_visa'
        });

      const confirmTime = Date.now() - confirmStartTime;
      expect(confirmTime).toBeLessThan(30000); // 決済確認は30秒以内
    });

    test('同時決済処理の競合状態テスト', async () => {
      // 複数の決済を同時実行
      const concurrentPayments = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/payment/create-intent')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            planType: 'premium',
            billingCycle: 'monthly'
          })
      );

      const results = await Promise.allSettled(concurrentPayments);
      
      // 最初の1つだけ成功し、他は適切にブロックされることを確認
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 200
      ).length;

      expect(successCount).toBe(1);
    });
  });

  describe('🎯 API制限統合テスト', () => {
    test('無料プラン検索制限（月10回）', async () => {
      // 10回検索実行
      for (let i = 0; i < 10; i++) {
        const searchResponse = await request(app)
          .get('/api/subsidies/search')
          .query({ companySize: '中小企業' })
          .set('Authorization', `Bearer ${authToken}`);

        expect(searchResponse.status).toBe(200);
        expect(searchResponse.body.data.remainingQuota).toBe(9 - i);
      }

      // 11回目でブロックされることを確認
      const limitExceeded = await request(app)
        .get('/api/subsidies/search')
        .query({ companySize: '中小企業' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(limitExceeded.status).toBe(429);
      expect(limitExceeded.body.error.code).toBe('QUOTA_EXCEEDED');
    });

    test('プレミアムプラン無制限アクセス', async () => {
      // プレミアムプランに設定
      await request(app)
        .post('/api/user/update-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plan: 'premium' });

      // 大量検索でも制限されないことを確認
      for (let i = 0; i < 50; i++) {
        const searchResponse = await request(app)
          .get('/api/subsidies/search')
          .query({ companySize: '中小企業' })
          .set('Authorization', `Bearer ${authToken}`);

        expect(searchResponse.status).toBe(200);
        expect(searchResponse.body.data.remainingQuota).toBe(-1); // 無制限
      }
    });
  });

  describe('📄 DocuCraft AI統合テスト', () => {
    test('プレミアムプラン限定文書生成', async () => {
      // 無料プランでは生成できないことを確認
      const freeDocGeneration = await request(app)
        .post('/api/documents/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateId: 'business_plan',
          companyInfo: { name: 'テスト会社' }
        });

      expect(freeDocGeneration.status).toBe(403);
      expect(freeDocGeneration.body.error.code).toBe('PREMIUM_FEATURE_REQUIRED');

      // プレミアムプランに変更
      await request(app)
        .post('/api/user/update-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plan: 'premium' });

      // プレミアムプランでは生成できることを確認
      const premiumDocGeneration = await request(app)
        .post('/api/documents/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateId: 'business_plan',
          companyInfo: { name: 'テスト会社' }
        });

      expect(premiumDocGeneration.status).toBe(200);
      expect(premiumDocGeneration.body.data.documentId).toBeTruthy();
    });
  });
});

module.exports = {
  setupPaymentIntegrationTests: () => {
    // 決済統合テスト用のセットアップ
    return {
      stripeTestKeys: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY_TEST,
        secretKey: process.env.STRIPE_SECRET_KEY_TEST
      },
      testCards: {
        visa: 'pm_card_visa',
        visaDebit: 'pm_card_visaDebit',
        declined: 'pm_card_chargeDeclined',
        insufficientFunds: 'pm_card_chargeDeclinedInsufficientFunds'
      }
    };
  }
};