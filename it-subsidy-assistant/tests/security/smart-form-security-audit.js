/**
 * スマートフォームシステム セキュリティ監査
 * XSS、CSRF、SQLインジェクション、ファイルアップロード脆弱性の包括的チェック
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SmartFormSecurityAuditor {
  constructor() {
    this.vulnerabilities = [];
    this.testResults = {
      xss: { tested: 0, vulnerable: 0, details: [] },
      csrf: { tested: 0, vulnerable: 0, details: [] },
      injection: { tested: 0, vulnerable: 0, details: [] },
      fileUpload: { tested: 0, vulnerable: 0, details: [] },
      inputValidation: { tested: 0, vulnerable: 0, details: [] }
    };
  }

  // XSS脆弱性テスト
  async testXSSVulnerabilities(page) {
    console.log('🔍 XSS脆弱性テストを開始...');
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      '\'; alert("XSS"); //',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<body onload=alert("XSS")>',
      '<input onfocus=alert("XSS") autofocus>',
      '<marquee onstart=alert("XSS")>'
    ];

    // フォーム入力フィールドの取得
    const inputSelectors = await page.$$eval('input, textarea, select', elements => 
      elements.map(el => ({
        tagName: el.tagName,
        type: el.type || '',
        name: el.name || '',
        id: el.id || '',
        selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : el.name ? `[name="${el.name}"]` : '')
      }))
    );

    for (const input of inputSelectors) {
      for (const payload of xssPayloads) {
        this.testResults.xss.tested++;
        
        try {
          // XSSペイロードを入力
          await page.focus(input.selector);
          await page.keyboard.type(payload);
          
          // フォーム送信またはイベント発火をトリガー
          await page.keyboard.press('Tab');
          
          // アラートダイアログの検出
          const dialogDetected = await page.evaluate(() => {
            return new Promise((resolve) => {
              const originalAlert = window.alert;
              let alertTriggered = false;
              
              window.alert = function(message) {
                alertTriggered = true;
                originalAlert.call(window, message);
                return true;
              };
              
              setTimeout(() => {
                window.alert = originalAlert;
                resolve(alertTriggered);
              }, 1000);
            });
          });

          if (dialogDetected) {
            this.testResults.xss.vulnerable++;
            this.testResults.xss.details.push({
              field: input.selector,
              payload: payload,
              severity: 'HIGH',
              description: 'XSS実行可能な入力フィールドを発見'
            });
          }

          // DOM内での反映確認
          const xssInDOM = await page.evaluate((payload) => {
            return document.body.innerHTML.includes(payload.replace(/[<>]/g, ''));
          }, payload);

          if (xssInDOM) {
            this.testResults.xss.vulnerable++;
            this.testResults.xss.details.push({
              field: input.selector,
              payload: payload,
              severity: 'MEDIUM',
              description: 'サニタイズされていないユーザー入力がDOMに反映'
            });
          }

          // フィールドをクリア
          await page.focus(input.selector);
          await page.keyboard.down('Control');
          await page.keyboard.press('a');
          await page.keyboard.up('Control');
          await page.keyboard.press('Delete');

        } catch (error) {
          console.warn(`XSSテストエラー (${input.selector}):`, error.message);
        }
      }
    }
  }

  // CSRF脆弱性テスト
  async testCSRFVulnerabilities(page) {
    console.log('🔍 CSRF脆弱性テストを開始...');
    
    this.testResults.csrf.tested++;

    // CSRFトークンの存在確認
    const csrfTokenExists = await page.evaluate(() => {
      const metaToken = document.querySelector('meta[name="csrf-token"]');
      const inputToken = document.querySelector('input[name="_token"], input[name="csrf_token"]');
      const headerToken = document.querySelector('script').textContent.includes('X-CSRF-TOKEN');
      
      return !!(metaToken || inputToken || headerToken);
    });

    if (!csrfTokenExists) {
      this.testResults.csrf.vulnerable++;
      this.testResults.csrf.details.push({
        issue: 'CSRFトークンが見つかりません',
        severity: 'HIGH',
        description: 'フォームにCSRFプロテクションが実装されていない可能性'
      });
    }

    // SameSite Cookieの確認
    const cookies = await page.cookies();
    const sessionCookies = cookies.filter(cookie => 
      cookie.name.toLowerCase().includes('session') || 
      cookie.name.toLowerCase().includes('token')
    );

    for (const cookie of sessionCookies) {
      if (!cookie.sameSite || cookie.sameSite === 'None') {
        this.testResults.csrf.vulnerable++;
        this.testResults.csrf.details.push({
          issue: `Cookieの SameSite 属性が不適切: ${cookie.name}`,
          severity: 'MEDIUM',
          description: 'SameSite=Strict または Lax を設定してCSRFを防止'
        });
      }
    }
  }

  // SQLインジェクション脆弱性テスト
  async testSQLInjectionVulnerabilities(page) {
    console.log('🔍 SQLインジェクション脆弱性テストを開始...');

    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "' OR 1=1 --",
      "'; EXEC xp_cmdshell('dir'); --",
      "' OR 'x'='x",
      "1' OR '1'='1' --",
      "'; WAITFOR DELAY '00:00:05' --",
      "' AND (SELECT COUNT(*) FROM information_schema.tables)>0 --"
    ];

    const inputSelectors = await page.$$eval('input[type="text"], input[type="email"], textarea', elements => 
      elements.map(el => el.id || el.name || el.className).filter(Boolean)
    );

    for (const selector of inputSelectors) {
      for (const payload of sqlInjectionPayloads) {
        this.testResults.injection.tested++;

        try {
          await page.focus(`#${selector}, [name="${selector}"], .${selector}`);
          await page.keyboard.type(payload);
          
          // フォーム送信をシミュレート
          await page.keyboard.press('Enter');
          
          // エラーメッセージまたは異常な応答の検出
          await page.waitForTimeout(1000);
          
          const errorDetected = await page.evaluate(() => {
            const errorKeywords = [
              'sql', 'mysql', 'postgresql', 'oracle', 'sqlite',
              'syntax error', 'unexpected', 'database',
              'column', 'table', 'query'
            ];
            
            const pageText = document.body.textContent.toLowerCase();
            return errorKeywords.some(keyword => pageText.includes(keyword));
          });

          if (errorDetected) {
            this.testResults.injection.vulnerable++;
            this.testResults.injection.details.push({
              field: selector,
              payload: payload,
              severity: 'CRITICAL',
              description: 'SQLエラーメッセージが検出されました - SQLインジェクションの可能性'
            });
          }

          // フィールドをクリア
          await page.focus(`#${selector}, [name="${selector}"], .${selector}`);
          await page.keyboard.down('Control');
          await page.keyboard.press('a');
          await page.keyboard.up('Control');
          await page.keyboard.press('Delete');

        } catch (error) {
          console.warn(`SQLインジェクションテストエラー (${selector}):`, error.message);
        }
      }
    }
  }

  // ファイルアップロード脆弱性テスト
  async testFileUploadVulnerabilities(page) {
    console.log('🔍 ファイルアップロード脆弱性テストを開始...');

    const fileInputs = await page.$$('input[type="file"]');
    
    if (fileInputs.length === 0) {
      console.log('ファイルアップロード機能が見つかりません');
      return;
    }

    // 危険なファイルタイプのテスト
    const maliciousFiles = [
      { name: 'test.php', content: '<?php echo "PHP executed"; ?>', mimeType: 'application/x-php' },
      { name: 'test.jsp', content: '<% out.println("JSP executed"); %>', mimeType: 'application/x-jsp' },
      { name: 'test.asp', content: '<% Response.Write("ASP executed") %>', mimeType: 'application/x-asp' },
      { name: 'test.exe', content: 'MZ\x90\x00', mimeType: 'application/x-msdownload' },
      { name: 'test.bat', content: '@echo off\necho Batch executed', mimeType: 'application/x-bat' },
      { name: 'test.js', content: 'alert("JavaScript executed");', mimeType: 'application/javascript' }
    ];

    for (let i = 0; i < fileInputs.length; i++) {
      this.testResults.fileUpload.tested++;

      for (const maliciousFile of maliciousFiles) {
        try {
          // 一時的な悪意のあるファイルを作成
          const tempFilePath = path.join(__dirname, '..', 'temp', maliciousFile.name);
          fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
          fs.writeFileSync(tempFilePath, maliciousFile.content);

          // ファイルアップロードを試行
          await fileInputs[i].uploadFile(tempFilePath);
          
          // アップロード後の応答を確認
          await page.waitForTimeout(2000);
          
          const uploadSuccess = await page.evaluate(() => {
            const successKeywords = ['success', 'uploaded', 'complete'];
            const pageText = document.body.textContent.toLowerCase();
            return successKeywords.some(keyword => pageText.includes(keyword));
          });

          if (uploadSuccess) {
            this.testResults.fileUpload.vulnerable++;
            this.testResults.fileUpload.details.push({
              file: maliciousFile.name,
              severity: 'HIGH',
              description: `危険なファイルタイプ (${maliciousFile.name}) のアップロードが成功`
            });
          }

          // 一時ファイルを削除
          fs.unlinkSync(tempFilePath);

        } catch (error) {
          console.warn(`ファイルアップロードテストエラー:`, error.message);
        }
      }
    }

    // ファイルサイズ制限のテスト
    try {
      const largeFileContent = 'A'.repeat(100 * 1024 * 1024); // 100MB
      const largeFilePath = path.join(__dirname, '..', 'temp', 'large_file.txt');
      fs.writeFileSync(largeFilePath, largeFileContent);

      await fileInputs[0].uploadFile(largeFilePath);
      
      const largeSizeAccepted = await page.evaluate(() => {
        const pageText = document.body.textContent.toLowerCase();
        return !pageText.includes('too large') && !pageText.includes('size limit');
      });

      if (largeSizeAccepted) {
        this.testResults.fileUpload.vulnerable++;
        this.testResults.fileUpload.details.push({
          issue: 'ファイルサイズ制限が適切でない',
          severity: 'MEDIUM',
          description: '大きなファイルのアップロードが制限されていない'
        });
      }

      fs.unlinkSync(largeFilePath);
    } catch (error) {
      console.warn('ファイルサイズテストエラー:', error.message);
    }
  }

  // 入力検証脆弱性テスト
  async testInputValidationVulnerabilities(page) {
    console.log('🔍 入力検証脆弱性テストを開始...');

    const validationTestCases = [
      { field: 'email', invalid: 'invalid-email', description: 'メールアドレス形式の検証' },
      { field: 'phone', invalid: 'abc123', description: '電話番号形式の検証' },
      { field: 'number', invalid: 'not-a-number', description: '数値形式の検証' },
      { field: 'url', invalid: 'not-a-url', description: 'URL形式の検証' },
      { field: 'date', invalid: '2025-13-40', description: '日付形式の検証' }
    ];

    for (const testCase of validationTestCases) {
      this.testResults.inputValidation.tested++;

      const inputSelectors = await page.$$eval(
        `input[type="${testCase.field}"], input[name*="${testCase.field}"], input[id*="${testCase.field}"]`,
        elements => elements.map(el => el.id || el.name || el.className).filter(Boolean)
      );

      for (const selector of inputSelectors) {
        try {
          await page.focus(`#${selector}, [name="${selector}"], .${selector}`);
          await page.keyboard.type(testCase.invalid);
          await page.keyboard.press('Tab');
          
          // バリデーションエラーが表示されるかチェック
          await page.waitForTimeout(1000);
          
          const validationError = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('.error, .invalid, [class*="error"], [class*="invalid"]');
            return errorElements.length > 0;
          });

          if (!validationError) {
            this.testResults.inputValidation.vulnerable++;
            this.testResults.inputValidation.details.push({
              field: selector,
              issue: testCase.description,
              severity: 'MEDIUM',
              description: `${testCase.field}フィールドで不正な値が受け入れられました`
            });
          }

          // フィールドをクリア
          await page.focus(`#${selector}, [name="${selector}"], .${selector}`);
          await page.keyboard.down('Control');
          await page.keyboard.press('a');
          await page.keyboard.up('Control');
          await page.keyboard.press('Delete');

        } catch (error) {
          console.warn(`入力検証テストエラー (${selector}):`, error.message);
        }
      }
    }
  }

  // セキュリティヘッダーのチェック
  async checkSecurityHeaders(page) {
    console.log('🔍 セキュリティヘッダーを確認...');

    const response = page.response();
    const headers = response ? await response.headers() : {};

    const requiredHeaders = {
      'content-security-policy': 'Content Security Policy',
      'x-frame-options': 'X-Frame-Options',
      'x-content-type-options': 'X-Content-Type-Options',
      'referrer-policy': 'Referrer Policy',
      'permissions-policy': 'Permissions Policy'
    };

    const missingHeaders = [];
    
    for (const [headerName, description] of Object.entries(requiredHeaders)) {
      if (!headers[headerName]) {
        missingHeaders.push({
          header: headerName,
          description: description,
          severity: 'MEDIUM'
        });
      }
    }

    return missingHeaders;
  }

  // メインの監査実行
  async runSecurityAudit(url = 'http://localhost:5174') {
    console.log('🚀 スマートフォームセキュリティ監査を開始...');
    
    const browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // セキュリティ関連のイベントリスナーを設定
      page.on('dialog', dialog => {
        console.log('⚠️  ダイアログ検出:', dialog.message());
        dialog.dismiss();
      });

      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('🔴 コンソールエラー:', msg.text());
        }
      });

      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // 各テストを実行
      await this.testXSSVulnerabilities(page);
      await this.testCSRFVulnerabilities(page);
      await this.testSQLInjectionVulnerabilities(page);
      await this.testFileUploadVulnerabilities(page);
      await this.testInputValidationVulnerabilities(page);
      
      const missingHeaders = await this.checkSecurityHeaders(page);
      
      // 結果をまとめる
      const report = this.generateSecurityReport(missingHeaders);
      
      return report;
    } finally {
      await browser.close();
    }
  }

  // セキュリティレポート生成
  generateSecurityReport(missingHeaders) {
    const totalVulnerabilities = Object.values(this.testResults)
      .reduce((sum, result) => sum + result.vulnerable, 0);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: Object.values(this.testResults).reduce((sum, result) => sum + result.tested, 0),
        totalVulnerabilities: totalVulnerabilities,
        riskLevel: totalVulnerabilities === 0 ? 'LOW' : 
                   totalVulnerabilities <= 5 ? 'MEDIUM' : 'HIGH'
      },
      testResults: this.testResults,
      missingSecurityHeaders: missingHeaders,
      recommendations: this.generateRecommendations()
    };

    // レポートファイルに保存
    const reportPath = path.join(__dirname, '../../reports/smart-form-security-audit.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('📊 セキュリティ監査レポートを生成:', reportPath);
    
    return report;
  }

  // 推奨事項の生成
  generateRecommendations() {
    const recommendations = [];

    if (this.testResults.xss.vulnerable > 0) {
      recommendations.push({
        category: 'XSS対策',
        priority: 'HIGH',
        action: 'すべてのユーザー入力をサニタイズし、出力時にエスケープ処理を実装'
      });
    }

    if (this.testResults.csrf.vulnerable > 0) {
      recommendations.push({
        category: 'CSRF対策',
        priority: 'HIGH',
        action: 'CSRFトークンの実装とSameSiteクッキーの設定'
      });
    }

    if (this.testResults.injection.vulnerable > 0) {
      recommendations.push({
        category: 'SQLインジェクション対策',
        priority: 'CRITICAL',
        action: 'パラメータ化クエリの使用とORM活用'
      });
    }

    if (this.testResults.fileUpload.vulnerable > 0) {
      recommendations.push({
        category: 'ファイルアップロード対策',
        priority: 'HIGH',
        action: 'ファイルタイプ検証、サイズ制限、アップロード先の分離'
      });
    }

    if (this.testResults.inputValidation.vulnerable > 0) {
      recommendations.push({
        category: '入力検証強化',
        priority: 'MEDIUM',
        action: 'クライアント・サーバー両側での包括的なバリデーション実装'
      });
    }

    return recommendations;
  }
}

// 監査実行
async function runAudit() {
  const auditor = new SmartFormSecurityAuditor();
  try {
    const report = await auditor.runSecurityAudit();
    
    console.log('\n🎯 セキュリティ監査完了:');
    console.log(`総テスト数: ${report.summary.totalTests}`);
    console.log(`発見された脆弱性: ${report.summary.totalVulnerabilities}`);
    console.log(`リスクレベル: ${report.summary.riskLevel}`);
    
    return report;
  } catch (error) {
    console.error('セキュリティ監査中にエラーが発生:', error);
    throw error;
  }
}

module.exports = { SmartFormSecurityAuditor, runAudit };

if (require.main === module) {
  runAudit();
}