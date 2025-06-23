import { defineConfig, devices } from '@playwright/test';

/**
 * Advanced Quality Assurance Configuration for IT Subsidy Assistant
 * Includes comprehensive UI testing, performance monitoring, and quality gates
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Enhanced reporting for quality assurance
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line'],
    // Quality Gates Reporter
    ['./tests/quality-gates-reporter.ts']
  ],
  
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Enhanced quality assurance settings
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // Accessibility and performance monitoring
    contextOptions: {
      permissions: ['clipboard-read', 'clipboard-write'],
      colorScheme: 'light',  // Test both themes
    }
  },

  // Comprehensive browser and device coverage
  projects: [
    // Desktop browsers with quality checks
    {
      name: 'chromium-quality',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: ['**/quality-assurance/**/*.spec.ts', '**/e2e/**/*.spec.ts']
    },
    {
      name: 'firefox-compatibility',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['**/compatibility/**/*.spec.ts']
    },
    {
      name: 'webkit-safari',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/safari/**/*.spec.ts']
    },
    
    // Mobile responsiveness tests
    {
      name: 'mobile-android',
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/mobile/**/*.spec.ts']
    },
    {
      name: 'mobile-ios',
      use: { ...devices['iPhone 12'] },
      testMatch: ['**/mobile/**/*.spec.ts']
    },
    
    // Accessibility tests
    {
      name: 'accessibility',
      use: { 
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',  // Test dark mode accessibility
      },
      testMatch: ['**/accessibility/**/*.spec.ts']
    },
    
    // Performance tests
    {
      name: 'performance',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      },
      testMatch: ['**/performance/**/*.spec.ts']
    }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5175',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Quality assurance specific settings
  expect: {
    threshold: 0.2,
    toHaveScreenshot: { 
      threshold: 0.2, 
      animations: 'disabled',
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    },
    toMatchSnapshot: { threshold: 0.2 }
  },

  timeout: 60000,
  
  // Global setup for comprehensive quality checks
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
  
  // Output directories for detailed analysis
  outputDir: 'test-results',
});