/**
 * Quality Gates Reporter for Playwright
 * Revolutionary approach to comprehensive quality reporting
 */

import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface QualityMetrics {
  performance: {
    lcp: number[];
    fcp: number[];
    cls: number[];
    tbt: number[];
  };
  accessibility: {
    violations: any[];
    score: number;
  };
  security: {
    vulnerabilities: string[];
    cspViolations: number;
  };
  usability: {
    formCompletionRate: number;
    averageTaskTime: number;
    errorRate: number;
  };
}

class QualityGatesReporter implements Reporter {
  private config: FullConfig;
  private results: TestResult[] = [];
  private metrics: QualityMetrics = {
    performance: { lcp: [], fcp: [], cls: [], tbt: [] },
    accessibility: { violations: [], score: 0 },
    security: { vulnerabilities: [], cspViolations: 0 },
    usability: { formCompletionRate: 0, averageTaskTime: 0, errorRate: 0 }
  };

  constructor(options: any = {}) {
    this.config = options.config;
  }

  onBegin(config: FullConfig, suite: Suite) {
    console.log('🚀 Starting Quality Gates Analysis...');
    this.config = config;
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.results.push(result);
    this.extractMetricsFromTest(test, result);
  }

  onEnd(result: FullResult) {
    this.generateQualityReport(result);
    this.evaluateQualityGates();
  }

  private extractMetricsFromTest(test: TestCase, result: TestResult) {
    // Extract performance metrics from test attachments
    for (const attachment of result.attachments) {
      if (attachment.name === 'performance-metrics') {
        try {
          const metrics = JSON.parse(attachment.body?.toString() || '{}');
          if (metrics.lcp) this.metrics.performance.lcp.push(metrics.lcp);
          if (metrics.fcp) this.metrics.performance.fcp.push(metrics.fcp);
          if (metrics.cls) this.metrics.performance.cls.push(metrics.cls);
          if (metrics.tbt) this.metrics.performance.tbt.push(metrics.tbt);
        } catch (e) {
          console.warn('Failed to parse performance metrics:', e);
        }
      }

      if (attachment.name === 'accessibility-results') {
        try {
          const axeResults = JSON.parse(attachment.body?.toString() || '{}');
          this.metrics.accessibility.violations.push(...axeResults.violations || []);
          this.metrics.accessibility.score = this.calculateAccessibilityScore(axeResults);
        } catch (e) {
          console.warn('Failed to parse accessibility results:', e);
        }
      }

      if (attachment.name === 'security-scan') {
        try {
          const securityResults = JSON.parse(attachment.body?.toString() || '{}');
          this.metrics.security.vulnerabilities.push(...securityResults.vulnerabilities || []);
          this.metrics.security.cspViolations += securityResults.cspViolations || 0;
        } catch (e) {
          console.warn('Failed to parse security results:', e);
        }
      }
    }
  }

  private calculateAccessibilityScore(axeResults: any): number {
    const totalRules = axeResults.passes?.length + axeResults.violations?.length + axeResults.incomplete?.length;
    const passedRules = axeResults.passes?.length || 0;
    return totalRules > 0 ? (passedRules / totalRules) * 100 : 0;
  }

