import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate must be below 10%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001/v1';

// Test data
const testUsers = [
  { email: 'perf-test1@example.com', password: 'TestPerf123!@#' },
  { email: 'perf-test2@example.com', password: 'TestPerf123!@#' },
  { email: 'perf-test3@example.com', password: 'TestPerf123!@#' },
];

// Helper function to get auth token
function authenticate(email, password) {
  const payload = JSON.stringify({ email, password });
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const response = http.post(`${BASE_URL}/auth/login`, payload, params);
  
  check(response, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.json('accessToken') !== undefined,
  });

  if (response.status !== 200) {
    errorRate.add(1);
    return null;
  }

  return response.json('accessToken');
}

// Main test scenario
export default function () {
  // Select a random test user
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  const token = authenticate(user.email, user.password);

  if (!token) {
    sleep(1);
    return;
  }

  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // Test 1: Get user profile
  let response = http.get(`${BASE_URL}/auth/me`, authHeaders);
  check(response, {
    'get profile status 200': (r) => r.status === 200,
    'profile contains email': (r) => r.json('user.email') === user.email,
  });
  errorRate.add(response.status !== 200);
  sleep(0.5);

  // Test 2: Get subsidies list
  response = http.get(`${BASE_URL}/subsidies`, authHeaders);
  check(response, {
    'get subsidies status 200': (r) => r.status === 200,
    'subsidies is array': (r) => Array.isArray(r.json('subsidies')),
    'response time < 300ms': (r) => r.timings.duration < 300,
  });
  errorRate.add(response.status !== 200);
  sleep(0.5);

  // Test 3: Check eligibility
  const eligibilityPayload = JSON.stringify({
    companySize: 'small',
    industry: 'manufacturing',
    challenges: ['digitalization', 'security'],
  });

  response = http.post(`${BASE_URL}/eligibility/check`, eligibilityPayload, authHeaders);
  check(response, {
    'eligibility check status 200': (r) => r.status === 200,
    'recommendations provided': (r) => r.json('recommendations') !== undefined,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(response.status !== 200);
  sleep(0.5);

  // Test 4: Get required documents
  response = http.get(`${BASE_URL}/required-documents?subsidyType=digitalization`, authHeaders);
  check(response, {
    'get documents status 200': (r) => r.status === 200,
    'documents is array': (r) => Array.isArray(r.json('documents')),
  });
  errorRate.add(response.status !== 200);
  sleep(0.5);

  // Test 5: Create draft application (write operation)
  const applicationPayload = JSON.stringify({
    subsidyType: 'digitalization',
    companyId: 'test-company-id',
    requestedAmount: 1000000,
    projectDescription: 'Performance test application',
  });

  response = http.post(`${BASE_URL}/applications`, applicationPayload, authHeaders);
  check(response, {
    'create application status 201': (r) => r.status === 201,
    'application id returned': (r) => r.json('application.id') !== undefined,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  errorRate.add(response.status !== 201);

  sleep(1);
}

// Setup function - create test users if they don't exist
export function setup() {
  console.log('Setting up test users...');
  
  const adminToken = authenticate('admin@example.com', 'AdminPassword123!@#');
  
  if (adminToken) {
    const authHeaders = {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    };

    testUsers.forEach(user => {
      const payload = JSON.stringify({
        email: user.email,
        password: user.password,
        name: `Performance Test User`,
        role: 'company',
      });

      const response = http.post(`${BASE_URL}/auth/register`, payload, authHeaders);
      if (response.status === 201) {
        console.log(`Created test user: ${user.email}`);
      }
    });
  }

  return { testUsers };
}

// Teardown function - cleanup test data
export function teardown(data) {
  console.log('Cleaning up test data...');
  // In a real scenario, you might want to delete test users here
}

// Custom summary
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}