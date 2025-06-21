/**
 * 完全統合テスト - 6つの質問からExcel出力まで
 * Worker1とWorker2の成果物の統合品質確認
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('完全統合テスト - Worker1・Worker2統合', () => {
  let frontendProcess;
  let backendProcess;
  
  beforeAll(async () => {
    // フロントエンド起動
    frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '../../frontend'),
      stdio: 'pipe'
    });
    
    // バックエンド起動
    backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '../../backend'),
      stdio: 'pipe'
    });
    
    // 起動待機
    await new Promise(resolve => setTimeout(resolve, 10000));
  }, 30000);

  afterAll(() => {
    if (frontendProcess) frontendProcess.kill();
    if (backendProcess) backendProcess.kill();
  });

  test('6つの基礎質問フロー統合テスト', async () => {
    const fetch = (await import('node-fetch')).default;
    
    // 1. フロントエンドのヘルスチェック
    const frontendResponse = await fetch('http://localhost:3000');
    expect(frontendResponse.status).toBe(200);
    
    // 2. バックエンドAPIのヘルスチェック
    const backendResponse = await fetch('http://localhost:8000/api/health');
    expect(backendResponse.status).toBe(200);
    
    // 3. 診断APIテスト
    const diagnosisResponse = await fetch('http://localhost:8000/api/diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        situation: 'existing',
        employeeCount: 'small',
        businessField: 'it',
        investment: 'digital',
        budget: '100to500',
        timeline: 'quarter'
      })
    });
    
    expect(diagnosisResponse.status).toBe(200);
    const diagnosisData = await diagnosisResponse.json();
    expect(diagnosisData).toHaveProperty('subsidies');
    expect(diagnosisData.subsidies.length).toBeGreaterThan(0);
    
    // 4. 推奨補助金がIT導入補助金であることを確認
    const recommended = diagnosisData.subsidies.find(s => s.recommended);
    expect(recommended).toBeDefined();
    expect(recommended.name).toContain('IT導入補助金');
  });

  test('Excel出力品質検証', async () => {
    const fetch = (await import('node-fetch')).default;
    
    // Excel生成テスト
    const excelResponse = await fetch('http://localhost:8000/api/excel/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subsidyType: 'it-donyu',
        formData: {
          companyName: 'テスト株式会社',
          representativeName: '山田太郎',
          applicationAmount: 1000000
        }
      })
    });
    
    expect(excelResponse.status).toBe(200);
    const excelData = await excelResponse.json();
    expect(excelData).toHaveProperty('downloadUrls');
    expect(excelData.downloadUrls.length).toBeGreaterThan(0);
  });

  test('データ受け渡し整合性確認', async () => {
    const fetch = (await import('node-fetch')).default;
    
    // 診断→必要書類→Excel出力の一連のフロー
    const diagnosisData = {
      situation: 'startup',
      employeeCount: 'micro',
      businessField: 'retail',
      investment: 'sales',
      budget: '50to100',
      timeline: 'asap'
    };
    
    // 1. 診断実行
    const diagnosisResponse = await fetch('http://localhost:8000/api/diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(diagnosisData)
    });
    
    const diagnosis = await diagnosisResponse.json();
    const selectedSubsidy = diagnosis.subsidies[0];
    
    // 2. 必要書類取得
    const documentsResponse = await fetch(`http://localhost:8000/api/documents/required/${selectedSubsidy.type}`);
    const documents = await documentsResponse.json();
    
    expect(documents).toHaveProperty('requiredDocuments');
    expect(documents.requiredDocuments.length).toBeGreaterThan(0);
    
    // 3. Excel生成（書類情報を使用）
    const excelResponse = await fetch('http://localhost:8000/api/excel/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subsidyType: selectedSubsidy.type,
        documents: documents.requiredDocuments,
        formData: {
          companyName: 'テスト株式会社',
          representativeName: '田中花子',
          applicationAmount: 500000
        }
      })
    });
    
    expect(excelResponse.status).toBe(200);
    const excelResult = await excelResponse.json();
    expect(excelResult.success).toBe(true);
  });

  test('エラーハンドリング品質確認', async () => {
    const fetch = (await import('node-fetch')).default;
    
    // 不正なデータでのAPIテスト
    const invalidDiagnosisResponse = await fetch('http://localhost:8000/api/diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invalidField: 'test'
      })
    });
    
    expect(invalidDiagnosisResponse.status).toBe(400);
    
    // 存在しない補助金タイプでのExcel生成
    const invalidExcelResponse = await fetch('http://localhost:8000/api/excel/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subsidyType: 'invalid-type',
        formData: {}
      })
    });
    
    expect(invalidExcelResponse.status).toBe(400);
  });

  test('レスポンシブデザイン品質確認', async () => {
    const fetch = (await import('node-fetch')).default;
    
    // フロントエンドのレスポンシブテスト
    const htmlResponse = await fetch('http://localhost:3000');
    const html = await htmlResponse.text();
    
    // ダークモード対応の確認
    expect(html).toContain('darkmode.css');
    expect(html).toContain('darkmode.js');
    
    // レスポンシブメタタグの確認
    expect(html).toContain('viewport');
    expect(html).toContain('width=device-width');
  });
});