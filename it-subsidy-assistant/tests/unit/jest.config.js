/**
 * Jest単体テスト設定ファイル
 * 高品質なテスト環境とカバレッジ測定を実現
 */

module.exports = {
  // テスト環境
  testEnvironment: 'node',
  
  // テストファイルのパターン
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/tests/unit/**/*.(js|jsx|ts|tsx)'
  ],
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.js'],
  
  // カバレッジ設定
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/serviceWorker.js',
    '!src/reportWebVitals.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  
  // カバレッジ閾値（品質ゲートウェイ）
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/utils/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/services/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // カバレッジレポート形式
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
    'cobertura'
  ],
  
  // カバレッジディレクトリ
  coverageDirectory: '<rootDir>/reports/coverage',
  
  // モジュール解決
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // 変換設定
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.css$': 'jest-css-modules-transform'
  },
  
  // 無視するファイル
  transformIgnorePatterns: [
    'node_modules/(?!(axios|@testing-library)/)'
  ],
  
  // モックファイル
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // テストタイムアウト
  testTimeout: 10000,
  
  // 並列実行
  maxWorkers: '50%',
  
  // 詳細出力
  verbose: true,
  
  // 失敗時の詳細
  bail: false,
  
  // ウォッチモード設定
  watchPathIgnorePatterns: ['node_modules', 'coverage', 'reports'],
  
  // レポーター設定
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './reports/jest-html',
      filename: 'jest-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'IT補助金アシストツール - Jest テストレポート'
    }],
    ['jest-sonar', {
      outputDirectory: './reports/sonar',
      outputName: 'test-report.xml'
    }],
    ['jest-junit', {
      outputDirectory: './reports/junit',
      outputName: 'junit.xml',
      ancestorSeparator: ' › ',
      uniqueOutputName: 'false',
      suiteNameTemplate: '{filepath}',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}'
    }]
  ],
  
  // セットアップ・ティアダウン
  globalSetup: '<rootDir>/tests/unit/globalSetup.js',
  globalTeardown: '<rootDir>/tests/unit/globalTeardown.js',
  
  // エラーハンドリング
  errorOnDeprecated: true,
  
  // キャッシュ
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // 通知設定
  notify: true,
  notifyMode: 'failure-change',
  
  // スナップショット設定
  updateSnapshot: false,
  
  // カスタムマッチャー
  setupFilesAfterEnv: [
    '<rootDir>/tests/unit/setup.js',
    '<rootDir>/tests/unit/customMatchers.js'
  ]
};