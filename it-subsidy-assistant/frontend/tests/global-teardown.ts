/**
 * Global Teardown for Quality Assurance Testing
 * Generates final reports and cleanup
 */

import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Quality Assurance Cleanup...');

  try {
    // Aggregate all test results
    await aggregateTestResults();

    // Generate final quality dashboard
    await generateQualityDashboard();

    // Cleanup temporary files
    await cleanupTempFiles();

    // Generate improvement recommendations
    await generateImprovementRecommendations();

    console.log('✅ Quality Assurance Cleanup completed');

  } catch (error) {
    console.error('❌ Failed during cleanup:', error);
  }
}

async function aggregateTestResults() {
  console.log('📊 Aggregating test results...');

  const resultsDir = 'test-results';
  const aggregatedResults = {
    testSummary: {},
    qualityMetrics: {},
    securityFindings: {},
    accessibilityReport: {},
    performanceMetrics: {},
    timestamp: Date.now()
  };

  // Read quality gates report if exists
  const qualityReportPath = path.join(resultsDir, 'quality-gates-report.json');
  if (fs.existsSync(qualityReportPath)) {
    const qualityReport = JSON.parse(fs.readFileSync(qualityReportPath, 'utf8'));
    aggregatedResults.qualityMetrics = qualityReport.qualityMetrics;
    aggregatedResults.testSummary = qualityReport.summary;
  }

  // Read security pre-checks
  const securityPath = path.join(resultsDir, 'security', 'pre-checks.json');
  if (fs.existsSync(securityPath)) {
    aggregatedResults.securityFindings = JSON.parse(fs.readFileSync(securityPath, 'utf8'));
  }

  // Read accessibility baseline
  const accessibilityPath = path.join(resultsDir, 'accessibility', 'baseline.json');
  if (fs.existsSync(accessibilityPath)) {
    aggregatedResults.accessibilityReport = JSON.parse(fs.readFileSync(accessibilityPath, 'utf8'));
  }

  // Save aggregated results
  fs.writeFileSync(
    path.join(resultsDir, 'aggregated-results.json'),
    JSON.stringify(aggregatedResults, null, 2)
  );

  console.log('✅ Test results aggregated successfully');
}

