import request from 'supertest';
import app from '@/index';
import { supabase } from '@/config/supabase';

describe('Diagnosis API Routes', () => {
  let sessionId: string;
  let sessionToken: string;

  beforeAll(async () => {
    // テスト用のSupabaseクライアント設定
    process.env.NODE_ENV = 'test';
  });

  describe('POST /v1/diagnosis/start', () => {
    it('should start a new diagnosis session', async () => {
      const response = await request(app)
        .post('/v1/diagnosis/start')
        .send({
          initial_data: {
            company_name: 'テスト株式会社',
            industry: 'IT',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('session_id');
      expect(response.body).toHaveProperty('session_token');
      expect(response.body.current_step).toBe('basic_info');
      expect(response.body.progress).toBe(0);

      sessionId = response.body.session_id;
      sessionToken = response.body.session_token;
    });

    it('should start a session without initial data', async () => {
      const response = await request(app)
        .post('/v1/diagnosis/start')
        .send({});

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('session_id');
    });
  });

  describe('POST /v1/diagnosis/answer', () => {
    it('should save diagnosis answer', async () => {
      const response = await request(app)
        .post('/v1/diagnosis/answer')
        .send({
          session_id: sessionId,
          question_key: 'company_size',
          answer: '50-100',
          current_step: 'basic_info',
          progress: 25,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.progress).toBe(25);
    });

    it('should reject answer for non-existent session', async () => {
      const response = await request(app)
        .post('/v1/diagnosis/answer')
        .send({
          session_id: '00000000-0000-0000-0000-000000000000',
          question_key: 'test',
          answer: 'test',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Session not found');
    });

    it('should reject invalid request body', async () => {
      const response = await request(app)
        .post('/v1/diagnosis/answer')
        .send({
          question_key: 'test',
          answer: 'test',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /v1/diagnosis/session/:sessionId', () => {
    it('should retrieve session data', async () => {
      const response = await request(app)
        .get(`/v1/diagnosis/session/${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.session).toHaveProperty('id', sessionId);
      expect(response.body).toHaveProperty('answers');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/v1/diagnosis/session/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /v1/diagnosis/complete/:sessionId', () => {
    beforeEach(async () => {
      // セッションに必要な回答を追加
      await request(app)
        .post('/v1/diagnosis/answer')
        .send({
          session_id: sessionId,
          question_key: 'annual_revenue',
          answer: 100000000,
        });

      await request(app)
        .post('/v1/diagnosis/answer')
        .send({
          session_id: sessionId,
          question_key: 'employee_count',
          answer: 75,
        });
    });

    it('should complete diagnosis and return matched subsidies', async () => {
      const response = await request(app)
        .post(`/v1/diagnosis/complete/${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('completed');
      expect(response.body).toHaveProperty('matched_subsidies');
      expect(Array.isArray(response.body.matched_subsidies)).toBe(true);
      expect(response.body).toHaveProperty('recommendation_count');
    });

    it('should reject completion for already completed session', async () => {
      // 最初の完了リクエスト
      await request(app).post(`/v1/diagnosis/complete/${sessionId}`);

      // 2回目の完了リクエスト
      const response = await request(app)
        .post(`/v1/diagnosis/complete/${sessionId}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Session already completed');
    });
  });

  describe('POST /v1/diagnosis/match/:sessionId', () => {
    it('should re-run subsidy matching', async () => {
      const response = await request(app)
        .post(`/v1/diagnosis/match/${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('matched_subsidies');
      expect(Array.isArray(response.body.matched_subsidies)).toBe(true);
    });
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    if (sessionId) {
      await supabase
        .from('diagnosis_sessions')
        .delete()
        .eq('id', sessionId);
    }
  });
});