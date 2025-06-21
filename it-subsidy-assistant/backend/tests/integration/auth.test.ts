import request from 'supertest';
import app from '@/index';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Authentication API Integration Tests', () => {
  const testUsers = {
    admin: {
      email: 'test-admin@example.com',
      password: 'TestAdmin123!@#',
      role: 'admin'
    },
    company: {
      email: 'test-company@example.com',
      password: 'TestCompany123!@#',
      role: 'company'
    },
    consultant: {
      email: 'test-consultant@example.com',
      password: 'TestConsultant123!@#',
      role: 'consultant'
    }
  };

  let adminToken: string;
  let companyToken: string;
  let consultantToken: string;

  beforeAll(async () => {
    // Clean up test users
    for (const user of Object.values(testUsers)) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (existingUser) {
        await supabase.auth.admin.deleteUser(existingUser.id);
      }
    }
  });

  afterAll(async () => {
    // Clean up test data
    for (const user of Object.values(testUsers)) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (existingUser) {
        await supabase.auth.admin.deleteUser(existingUser.id);
      }
    }
  });

  describe('POST /api/v1/auth/register', () => {
    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({
          email: testUsers.company.email,
          password: testUsers.company.password,
          name: 'Test Company User',
          role: 'company',
          companyName: 'Test Company Inc.'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUsers.company.email);
    });

    test('should fail with weak password', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({
          email: 'weak-password@example.com',
          password: '123456',
          name: 'Weak Password User',
          role: 'company'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: testUsers.company.password,
          name: 'Invalid Email User',
          role: 'company'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail with duplicate email', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({
          email: testUsers.company.email,
          password: testUsers.company.password,
          name: 'Duplicate User',
          role: 'company'
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: testUsers.company.email,
          password: testUsers.company.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      
      companyToken = response.body.accessToken;
    });

    test('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: testUsers.company.email,
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'non-existent@example.com',
          password: testUsers.company.password
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should implement rate limiting', async () => {
      // Make multiple rapid login attempts
      const attempts = 10;
      const responses = [];

      for (let i = 0; i < attempts; i++) {
        const response = await request(app)
          .post('/v1/auth/login')
          .send({
            email: testUsers.company.email,
            password: 'WrongPassword' + i
          });
        responses.push(response.status);
      }

      // At least one should be rate limited
      expect(responses).toContain(429);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    test('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUsers.company.email);
    });

    test('should fail without token', async () => {
      const response = await request(app)
        .get('/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail with expired token', async () => {
      // Create a token with very short expiration
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.invalid';
      
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({
          email: testUsers.company.email,
          password: testUsers.company.password
        });
      
      refreshToken = loginResponse.body.refreshToken;
    });

    test('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.refreshToken).not.toBe(refreshToken);
    });

    test('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/v1/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail without refresh token', async () => {
      const response = await request(app)
        .post('/v1/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    test('should work without token (no-op)', async () => {
      const response = await request(app)
        .post('/v1/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Security Tests', () => {
    test('should prevent SQL injection in login', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: "admin@example.com' OR '1'='1",
          password: "password' OR '1'='1"
        });

      expect(response.status).toBe(400);
    });

    test('should prevent XSS in registration', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({
          email: 'xss@example.com',
          password: testUsers.company.password,
          name: '<script>alert("XSS")</script>',
          role: 'company'
        });

      expect(response.status).toBe(201);
      // Check that the name is properly escaped in response
      expect(response.body.user.name).not.toContain('<script>');
    });

    test('should include security headers', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('0');
    });
  });
});