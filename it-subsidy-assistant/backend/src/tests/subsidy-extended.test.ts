import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { app } from '@/index';
import { SubsidyModel } from '@/models/Subsidy';
import { QuestionFlowManager } from '@/services/QuestionFlowManager';
import { DeadlineScheduler } from '@/services/DeadlineScheduler';
import { supabaseService } from '@/config/database';
import { generateTestToken } from '@/tests/utils';

// モックの設定
jest.mock('@/models/Subsidy');
jest.mock('@/services/QuestionFlowManager');
jest.mock('@/services/DeadlineScheduler');
jest.mock('@/config/database');

describe('Extended Subsidy API Tests', () => {
  let authToken: string;
  let adminToken: string;

  beforeEach(() => {
    // テストユーザーのトークンを生成
    authToken = generateTestToken({ id: 'test-user-id', role: 'user' });
    adminToken = generateTestToken({ id: 'admin-user-id', role: 'admin' });
    
    // モックをリセット
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/subsidies', () => {
    it('should return filtered subsidies by type and status', async () => {
      const mockSubsidies = [
        {
          id: 'subsidy-1',
          name: 'IT導入補助金2025',
          subsidy_type: 'it-donyu',
          status: 'active'
        },
        {
          id: 'subsidy-2',
          name: '持続化補助金',
          subsidy_type: 'jizokuka',
          status: 'upcoming'
        }
      ];

      (supabaseService.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        match: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockSubsidies,
          error: null
        })
      });

      const response = await request(app)
        .get('/api/subsidies')
        .query({ subsidy_type: 'it-donyu', status: 'active' });

      expect(response.status).toBe(200);
      expect(response.body.subsidies).toHaveLength(2);
      expect(response.body.subsidies[0].subsidy_type).toBe('it-donyu');
    });

    it('should handle pagination parameters', async () => {
      (SubsidyModel.search as jest.Mock).mockResolvedValue({
        subsidies: [],
        total: 50
      });

      const response = await request(app)
        .get('/api/subsidies')
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(SubsidyModel.search).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10
        })
      );
    });
  });

  describe('GET /api/subsidies/:id/questions', () => {
    it('should return question set for a subsidy', async () => {
      const mockQuestionSet = {
        id: 'question-set-1',
        name: 'IT導入補助金質問セット',
        questions: [
          {
            id: 'q1',
            questionCode: 'company_size',
            questionText: '従業員数を教えてください',
            questionType: 'number',
            isRequired: true
          }
        ]
      };

      (SubsidyModel.findById as jest.Mock).mockResolvedValue({
        id: 'subsidy-1',
        name: 'IT導入補助金2025'
      });

      (QuestionFlowManager.getQuestionSet as jest.Mock).mockResolvedValue(mockQuestionSet);

      const response = await request(app)
        .get('/api/subsidies/subsidy-1/questions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockQuestionSet);
      expect(QuestionFlowManager.getQuestionSet).toHaveBeenCalledWith('subsidy-1');
    });

    it('should fallback to subsidy type questions if specific questions not found', async () => {
      const mockTypeQuestionSet = {
        id: 'type-question-set-1',
        name: 'IT導入補助金共通質問',
        questions: []
      };

      (SubsidyModel.findById as jest.Mock).mockResolvedValue({
        id: 'subsidy-1'
      });

      (QuestionFlowManager.getQuestionSet as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockTypeQuestionSet);

      (supabaseService.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { subsidy_type: 'it-donyu' },
          error: null
        })
      });

      const response = await request(app)
        .get('/api/subsidies/subsidy-1/questions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTypeQuestionSet);
    });
  });

  describe('POST /api/subsidies/:id/validate-answers', () => {
    it('should validate answers and return visible questions', async () => {
      const mockQuestionSet = {
        questions: [
          {
            questionCode: 'q1',
            questionText: 'Question 1',
            isRequired: true
          },
          {
            questionCode: 'q2',
            questionText: 'Question 2',
            isRequired: false,
            conditions: [{
              conditionType: 'show_if',
              dependsOnQuestionCode: 'q1',
              conditionOperator: 'equals',
              conditionValue: 'yes'
            }]
          }
        ]
      };

      (QuestionFlowManager.getQuestionSet as jest.Mock).mockResolvedValue(mockQuestionSet);
      (QuestionFlowManager.validateAnswers as jest.Mock).mockReturnValue({
        valid: true,
        errors: {}
      });
      (QuestionFlowManager.evaluateQuestionVisibility as jest.Mock).mockReturnValue([
        mockQuestionSet.questions[0]
      ]);
      (QuestionFlowManager.isQuestionRequired as jest.Mock).mockReturnValue(true);

      const response = await request(app)
        .post('/api/subsidies/subsidy-1/validate-answers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: { q1: 'no' }
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        valid: true,
        errors: {},
        visibleQuestions: [{
          questionCode: 'q1',
          isRequired: true
        }]
      });
    });
  });

  describe('POST /api/subsidies/:id/alerts', () => {
    it('should set deadline alert for authenticated user', async () => {
      (DeadlineScheduler.setUserAlert as jest.Mock).mockResolvedValue('alert-id-1');

      const response = await request(app)
        .post('/api/subsidies/subsidy-1/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          alert_type: 'email',
          days_before: [30, 14, 7, 1]
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 'alert-id-1',
        message: 'Alert set successfully'
      });
      expect(DeadlineScheduler.setUserAlert).toHaveBeenCalledWith(
        'test-user-id',
        'subsidy-1',
        {
          alertType: 'email',
          daysBefore: [30, 14, 7, 1],
          isActive: true
        }
      );
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/subsidies/subsidy-1/alerts')
        .send({
          alert_type: 'email',
          days_before: [30]
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/subsidies/:id', () => {
    it('should update subsidy with admin privileges', async () => {
      const updatedSubsidy = {
        id: 'subsidy-1',
        name: 'Updated IT導入補助金',
        status: 'closed'
      };

      (supabaseService.rpc as jest.Mock).mockResolvedValue({ error: null });
      (supabaseService.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updatedSubsidy,
          error: null
        })
      });

      const response = await request(app)
        .put('/api/subsidies/subsidy-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated IT導入補助金',
          status: 'closed'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedSubsidy);
    });

    it('should reject non-admin users', async () => {
      const response = await request(app)
        .put('/api/subsidies/subsidy-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('Question Flow Manager Tests', () => {
    describe('evaluateQuestionVisibility', () => {
      it('should filter questions based on conditions', () => {
        const questions = [
          {
            id: 'q1',
            questionCode: 'has_employees',
            questionText: '従業員はいますか？',
            questionType: 'boolean' as const,
            isRequired: true,
            sortOrder: 1,
            inputConfig: {},
            validationRules: {}
          },
          {
            id: 'q2',
            questionCode: 'employee_count',
            questionText: '従業員数',
            questionType: 'number' as const,
            isRequired: false,
            sortOrder: 2,
            inputConfig: {},
            validationRules: {},
            conditions: [{
              id: 'c1',
              conditionType: 'show_if' as const,
              dependsOnQuestionCode: 'has_employees',
              conditionOperator: 'equals' as const,
              conditionValue: true
            }]
          }
        ];

        const visibleWithEmployees = QuestionFlowManager.evaluateQuestionVisibility(
          questions,
          { has_employees: true }
        );
        expect(visibleWithEmployees).toHaveLength(2);

        const visibleWithoutEmployees = QuestionFlowManager.evaluateQuestionVisibility(
          questions,
          { has_employees: false }
        );
        expect(visibleWithoutEmployees).toHaveLength(1);
      });
    });

    describe('validateAnswers', () => {
      it('should validate required fields', () => {
        const questions = [
          {
            id: 'q1',
            questionCode: 'company_name',
            questionText: '会社名',
            questionType: 'text' as const,
            isRequired: true,
            sortOrder: 1,
            inputConfig: {},
            validationRules: { minLength: 1 }
          }
        ];

        const result = QuestionFlowManager.validateAnswers(questions, {});
        expect(result.valid).toBe(false);
        expect(result.errors.company_name).toBe('必須項目です');
      });

      it('should apply validation rules', () => {
        const questions = [
          {
            id: 'q1',
            questionCode: 'employee_count',
            questionText: '従業員数',
            questionType: 'number' as const,
            isRequired: true,
            sortOrder: 1,
            inputConfig: {},
            validationRules: { min: 1, max: 9999 }
          }
        ];

        const result = QuestionFlowManager.validateAnswers(questions, {
          employee_count: 10000
        });
        expect(result.valid).toBe(false);
        expect(result.errors.employee_count).toContain('9999以下');
      });
    });
  });

  describe('Deadline Scheduler Tests', () => {
    describe('updateSubsidyStatuses', () => {
      it('should call database function to update statuses', async () => {
        (supabaseService.rpc as jest.Mock).mockResolvedValue({ error: null });

        await DeadlineScheduler['updateSubsidyStatuses']();

        expect(supabaseService.rpc).toHaveBeenCalledWith('update_subsidy_status');
      });
    });

    describe('setUserAlert', () => {
      it('should create or update user alert settings', async () => {
        const mockAlertId = 'alert-123';
        (supabaseService.from as jest.Mock).mockReturnValue({
          upsert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: mockAlertId },
            error: null
          })
        });

        const result = await DeadlineScheduler.setUserAlert(
          'user-123',
          'subsidy-456',
          {
            alertType: 'both',
            daysBefore: [30, 7, 1],
            isActive: true
          }
        );

        expect(result).toBe(mockAlertId);
      });
    });
  });
});