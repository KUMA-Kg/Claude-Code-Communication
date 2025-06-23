/**
 * Global Setup for Quality Assurance Testing
 * Initializes comprehensive testing environment
 */

import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up Quality Assurance Environment...');

  // Create test results directories
  const resultsDir = 'test-results';
  const dirs = [
    resultsDir,
    path.join(resultsDir, 'screenshots'),
    path.join(resultsDir, 'videos'),
    path.join(resultsDir, 'traces'),
    path.join(resultsDir, 'accessibility'),
    path.join(resultsDir, 'performance'),
    path.join(resultsDir, 'security')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Initialize browser for pre-setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Warm up the application
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:5175');
    await page.waitForLoadState('networkidle');
    console.log('✅ Application warmed up successfully');

    // Check if UX monitoring system is available
    await page.evaluate(() => {
      if (typeof window !== 'undefined' && !window.uxMonitor) {
        // Load UX monitoring system
        const script = document.createElement('script');
        script.src = '/ux-monitoring-system.js';
        document.head.appendChild(script);
      }
    });

    // Initialize quality monitoring data
    const qualityConfig = {
      testStart: Date.now(),
      environment: process.env.NODE_ENV || 'test',
      browserInfo: await page.evaluate(() => ({
        userAgent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }))
    };

    fs.writeFileSync(
      path.join(resultsDir, 'quality-config.json'),
      JSON.stringify(qualityConfig, null, 2)
    );

    // Pre-flight security checks
    await performSecurityPreChecks(page);

    // Accessibility baseline establishment
    await establishAccessibilityBaseline(page);

    console.log('✅ Quality Assurance Environment setup completed');

  } catch (error) {
    console.error('❌ Failed to setup QA environment:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function performSecurityPreChecks(page: any) {
  console.log('🔒 Performing security pre-checks...');

  // Check for Content Security Policy
  const cspHeader = await page.evaluate(() => {
    const metaCsp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    return metaCsp ? metaCsp.getAttribute('content') : null;
  });

  // Check for HTTPS redirect
  const isHttps = await page.evaluate(() => location.protocol === 'https:');

  // Check for sensitive data exposure
  const sensitivePatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i
  ];

  const pageContent = await page.content();
  const sensitiveDataFound = sensitivePatterns.some(pattern => pattern.test(pageContent));

  const securityChecks = {
    cspPresent: !!cspHeader,
    httpsEnabled: isHttps,
    noSensitiveDataExposed: !sensitiveDataFound,
    timestamp: Date.now()
  };

  fs.writeFileSync(
    'test-results/security/pre-checks.json',
    JSON.stringify(securityChecks, null, 2)
  );

  if (sensitiveDataFound) {
    console.warn('⚠️  Potential sensitive data exposure detected');
  }

  console.log('✅ Security pre-checks completed');
}

async function establishAccessibilityBaseline(page: any) {
  console.log('♿ Establishing accessibility baseline...');

  try {
    // Inject axe-core for accessibility testing
    await page.addScriptTag({
      url: 'https://unpkg.com/axe-core@4.7.0/axe.min.js'
    });

    // Run baseline accessibility scan
    const results = await page.evaluate(() => {
      return new Promise((resolve) => {
        // @ts-ignore
        axe.run(document, {
          rules: {
            'color-contrast': { enabled: true },
            'keyboard-navigation': { enabled: true },
            'aria-roles': { enabled: true },
            'form-labels': { enabled: true }
          }
        }, (err: any, results: any) => {
          if (err) throw err;
          resolve(results);
        });
      });
    });

    fs.writeFileSync(
      'test-results/accessibility/baseline.json',
      JSON.stringify(results, null, 2)
    );

    console.log(`✅ Accessibility baseline established: ${(results as any).violations.length} violations found`);

  } catch (error) {
    console.warn('⚠️  Could not establish accessibility baseline:', error);
  }
}

export default globalSetup;