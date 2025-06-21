/**
 * セキュリティ監査レポート生成スクリプト
 * 各種セキュリティテストの結果を統合して包括的なレポートを生成
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// セキュリティ監査結果を保存するオブジェクト
const securityAuditReport = {
  timestamp: new Date().toISOString(),
  projectName: 'IT補助金アシストツール',
  summary: {
    totalIssues: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  },
  owaspTop10: [],
  inputValidation: [],
  dependencies: [],
  infrastructure: [],
  recommendations: [],
  complianceStatus: {
    owaspTop10: 'PENDING',
    gdpr: 'PENDING',
    pciDss: 'NOT_APPLICABLE',
    iso27001: 'PENDING'
  }
};

// OWASP Top 10監査の実行
async function runOwaspAudit() {
  console.log('\n🔍 OWASP Top 10監査を実行中...');
  
  try {
    const { stdout, stderr } = await execAsync(
      'npx playwright test tests/security/owasp-top10-audit.js --reporter=json'
    );
    
    // 結果ファイルを読み込み
    const resultsPath = path.join(__dirname, '../reports/owasp-security-audit.json');
    const results = JSON.parse(await fs.readFile(resultsPath, 'utf-8'));
    
    // 結果を統合
    securityAuditReport.owaspTop10 = results.vulnerabilities || [];
    
    // サマリーを更新
    results.vulnerabilities.forEach(vuln => {
      securityAuditReport.summary.totalIssues++;
      securityAuditReport.summary[vuln.severity.toLowerCase()]++;
    });
    
    console.log('✅ OWASP Top 10監査完了');
  } catch (error) {
    console.error('❌ OWASP Top 10監査エラー:', error.message);
  }
}

// 入力値検証テストの実行
async function runInputValidationTests() {
  console.log('\n🔍 入力値検証テストを実行中...');
  
  try {
    const { stdout } = await execAsync(
      'npx playwright test tests/security/input-validation-test.js --reporter=json'
    );
    
    // テスト結果をパース
    const results = JSON.parse(stdout);
    
    // 失敗したテストを脆弱性として記録
    if (results.errors && results.errors.length > 0) {
      results.errors.forEach(error => {
        securityAuditReport.inputValidation.push({
          title: error.title,
          severity: 'HIGH',
          description: error.message,
          location: error.location
        });
        securityAuditReport.summary.totalIssues++;
        securityAuditReport.summary.high++;
      });
    }
    
    console.log('✅ 入力値検証テスト完了');
  } catch (error) {
    console.error('❌ 入力値検証テストエラー:', error.message);
  }
}

// 依存関係の脆弱性チェック
async function checkDependencies() {
  console.log('\n🔍 依存関係の脆弱性をチェック中...');
  
  try {
    // npm auditを実行
    const { stdout } = await execAsync('npm audit --json', {
      cwd: path.join(__dirname, '..')
    });
    
    const auditResult = JSON.parse(stdout);
    
    if (auditResult.vulnerabilities) {
      Object.entries(auditResult.vulnerabilities).forEach(([pkg, vuln]) => {
        securityAuditReport.dependencies.push({
          package: pkg,
          severity: vuln.severity.toUpperCase(),
          title: vuln.title,
          fixAvailable: vuln.fixAvailable,
          recommendation: vuln.fixAvailable ? 
            `${pkg}を最新バージョンに更新してください` : 
            `${pkg}の代替パッケージを検討してください`
        });
        
        securityAuditReport.summary.totalIssues++;
        securityAuditReport.summary[vuln.severity.toLowerCase()]++;
      });
    }
    
    console.log('✅ 依存関係チェック完了');
  } catch (error) {
    console.error('❌ 依存関係チェックエラー:', error.message);
  }
}

// インフラストラクチャのセキュリティチェック
async function checkInfrastructure() {
  console.log('\n🔍 インフラストラクチャのセキュリティをチェック中...');
  
  // 環境変数のチェック
  const envFile = path.join(__dirname, '../backend/.env');
  try {
    const envContent = await fs.readFile(envFile, 'utf-8');
    
    // 機密情報のハードコーディングをチェック
    const sensitivePatterns = [
      /DB_PASSWORD=['"]?[^\s'"]+['"]?/gi,
      /API_KEY=['"]?[^\s'"]+['"]?/gi,
      /SECRET=['"]?[^\s'"]+['"]?/gi
    ];
    
    sensitivePatterns.forEach(pattern => {
      if (pattern.test(envContent)) {
        securityAuditReport.infrastructure.push({
          title: '環境変数に機密情報が含まれている',
          severity: 'MEDIUM',
          description: '.envファイルに機密情報がハードコーディングされています',
          recommendation: '環境変数管理サービスまたはシークレット管理サービスを使用してください'
        });
        securityAuditReport.summary.totalIssues++;
        securityAuditReport.summary.medium++;
      }
    });
  } catch (error) {
    // .envファイルが存在しない場合はスキップ
  }
  
  // HTTPS設定の確認
  const configFiles = [
    'backend/src/index.ts',
    'frontend/vite.config.ts'
  ];
  
  for (const configFile of configFiles) {
    try {
      const content = await fs.readFile(path.join(__dirname, '..', configFile), 'utf-8');
      
      if (!content.includes('https:') && !content.includes('secure: true')) {
        securityAuditReport.infrastructure.push({
          title: `HTTPSが設定されていない: ${configFile}`,
          severity: 'HIGH',
          description: 'アプリケーションがHTTPSを使用していない可能性があります',
          recommendation: '本番環境ではHTTPSを必ず有効化してください'
        });
        securityAuditReport.summary.totalIssues++;
        securityAuditReport.summary.high++;
      }
    } catch (error) {
      // ファイルが存在しない場合はスキップ
    }
  }
  
  console.log('✅ インフラストラクチャチェック完了');
}

// 推奨事項の生成
function generateRecommendations() {
  console.log('\n💡 推奨事項を生成中...');
  
  // クリティカルな問題がある場合
  if (securityAuditReport.summary.critical > 0) {
    securityAuditReport.recommendations.push({
      priority: 'URGENT',
      title: 'クリティカルな脆弱性の即座の修正',
      description: `${securityAuditReport.summary.critical}件のクリティカルな脆弱性が発見されました。これらは直ちに修正する必要があります。`,
      actions: [
        'クリティカルな脆弱性を優先的に修正',
        '修正後に再テストを実施',
        'セキュリティインシデント対応計画を立案'
      ]
    });
  }
  
  // 高リスクの問題がある場合
  if (securityAuditReport.summary.high > 0) {
    securityAuditReport.recommendations.push({
      priority: 'HIGH',
      title: '高リスク脆弱性の早急な対応',
      description: `${securityAuditReport.summary.high}件の高リスク脆弱性が発見されました。`,
      actions: [
        'リリース前にすべての高リスク問題を修正',
        'セキュリティテストをCI/CDパイプラインに統合',
        '定期的なセキュリティ監査の実施'
      ]
    });
  }
  
  // 依存関係の問題がある場合
  if (securityAuditReport.dependencies.length > 0) {
    securityAuditReport.recommendations.push({
      priority: 'MEDIUM',
      title: '依存関係の更新',
      description: `${securityAuditReport.dependencies.length}件の脆弱な依存関係が発見されました。`,
      actions: [
        'npm audit fixを実行して自動修正を試みる',
        '修正が困難なパッケージは代替を検討',
        'Dependabotなどの自動更新ツールを導入'
      ]
    });
  }
  
  // 一般的なセキュリティ強化の推奨
  securityAuditReport.recommendations.push({
    priority: 'LOW',
    title: '継続的なセキュリティ改善',
    description: 'セキュリティは継続的なプロセスです。',
    actions: [
      '定期的なセキュリティトレーニングの実施',
      'セキュリティポリシーの策定と更新',
      'ペネトレーションテストの定期実施',
      'セキュリティインシデント対応計画の策定'
    ]
  });
  
  console.log('✅ 推奨事項の生成完了');
}

// コンプライアンス状態の評価
function evaluateCompliance() {
  console.log('\n📊 コンプライアンス状態を評価中...');
  
  // OWASP Top 10コンプライアンス
  if (securityAuditReport.summary.critical === 0 && securityAuditReport.summary.high === 0) {
    securityAuditReport.complianceStatus.owaspTop10 = 'COMPLIANT';
  } else if (securityAuditReport.summary.critical === 0) {
    securityAuditReport.complianceStatus.owaspTop10 = 'PARTIAL';
  } else {
    securityAuditReport.complianceStatus.owaspTop10 = 'NON_COMPLIANT';
  }
  
  // GDPRコンプライアンス（簡易評価）
  const hasDataProtection = securityAuditReport.owaspTop10.filter(
    v => v.category === 'A02' || v.category === 'A04'
  ).length === 0;
  
  if (hasDataProtection) {
    securityAuditReport.complianceStatus.gdpr = 'COMPLIANT';
  } else {
    securityAuditReport.complianceStatus.gdpr = 'REQUIRES_REVIEW';
  }
  
  // ISO 27001コンプライアンス
  if (securityAuditReport.summary.totalIssues < 10) {
    securityAuditReport.complianceStatus.iso27001 = 'COMPLIANT';
  } else {
    securityAuditReport.complianceStatus.iso27001 = 'REQUIRES_IMPROVEMENT';
  }
  
  console.log('✅ コンプライアンス評価完了');
}

// HTMLレポートの生成
function generateHTMLReport() {
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>セキュリティ監査総合レポート</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #333; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; border-radius: 10px; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header h1 { color: #2c3e50; margin-bottom: 10px; }
        .header .meta { color: #7f8c8d; font-size: 14px; }
        
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: white; border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .summary-card:hover { transform: translateY(-5px); }
        .summary-card.critical { border-top: 4px solid #e74c3c; }
        .summary-card.high { border-top: 4px solid #e67e22; }
        .summary-card.medium { border-top: 4px solid #f39c12; }
        .summary-card.low { border-top: 4px solid #27ae60; }
        .summary-card.info { border-top: 4px solid #3498db; }
        .summary-card h3 { font-size: 36px; margin: 10px 0; }
        .summary-card p { color: #7f8c8d; text-transform: uppercase; font-size: 12px; font-weight: 600; }
        
        .section { background: white; border-radius: 10px; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .section h2 { color: #2c3e50; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #ecf0f1; }
        
        .vulnerability { margin-bottom: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #bdc3c7; }
        .vulnerability.critical { border-left-color: #e74c3c; background: #ffeee9; }
        .vulnerability.high { border-left-color: #e67e22; background: #fff5e9; }
        .vulnerability.medium { border-left-color: #f39c12; background: #fffbe9; }
        .vulnerability.low { border-left-color: #27ae60; background: #eafaf1; }
        .vulnerability.info { border-left-color: #3498db; background: #e9f2ff; }
        
        .vulnerability h3 { margin-bottom: 10px; color: #2c3e50; }
        .vulnerability .severity { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 10px; }
        .vulnerability.critical .severity { background: #e74c3c; color: white; }
        .vulnerability.high .severity { background: #e67e22; color: white; }
        .vulnerability.medium .severity { background: #f39c12; color: white; }
        .vulnerability.low .severity { background: #27ae60; color: white; }
        .vulnerability.info .severity { background: #3498db; color: white; }
        
        .recommendation { margin-bottom: 20px; padding: 20px; background: #f0f8ff; border-radius: 8px; border-left: 4px solid #3498db; }
        .recommendation h3 { color: #2c3e50; margin-bottom: 10px; }
        .recommendation .priority { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 10px; background: #3498db; color: white; }
        .recommendation .priority.urgent { background: #e74c3c; }
        .recommendation .priority.high { background: #e67e22; }
        .recommendation ul { margin-left: 20px; margin-top: 10px; }
        
        .compliance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .compliance-card { padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center; }
        .compliance-card h4 { margin-bottom: 10px; color: #2c3e50; }
        .compliance-card .status { padding: 8px 16px; border-radius: 20px; font-weight: 600; display: inline-block; }
        .compliance-card .compliant { background: #27ae60; color: white; }
        .compliance-card .partial { background: #f39c12; color: white; }
        .compliance-card .non-compliant { background: #e74c3c; color: white; }
        .compliance-card .pending { background: #95a5a6; color: white; }
        .compliance-card .not-applicable { background: #7f8c8d; color: white; }
        
        .footer { text-align: center; color: #7f8c8d; padding: 20px; }
        
        @media print {
            .section { break-inside: avoid; }
            .vulnerability { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 セキュリティ監査総合レポート</h1>
            <p class="meta">プロジェクト: ${securityAuditReport.projectName}</p>
            <p class="meta">監査日時: ${new Date(securityAuditReport.timestamp).toLocaleString('ja-JP')}</p>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card critical">
                <h3>${securityAuditReport.summary.critical}</h3>
                <p>クリティカル</p>
            </div>
            <div class="summary-card high">
                <h3>${securityAuditReport.summary.high}</h3>
                <p>高</p>
            </div>
            <div class="summary-card medium">
                <h3>${securityAuditReport.summary.medium}</h3>
                <p>中</p>
            </div>
            <div class="summary-card low">
                <h3>${securityAuditReport.summary.low}</h3>
                <p>低</p>
            </div>
            <div class="summary-card info">
                <h3>${securityAuditReport.summary.info}</h3>
                <p>情報</p>
            </div>
        </div>
        
        <div class="section">
            <h2>🎯 コンプライアンス状態</h2>
            <div class="compliance-grid">
                <div class="compliance-card">
                    <h4>OWASP Top 10</h4>
                    <span class="status ${securityAuditReport.complianceStatus.owaspTop10.toLowerCase().replace('_', '-')}">
                        ${securityAuditReport.complianceStatus.owaspTop10.replace('_', ' ')}
                    </span>
                </div>
                <div class="compliance-card">
                    <h4>GDPR</h4>
                    <span class="status ${securityAuditReport.complianceStatus.gdpr.toLowerCase().replace('_', '-')}">
                        ${securityAuditReport.complianceStatus.gdpr.replace('_', ' ')}
                    </span>
                </div>
                <div class="compliance-card">
                    <h4>PCI-DSS</h4>
                    <span class="status ${securityAuditReport.complianceStatus.pciDss.toLowerCase().replace('_', '-')}">
                        ${securityAuditReport.complianceStatus.pciDss.replace('_', ' ')}
                    </span>
                </div>
                <div class="compliance-card">
                    <h4>ISO 27001</h4>
                    <span class="status ${securityAuditReport.complianceStatus.iso27001.toLowerCase().replace('_', '-')}">
                        ${securityAuditReport.complianceStatus.iso27001.replace('_', ' ')}
                    </span>
                </div>
            </div>
        </div>
        
        ${securityAuditReport.owaspTop10.length > 0 ? `
        <div class="section">
            <h2>🔍 OWASP Top 10 脆弱性</h2>
            ${securityAuditReport.owaspTop10.map(vuln => `
                <div class="vulnerability ${vuln.severity.toLowerCase()}">
                    <span class="severity">${vuln.severity}</span>
                    <h3>${vuln.category}: ${vuln.title}</h3>
                    <p><strong>説明:</strong> ${vuln.description}</p>
                    <p><strong>推奨:</strong> ${vuln.recommendation}</p>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${securityAuditReport.dependencies.length > 0 ? `
        <div class="section">
            <h2>📦 依存関係の脆弱性</h2>
            ${securityAuditReport.dependencies.map(dep => `
                <div class="vulnerability ${dep.severity.toLowerCase()}">
                    <span class="severity">${dep.severity}</span>
                    <h3>${dep.package}</h3>
                    <p><strong>問題:</strong> ${dep.title}</p>
                    <p><strong>修正:</strong> ${dep.recommendation}</p>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="section">
            <h2>💡 推奨事項</h2>
            ${securityAuditReport.recommendations.map(rec => `
                <div class="recommendation">
                    <span class="priority ${rec.priority.toLowerCase()}">${rec.priority}</span>
                    <h3>${rec.title}</h3>
                    <p>${rec.description}</p>
                    <ul>
                        ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>このレポートは ${new Date().toLocaleString('ja-JP')} に生成されました</p>
        </div>
    </div>
</body>
</html>`;
  
  return html;
}

// メイン実行関数
async function main() {
  console.log('\n🔒 IT補助金アシストツール - セキュリティ監査レポート\n');
  console.log('='.repeat(60));
  
  try {
    // 各種監査の実行
    await runOwaspAudit();
    await runInputValidationTests();
    await checkDependencies();
    await checkInfrastructure();
    
    // 推奨事項とコンプライアンス評価
    generateRecommendations();
    evaluateCompliance();
    
    // レポートの保存
    const reportDir = path.join(__dirname, '../reports');
    await fs.mkdir(reportDir, { recursive: true });
    
    // JSONレポートの保存
    await fs.writeFile(
      path.join(reportDir, 'security-audit-report.json'),
      JSON.stringify(securityAuditReport, null, 2)
    );
    
    // HTMLレポートの保存
    const htmlReport = generateHTMLReport();
    await fs.writeFile(
      path.join(reportDir, 'security-audit-report.html'),
      htmlReport
    );
    
    // サマリーの表示
    console.log('\n' + '='.repeat(60));
    console.log('📊 監査結果サマリー');
    console.log('='.repeat(60));
    console.log(`総脆弱性数: ${securityAuditReport.summary.totalIssues}`);
    console.log(`  - クリティカル: ${securityAuditReport.summary.critical}`);
    console.log(`  - 高: ${securityAuditReport.summary.high}`);
    console.log(`  - 中: ${securityAuditReport.summary.medium}`);
    console.log(`  - 低: ${securityAuditReport.summary.low}`);
    console.log(`  - 情報: ${securityAuditReport.summary.info}`);
    console.log('\n📄 レポートが以下に保存されました:');
    console.log(`  - ${path.join(reportDir, 'security-audit-report.html')}`);
    console.log(`  - ${path.join(reportDir, 'security-audit-report.json')}`);
    
    // 重要な警告
    if (securityAuditReport.summary.critical > 0) {
      console.log('\n⚠️  警告: クリティカルな脆弱性が発見されました！');
      console.log('   直ちに修正してください。');
    }
    
  } catch (error) {
    console.error('\n❌ セキュリティ監査中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトの実行
if (require.main === module) {
  main();
}

module.exports = { main };