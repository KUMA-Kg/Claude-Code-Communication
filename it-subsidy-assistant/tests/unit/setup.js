/**
 * Jest テストセットアップファイル
 * テスト環境の初期化とモック設定
 */

// Testing Library の拡張
import '@testing-library/jest-dom';

// Fetch API のモック
global.fetch = require('jest-fetch-mock');

// LocalStorage のモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// SessionStorage のモック
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Window のモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// IntersectionObserver のモック
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// ResizeObserver のモック
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// File API のモック
global.File = class File {
  constructor(bits, name, options = {}) {
    this.bits = bits;
    this.name = name;
    this.size = bits.length;
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
};

global.FileReader = class FileReader {
  constructor() {
    this.result = null;
    this.error = null;
    this.readyState = 0;
    this.onload = null;
    this.onerror = null;
  }
  
  readAsText(file) {
    this.readyState = 2;
    this.result = file.bits;
    if (this.onload) this.onload();
  }
  
  readAsDataURL(file) {
    this.readyState = 2;
    this.result = `data:${file.type};base64,${Buffer.from(file.bits).toString('base64')}`;
    if (this.onload) this.onload();
  }
};

// URL のモック
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Crypto のモック
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => '12345678-1234-1234-1234-123456789012'),
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// 環境変数のモック
process.env.NODE_ENV = 'test';
process.env.REACT_APP_API_URL = 'http://localhost:3001/api';
process.env.REACT_APP_SUPABASE_URL = 'https://test.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-anon-key';

// コンソールの制御（テスト時のノイズ削減）
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// テスト前後のクリーンアップ
beforeEach(() => {
  // モックのクリア
  jest.clearAllMocks();
  
  // LocalStorage のクリア
  localStorage.clear();
  sessionStorage.clear();
  
  // Fetch モックのクリア
  fetch.resetMocks();
});

afterEach(() => {
  // DOMのクリーンアップ
  document.body.innerHTML = '';
  
  // タイマーのクリア
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// グローバルテストヘルパー
global.testHelpers = {
  // 非同期処理の待機
  waitFor: async (callback, timeout = 5000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        const result = await callback();
        if (result) return result;
      } catch (error) {
        // 継続
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Timeout after ${timeout}ms`);
  },
  
  // イベントの模擬
  fireEvent: (element, eventType, eventData = {}) => {
    const event = new Event(eventType, { bubbles: true });
    Object.assign(event, eventData);
    element.dispatchEvent(event);
  },
  
  // DOM要素の作成
  createElement: (tag, attributes = {}, children = []) => {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
    return element;
  },
  
  // APIレスポンスのモック
  mockApiResponse: (data, status = 200) => {
    fetch.mockResponseOnce(JSON.stringify(data), { status });
  },
  
  // エラーレスポンスのモック
  mockApiError: (error, status = 500) => {
    fetch.mockRejectOnce(new Error(error));
  }
};

// テストデータファクトリー
global.testData = {
  // ユーザーデータ
  user: (overrides = {}) => ({
    id: '1',
    email: 'test@example.com',
    name: 'テストユーザー',
    role: 'user',
    createdAt: '2023-01-01T00:00:00Z',
    ...overrides
  }),
  
  // 補助金データ
  subsidy: (overrides = {}) => ({
    id: '1',
    title: 'IT導入補助金2023',
    description: 'ITツール導入支援',
    amount: 500000,
    rate: 0.5,
    deadline: '2023-12-31',
    category: 'IT導入',
    requirements: ['中小企業', 'IT投資'],
    ...overrides
  }),
  
  // 企業データ
  company: (overrides = {}) => ({
    id: '1',
    name: '株式会社テスト',
    representative: '山田太郎',
    employeeCount: 50,
    capital: 10000000,
    industry: 'IT・情報通信業',
    address: '東京都渋谷区',
    ...overrides
  }),
  
  // フォームデータ
  form: (overrides = {}) => ({
    companySize: '中小企業',
    industry: 'IT・情報通信業',
    investmentAmount: 500000,
    purpose: 'DX推進',
    timeline: '6ヶ月',
    ...overrides
  })
};

// カスタムマッチャーの登録
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toHaveValidationError(received, expectedError) {
    const hasError = received.errors && 
                    received.errors.some(error => 
                      error.message.includes(expectedError));
    if (hasError) {
      return {
        message: () => `expected validation errors not to include "${expectedError}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected validation errors to include "${expectedError}"`,
        pass: false,
      };
    }
  }
});

// パフォーマンステストヘルパー
global.performance = global.performance || {};
global.performance.measure = jest.fn();
global.performance.mark = jest.fn();
global.performance.getEntriesByName = jest.fn(() => []);
global.performance.getEntriesByType = jest.fn(() => []);
global.performance.clearMarks = jest.fn();
global.performance.clearMeasures = jest.fn();

console.log('🧪 Jest テスト環境セットアップ完了');