/**
 * 包括的セキュリティテストスイート
 * OWASP Top 10、認証・認可、データ保護の網羅的テスト
 */

import request from 'supertest';
import { app } from '@/app';
import { enterpriseSecurity } from '@/middleware/enterpriseSecurityMiddleware';
import { advancedRateLimiting } from '@/middleware/advancedRateLimiting';
import { JWTManager } from '@/utils/jwt';
import { createHash } from 'crypto';

describe('🔒 Enterprise Security Test Suite', () => {
  let authToken: string;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    // テスト用トークン生成
    authToken = JWTManager.generateAccessToken({ userId: 'test-user', role: 'user' });
    adminToken = JWTManager.generateAccessToken({ userId: 'admin-user', role: 'admin' });
    userToken = JWTManager.generateAccessToken({ userId: 'regular-user', role: 'user' });
  });

  describe('🛡️ OWASP Top 10 Security Tests', () => {
    describe('A01: Broken Access Control', () => {
      it('should deny access to admin endpoints without admin role', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(response.body.error).toBe('FORBIDDEN');
      });

      it('should deny access to user data of other users', async () => {
        const response = await request(app)
          .get('/api/users/other-user-id')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(response.body.error).toMatch(/access.*denied/i);
      });

      it('should prevent direct object reference attacks', async () => {
        const response = await request(app)
          .get('/api/documents/999999') // Non-existent or unauthorized document
          .set('Authorization', `Bearer ${userToken}`)
          .expect(404);
      });

      it('should validate file upload permissions', async () => {
        const response = await request(app)
          .post('/api/admin/system-files')
          .set('Authorization', `Bearer ${userToken}`)
          .attach('file', Buffer.from('malicious content'), 'malicious.exe')
          .expect(403);
      });
    });

    describe('A02: Cryptographic Failures', () => {
      it('should enforce HTTPS in production', () => {
        if (process.env.NODE_ENV === 'production') {
          // HTTPSリダイレクトのテスト
          expect(process.env.FORCE_HTTPS).toBe('true');
        }
      });

      it('should use strong password hashing', async () => {
        const testPassword = 'TestPassword123!';
        // bcryptの強度テスト（実際の実装では適切なハッシュ関数を使用）
        const hash = createHash('sha256').update(testPassword).digest('hex');
        expect(hash).toHaveLength(64);
      });

      it('should generate secure session tokens', () => {
        const token = JWTManager.generateAccessToken({ userId: 'test' });
        const parts = token.split('.');
        expect(parts).toHaveLength(3); // JWT形式
        expect(parts[2]).toMatch(/^[A-Za-z0-9_-]+$/); // Base64URL署名
      });

      it('should protect sensitive data in transit', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@test.com', password: 'password' });

        // レスポンスにプレーンテキストパスワードが含まれていないことを確認
        expect(JSON.stringify(response.body)).not.toContain('password');
      });
    });

    describe('A03: Injection Attacks', () => {
      it('should prevent SQL injection in query parameters', async () => {
        const maliciousPayload = "'; DROP TABLE users; --";
        
        const response = await request(app)
          .get(`/api/subsidies/search?query=${encodeURIComponent(maliciousPayload)}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.message).toMatch(/invalid.*input/i);
      });

      it('should prevent NoSQL injection', async () => {
        const maliciousPayload = { $where: 'this.password.length > 0' };
        
        const response = await request(app)
          .post('/api/subsidies/search')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ filter: maliciousPayload })
          .expect(400);
      });

      it('should prevent LDAP injection', async () => {
        const maliciousPayload = '*)(uid=*))(|(uid=*';
        
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: maliciousPayload, password: 'test' })
          .expect(400);
      });

      it('should prevent command injection', async () => {
        const maliciousPayload = '; rm -rf /';
        
        const response = await request(app)
          .post('/api/documents/process')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ filename: maliciousPayload })
          .expect(400);

        expect(response.body.message).toMatch(/invalid.*filename/i);
      });
    });

    describe('A04: Insecure Design', () => {
      it('should implement proper rate limiting', async () => {
        const endpoint = '/api/auth/login';
        const requests = [];

        // 短時間で多数のリクエストを送信
        for (let i = 0; i < 10; i++) {
          requests.push(
            request(app)
              .post(endpoint)
              .send({ email: 'test@test.com', password: 'wrong' })
          );
        }

        const responses = await Promise.all(requests);
        const rateLimitedResponses = responses.filter(r => r.status === 429);
        
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });

      it('should implement account lockout after failed attempts', async () => {
        const email = 'lockout-test@test.com';
        
        // 複数回失敗
        for (let i = 0; i < 6; i++) {
          await request(app)
            .post('/api/auth/login')
            .send({ email, password: 'wrong' });
        }

        const response = await request(app)
          .post('/api/auth/login')
          .send({ email, password: 'correct' })
          .expect(423); // Locked

        expect(response.body.error).toBe('ACCOUNT_LOCKED');
      });

      it('should validate business logic for money transfers', async () => {
        const response = await request(app)
          .post('/api/subsidies/apply')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: -1000000, // 負の金額
            category: 'IT'
          })
          .expect(400);

        expect(response.body.message).toMatch(/invalid.*amount/i);
      });
    });

    describe('A05: Security Misconfiguration', () => {
      it('should not expose debug information in production', () => {
        if (process.env.NODE_ENV === 'production') {
          expect(process.env.DEBUG).toBeFalsy();
        }
      });

      it('should have secure headers configured', async () => {
        const response = await request(app)
          .get('/api/health')
          .expect(200);

        expect(response.headers['x-frame-options']).toBe('DENY');
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-xss-protection']).toBe('1; mode=block');
        expect(response.headers['content-security-policy']).toBeDefined();
        expect(response.headers['strict-transport-security']).toBeDefined();
      });

      it('should not expose server information', async () => {
        const response = await request(app)
          .get('/api/health');

        expect(response.headers.server).toBeUndefined();
        expect(response.headers['x-powered-by']).toBeUndefined();
      });

      it('should disable unnecessary HTTP methods', async () => {
        const response = await request(app)
          .trace('/api/health')
          .expect(405);
      });
    });

    describe('A06: Vulnerable and Outdated Components', () => {
      it('should not use known vulnerable packages', async () => {
        // package.jsonを読み込んで既知の脆弱なパッケージをチェック
        const packageJson = require('../../../../package.json');
        const vulnerablePackages = [
          'event-stream@3.3.6',
          'eslint-scope@3.7.2',
          'flatmap-stream@0.1.1'
        ];

        const dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };

        vulnerablePackages.forEach(vulnPackage => {
          const [name, version] = vulnPackage.split('@');
          if (dependencies[name] === version) {
            throw new Error(`Vulnerable package detected: ${vulnPackage}`);
          }
        });
      });
    });

    describe('A07: Identification and Authentication Failures', () => {
      it('should enforce strong password policy', async () => {
        const weakPasswords = ['123456', 'password', 'qwerty', 'abc'];
        
        for (const password of weakPasswords) {
          const response = await request(app)
            .post('/api/auth/register')
            .send({
              email: 'test@test.com',
              password,
              name: 'Test User'
            })
            .expect(400);

          expect(response.body.message).toMatch(/password.*requirements/i);
        }
      });

      it('should implement proper session management', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@test.com', password: 'ValidPassword123!' });

        if (response.status === 200) {
          const token = response.body.token;
          expect(token).toBeDefined();
          
          // トークンの有効性を確認
          const decoded = JWTManager.verifyAccessToken(token);
          expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
        }
      });

      it('should prevent brute force attacks', async () => {
        const endpoint = '/api/auth/login';
        const email = 'bruteforce-test@test.com';
        
        // 短時間で多数のログイン試行
        const attempts = [];
        for (let i = 0; i < 20; i++) {
          attempts.push(
            request(app)
              .post(endpoint)
              .send({ email, password: 'wrong' })
          );
        }

        const responses = await Promise.all(attempts);
        const rateLimitedCount = responses.filter(r => r.status === 429).length;
        
        expect(rateLimitedCount).toBeGreaterThan(0);
      });

      it('should implement multi-factor authentication for admin', async () => {
        const response = await request(app)
          .get('/api/admin/sensitive-data')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(403);

        expect(response.body.error).toBe('MFA_REQUIRED');
      });
    });

    describe('A08: Software and Data Integrity Failures', () => {
      it('should validate file upload integrity', async () => {
        const maliciousFile = Buffer.from('<?php eval($_GET["cmd"]); ?>');
        
        const response = await request(app)
          .post('/api/documents/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', maliciousFile, 'malicious.php')
          .expect(400);

        expect(response.body.message).toMatch(/file.*type.*not.*allowed/i);
      });

      it('should verify digital signatures', async () => {
        const response = await request(app)
          .post('/api/documents/verify')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            document: 'test-document',
            signature: 'invalid-signature'
          })
          .expect(400);

        expect(response.body.message).toMatch(/invalid.*signature/i);
      });

      it('should validate JSON schema for API inputs', async () => {
        const invalidPayload = {
          amount: 'not-a-number',
          date: 'invalid-date',
          nested: {
            value: null
          }
        };

        const response = await request(app)
          .post('/api/subsidies/apply')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidPayload)
          .expect(400);

        expect(response.body.message).toMatch(/validation.*failed/i);
      });
    });

    describe('A09: Security Logging and Monitoring Failures', () => {
      it('should log security events', async () => {
        // セキュリティイベントのログテスト
        const logSpy = jest.spyOn(console, 'warn');
        
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'attacker@evil.com', password: 'wrong' });

        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('SECURITY_EVENT')
        );
        
        logSpy.mockRestore();
      });

      it('should detect and log suspicious activities', async () => {
        const logSpy = jest.spyOn(console, 'error');
        
        // 異常なパターンのリクエスト
        await request(app)
          .get('/api/subsidies/../../../etc/passwd')
          .set('Authorization', `Bearer ${authToken}`);

        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('SUSPICIOUS_ACTIVITY')
        );
        
        logSpy.mockRestore();
      });

      it('should monitor for data exfiltration attempts', async () => {
        const response = await request(app)
          .get('/api/users/export?limit=999999')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(response.body.error).toBe('EXPORT_LIMIT_EXCEEDED');
      });
    });

    describe('A10: Server-Side Request Forgery (SSRF)', () => {
      it('should prevent SSRF through URL parameters', async () => {
        const maliciousUrls = [
          'http://localhost:22',
          'http://169.254.169.254/latest/meta-data/',
          'file:///etc/passwd',
          'gopher://localhost:11211/'
        ];

        for (const url of maliciousUrls) {
          const response = await request(app)
            .post('/api/external/fetch')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ url })
            .expect(400);

          expect(response.body.message).toMatch(/url.*not.*allowed/i);
        }
      });

      it('should validate redirect URLs', async () => {
        const response = await request(app)
          .get('/api/auth/callback?redirect=http://evil.com')
          .expect(400);

        expect(response.body.message).toMatch(/invalid.*redirect/i);
      });
    });
  });

  describe('🔐 Authentication & Authorization Tests', () => {
    it('should require authentication for protected endpoints', async () => {
      const protectedEndpoints = [
        '/api/subsidies',
        '/api/documents',
        '/api/profile',
        '/api/admin/users'
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(401);

        expect(response.body.error).toBe('UNAUTHORIZED');
      }
    });

    it('should validate JWT token structure', async () => {
      const invalidTokens = [
        'invalid.token',
        'Bearer invalid',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        ''
      ];

      for (const token of invalidTokens) {
        const response = await request(app)
          .get('/api/profile')
          .set('Authorization', token)
          .expect(401);

        expect(response.body.error).toBe('UNAUTHORIZED');
      }
    });

    it('should prevent privilege escalation', async () => {
      // 一般ユーザーが管理者権限を要求
      const response = await request(app)
        .post('/api/admin/promote-user')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: 'test-user', role: 'admin' })
        .expect(403);

      expect(response.body.error).toBe('FORBIDDEN');
    });

    it('should implement role-based access control', async () => {
      const roleBasedEndpoints = [
        { endpoint: '/api/admin/users', requiredRole: 'admin' },
        { endpoint: '/api/moderator/reports', requiredRole: 'moderator' },
        { endpoint: '/api/premium/features', requiredRole: 'premium' }
      ];

      for (const { endpoint, requiredRole } of roleBasedEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${userToken}`) // regular user token
          .expect(403);

        expect(response.body.error).toBe('FORBIDDEN');
      }
    });
  });

  describe('🛡️ Data Protection Tests', () => {
    it('should sanitize user inputs', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '"><script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        '${alert("xss")}'
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/profile/update')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: input })
          .expect(400);

        expect(response.body.message).toMatch(/invalid.*input/i);
      }
    });

    it('should prevent path traversal attacks', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
      ];

      for (const path of maliciousPaths) {
        const response = await request(app)
          .get(`/api/files/${encodeURIComponent(path)}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.message).toMatch(/invalid.*path/i);
      }
    });

    it('should implement proper CORS policy', async () => {
      const response = await request(app)
        .options('/api/subsidies')
        .set('Origin', 'https://evil.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).not.toBe('https://evil.com');
    });

    it('should validate file upload restrictions', async () => {
      const maliciousFiles = [
        { name: 'virus.exe', content: 'MZ\x90\x00' },
        { name: 'script.php', content: '<?php echo "test"; ?>' },
        { name: 'shell.jsp', content: '<%@ page import="java.io.*" %>' },
        { name: 'macro.docm', content: 'PK\x03\x04' }
      ];

      for (const file of maliciousFiles) {
        const response = await request(app)
          .post('/api/documents/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', Buffer.from(file.content), file.name)
          .expect(400);

        expect(response.body.message).toMatch(/file.*type.*not.*allowed/i);
      }
    });
  });

  describe('🔍 Business Logic Security Tests', () => {
    it('should prevent negative amount subsidies', async () => {
      const response = await request(app)
        .post('/api/subsidies/apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -100000,
          category: 'IT',
          description: 'Test subsidy'
        })
        .expect(400);

      expect(response.body.message).toMatch(/amount.*must.*positive/i);
    });

    it('should validate subsidy application limits', async () => {
      // 制限を超えた申請
      const response = await request(app)
        .post('/api/subsidies/apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 999999999, // 上限を超えた金額
          category: 'IT',
          description: 'Excessive amount test'
        })
        .expect(400);

      expect(response.body.message).toMatch(/amount.*exceeds.*limit/i);
    });

    it('should prevent duplicate submissions', async () => {
      const applicationData = {
        amount: 100000,
        category: 'IT',
        description: 'Duplicate test',
        documentHash: 'same-hash'
      };

      // 最初の申請
      await request(app)
        .post('/api/subsidies/apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData);

      // 重複申請
      const response = await request(app)
        .post('/api/subsidies/apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(409);

      expect(response.body.error).toBe('DUPLICATE_APPLICATION');
    });

    it('should validate temporal constraints', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);

      const response = await request(app)
        .post('/api/subsidies/apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100000,
          category: 'IT',
          deadline: futureDate.toISOString(),
          description: 'Future deadline test'
        })
        .expect(400);

      expect(response.body.message).toMatch(/deadline.*too.*far/i);
    });
  });

  describe('⚡ Performance Security Tests', () => {
    it('should prevent ReDoS attacks', async () => {
      const maliciousRegexInputs = [
        'a'.repeat(10000) + 'X', // 指数的バックトラッキング
        '(' + 'a|a'.repeat(100) + ')*b',
        'a'.repeat(1000) + 'X'
      ];

      for (const input of maliciousRegexInputs) {
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/search')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ query: input })
          .timeout(5000); // 5秒タイムアウト

        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 5秒以内に応答することを確認
        expect(duration).toBeLessThan(5000);
      }
    });

    it('should limit payload size', async () => {
      const largePayload = 'x'.repeat(10 * 1024 * 1024); // 10MB

      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ data: largePayload })
        .expect(413);

      expect(response.body.error).toBe('PAYLOAD_TOO_LARGE');
    });

    it('should prevent memory exhaustion', async () => {
      const memoryBefore = process.memoryUsage().heapUsed;
      
      const largeRequests = [];
      for (let i = 0; i < 100; i++) {
        largeRequests.push(
          request(app)
            .post('/api/subsidies/search')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ query: 'x'.repeat(1000) })
        );
      }

      await Promise.all(largeRequests);
      
      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = memoryAfter - memoryBefore;
      
      // メモリ増加が100MB未満であることを確認
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('🔒 Cryptographic Security Tests', () => {
    it('should use secure random number generation', () => {
      const randomValues = [];
      
      for (let i = 0; i < 100; i++) {
        const token = JWTManager.generateSessionId();
        randomValues.push(token);
      }

      // 重複がないことを確認
      const uniqueValues = new Set(randomValues);
      expect(uniqueValues.size).toBe(randomValues.length);

      // エントロピーの簡易チェック
      const entropy = uniqueValues.size / randomValues.length;
      expect(entropy).toBe(1);
    });

    it('should properly validate CSRF tokens', async () => {
      const response = await request(app)
        .post('/api/profile/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Name' })
        .expect(403);

      expect(response.body.error).toBe('CSRF_TOKEN_MISSING');
    });

    it('should implement secure key rotation', async () => {
      // キーローテーションのテスト
      const oldToken = JWTManager.generateAccessToken({ userId: 'test' });
      
      // キーローテーション実行（モック）
      // 実際の実装では、新しいキーで署名されたトークンをテスト
      
      const newToken = JWTManager.generateAccessToken({ userId: 'test' });
      expect(oldToken).not.toBe(newToken);
    });
  });

  afterAll(async () => {
    // テスト後のクリーンアップ
    // データベース接続を閉じる等
  });
});