  private generateQualityReport(result: FullResult) {
    const report = {
      summary: {
        totalTests: this.results.length,
        passed: this.results.filter(r => r.status === 'passed').length,
        failed: this.results.filter(r => r.status === 'failed').length,
        skipped: this.results.filter(r => r.status === 'skipped').length,
        duration: Date.now() - result.startTime.getTime()
      },
      qualityMetrics: this.calculateQualityScores(),
      recommendations: this.generateRecommendations(),
      detailedResults: this.metrics
    };

    // Save detailed JSON report
    const reportPath = path.join('test-results', 'quality-gates-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    this.generateHTMLReport(report, path.join('test-results', 'quality-gates-report.html'));

    // Generate executive summary
    this.generateExecutiveSummary(report, path.join('test-results', 'executive-summary.md'));

    console.log('📊 Quality Gates Report generated:');
    console.log(`  - JSON: ${reportPath}`);
    console.log(`  - HTML: test-results/quality-gates-report.html`);
    console.log(`  - Summary: test-results/executive-summary.md`);
  }

  private calculateQualityScores() {
    const performance = this.calculatePerformanceScore();
    const accessibility = this.metrics.accessibility.score;
    const security = this.calculateSecurityScore();
    const reliability = this.calculateReliabilityScore();

    return {
      overall: Math.round((performance + accessibility + security + reliability) / 4),
      performance: Math.round(performance),
      accessibility: Math.round(accessibility),
      security: Math.round(security),
      reliability: Math.round(reliability)
    };
  }

  private calculatePerformanceScore(): number {
    const avgLCP = this.average(this.metrics.performance.lcp);
    const avgFCP = this.average(this.metrics.performance.fcp);
    const avgCLS = this.average(this.metrics.performance.cls);

    // Google's thresholds
    const lcpScore = avgLCP <= 2500 ? 100 : avgLCP <= 4000 ? 50 : 0;
    const fcpScore = avgFCP <= 1800 ? 100 : avgFCP <= 3000 ? 50 : 0;
    const clsScore = avgCLS <= 0.1 ? 100 : avgCLS <= 0.25 ? 50 : 0;

    return (lcpScore + fcpScore + clsScore) / 3;
  }

  private calculateSecurityScore(): number {
    const vulnerabilityCount = this.metrics.security.vulnerabilities.length;
    const cspViolations = this.metrics.security.cspViolations;

    if (vulnerabilityCount === 0 && cspViolations === 0) return 100;
    if (vulnerabilityCount <= 2 && cspViolations <= 1) return 80;
    if (vulnerabilityCount <= 5 && cspViolations <= 3) return 60;
    return 40;
  }

  private calculateReliabilityScore(): number {
    const passRate = this.results.filter(r => r.status === 'passed').length / this.results.length;
    return passRate * 100;
  }

  private generateRecommendations() {
    const recommendations = [];
    const scores = this.calculateQualityScores();

    if (scores.performance < 80) {
      recommendations.push({
        category: 'Performance',
        priority: 'High',
        issue: 'Performance metrics below threshold',
        solution: 'Optimize bundle size, implement code splitting, and lazy loading',
        impact: 'Improve user experience and SEO rankings'
      });
    }

    if (scores.accessibility < 90) {
      recommendations.push({
        category: 'Accessibility',
        priority: 'High',
        issue: 'Accessibility violations detected',
        solution: 'Fix ARIA labels, improve keyboard navigation, ensure color contrast',
        impact: 'Ensure compliance with WCAG 2.1 AA standards'
      });
    }

    if (scores.security < 95) {
      recommendations.push({
        category: 'Security',
        priority: 'Critical',
        issue: 'Security vulnerabilities or CSP violations',
        solution: 'Update dependencies, strengthen CSP headers, sanitize inputs',
        impact: 'Prevent security breaches and data exposure'
      });
    }

    if (scores.reliability < 95) {
      recommendations.push({
        category: 'Reliability',
        priority: 'Medium',
        issue: 'Test failures indicating instability',
        solution: 'Fix flaky tests, improve error handling, add retry mechanisms',
        impact: 'Ensure consistent user experience'
      });
    }

    return recommendations;
  }

  private evaluateQualityGates() {
    const scores = this.calculateQualityScores();
    const thresholds = {
      overall: 85,
      performance: 80,
      accessibility: 90,
      security: 95,
      reliability: 95
    };

    console.log('\n🎯 Quality Gates Evaluation:');
    
    Object.entries(scores).forEach(([metric, score]) => {
      const threshold = thresholds[metric as keyof typeof thresholds];
      const status = score >= threshold ? '✅ PASS' : '❌ FAIL';
      const emoji = score >= threshold ? '🟢' : '🔴';
      
      console.log(`  ${emoji} ${metric.toUpperCase()}: ${score}/100 (threshold: ${threshold}) ${status}`);
    });

    // Fail the build if critical thresholds are not met
    if (scores.security < thresholds.security) {
      console.error('\n🚨 CRITICAL: Security quality gate failed!');
      process.exit(1);
    }

    if (scores.overall < thresholds.overall) {
      console.error('\n⚠️  WARNING: Overall quality gate failed!');
      // Don't exit here, just warn
    }

    console.log(`\n📊 Overall Quality Score: ${scores.overall}/100`);
  }

  private generateHTMLReport(report: any, filePath: string) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quality Gates Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .score-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .score-value { font-size: 3em; font-weight: bold; margin: 10px 0; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .rec-item { margin-bottom: 15px; padding: 15px; background: white; border-radius: 4px; border-left: 4px solid #e17055; }
        .high-priority { border-left-color: #d63031; }
        .critical-priority { border-left-color: #2d3436; }
        .metrics-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .metrics-table th, .metrics-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .metrics-table th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Quality Gates Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="score-grid">
            <div class="score-card">
                <h3>Overall Score</h3>
                <div class="score-value">${report.qualityMetrics.overall}</div>
                <p>Quality Index</p>
            </div>
            <div class="score-card">
                <h3>Performance</h3>
                <div class="score-value">${report.qualityMetrics.performance}</div>
                <p>Core Web Vitals</p>
            </div>
            <div class="score-card">
                <h3>Accessibility</h3>
                <div class="score-value">${report.qualityMetrics.accessibility}</div>
                <p>WCAG 2.1 AA</p>
            </div>
            <div class="score-card">
                <h3>Security</h3>
                <div class="score-value">${report.qualityMetrics.security}</div>
                <p>Vulnerability Scan</p>
            </div>
        </div>
        
        <div class="recommendations">
            <h2>🚀 Recommendations for Improvement</h2>
            ${report.recommendations.map((rec: any) => `
                <div class="rec-item ${rec.priority.toLowerCase()}-priority">
                    <h4>${rec.category} - ${rec.priority} Priority</h4>
                    <p><strong>Issue:</strong> ${rec.issue}</p>
                    <p><strong>Solution:</strong> ${rec.solution}</p>
                    <p><strong>Impact:</strong> ${rec.impact}</p>
                </div>
            `).join('')}
        </div>
        
        <h2>📊 Test Summary</h2>
        <table class="metrics-table">
            <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Status</th>
            </tr>
            <tr>
                <td>Total Tests</td>
                <td>${report.summary.totalTests}</td>
                <td>-</td>
            </tr>
            <tr>
                <td>Passed</td>
                <td>${report.summary.passed}</td>
                <td>✅</td>
            </tr>
            <tr>
                <td>Failed</td>
                <td>${report.summary.failed}</td>
                <td>${report.summary.failed === 0 ? '✅' : '❌'}</td>
            </tr>
            <tr>
                <td>Duration</td>
                <td>${Math.round(report.summary.duration / 1000)}s</td>
                <td>-</td>
            </tr>
        </table>
    </div>
</body>
</html>`;

    fs.writeFileSync(filePath, html);
  }

  private generateExecutiveSummary(report: any, filePath: string) {
    const summary = `# Executive Summary - Quality Gates Report

## 🎯 Overall Quality Score: ${report.qualityMetrics.overall}/100

### Key Metrics
- **Performance**: ${report.qualityMetrics.performance}/100
- **Accessibility**: ${report.qualityMetrics.accessibility}/100  
- **Security**: ${report.qualityMetrics.security}/100
- **Reliability**: ${report.qualityMetrics.reliability}/100

### Test Results
- Total Tests: ${report.summary.totalTests}
- Passed: ${report.summary.passed}
- Failed: ${report.summary.failed}
- Duration: ${Math.round(report.summary.duration / 1000)}s

### Critical Actions Required
${report.recommendations.filter((r: any) => r.priority === 'Critical').map((r: any) => 
  `- **${r.category}**: ${r.issue} → ${r.solution}`
).join('\n') || 'None'}

### High Priority Improvements
${report.recommendations.filter((r: any) => r.priority === 'High').map((r: any) => 
  `- **${r.category}**: ${r.issue}`
).join('\n') || 'None'}

---
*Report generated on ${new Date().toISOString()}*
`;

    fs.writeFileSync(filePath, summary);
  }

  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }
}

export default QualityGatesReporter;