#!/usr/bin/env node

/**
 * セキュリティ監査・脆弱性スキャン自動化スクリプト
 * OWASP Top 10、CVE脆弱性、依存関係セキュリティの包括的監査
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');
const crypto = require('crypto');

class SecurityAuditAutomation {
  constructor() {
    this.reportDir = path.join(__dirname, '../security-reports');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.auditResults = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0
      },
      audits: {}
    };
  }

  async init() {
    console.log('🔒 IT補助金アシスタント セキュリティ監査開始');
    console.log('━'.repeat(60));
    
    await this.ensureReportDirectory();
    await this.runAllAudits();
    await this.generateConsolidatedReport();
    await this.generateRecommendations();
    
    console.log('✅ セキュリティ監査完了');
    console.log(`📊 レポート: ${this.reportDir}/consolidated-report-${this.timestamp}.json`);
  }

  async ensureReportDirectory() {
    try {
      await fs.access(this.reportDir);
    } catch {
      await fs.mkdir(this.reportDir, { recursive: true });
    }
  }

  async runAllAudits() {
    const audits = [
      { name: 'npm-audit', fn: () => this.runNpmAudit() },
      { name: 'snyk-scan', fn: () => this.runSnykScan() },
      { name: 'dependency-check', fn: () => this.runDependencyCheck() },
      { name: 'semgrep-scan', fn: () => this.runSemgrepScan() },
      { name: 'eslint-security', fn: () => this.runESLintSecurity() },
      { name: 'bandit-scan', fn: () => this.runBanditScan() },
      { name: 'docker-scan', fn: () => this.runDockerScan() },
      { name: 'owasp-zap', fn: () => this.runOWASPZAP() },
      { name: 'secret-scan', fn: () => this.runSecretScan() },
      { name: 'license-check', fn: () => this.runLicenseCheck() }
    ];

    for (const audit of audits) {
      console.log(`\n🔍 実行中: ${audit.name}`);
      try {
        const result = await audit.fn();
        this.auditResults.audits[audit.name] = {
          status: 'completed',
          timestamp: new Date().toISOString(),
          ...result
        };
        this.updateSummary(result);
      } catch (error) {
        console.error(`❌ ${audit.name} failed:`, error.message);
        this.auditResults.audits[audit.name] = {
          status: 'failed',
          timestamp: new Date().toISOString(),
          error: error.message
        };
      }
    }
  }

  async runNpmAudit() {
    const frontendDir = path.join(__dirname, '../frontend');
    const backendDir = path.join(__dirname, '../backend');
    
    const results = {
      frontend: await this.executeNpmAudit(frontendDir),
      backend: await this.executeNpmAudit(backendDir)
    };

    return {
      tool: 'npm audit',
      results,
      issues: this.extractNpmAuditIssues(results)
    };
  }

  async executeNpmAudit(directory) {
    try {
      const output = execSync('npm audit --json', { 
        cwd: directory, 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return JSON.parse(output);
    } catch (error) {
      // npm auditは脆弱性があると非ゼロで終了するため、stdoutから結果を取得
      try {
        return JSON.parse(error.stdout);
      } catch {
        return { error: error.message };
      }
    }
  }

  extractNpmAuditIssues(results) {
    const issues = [];
    
    Object.values(results).forEach(result => {
      if (result.vulnerabilities) {
        Object.entries(result.vulnerabilities).forEach(([name, vuln]) => {
          issues.push({
            type: 'dependency-vulnerability',
            severity: vuln.severity,
            package: name,
            title: vuln.title,
            description: vuln.info,
            recommendation: vuln.fixAvailable ? 'Update available' : 'Manual review required'
          });
        });
      }
    });

    return issues;
  }

  async runSnykScan() {
    if (!process.env.SNYK_TOKEN) {
      return { 
        tool: 'Snyk',
        error: 'SNYK_TOKEN environment variable not set',
        issues: []
      };
    }

    try {
      // Snykインストール確認
      try {
        execSync('snyk --version', { stdio: 'pipe' });
      } catch {
        console.log('📦 Snyk CLI installing...');
        execSync('npm install -g snyk', { stdio: 'inherit' });
      }

      const frontendResult = await this.executeSnykScan('../frontend');
      const backendResult = await this.executeSnykScan('../backend');

      return {
        tool: 'Snyk',
        results: {
          frontend: frontendResult,
          backend: backendResult
        },
        issues: this.extractSnykIssues({ frontend: frontendResult, backend: backendResult })
      };
    } catch (error) {
      return {
        tool: 'Snyk',
        error: error.message,
        issues: []
      };
    }
  }

  async executeSnykScan(directory) {
    try {
      const output = execSync('snyk test --json', {
        cwd: path.join(__dirname, directory),
        encoding: 'utf8',
        env: { ...process.env, SNYK_TOKEN: process.env.SNYK_TOKEN },
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return JSON.parse(output);
    } catch (error) {
      try {
        return JSON.parse(error.stdout);
      } catch {
        return { error: error.message };
      }
    }
  }

  extractSnykIssues(results) {
    const issues = [];
    
    Object.values(results).forEach(result => {
      if (result.vulnerabilities) {
        result.vulnerabilities.forEach(vuln => {
          issues.push({
            type: 'snyk-vulnerability',
            severity: vuln.severity,
            package: vuln.packageName,
            title: vuln.title,
            description: vuln.description,
            cveId: vuln.identifiers?.CVE?.[0],
            recommendation: vuln.fixedIn ? `Update to ${vuln.fixedIn.join(', ')}` : 'Review required'
          });
        });
      }
    });

    return issues;
  }

  async runDependencyCheck() {
    const packageFiles = [
      path.join(__dirname, '../frontend/package.json'),
      path.join(__dirname, '../backend/package.json')
    ];

    const issues = [];

    for (const packageFile of packageFiles) {
      try {
        const packageJson = JSON.parse(await fs.readFile(packageFile, 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        // 既知の脆弱なパッケージチェック
        const vulnerablePackages = await this.checkVulnerablePackages(deps);
        issues.push(...vulnerablePackages);

        // 古いパッケージチェック
        const outdatedPackages = await this.checkOutdatedPackages(deps, path.dirname(packageFile));
        issues.push(...outdatedPackages);

      } catch (error) {
        issues.push({
          type: 'dependency-check-error',
          severity: 'medium',
          file: packageFile,
          error: error.message
        });
      }
    }

    return {
      tool: 'Dependency Check',
      issues
    };
  }

  async checkVulnerablePackages(dependencies) {
    // 既知の脆弱なパッケージリスト（簡易版）
    const vulnerablePackages = {
      'event-stream': { severity: 'critical', reason: 'Malicious code injection' },
      'eslint-scope': { severity: 'critical', reason: 'Malicious code injection' },
      'flatmap-stream': { severity: 'critical', reason: 'Malicious code injection' },
      'lodash': { severity: 'high', reason: 'Prototype pollution vulnerabilities', version: '<4.17.12' }
    };

    const issues = [];
    
    Object.entries(dependencies).forEach(([name, version]) => {
      if (vulnerablePackages[name]) {
        issues.push({
          type: 'vulnerable-package',
          severity: vulnerablePackages[name].severity,
          package: name,
          version,
          reason: vulnerablePackages[name].reason,
          recommendation: 'Update to latest secure version or remove dependency'
        });
      }
    });

    return issues;
  }

  async checkOutdatedPackages(dependencies, directory) {
    try {
      const output = execSync('npm outdated --json', {
        cwd: directory,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const outdated = JSON.parse(output);
      return Object.entries(outdated).map(([name, info]) => ({
        type: 'outdated-package',
        severity: 'low',
        package: name,
        current: info.current,
        wanted: info.wanted,
        latest: info.latest,
        recommendation: `Update from ${info.current} to ${info.latest}`
      }));
    } catch {
      return []; // npm outdatedは結果があると非ゼロで終了するため、エラーを無視
    }
  }

  async runSemgrepScan() {
    try {
      // Semgrepインストール確認
      try {
        execSync('semgrep --version', { stdio: 'pipe' });
      } catch {
        console.log('📦 Semgrep installing...');
        execSync('python3 -m pip install semgrep', { stdio: 'inherit' });
      }

      const output = execSync('semgrep --config=auto --json .', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      });

      const results = JSON.parse(output);
      
      return {
        tool: 'Semgrep',
        results,
        issues: this.extractSemgrepIssues(results)
      };
    } catch (error) {
      return {
        tool: 'Semgrep',
        error: error.message,
        issues: []
      };
    }
  }

  extractSemgrepIssues(results) {
    return results.results?.map(result => ({
      type: 'semgrep-finding',
      severity: this.mapSemgrepSeverity(result.extra?.severity),
      rule: result.check_id,
      file: result.path,
      line: result.start?.line,
      message: result.extra?.message,
      recommendation: result.extra?.fix || 'Review and fix manually'
    })) || [];
  }

  mapSemgrepSeverity(severity) {
    const mapping = {
      'ERROR': 'high',
      'WARNING': 'medium',
      'INFO': 'low'
    };
    return mapping[severity] || 'medium';
  }

  async runESLintSecurity() {
    try {
      const frontendResult = await this.executeESLintSecurity('../frontend');
      const backendResult = await this.executeESLintSecurity('../backend');

      return {
        tool: 'ESLint Security',
        results: {
          frontend: frontendResult,
          backend: backendResult
        },
        issues: this.extractESLintSecurityIssues({ frontend: frontendResult, backend: backendResult })
      };
    } catch (error) {
      return {
        tool: 'ESLint Security',
        error: error.message,
        issues: []
      };
    }
  }

  async executeESLintSecurity(directory) {
    try {
      const output = execSync('npx eslint . --ext .js,.ts --format json', {
        cwd: path.join(__dirname, directory),
        encoding: 'utf8'
      });
      return JSON.parse(output);
    } catch (error) {
      try {
        return JSON.parse(error.stdout);
      } catch {
        return [];
      }
    }
  }

  extractESLintSecurityIssues(results) {
    const issues = [];
    
    Object.values(results).forEach(result => {
      if (Array.isArray(result)) {
        result.forEach(file => {
          file.messages?.forEach(message => {
            if (message.ruleId?.includes('security/')) {
              issues.push({
                type: 'eslint-security',
                severity: message.severity === 2 ? 'high' : 'medium',
                rule: message.ruleId,
                file: file.filePath,
                line: message.line,
                column: message.column,
                message: message.message,
                recommendation: 'Fix security rule violation'
              });
            }
          });
        });
      }
    });

    return issues;
  }

  async runBanditScan() {
    // Python Bandit（Python固有のセキュリティスキャナー）
    // Node.jsプロジェクトなので、類似の機能を独自実装
    const patterns = [
      {
        pattern: /eval\s*\(/g,
        severity: 'high',
        message: 'Use of eval() detected - potential code injection vulnerability'
      },
      {
        pattern: /new\s+Function\s*\(/g,
        severity: 'high',
        message: 'Use of Function constructor detected - potential code injection'
      },
      {
        pattern: /innerHTML\s*=/g,
        severity: 'medium',
        message: 'innerHTML assignment detected - potential XSS vulnerability'
      },
      {
        pattern: /\.html\(/g,
        severity: 'medium',
        message: 'jQuery .html() detected - potential XSS vulnerability'
      },
      {
        pattern: /document\.write\(/g,
        severity: 'medium',
        message: 'document.write() detected - potential XSS vulnerability'
      }
    ];

    const issues = [];
    const scanDirs = ['../frontend/src', '../backend/src'];

    for (const scanDir of scanDirs) {
      const fullPath = path.join(__dirname, scanDir);
      await this.scanDirectoryForPatterns(fullPath, patterns, issues);
    }

    return {
      tool: 'Custom Security Scanner',
      issues
    };
  }

  async scanDirectoryForPatterns(directory, patterns, issues) {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await this.scanDirectoryForPatterns(fullPath, patterns, issues);
        } else if (entry.isFile() && /\.(js|ts|jsx|tsx)$/.test(entry.name)) {
          const content = await fs.readFile(fullPath, 'utf8');
          const lines = content.split('\n');
          
          patterns.forEach(({ pattern, severity, message }) => {
            lines.forEach((line, lineNumber) => {
              if (pattern.test(line)) {
                issues.push({
                  type: 'security-pattern',
                  severity,
                  file: fullPath,
                  line: lineNumber + 1,
                  message,
                  code: line.trim(),
                  recommendation: 'Review and use secure alternatives'
                });
              }
            });
          });
        }
      }
    } catch (error) {
      // ディレクトリアクセスエラーは無視
    }
  }

  async runDockerScan() {
    try {
      // Dockerfileの存在確認
      const dockerfiles = await this.findDockerfiles();
      
      if (dockerfiles.length === 0) {
        return {
          tool: 'Docker Security Scan',
          message: 'No Dockerfiles found',
          issues: []
        };
      }

      const issues = [];
      
      for (const dockerfile of dockerfiles) {
        const content = await fs.readFile(dockerfile, 'utf8');
        const dockerIssues = this.analyzeDockerfile(content, dockerfile);
        issues.push(...dockerIssues);
      }

      return {
        tool: 'Docker Security Scan',
        issues
      };
    } catch (error) {
      return {
        tool: 'Docker Security Scan',
        error: error.message,
        issues: []
      };
    }
  }

  async findDockerfiles() {
    const dockerfiles = [];
    const searchDirs = ['..', '../frontend', '../backend'];
    
    for (const dir of searchDirs) {
      try {
        const fullPath = path.join(__dirname, dir);
        const entries = await fs.readdir(fullPath);
        
        for (const entry of entries) {
          if (entry === 'Dockerfile' || entry.startsWith('Dockerfile.')) {
            dockerfiles.push(path.join(fullPath, entry));
          }
        }
      } catch {
        // ディレクトリが存在しない場合は無視
      }
    }
    
    return dockerfiles;
  }

  analyzeDockerfile(content, filePath) {
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const upperLine = line.toUpperCase();
      
      // セキュリティチェック
      if (upperLine.includes('USER ROOT')) {
        issues.push({
          type: 'docker-security',
          severity: 'high',
          file: filePath,
          line: lineNumber,
          message: 'Running as root user detected',
          recommendation: 'Use non-root user for better security'
        });
      }
      
      if (upperLine.includes('ADD ') && upperLine.includes('HTTP')) {
        issues.push({
          type: 'docker-security',
          severity: 'medium',
          file: filePath,
          line: lineNumber,
          message: 'ADD with URL detected',
          recommendation: 'Use COPY instead of ADD for better security'
        });
      }
      
      if (upperLine.includes('--NO-CHECK-CERTIFICATE')) {
        issues.push({
          type: 'docker-security',
          severity: 'high',
          file: filePath,
          line: lineNumber,
          message: 'Certificate verification disabled',
          recommendation: 'Enable certificate verification'
        });
      }
    });
    
    return issues;
  }

  async runOWASPZAP() {
    // OWASP ZAP統合（実際の実装では、ZAPのAPIを使用）
    return {
      tool: 'OWASP ZAP',
      message: 'ZAP integration not implemented in this demo',
      issues: [],
      recommendation: 'Implement ZAP API integration for dynamic security testing'
    };
  }

  async runSecretScan() {
    const secretPatterns = [
      {
        name: 'AWS Access Key',
        pattern: /AKIA[0-9A-Z]{16}/g,
        severity: 'critical'
      },
      {
        name: 'API Key',
        pattern: /api[_-]?key[\s]*[:=][\s]*['"]*[a-zA-Z0-9_-]{20,}['"]*|[a-zA-Z0-9_-]{32,}/gi,
        severity: 'high'
      },
      {
        name: 'JWT Token',
        pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
        severity: 'high'
      },
      {
        name: 'Password in URL',
        pattern: /[a-zA-Z]{3,10}:\/\/[^\/\s:@]{3,20}:[^\/\s:@]{3,20}@.{1,100}/g,
        severity: 'high'
      },
      {
        name: 'Private Key',
        pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
        severity: 'critical'
      }
    ];

    const issues = [];
    const scanDirs = ['../frontend', '../backend', '..'];

    for (const scanDir of scanDirs) {
      const fullPath = path.join(__dirname, scanDir);
      await this.scanForSecrets(fullPath, secretPatterns, issues);
    }

    return {
      tool: 'Secret Scanner',
      issues
    };
  }

  async scanForSecrets(directory, patterns, issues) {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        
        // スキップするディレクトリ
        if (entry.isDirectory()) {
          if (['node_modules', '.git', 'dist', 'build', 'coverage'].includes(entry.name)) {
            continue;
          }
          await this.scanForSecrets(fullPath, patterns, issues);
        } else if (entry.isFile()) {
          // バイナリファイルをスキップ
          if (/\.(jpg|jpeg|png|gif|ico|pdf|zip|tar|gz)$/i.test(entry.name)) {
            continue;
          }
          
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            const lines = content.split('\n');
            
            patterns.forEach(({ name, pattern, severity }) => {
              lines.forEach((line, lineNumber) => {
                const matches = line.match(pattern);
                if (matches) {
                  matches.forEach(match => {
                    issues.push({
                      type: 'secret-detection',
                      severity,
                      file: fullPath,
                      line: lineNumber + 1,
                      secretType: name,
                      message: `Potential ${name} detected`,
                      preview: line.substring(0, 100) + '...',
                      recommendation: 'Remove secret and use environment variables or secure key management'
                    });
                  });
                }
              });
            });
          } catch {
            // バイナリファイルなどの読み取りエラーは無視
          }
        }
      }
    } catch {
      // ディレクトリアクセスエラーは無視
    }
  }

  async runLicenseCheck() {
    const packageFiles = [
      path.join(__dirname, '../frontend/package.json'),
      path.join(__dirname, '../backend/package.json')
    ];

    const issues = [];
    const prohibitedLicenses = ['GPL-3.0', 'AGPL-3.0', 'SSPL-1.0'];
    const warningLicenses = ['GPL-2.0', 'LGPL-3.0'];

    for (const packageFile of packageFiles) {
      try {
        // ライセンス情報を取得
        const directory = path.dirname(packageFile);
        const licenseInfo = await this.getLicenseInfo(directory);
        
        Object.entries(licenseInfo).forEach(([packageName, license]) => {
          if (prohibitedLicenses.includes(license)) {
            issues.push({
              type: 'license-violation',
              severity: 'high',
              package: packageName,
              license,
              message: `Prohibited license detected: ${license}`,
              recommendation: 'Replace with compatible license package'
            });
          } else if (warningLicenses.includes(license)) {
            issues.push({
              type: 'license-warning',
              severity: 'medium',
              package: packageName,
              license,
              message: `License requires attention: ${license}`,
              recommendation: 'Review license compatibility'
            });
          }
        });
      } catch (error) {
        issues.push({
          type: 'license-check-error',
          severity: 'low',
          file: packageFile,
          error: error.message
        });
      }
    }

    return {
      tool: 'License Check',
      issues
    };
  }

  async getLicenseInfo(directory) {
    try {
      const output = execSync('npm ls --json --all', {
        cwd: directory,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const data = JSON.parse(output);
      const licenses = {};
      
      const extractLicenses = (deps, prefix = '') => {
        if (!deps) return;
        
        Object.entries(deps).forEach(([name, info]) => {
          const fullName = prefix ? `${prefix}/${name}` : name;
          if (info.license) {
            licenses[fullName] = info.license;
          }
          if (info.dependencies) {
            extractLicenses(info.dependencies, fullName);
          }
        });
      };
      
      extractLicenses(data.dependencies);
      return licenses;
    } catch {
      return {};
    }
  }

  updateSummary(result) {
    if (result.issues) {
      result.issues.forEach(issue => {
        this.auditResults.summary.totalIssues++;
        
        switch (issue.severity) {
          case 'critical':
            this.auditResults.summary.criticalIssues++;
            break;
          case 'high':
            this.auditResults.summary.highIssues++;
            break;
          case 'medium':
            this.auditResults.summary.mediumIssues++;
            break;
          case 'low':
            this.auditResults.summary.lowIssues++;
            break;
        }
      });
    }
  }

  async generateConsolidatedReport() {
    const reportPath = path.join(this.reportDir, `consolidated-report-${this.timestamp}.json`);
    await fs.writeFile(reportPath, JSON.stringify(this.auditResults, null, 2));
    
    // HTML レポートも生成
    await this.generateHTMLReport();
  }

  async generateHTMLReport() {
    const htmlContent = this.generateHTMLContent();
    const htmlPath = path.join(this.reportDir, `security-report-${this.timestamp}.html`);
    await fs.writeFile(htmlPath, htmlContent);
  }

  generateHTMLContent() {
    const { summary, audits } = this.auditResults;
    
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT補助金アシスタント セキュリティ監査レポート</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .summary { background: #ecf0f1; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .audit-section { margin: 20px 0; padding: 15px; border-left: 4px solid #3498db; }
        .issue { margin: 10px 0; padding: 10px; border-radius: 3px; }
        .critical { background: #e74c3c; color: white; }
        .high { background: #e67e22; color: white; }
        .medium { background: #f39c12; color: black; }
        .low { background: #27ae60; color: white; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border: 1px solid #ddd; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 セキュリティ監査レポート</h1>
        <p>IT補助金アシスタント - ${this.auditResults.timestamp}</p>
    </div>
    
    <div class="summary">
        <h2>📊 サマリー</h2>
        <div class="metric">総問題数: <strong>${summary.totalIssues}</strong></div>
        <div class="metric critical">致命的: ${summary.criticalIssues}</div>
        <div class="metric high">高: ${summary.highIssues}</div>
        <div class="metric medium">中: ${summary.mediumIssues}</div>
        <div class="metric low">低: ${summary.lowIssues}</div>
    </div>
    
    ${Object.entries(audits).map(([name, audit]) => this.generateAuditSectionHTML(name, audit)).join('')}
    
    <div class="footer" style="text-align: center; margin-top: 40px; color: #7f8c8d;">
        <p>Generated by IT補助金アシスタント Security Audit Automation</p>
    </div>
</body>
</html>`;
  }

  generateAuditSectionHTML(name, audit) {
    if (audit.status === 'failed') {
      return `
        <div class="audit-section">
            <h3>❌ ${name}</h3>
            <p>監査に失敗しました: ${audit.error}</p>
        </div>`;
    }

    const issues = audit.issues || [];
    
    return `
      <div class="audit-section">
          <h3>🔍 ${audit.tool || name}</h3>
          <p>問題数: ${issues.length}</p>
          ${issues.map(issue => `
              <div class="issue ${issue.severity}">
                  <strong>${issue.type}</strong>: ${issue.message || issue.title}
                  ${issue.file ? `<br><small>ファイル: ${issue.file}${issue.line ? `:${issue.line}` : ''}</small>` : ''}
                  ${issue.recommendation ? `<br><em>推奨: ${issue.recommendation}</em>` : ''}
              </div>
          `).join('')}
      </div>`;
  }

  async generateRecommendations() {
    const recommendations = this.analyzeResults();
    const recPath = path.join(this.reportDir, `recommendations-${this.timestamp}.md`);
    
    const content = `# セキュリティ推奨事項

## 🚨 緊急対応が必要

${recommendations.critical.map(r => `- ${r}`).join('\n')}

## ⚠️ 高優先度

${recommendations.high.map(r => `- ${r}`).join('\n')}

## 📋 中優先度

${recommendations.medium.map(r => `- ${r}`).join('\n')}

## 💡 改善提案

${recommendations.improvements.map(r => `- ${r}`).join('\n')}

## 📈 セキュリティ成熟度向上

${recommendations.maturity.map(r => `- ${r}`).join('\n')}

---
生成日時: ${new Date().toISOString()}
`;

    await fs.writeFile(recPath, content);
  }

  analyzeResults() {
    const { summary, audits } = this.auditResults;
    const recommendations = {
      critical: [],
      high: [],
      medium: [],
      improvements: [],
      maturity: []
    };

    // 致命的な問題への対応
    if (summary.criticalIssues > 0) {
      recommendations.critical.push('致命的なセキュリティ脆弱性が検出されています。即座の対応が必要です。');
      recommendations.critical.push('本番環境への展開を一時停止し、脆弱性の修正を優先してください。');
    }

    // 高優先度の推奨事項
    if (summary.highIssues > 10) {
      recommendations.high.push('多数の高優先度問題が検出されています。セキュリティレビューを実施してください。');
    }

    // シークレット検出
    const secretIssues = Object.values(audits).reduce((acc, audit) => {
      return acc + (audit.issues?.filter(i => i.type === 'secret-detection').length || 0);
    }, 0);

    if (secretIssues > 0) {
      recommendations.critical.push('シークレット情報がコードに含まれています。即座に削除し、ローテーションしてください。');
    }

    // 依存関係の問題
    const depIssues = Object.values(audits).reduce((acc, audit) => {
      return acc + (audit.issues?.filter(i => i.type.includes('dependency')).length || 0);
    }, 0);

    if (depIssues > 5) {
      recommendations.high.push('多数の依存関係脆弱性が検出されています。パッケージの更新を実施してください。');
    }

    // 改善提案
    recommendations.improvements.push('定期的なセキュリティ監査の自動化を検討してください。');
    recommendations.improvements.push('セキュリティヘッダーの実装を強化してください。');
    recommendations.improvements.push('入力バリデーションの包括的な見直しを実施してください。');

    // セキュリティ成熟度向上
    recommendations.maturity.push('セキュリティ開発ライフサイクル（SDLC）の導入を検討してください。');
    recommendations.maturity.push('ペネトレーションテストの定期実施を計画してください。');
    recommendations.maturity.push('セキュリティ意識向上のための開発者トレーニングを実施してください。');

    return recommendations;
  }
}

// スクリプト実行
if (require.main === module) {
  const audit = new SecurityAuditAutomation();
  audit.init().catch(error => {
    console.error('❌ Security audit failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityAuditAutomation;