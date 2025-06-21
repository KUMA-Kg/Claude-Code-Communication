/**
 * OWASP Top 10 セキュリティ監査スクリプト
 * 2023年版OWASP Top 10に基づいた包括的なセキュリティ監査
 */

const { test } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// 監査結果を保存するオブジェクト
const auditResults = {
  timestamp: new Date().toISOString(),
  owaspVersion: '2023',
  vulnerabilities: [],
  summary: {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  }
};

// 脆弱性を記録する関数
function recordVulnerability(category, title, severity, description, recommendation, evidence = null) {
  auditResults.vulnerabilities.push({
    category,
    title,
    severity,
    description,
    recommendation,
    evidence,
    timestamp: new Date().toISOString()
  });
  
  auditResults.summary[severity.toLowerCase()]++;
}

// A01:2021 – アクセス制御の不備
test.describe('A01: Broken Access Control', () => {
  test('認証なしでのアクセステスト', async ({ page }) => {
    // 保護されたエンドポイントへの直接アクセスを試行
    const protectedEndpoints = [
      '/api/admin',
      '/api/users',
      '/api/subsidies/create',
      '/api/documents/delete',
      '/dashboard',
      '/admin'
    ];
    
    for (const endpoint of protectedEndpoints) {
      const response = await page.goto(`http://localhost:3000${endpoint}`, { waitUntil: 'networkidle' });
      
      if (response && response.status() === 200) {
        recordVulnerability(
          'A01',
          `未認証アクセス: ${endpoint}`,
          'CRITICAL',
          `エンドポイント ${endpoint} が認証なしでアクセス可能`,
          '適切な認証ミドルウェアを実装し、すべての保護されたリソースへのアクセスを制限する',
          { endpoint, statusCode: response.status() }
        );
      }
    }
  });
  
  test('IDOR（Insecure Direct Object Reference）テスト', async ({ page }) => {
    // ログイン
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'user1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // 他のユーザーのリソースへのアクセスを試行
    const response = await page.goto('/api/users/2/documents', { waitUntil: 'networkidle' });
    
    if (response && response.status() === 200) {
      recordVulnerability(
        'A01',
        'IDOR脆弱性',
        'HIGH',
        '他のユーザーのドキュメントにアクセス可能',
        'オブジェクトの所有者を確認し、適切な許可チェックを実装する'
      );
    }
  });
});

// A02:2021 – 暗号化の失敗
test.describe('A02: Cryptographic Failures', () => {
  test('HTTPS使用の確認', async ({ page }) => {
    const response = await page.goto('http://localhost:3000');
    const url = page.url();
    
    if (!url.startsWith('https://')) {
      recordVulnerability(
        'A02',
        'HTTPS未使用',
        'HIGH',
        'アプリケーションがHTTPSを使用していない',
        'すべての通信にHTTPSを強制し、HSTSを有効化する'
      );
    }
  });
  
  test('機密データの公開チェック', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();
    
    // ソースコード内の機密情報をチェック
    const sensitivePatterns = [
      /api[_-]?key[\s]*[:=][\s]*['"][^'"]+['"]/gi,
      /password[\s]*[:=][\s]*['"][^'"]+['"]/gi,
      /secret[\s]*[:=][\s]*['"][^'"]+['"]/gi,
      /token[\s]*[:=][\s]*['"][^'"]+['"]/gi
    ];
    
    for (const pattern of sensitivePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        recordVulnerability(
          'A02',
          '機密情報の公開',
          'CRITICAL',
          `ソースコードに機密情報が含まれている: ${matches[0]}`,
          '機密情報を環境変数または安全なキー管理システムに移動する',
          { matches: matches.slice(0, 3) }
        );
      }
    }
  });
});

// A03:2021 – インジェクション
test.describe('A03: Injection', () => {
  test('SQLインジェクションテスト', async ({ page }) => {
    await page.goto('/search');
    
    const sqlPayloads = [
      "' OR '1'='1",
      "1'; DROP TABLE users; --",
      "admin'--",
      "1 UNION SELECT * FROM users"
    ];
    
    for (const payload of sqlPayloads) {
      await page.fill('[data-testid="search-input"]', payload);
      await page.click('[data-testid="search-button"]');
      
      const response = await page.waitForResponse(resp => resp.url().includes('/api/search'));
      
      if (response.status() === 200) {
        const responseText = await response.text();
        if (responseText.includes('error') || responseText.includes('SQL')) {
          recordVulnerability(
            'A03',
            'SQLインジェクションの可能性',
            'CRITICAL',
            `SQLインジェクションペイロードが処理された: ${payload}`,
            'パラメータ化されたクエリまたはORMを使用し、入力検証を強化する',
            { payload, response: responseText.substring(0, 200) }
          );
        }
      }
    }
  });
  
  test('XSS（クロスサイトスクリプティング）テスト', async ({ page }) => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror="alert(\'XSS\')" />',
      '<svg onload="alert(\'XSS\')" />',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>'
    ];
    
    for (const payload of xssPayloads) {
      await page.goto('/profile/edit');
      await page.fill('[data-testid="name-input"]', payload);
      await page.click('[data-testid="save-button"]');
      
      // アラートダイアログの検出
      let alertDetected = false;
      page.on('dialog', dialog => {
        alertDetected = true;
        dialog.dismiss();
      });
      
      await page.goto('/profile');
      await page.waitForTimeout(1000);
      
      if (alertDetected) {
        recordVulnerability(
          'A03',
          'XSS脆弱性',
          'HIGH',
          `XSSペイロードが実行された: ${payload}`,
          'すべてのユーザー入力を適切にエスケープし、CSPを実装する',
          { payload }
        );
      }
    }
  });
});

// A04:2021 – 安全でない設計
test.describe('A04: Insecure Design', () => {
  test('レート制限の確認', async ({ page }) => {
    // 短時間に大量のリクエストを送信
    const requests = [];
    for (let i = 0; i < 100; i++) {
      requests.push(
        page.goto('/api/search?q=test', { waitUntil: 'networkidle' })
      );
    }
    
    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r && r.status() === 200).length;
    
    if (successCount > 90) {
      recordVulnerability(
        'A04',
        'レート制限の不備',
        'MEDIUM',
        'APIエンドポイントに適切なレート制限が設定されていない',
        'DDoS攻撃を防ぐために適切なレート制限を実装する',
        { successRate: `${successCount}/100` }
      );
    }
  });
  
  test('ビジネスロジックの脆弱性', async ({ page }) => {
    // 負の数値の入力テスト
    await page.goto('/application/create');
    await page.fill('[data-testid="amount-input"]', '-1000');
    await page.click('[data-testid="submit-button"]');
    
    const errorMessage = await page.locator('[data-testid="error-message"]');
    if (!await errorMessage.isVisible()) {
      recordVulnerability(
        'A04',
        'ビジネスロジックの不備',
        'MEDIUM',
        '負の金額が受け入れられる',
        '適切な入力検証とビジネスルールの実装を行う'
      );
    }
  });
});

// A05:2021 – セキュリティの設定ミス
test.describe('A05: Security Misconfiguration', () => {
  test('セキュリティヘッダーの確認', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response.headers();
    
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'strict-transport-security',
      'content-security-policy',
      'x-xss-protection'
    ];
    
    for (const header of requiredHeaders) {
      if (!headers[header]) {
        recordVulnerability(
          'A05',
          `セキュリティヘッダーの欠落: ${header}`,
          'MEDIUM',
          `重要なセキュリティヘッダー ${header} が設定されていない`,
          `${header} ヘッダーを適切に設定する`
        );
      }
    }
  });
  
  test('デフォルト認証情報の確認', async ({ page }) => {
    const defaultCredentials = [
      { username: 'admin', password: 'admin' },
      { username: 'admin', password: 'password' },
      { username: 'test', password: 'test' }
    ];
    
    for (const creds of defaultCredentials) {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', creds.username);
      await page.fill('[data-testid="password"]', creds.password);
      await page.click('[data-testid="login-button"]');
      
      if (page.url().includes('/dashboard')) {
        recordVulnerability(
          'A05',
          'デフォルト認証情報',
          'CRITICAL',
          `デフォルトの認証情報が有効: ${creds.username}/${creds.password}`,
          'すべてのデフォルト認証情報を変更する',
          { credentials: creds }
        );
      }
    }
  });
});

// A06:2021 – 脆弱で古いコンポーネント
test.describe('A06: Vulnerable and Outdated Components', () => {
  test('依存関係の脆弱性チェック', async () => {
    // package.jsonの依存関係をチェック
    try {
      const packageJson = await fs.readFile(
        path.join(__dirname, '../../package.json'),
        'utf-8'
      );
      const dependencies = JSON.parse(packageJson).dependencies || {};
      
      // 既知の脆弱なバージョンをチェック（例）
      const vulnerablePackages = {
        'express': '<4.17.3',
        'jsonwebtoken': '<9.0.0',
        'axios': '<0.21.2'
      };
      
      for (const [pkg, vulnerableVersion] of Object.entries(vulnerablePackages)) {
        if (dependencies[pkg]) {
          // 簡易的なバージョン比較（実際はsemverを使用すべき）
          recordVulnerability(
            'A06',
            `脆弱な依存関係: ${pkg}`,
            'HIGH',
            `${pkg} のバージョンが古い可能性がある`,
            `${pkg} を最新の安全なバージョンに更新する`,
            { package: pkg, currentVersion: dependencies[pkg] }
          );
        }
      }
    } catch (error) {
      console.error('依存関係のチェックエラー:', error);
    }
  });
});

// A07:2021 – 識別と認証の失敗
test.describe('A07: Identification and Authentication Failures', () => {
  test('弱いパスワードポリシー', async ({ page }) => {
    await page.goto('/signup');
    
    const weakPasswords = [
      '123456',
      'password',
      'qwerty',
      'abc123'
    ];
    
    for (const password of weakPasswords) {
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', password);
      await page.click('[data-testid="signup-button"]');
      
      const errorMessage = await page.locator('[data-testid="password-error"]');
      if (!await errorMessage.isVisible()) {
        recordVulnerability(
          'A07',
          '弱いパスワードポリシー',
          'HIGH',
          `弱いパスワードが受け入れられる: ${password}`,
          '強力なパスワードポリシーを実装する（最小長、複雑さ、一般的なパスワードの拒否）'
        );
        break;
      }
    }
  });
  
  test('セッション管理の脆弱性', async ({ page }) => {
    // ログイン
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // セッション情報の確認
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'session' || c.name === 'token');
    
    if (sessionCookie) {
      if (!sessionCookie.secure) {
        recordVulnerability(
          'A07',
          'セッションCookieのセキュリティ設定不備',
          'MEDIUM',
          'セッションCookieにSecureフラグが設定されていない',
          'Secure、HttpOnly、SameSiteフラグを適切に設定する'
        );
      }
      if (!sessionCookie.httpOnly) {
        recordVulnerability(
          'A07',
          'セッションCookieのHttpOnlyフラグ不備',
          'MEDIUM',
          'セッションCookieにHttpOnlyフラグが設定されていない',
          'XSS攻撃からセッションを保護するためHttpOnlyフラグを設定する'
        );
      }
    }
  });
});

// A08:2021 – ソフトウェアとデータの整合性エラー
test.describe('A08: Software and Data Integrity Failures', () => {
  test('CSRF保護の確認', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // フォーム送信時のCSRFトークン確認
    await page.goto('/profile/edit');
    const csrfToken = await page.locator('[name="csrf-token"]').getAttribute('content');
    
    if (!csrfToken) {
      recordVulnerability(
        'A08',
        'CSRF保護の不備',
        'HIGH',
        'CSRFトークンが実装されていない',
        'すべての状態変更操作にCSRFトークンを実装する'
      );
    }
  });
  
  test('コンテンツ整合性の確認', async ({ page }) => {
    const response = await page.goto('/js/app.js');
    const headers = response.headers();
    
    if (!headers['integrity'] && !headers['content-security-policy']?.includes('require-sri-for')) {
      recordVulnerability(
        'A08',
        'サブリソース整合性の不備',
        'MEDIUM',
        '外部リソースに対する整合性チェックが実装されていない',
        'Subresource Integrity (SRI) を使用して外部リソースの整合性を検証する'
      );
    }
  });
});

// A09:2021 – セキュリティログと監視の不備
test.describe('A09: Security Logging and Monitoring Failures', () => {
  test('ログイン失敗のログ記録', async ({ page }) => {
    // 意図的に失敗するログインを試行
    for (let i = 0; i < 5; i++) {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');
    }
    
    // ログの確認（実際にはサーバーサイドで確認が必要）
    recordVulnerability(
      'A09',
      'セキュリティログの検証が必要',
      'INFO',
      'ログイン失敗が適切に記録されているか確認が必要',
      'すべてのセキュリティイベントを適切にログに記録し、監視する'
    );
  });
});

// A10:2021 – サーバーサイドリクエストフォージェリ (SSRF)
test.describe('A10: Server-Side Request Forgery', () => {
  test('SSRF脆弱性のテスト', async ({ page }) => {
    const ssrfPayloads = [
      'http://localhost:22',
      'http://127.0.0.1:3306',
      'http://169.254.169.254/',  // AWS metadata
      'file:///etc/passwd'
    ];
    
    await page.goto('/tools/url-preview');
    
    for (const payload of ssrfPayloads) {
      await page.fill('[data-testid="url-input"]', payload);
      await page.click('[data-testid="preview-button"]');
      
      const response = await page.waitForResponse(resp => resp.url().includes('/api/preview'));
      
      if (response.status() === 200) {
        recordVulnerability(
          'A10',
          'SSRF脆弱性',
          'CRITICAL',
          `内部リソースへのアクセスが可能: ${payload}`,
          'URL入力を適切に検証し、ホワイトリスト方式を採用する',
          { payload }
        );
      }
    }
  });
});

// 監査結果の保存
test.afterAll(async () => {
  const reportPath = path.join(__dirname, '../../reports/owasp-security-audit.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(auditResults, null, 2));
  
  // HTMLレポートの生成
  const htmlReport = generateHTMLReport(auditResults);
  await fs.writeFile(
    path.join(__dirname, '../../reports/owasp-security-audit.html'),
    htmlReport
  );
  
  console.log('\n=== OWASP Top 10 セキュリティ監査結果 ===');
  console.log(`総脆弱性数: ${auditResults.vulnerabilities.length}`);
  console.log(`クリティカル: ${auditResults.summary.critical}`);
  console.log(`高: ${auditResults.summary.high}`);
  console.log(`中: ${auditResults.summary.medium}`);
  console.log(`低: ${auditResults.summary.low}`);
  console.log(`情報: ${auditResults.summary.info}`);
});

// HTMLレポート生成関数
function generateHTMLReport(results) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OWASP Top 10 セキュリティ監査レポート</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        h1, h2 { color: #333; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .summary-card { flex: 1; padding: 15px; border-radius: 8px; color: white; text-align: center; }
        .critical { background: #dc3545; }
        .high { background: #fd7e14; }
        .medium { background: #ffc107; color: #333; }
        .low { background: #28a745; }
        .info { background: #17a2b8; }
        .vulnerability { margin: 20px 0; padding: 15px; border-left: 4px solid #ccc; background: #f8f9fa; }
        .vulnerability.critical { border-color: #dc3545; }
        .vulnerability.high { border-color: #fd7e14; }
        .vulnerability.medium { border-color: #ffc107; }
        .vulnerability.low { border-color: #28a745; }
        .vulnerability.info { border-color: #17a2b8; }
        .metadata { color: #666; font-size: 0.9em; }
        pre { background: #f4f4f4; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>OWASP Top 10 セキュリティ監査レポート</h1>
        <p class="metadata">監査日時: ${results.timestamp}</p>
        <p class="metadata">OWASPバージョン: ${results.owaspVersion}</p>
        
        <h2>サマリー</h2>
        <div class="summary">
            <div class="summary-card critical">
                <h3>${results.summary.critical}</h3>
                <p>クリティカル</p>
            </div>
            <div class="summary-card high">
                <h3>${results.summary.high}</h3>
                <p>高</p>
            </div>
            <div class="summary-card medium">
                <h3>${results.summary.medium}</h3>
                <p>中</p>
            </div>
            <div class="summary-card low">
                <h3>${results.summary.low}</h3>
                <p>低</p>
            </div>
            <div class="summary-card info">
                <h3>${results.summary.info}</h3>
                <p>情報</p>
            </div>
        </div>
        
        <h2>詳細</h2>
        ${results.vulnerabilities.map(vuln => `
            <div class="vulnerability ${vuln.severity.toLowerCase()}">
                <h3>${vuln.category}: ${vuln.title}</h3>
                <p><strong>重要度:</strong> ${vuln.severity}</p>
                <p><strong>説明:</strong> ${vuln.description}</p>
                <p><strong>推奨事項:</strong> ${vuln.recommendation}</p>
                ${vuln.evidence ? `<pre>${JSON.stringify(vuln.evidence, null, 2)}</pre>` : ''}
                <p class="metadata">検出時刻: ${vuln.timestamp}</p>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
}