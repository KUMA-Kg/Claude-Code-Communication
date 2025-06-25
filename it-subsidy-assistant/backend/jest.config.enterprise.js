module.exports = {
  // 基本設定
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/**/*.interface.ts',
    '!src/index.ts',
    '!src/**/index.ts'
  ],

  // カバレッジ設定（エンタープライズレベル）
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'json-summary',
    'cobertura'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    // クリティカルなファイルにはより高い閾値
    './src/middleware/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/utils/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/models/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },

  // セットアップとティアダウン
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts'
  ],
  globalSetup: '<rootDir>/src/tests/globalSetup.ts',
  globalTeardown: '<rootDir>/src/tests/globalTeardown.ts',

  // モジュール解決
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1'
  },

  // テストタイムアウト
  testTimeout: 30000,

  // パフォーマンス設定
  maxWorkers: '50%',
  maxConcurrency: 5,

  // 詳細なレポート
  verbose: true,
  detectOpenHandles: true,
  detectLeaks: true,
  forceExit: true,

  // ファイル変更監視
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
    '<rootDir>/logs/'
  ],

  // テスト結果レポート
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage',
        filename: 'test-report.html',
        openReport: false,
        pageTitle: 'IT補助金アシスタント テストレポート',
        logo: '',
        hideIcon: false,
        includeFailureMsg: true,
        includeSuiteFailure: true
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}'
      }
    ],
    [
      'jest-sonar-reporter',
      {
        outputDirectory: './coverage',
        outputName: 'sonar-report.xml',
        reportedFilePath: 'relative'
      }
    ]
  ],

  // エラーハンドリング
  errorOnDeprecated: true,
  bail: false, // 本番では false、開発時は 1 に設定可能

  // 並列実行設定
  runInBand: false,

  // キャッシュ設定
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // テストファイルの除外
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
    '<rootDir>/src/tests/fixtures/',
    '<rootDir>/src/tests/mocks/'
  ],

  // 環境変数設定
  setupFiles: [
    '<rootDir>/src/tests/env.setup.ts'
  ],

  // グローバル変数
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      },
      isolatedModules: true,
      diagnostics: {
        ignoreCodes: [1343]
      }
    }
  },

  // テスト実行前後のフック
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  // モックファイル
  unmockedModulePathPatterns: [
    '<rootDir>/node_modules/'
  ],

  // ランダム化
  randomize: true,

  // 詳細なログ出力
  silent: false,
  logHeapUsage: true,

  // セキュリティテスト用の追加設定
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/tests/unit.setup.ts']
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/**/*.integration.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/tests/integration.setup.ts'],
      testTimeout: 60000
    },
    {
      displayName: 'security',
      testMatch: ['<rootDir>/src/**/*.security.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/tests/security.setup.ts'],
      testTimeout: 120000
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/src/**/*.performance.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/tests/performance.setup.ts'],
      testTimeout: 300000
    }
  ],

  // 並列実行の詳細制御
  workerIdleMemoryLimit: '512MB',

  // 高度なマッチャー
  snapshotSerializers: [
    'jest-serializer-path'
  ],

  // デバッグ設定
  collectCoverage: process.env.NODE_ENV !== 'debug',
  
  // 継続的統合環境での設定
  ci: process.env.CI === 'true',

  // テスト結果の詳細分析
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/src/tests/',
    '/src/types/',
    '/src/config/environment.ts', // 環境設定ファイルは除外
    '/src/scripts/', // スクリプトファイルは除外
    '/src/migrations/' // マイグレーションファイルは除外
  ],

  // カスタムレポーター
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'clover',
    ['lcov', { projectRoot: '../..' }] // モノレポ対応
  ]
};