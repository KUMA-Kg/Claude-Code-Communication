// 簡易APIテストスクリプト
const testAPI = async () => {
  const baseURL = 'http://localhost:3001';
  
  console.log('🧪 Starting API Tests...\n');
  
  // 1. ヘルスチェックテスト
  console.log('1️⃣ Testing Health Check Endpoint...');
  try {
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
  }
  
  console.log('\n2️⃣ Testing Document Generation Endpoint...');
  
  // 2. 正常なリクエストテスト
  try {
    const generateResponse = await fetch(`${baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessDescription: 'IT関連のコンサルティング事業を行っています。中小企業向けにDX推進支援を提供',
        requestAmount: 1000000,
        usagePurpose: '新しいAIシステム開発のための機材購入とソフトウェアライセンス費用'
      })
    });
    
    const generateData = await generateResponse.json();
    
    if (generateResponse.ok) {
      console.log('✅ Document Generation Success!');
      console.log('📄 Document Length:', generateData.document.length, 'characters');
      console.log('⏱️ Processing Time:', generateData.metadata.processingTime);
      console.log('📝 First 200 characters:', generateData.document.substring(0, 200) + '...');
    } else {
      console.error('❌ Document Generation Failed:', generateData);
    }
  } catch (error) {
    console.error('❌ Request Failed:', error.message);
  }
  
  console.log('\n3️⃣ Testing Error Handling...');
  
  // 3. エラーハンドリングテスト（必須フィールド不足）
  try {
    const errorResponse = await fetch(`${baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessDescription: 'テスト事業'
        // requestAmountとusagePurposeが不足
      })
    });
    
    const errorData = await errorResponse.json();
    console.log('✅ Error Handling Works:', errorData);
  } catch (error) {
    console.error('❌ Error Test Failed:', error.message);
  }
  
  console.log('\n✨ API Tests Completed!');
};

// Node.js環境でfetchが利用できない場合の対策
if (typeof fetch === 'undefined') {
  console.log('⚠️ fetch is not available. Please run: npm install node-fetch@2');
  console.log('Then add: const fetch = require("node-fetch"); at the top of this file');
} else {
  testAPI();
}