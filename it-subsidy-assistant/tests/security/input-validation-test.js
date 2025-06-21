/**
 * 入力値検証セキュリティテスト
 * XSS、SQLインジェクション、パストラバーサルなどの攻撃に対する防御テスト
 */

const { test, expect } = require('@playwright/test');

test.describe('入力値検証セキュリティテスト', () => {
  
  test.describe('XSS攻撃の防御', () => {
    const xssPayloads = [
      // 基本的なXSSペイロード
      '<script>alert("XSS")</script>',
      '<img src=x onerror="alert(\'XSS\')" />',
      '<svg onload="alert(\'XSS\')" />',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      
      // エンコーディングを使ったXSS
      '&#60;script&#62;alert("XSS")&#60;/script&#62;',
      '\u003cscript\u003ealert("XSS")\u003c/script\u003e',
      
      // イベントハンドラーを使ったXSS
      '"><script>alert("XSS")</script>',
      "' onclick='alert(\"XSS\")' '",
      
      // DOMベースXSS
      '#<script>alert("XSS")</script>',
      '?search=<script>alert("XSS")</script>'
    ];
    
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'password123');
      await page.click('[data-testid="login-button"]');
    });
    
    test('プロフィール編集画面でのXSS防御', async ({ page }) => {
      for (const payload of xssPayloads) {
        await page.goto('/profile/edit');
        
        // 各入力フィールドにペイロードを入力
        await page.fill('[data-testid="name-input"]', payload);
        await page.fill('[data-testid="bio-input"]', payload);
        await page.click('[data-testid="save-button"]');
        
        // アラートが発生しないことを確認
        let alertTriggered = false;
        page.on('dialog', () => {
          alertTriggered = true;
        });
        
        // プロフィール表示ページでスクリプトが実行されないことを確認
        await page.goto('/profile');
        await page.waitForTimeout(1000);
        
        expect(alertTriggered).toBe(false);
        
        // HTMLがエスケープされて表示されていることを確認
        const nameText = await page.locator('[data-testid="profile-name"]').textContent();
        expect(nameText).not.toContain('<script>');
        expect(nameText).not.toContain('<img');
      }
    });
    
    test('検索機能でのXSS防御', async ({ page }) => {
      await page.goto('/search');
      
      for (const payload of xssPayloads.slice(0, 5)) { // 一部のペイロードでテスト
        await page.fill('[data-testid="search-input"]', payload);
        await page.click('[data-testid="search-button"]');
        
        let alertTriggered = false;
        page.on('dialog', () => {
          alertTriggered = true;
        });
        
        await page.waitForTimeout(1000);
        expect(alertTriggered).toBe(false);
        
        // 検索結果にペイロードがそのまま表示されないことを確認
        const resultsText = await page.locator('[data-testid="search-results"]').textContent();
        expect(resultsText).not.toContain('<script>');
      }
    });
  });
  
  test.describe('SQLインジェクションの防御', () => {
    const sqlPayloads = [
      // 基本的なSQLインジェクション
      "' OR '1'='1",
      "1'; DROP TABLE users; --",
      "admin'--",
      "1 UNION SELECT * FROM users",
      
      // 高度なSQLインジェクション
      "1' AND 1=1--",
      "1' AND 1=2--",
      "1' ORDER BY 1--",
      "1' UNION SELECT NULL--",
      "1' UNION SELECT NULL,NULL--",
      
      // 時間ベースのSQLインジェクション
      "1' AND SLEEP(5)--",
      "1'; WAITFOR DELAY '00:00:05'--"
    ];
    
    test('検索機能でのSQLインジェクション防御', async ({ page }) => {
      await page.goto('/search');
      
      for (const payload of sqlPayloads) {
        await page.fill('[data-testid="search-input"]', payload);
        const startTime = Date.now();
        
        await page.click('[data-testid="search-button"]');
        
        // レスポンスを待つ
        const response = await page.waitForResponse(resp => resp.url().includes('/api/search'));
        const endTime = Date.now();
        
        // エラーが返されないことを確認
        expect(response.status()).not.toBe(500);
        
        // SQLエラーメッセージが公開されないことを確認
        const responseText = await response.text();
        expect(responseText.toLowerCase()).not.toContain('sql');
        expect(responseText.toLowerCase()).not.toContain('syntax error');
        expect(responseText.toLowerCase()).not.toContain('mysql');
        expect(responseText.toLowerCase()).not.toContain('postgresql');
        
        // 時間ベースの攻撃が効いていないことを確認
        const responseTime = endTime - startTime;
        expect(responseTime).toBeLessThan(3000); // 3秒以内
      }
    });
    
    test('ログイン画面でのSQLインジェクション防御', async ({ page }) => {
      for (const payload of sqlPayloads.slice(0, 5)) {
        await page.goto('/login');
        
        await page.fill('[data-testid="email"]', payload);
        await page.fill('[data-testid="password"]', payload);
        await page.click('[data-testid="login-button"]');
        
        // ログインが成功しないことを確認
        expect(page.url()).not.toContain('/dashboard');
        
        // SQLエラーが表示されないことを確認
        const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
        if (errorMessage) {
          expect(errorMessage.toLowerCase()).not.toContain('sql');
          expect(errorMessage.toLowerCase()).not.toContain('database');
        }
      }
    });
  });
  
  test.describe('パストラバーサルの防御', () => {
    const pathTraversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\win.ini',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd',
      '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
      '/var/www/../../etc/passwd',
      'C:\\..\\..\\windows\\win.ini'
    ];
    
    test('ファイルアップロード機能でのパストラバーサル防御', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      await page.goto('/documents/upload');
      
      for (const payload of pathTraversalPayloads) {
        // ファイル名にパストラバーサルペイロードを含むテストファイルを作成
        const fileName = payload.split('/').pop() || 'test.txt';
        
        // APIを直接呼び出してテスト
        const response = await page.evaluate(async (payload) => {
          const formData = new FormData();
          formData.append('file', new Blob(['test content'], { type: 'text/plain' }), payload);
          
          const response = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });
          
          return {
            status: response.status,
            text: await response.text()
          };
        }, payload);
        
        // ファイルが拒否されるか、安全な名前に変更されることを確認
        if (response.status === 200) {
          expect(response.text).not.toContain('..');
          expect(response.text).not.toContain('/etc/');
          expect(response.text).not.toContain('\\windows\\');
        }
      }
    });
  });
  
  test.describe('コマンドインジェクションの防御', () => {
    const commandInjectionPayloads = [
      '; ls -la',
      '| cat /etc/passwd',
      '& dir',
      '`cat /etc/passwd`',
      '$(cat /etc/passwd)',
      '; shutdown -h now',
      '| rm -rf /',
      '& del /f /q C:\\*.*'
    ];
    
    test('PDF生成機能でのコマンドインジェクション防御', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      await page.goto('/documents/generate-pdf');
      
      for (const payload of commandInjectionPayloads) {
        await page.fill('[data-testid="document-title"]', payload);
        await page.fill('[data-testid="document-content"]', payload);
        await page.click('[data-testid="generate-pdf-button"]');
        
        // レスポンスを待つ
        const response = await page.waitForResponse(resp => resp.url().includes('/api/documents/generate-pdf'));
        
        // コマンドが実行されないことを確認
        expect(response.status()).not.toBe(500);
        
        // システム情報が漏洩しないことを確認
        const responseText = await response.text();
        expect(responseText).not.toContain('root:');
        expect(responseText).not.toContain('Administrator:');
        expect(responseText).not.toContain('/bin/bash');
      }
    });
  });
  
  test.describe('XXEインジェクションの防御', () => {
    const xxePayloads = [
      `<?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE foo [
        <!ENTITY xxe SYSTEM "file:///etc/passwd">
      ]>
      <root>&xxe;</root>`,
      
      `<?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE foo [
        <!ENTITY xxe SYSTEM "http://localhost:8080/">
      ]>
      <root>&xxe;</root>`,
      
      `<?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE foo [
        <!ENTITY % xxe SYSTEM "file:///etc/passwd">
        %xxe;
      ]>
      <root>test</root>`
    ];
    
    test('XMLアップロードでのXXE防御', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      await page.goto('/import/xml');
      
      for (const payload of xxePayloads) {
        // XMLファイルをアップロード
        const response = await page.evaluate(async (xmlContent) => {
          const blob = new Blob([xmlContent], { type: 'application/xml' });
          const formData = new FormData();
          formData.append('file', blob, 'test.xml');
          
          const response = await fetch('/api/import/xml', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });
          
          return {
            status: response.status,
            text: await response.text()
          };
        }, payload);
        
        // XXE攻撃が防がれていることを確認
        expect(response.text).not.toContain('root:');
        expect(response.text).not.toContain('/etc/passwd');
        expect(response.text).not.toContain('<!ENTITY');
      }
    });
  });
  
  test.describe('ファイルアップロードのセキュリティ', () => {
    test('危険なファイルタイプの拒否', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      await page.goto('/documents/upload');
      
      const dangerousFileTypes = [
        { name: 'malicious.php', type: 'application/x-php' },
        { name: 'shell.jsp', type: 'application/x-jsp' },
        { name: 'backdoor.aspx', type: 'application/x-aspx' },
        { name: 'virus.exe', type: 'application/x-executable' },
        { name: 'script.sh', type: 'application/x-sh' },
        { name: 'payload.bat', type: 'application/x-batch' }
      ];
      
      for (const file of dangerousFileTypes) {
        const response = await page.evaluate(async (fileInfo) => {
          const blob = new Blob(['malicious content'], { type: fileInfo.type });
          const formData = new FormData();
          formData.append('file', blob, fileInfo.name);
          
          const response = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });
          
          return {
            status: response.status,
            text: await response.text()
          };
        }, file);
        
        // 危険なファイルタイプが拒否されることを確認
        expect(response.status).toBe(400);
        expect(response.text).toContain('許可されていないファイルタイプ');
      }
    });
    
    test('ファイルサイズ制限の確認', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      await page.goto('/documents/upload');
      
      // 100MBの大きなファイルをシミュレート
      const response = await page.evaluate(async () => {
        const largeContent = new Uint8Array(100 * 1024 * 1024); // 100MB
        const blob = new Blob([largeContent], { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('file', blob, 'large-file.pdf');
        
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        return {
          status: response.status,
          text: await response.text()
        };
      });
      
      // 大きすぎるファイルが拒否されることを確認
      expect(response.status).toBe(413);
      expect(response.text).toContain('ファイルサイズが大きすぎます');
    });
  });
  
  test.describe('ビジネスロジックの検証', () => {
    test('負の数値の拒否', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      await page.goto('/application/create');
      
      // 負の金額を入力
      await page.fill('[data-testid="investment-amount"]', '-10000');
      await page.fill('[data-testid="subsidy-amount"]', '-5000');
      await page.click('[data-testid="submit-button"]');
      
      // エラーメッセージが表示されることを確認
      await expect(page.locator('[data-testid="amount-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="amount-error"]')).toContainText('正の数値を入力してください');
    });
    
    test('最大値を超える入力の拒否', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      await page.goto('/application/create');
      
      // 非現実的な大きな数値を入力
      await page.fill('[data-testid="investment-amount"]', '999999999999999');
      await page.fill('[data-testid="employee-count"]', '1000000');
      await page.click('[data-testid="submit-button"]');
      
      // エラーメッセージが表示されることを確認
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    });
    
    test('日付の整合性チェック', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      await page.goto('/application/create');
      
      // 過去の日付を事業開始日に設定
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 2);
      await page.fill('[data-testid="project-start-date"]', pastDate.toISOString().split('T')[0]);
      
      // 終了日を開始日より前に設定
      const endDate = new Date(pastDate);
      endDate.setMonth(endDate.getMonth() - 1);
      await page.fill('[data-testid="project-end-date"]', endDate.toISOString().split('T')[0]);
      
      await page.click('[data-testid="submit-button"]');
      
      // エラーメッセージが表示されることを確認
      await expect(page.locator('[data-testid="date-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="date-error"]')).toContainText('終了日は開始日より後にしてください');
    });
  });
});