/**
 * 補助金API エンドポイントのテスト
 * RESTful API の完全な動作検証
 */

import request from 'supertest';
import { app } from '../../../src/app';
import { SubsidyService } from '../../../src/services/SubsidyService';
import { DatabaseService } from '../../../src/services/DatabaseService';

// モック設定
jest.mock('../../../src/services/SubsidyService');
jest.mock('../../../src/services/DatabaseService');
jest.mock('../../../src/middleware/auth');
jest.mock('../../../src/middleware/rateLimit');

// テストデータ
const mockSubsidies = [
  {
    id: '1',
    title: 'IT導入補助金2023',
    description: 'ITツール導入を支援する補助金',
    amount: 450000,
    rate: 0.5,
    deadline: '2023-12-31T23:59:59Z',
    category: 'IT導入',
    requirements: ['中小企業', 'IT投資'],
    eligibleSizes: ['小規模', '中小企業'],
    restrictedIndustries: [],
    maxEmployees: 300,
    maxCapital: 50000000,
    region: '全国',
    applicationUrl: 'https://example.com/apply',
    contactInfo: {
      phone: '03-1234-5678',
      email: 'info@example.com'
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'ものづくり補助金',
    description: '中小企業の設備投資を支援',
    amount: 1000000,
    rate: 0.66,
    deadline: '2023-11-30T23:59:59Z',
    category: '設備投資',
    requirements: ['中小企業', '製造業'],
    eligibleSizes: ['中小企業'],
    restrictedIndustries: ['金融業'],
    maxEmployees: 300,
    maxCapital: 30000000,
    region: '全国',
    applicationUrl: 'https://example.com/mono',
    contactInfo: {
      phone: '03-8765-4321',
      email: 'mono@example.com'
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

const mockUser = {
  id: '1',
  email: 'test@example.com',
  role: 'user'
};

const mockCompany = {
  id: '1',
  name: '株式会社テスト',
  size: '中小企業',
  industry: 'IT・情報通信業',
  employeeCount: 50,
  capital: 10000000,
  region: '東京都'
};

describe('Subsidy API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // デフォルトのモック設定
    SubsidyService.findAll.mockResolvedValue(mockSubsidies);
    SubsidyService.findById.mockResolvedValue(mockSubsidies[0]);
    SubsidyService.search.mockResolvedValue(mockSubsidies);
    DatabaseService.query.mockResolvedValue({ rows: mockSubsidies });
  });

  describe('GET /api/subsidies', () => {
    test('全補助金情報を取得できること', async () => {
      const response = await request(app)
        .get('/api/subsidies')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('id', '1');
      expect(response.body.data[0]).toHaveProperty('title', 'IT導入補助金2023');
      expect(SubsidyService.findAll).toHaveBeenCalledTimes(1);
    });

    test('ページネーションが正しく動作すること', async () => {
      const paginatedResult = {
        data: [mockSubsidies[0]],
        pagination: {
          page: 1,
          limit: 1,
          total: 2,
          totalPages: 2
        }
      };
      
      SubsidyService.findAll.mockResolvedValue(paginatedResult);

      const response = await request(app)
        .get('/api/subsidies?page=1&limit=1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(SubsidyService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 1
      });
    });

    test('ソート機能が正しく動作すること', async () => {
      const sortedResult = [...mockSubsidies].reverse();
      SubsidyService.findAll.mockResolvedValue(sortedResult);

      const response = await request(app)
        .get('/api/subsidies?sortBy=deadline&sortOrder=desc')
        .expect(200);

      expect(SubsidyService.findAll).toHaveBeenCalledWith({
        sortBy: 'deadline',
        sortOrder: 'desc'
      });
    });

    test('データベースエラー時に500エラーが返されること', async () => {
      SubsidyService.findAll.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/subsidies')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Internal server error');
    });
  });

  describe('GET /api/subsidies/:id', () => {
    test('指定IDの補助金情報を取得できること', async () => {
      const response = await request(app)
        .get('/api/subsidies/1')
        .expect(200);

      expect(response.body.data).toHaveProperty('id', '1');
      expect(response.body.data).toHaveProperty('title', 'IT導入補助金2023');
      expect(SubsidyService.findById).toHaveBeenCalledWith('1');
    });

    test('存在しないIDの場合404エラーが返されること', async () => {
      SubsidyService.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/subsidies/999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Subsidy not found');
    });

    test('不正なIDフォーマットの場合400エラーが返されること', async () => {
      const response = await request(app)
        .get('/api/subsidies/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid ID format');
    });
  });

  describe('POST /api/subsidies/search', () => {
    test('検索条件に基づいて補助金を検索できること', async () => {
      const searchCriteria = {
        companySize: '中小企業',
        industry: 'IT・情報通信業',
        investmentAmount: 500000
      };

      const response = await request(app)
        .post('/api/subsidies/search')
        .send(searchCriteria)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(SubsidyService.search).toHaveBeenCalledWith(searchCriteria);
    });

    test('詳細検索条件が正しく処理されること', async () => {
      const advancedCriteria = {
        companySize: '中小企業',
        industry: 'IT・情報通信業',
        investmentAmount: 500000,
        deadlineAfter: '2023-06-01',
        subsidyRateMin: 0.4,
        region: '東京都',
        category: 'IT導入'
      };

      const response = await request(app)
        .post('/api/subsidies/search')
        .send(advancedCriteria)
        .expect(200);

      expect(SubsidyService.search).toHaveBeenCalledWith(advancedCriteria);
    });

    test('必須項目が不足している場合400エラーが返されること', async () => {
      const incompleteCriteria = {
        industry: 'IT・情報通信業'
        // companySize が不足
      };

      const response = await request(app)
        .post('/api/subsidies/search')
        .send(incompleteCriteria)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Company size is required');
    });

    test('不正な投資額でバリデーションエラーが返されること', async () => {
      const invalidCriteria = {
        companySize: '中小企業',
        industry: 'IT・情報通信業',
        investmentAmount: -100000
      };

      const response = await request(app)
        .post('/api/subsidies/search')
        .send(invalidCriteria)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Investment amount must be positive');
    });

    test('空の検索結果が正しく返されること', async () => {
      SubsidyService.search.mockResolvedValue([]);

      const searchCriteria = {
        companySize: '大企業',
        industry: '金融業',
        investmentAmount: 100000000
      };

      const response = await request(app)
        .post('/api/subsidies/search')
        .send(searchCriteria)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body).toHaveProperty('message', 'No subsidies found matching the criteria');
    });
  });

  describe('POST /api/subsidies/:id/calculate', () => {
    test('補助金額計算が正しく実行されること', async () => {
      const calculationResult = {
        eligibleAmount: 400000,
        rate: 0.4,
        breakdown: {
          baseAmount: 250000,
          sizeMultiplier: 0.8,
          industryMultiplier: 1.2,
          finalAmount: 400000
        }
      };

      SubsidyService.calculateEligibleAmount.mockResolvedValue(calculationResult);

      const response = await request(app)
        .post('/api/subsidies/1/calculate')
        .send({
          company: mockCompany,
          investment: { amount: 1000000, purpose: 'DX推進' }
        })
        .expect(200);

      expect(response.body.data).toEqual(calculationResult);
      expect(SubsidyService.calculateEligibleAmount).toHaveBeenCalledWith(
        mockSubsidies[0],
        mockCompany,
        { amount: 1000000, purpose: 'DX推進' }
      );
    });

    test('計算に必要な情報が不足している場合400エラーが返されること', async () => {
      const response = await request(app)
        .post('/api/subsidies/1/calculate')
        .send({
          company: mockCompany
          // investment が不足
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Investment information is required');
    });

    test('適格性チェックで不適格の場合422エラーが返されること', async () => {
      const eligibilityError = new Error('Company is not eligible for this subsidy');
      eligibilityError.code = 'ELIGIBILITY_FAILED';
      
      SubsidyService.calculateEligibleAmount.mockRejectedValue(eligibilityError);

      const response = await request(app)
        .post('/api/subsidies/1/calculate')
        .send({
          company: { ...mockCompany, size: '大企業' },
          investment: { amount: 1000000, purpose: 'DX推進' }
        })
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not eligible');
    });
  });

  describe('POST /api/subsidies/:id/favorite', () => {
    test('お気に入りに追加できること', async () => {
      // 認証モックの設定
      const authMiddleware = require('../../../src/middleware/auth');
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });

      SubsidyService.addToFavorites.mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/api/subsidies/1/favorite')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(SubsidyService.addToFavorites).toHaveBeenCalledWith(mockUser.id, '1');
    });

    test('未認証の場合401エラーが返されること', async () => {
      const authMiddleware = require('../../../src/middleware/auth');
      authMiddleware.mockImplementation((req, res, next) => {
        res.status(401).json({ error: 'Authentication required' });
      });

      const response = await request(app)
        .post('/api/subsidies/1/favorite')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/subsidies/:id/favorite', () => {
    test('お気に入りから削除できること', async () => {
      const authMiddleware = require('../../../src/middleware/auth');
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });

      SubsidyService.removeFromFavorites.mockResolvedValue({ success: true });

      const response = await request(app)
        .delete('/api/subsidies/1/favorite')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(SubsidyService.removeFromFavorites).toHaveBeenCalledWith(mockUser.id, '1');
    });
  });

  describe('GET /api/subsidies/categories', () => {
    test('カテゴリ一覧を取得できること', async () => {
      const categories = [
        { id: 'it', name: 'IT導入', count: 15 },
        { id: 'equipment', name: '設備投資', count: 8 },
        { id: 'research', name: '研究開発', count: 5 }
      ];

      SubsidyService.getCategories.mockResolvedValue(categories);

      const response = await request(app)
        .get('/api/subsidies/categories')
        .expect(200);

      expect(response.body.data).toEqual(categories);
    });
  });

  describe('GET /api/subsidies/statistics', () => {
    test('統計情報を取得できること', async () => {
      const statistics = {
        totalSubsidies: 28,
        averageAmount: 750000,
        averageRate: 0.58,
        categoriesCount: {
          'IT導入': 15,
          '設備投資': 8,
          '研究開発': 5
        },
        recentlyAdded: 3,
        expiringThisMonth: 2
      };

      SubsidyService.getStatistics.mockResolvedValue(statistics);

      const response = await request(app)
        .get('/api/subsidies/statistics')
        .expect(200);

      expect(response.body.data).toEqual(statistics);
    });
  });

  describe('レート制限', () => {
    test('レート制限が正常に機能すること', async () => {
      const rateLimitMiddleware = require('../../../src/middleware/rateLimit');
      let callCount = 0;
      
      rateLimitMiddleware.mockImplementation((req, res, next) => {
        callCount++;
        if (callCount > 100) {
          return res.status(429).json({ error: 'Too many requests' });
        }
        next();
      });

      // 100回のリクエストは成功
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/subsidies')
          .expect(200);
      }

      // 101回目はレート制限に引っかかる
      const response = await request(app)
        .get('/api/subsidies')
        .expect(429);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Too many requests');
    });
  });

  describe('セキュリティ', () => {
    test('SQLインジェクション攻撃が防止されること', async () => {
      const maliciousId = "1'; DROP TABLE subsidies; --";

      const response = await request(app)
        .get(`/api/subsidies/${encodeURIComponent(maliciousId)}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(SubsidyService.findById).not.toHaveBeenCalled();
    });

    test('XSS攻撃が防止されること', async () => {
      const maliciousSearch = {
        companySize: '<script>alert("XSS")</script>',
        industry: 'IT・情報通信業',
        investmentAmount: 500000
      };

      const response = await request(app)
        .post('/api/subsidies/search')
        .send(maliciousSearch)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(SubsidyService.search).not.toHaveBeenCalled();
    });

    test('CSRFトークンが検証されること', async () => {
      const response = await request(app)
        .post('/api/subsidies/search')
        .send({
          companySize: '中小企業',
          industry: 'IT・情報通信業',
          investmentAmount: 500000
        })
        .expect(403); // CSRF token missing

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('CSRF token');
    });
  });

  describe('パフォーマンス', () => {
    test('大量データの検索が適切にハンドリングされること', async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        ...mockSubsidies[0],
        id: `${i + 1}`,
        title: `補助金 ${i + 1}`
      }));

      SubsidyService.findAll.mockResolvedValue(largeDataset);

      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/subsidies')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.data).toHaveLength(10000);
      expect(responseTime).toBeLessThan(1000); // 1秒以内に応答
    });

    test('同時リクエストが適切に処理されること', async () => {
      const promises = Array.from({ length: 50 }, () =>
        request(app).get('/api/subsidies')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
      });
    });
  });
});