async function generateQualityDashboard() {
  console.log('📈 Generating Quality Dashboard...');

  const resultsDir = 'test-results';
  const aggregatedPath = path.join(resultsDir, 'aggregated-results.json');
  
  if (!fs.existsSync(aggregatedPath)) {
    console.warn('⚠️  No aggregated results found, skipping dashboard generation');
    return;
  }

  const results = JSON.parse(fs.readFileSync(aggregatedPath, 'utf8'));
  
  const dashboard = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quality Assurance Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { 
            max-width: 1400px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 16px; 
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); 
            color: white; 
            padding: 40px; 
            text-align: center; 
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1em; }
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 30px; 
            padding: 40px; 
        }
        .metric-card { 
            background: white; 
            border-radius: 12px; 
            padding: 25px; 
            text-align: center; 
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
            border: 1px solid #f0f0f0;
            transition: transform 0.3s ease;
        }
        .metric-card:hover { transform: translateY(-5px); }
        .metric-value { 
            font-size: 3em; 
            font-weight: bold; 
            margin: 15px 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .metric-label { color: #666; font-size: 1.1em; font-weight: 500; }
        .status-indicator { 
            display: inline-block; 
            width: 12px; 
            height: 12px; 
            border-radius: 50%; 
            margin-left: 8px; 
        }
        .status-good { background: #27ae60; }
        .status-warning { background: #f39c12; }
        .status-critical { background: #e74c3c; }
        .recommendations { 
            margin: 40px; 
            padding: 30px; 
            background: #f8f9fa; 
            border-radius: 12px; 
        }
        .recommendations h2 { margin-bottom: 20px; color: #2c3e50; }
        .timeline { 
            margin: 40px; 
            padding: 30px; 
            background: #fff; 
            border-radius: 12px; 
            border-left: 4px solid #3498db; 
        }
        .charts-section { 
            margin: 40px; 
            padding: 30px; 
            background: #fff; 
            border-radius: 12px; 
        }
        .footer { 
            background: #2c3e50; 
            color: white; 
            text-align: center; 
            padding: 30px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Quality Assurance Dashboard</h1>
            <p>Comprehensive quality metrics and recommendations</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Overall Quality Score</div>
                <div class="metric-value">${results.qualityMetrics?.overall || 'N/A'}</div>
                <span class="status-indicator ${getStatusClass(results.qualityMetrics?.overall)}"></span>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Performance Score</div>
                <div class="metric-value">${results.qualityMetrics?.performance || 'N/A'}</div>
                <span class="status-indicator ${getStatusClass(results.qualityMetrics?.performance)}"></span>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Accessibility Score</div>
                <div class="metric-value">${results.qualityMetrics?.accessibility || 'N/A'}</div>
                <span class="status-indicator ${getStatusClass(results.qualityMetrics?.accessibility)}"></span>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Security Score</div>
                <div class="metric-value">${results.qualityMetrics?.security || 'N/A'}</div>
                <span class="status-indicator ${getStatusClass(results.qualityMetrics?.security)}"></span>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Test Success Rate</div>
                <div class="metric-value">${calculateSuccessRate(results.testSummary)}%</div>
                <span class="status-indicator ${getStatusClass(calculateSuccessRate(results.testSummary))}"></span>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Accessibility Violations</div>
                <div class="metric-value">${results.accessibilityReport?.violations?.length || 0}</div>
                <span class="status-indicator ${results.accessibilityReport?.violations?.length > 0 ? 'status-warning' : 'status-good'}"></span>
            </div>
        </div>
        
        <div class="recommendations">
            <h2>🚀 Key Recommendations</h2>
            <ul>
                ${generateRecommendations(results).map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        
        <div class="timeline">
            <h2>📈 Quality Trend Analysis</h2>
            <p>This dashboard provides a snapshot of current quality metrics. Consider implementing continuous monitoring for trend analysis.</p>
        </div>
        
        <div class="footer">
            <p>Quality Assurance Dashboard - Powered by Playwright & Custom Quality Gates</p>
            <p>For detailed reports, check the test-results directory</p>
        </div>
    </div>
</body>
</html>`;

  fs.writeFileSync(path.join(resultsDir, 'quality-dashboard.html'), dashboard);
  console.log('✅ Quality Dashboard generated successfully');
}

function getStatusClass(score: number): string {
  if (score >= 90) return 'status-good';
  if (score >= 70) return 'status-warning';
  return 'status-critical';
}

function calculateSuccessRate(testSummary: any): number {
  if (!testSummary || !testSummary.totalTests) return 0;
  return Math.round((testSummary.passed / testSummary.totalTests) * 100);
}

function generateRecommendations(results: any): string[] {
  const recommendations = [];
  
  if (results.qualityMetrics?.performance < 80) {
    recommendations.push('Optimize performance: Implement code splitting and lazy loading');
  }
  
  if (results.qualityMetrics?.accessibility < 90) {
    recommendations.push('Improve accessibility: Fix ARIA labels and keyboard navigation');
  }
  
  if (results.qualityMetrics?.security < 95) {
    recommendations.push('Strengthen security: Update dependencies and implement CSP headers');
  }
  
  if (results.accessibilityReport?.violations?.length > 0) {
    recommendations.push(`Address ${results.accessibilityReport.violations.length} accessibility violations`);
  }
  
  if (!results.securityFindings?.cspPresent) {
    recommendations.push('Implement Content Security Policy for enhanced security');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Excellent! All quality gates are passing. Continue monitoring for regression.');
  }
  
  return recommendations;
}

async function cleanupTempFiles() {
  console.log('🧹 Cleaning up temporary files...');
  
  // Remove large video files older than 1 day (if any)
  const videosDir = 'test-results/videos';
  if (fs.existsSync(videosDir)) {
    const files = fs.readdirSync(videosDir);
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    files.forEach(file => {
      const filePath = path.join(videosDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtime.getTime() < oneDayAgo) {
        fs.unlinkSync(filePath);
      }
    });
  }
  
  console.log('✅ Cleanup completed');
}

async function generateImprovementRecommendations() {
  console.log('💡 Generating improvement recommendations...');
  
  const recommendations = `# Quality Improvement Recommendations

## Immediate Actions
1. **Fix Critical Issues**: Address any security vulnerabilities immediately
2. **Performance Optimization**: Implement code splitting for large bundles
3. **Accessibility Compliance**: Ensure WCAG 2.1 AA compliance

## Medium-term Improvements
1. **Continuous Monitoring**: Implement real-time quality monitoring
2. **Automated Testing**: Expand test coverage to include edge cases
3. **Performance Budget**: Establish and enforce performance budgets

## Long-term Strategy
1. **Quality Culture**: Foster a culture of quality within the development team
2. **Metrics Dashboard**: Create real-time quality metrics dashboard
3. **Predictive Analysis**: Implement ML-based quality prediction

---
Generated on ${new Date().toISOString()}
`;

  fs.writeFileSync('test-results/improvement-recommendations.md', recommendations);
  console.log('✅ Improvement recommendations generated');
}

export default globalTeardown;