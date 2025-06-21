# MCP/プラグイン活用実装ガイド

## 1. Figma MCP - UIデザイン自動化

### 1.1 デザイントークン自動生成
```typescript
// Figma MCPからデザイントークンを取得
const designTokens = await figmaMCP.getDesignTokens({
  fileId: 'subsidy-assistant-design',
  includeColors: true,
  includeTypography: true,
  includeSpacing: true
});

// TailwindCSS設定に自動反映
export const tailwindConfig = {
  theme: {
    extend: {
      colors: designTokens.colors,
      fontFamily: designTokens.typography.families,
      spacing: designTokens.spacing
    }
  }
};
```

### 1.2 コンポーネント自動生成
```typescript
// Figmaデザインからコンポーネントを生成
await figmaMCP.generateComponent({
  componentName: 'SubsidyCard',
  figmaNodeId: 'component-123',
  outputPath: './src/components/ui/',
  framework: 'react',
  styling: 'tailwind'
});
```

## 2. Playwright MCP - E2Eテスト自動化

### 2.1 診断フローテスト
```typescript
// playwright.test.ts
import { test, expect } from '@playwright/test';

test.describe('補助金診断フロー', () => {
  test('6つの質問に回答して適切な補助金が提案される', async ({ page }) => {
    await page.goto('/diagnosis');
    
    // 質問1: 事業ステータス
    await page.click('[data-testid="answer-existing"]');
    
    // 質問2: 従業員規模
    await page.click('[data-testid="answer-small"]');
    
    // 質問3: 業種
    await page.click('[data-testid="answer-it"]');
    
    // 質問4: 投資目的
    await page.click('[data-testid="answer-digital"]');
    
    // 質問5: 投資予算
    await page.click('[data-testid="answer-100to500"]');
    
    // 質問6: 実施時期
    await page.click('[data-testid="answer-quarter"]');
    
    // 結果確認
    await expect(page.locator('.subsidy-recommendation')).toContainText('IT導入補助金');
    await expect(page.locator('.match-score')).toContainText('85%');
  });
});
```

### 2.2 ビジュアルリグレッションテスト
```typescript
// Playwright MCPでスクリーンショット比較
await playwrightMCP.visualTest({
  name: 'subsidy-card-design',
  selector: '.subsidy-card',
  threshold: 0.01,
  animations: 'disabled'
});
```

## 3. Supabase MCP - データベース管理

### 3.1 リアルタイムサブスクリプション
```typescript
// Supabase MCPでリアルタイム更新を実装
const subscription = await supabaseMCP.subscribe({
  table: 'diagnosis_sessions',
  event: ['INSERT', 'UPDATE'],
  filter: `company_id=eq.${companyId}`,
  callback: (payload) => {
    // 診断結果をリアルタイムで更新
    updateDiagnosisResults(payload.new);
  }
});
```

### 3.2 Row Level Security設定
```typescript
// Supabase MCPでRLSポリシーを自動設定
await supabaseMCP.createPolicy({
  table: 'applications',
  name: 'users_can_view_own_applications',
  definition: `
    CREATE POLICY "Users can view own applications"
    ON applications
    FOR SELECT
    USING (auth.uid() = user_id)
  `
});
```

### 3.3 ストレージ管理
```typescript
// 生成したPDFをSupabase Storageに保存
const { data, error } = await supabaseMCP.uploadFile({
  bucket: 'application-documents',
  path: `${userId}/${applicationId}/申請書.pdf`,
  file: pdfBuffer,
  contentType: 'application/pdf'
});
```

## 4. Jest - バックエンドテスト

### 4.1 補助金マッチングロジックのテスト
```typescript
describe('補助金マッチングアルゴリズム', () => {
  test('IT企業はIT導入補助金が最高スコアになる', () => {
    const answers = {
      businessStatus: 'existing',
      employeeCount: 'small',
      industry: 'it',
      investmentPurpose: 'digital',
      budget: '100to500',
      timeline: 'quarter'
    };
    
    const scores = calculateSubsidyScores(answers);
    
    expect(scores.itSubsidy).toBeGreaterThan(scores.monozukuri);
    expect(scores.itSubsidy).toBeGreaterThan(scores.jizokuka);
    expect(scores.itSubsidy).toBeGreaterThan(70);
  });
});
```

### 4.2 PDF生成のモック
```typescript
// Jest でPDF生成をモック
jest.mock('../utils/pdfGenerator', () => ({
  generateApplicationPDF: jest.fn().mockResolvedValue({
    buffer: Buffer.from('mock-pdf'),
    pages: 10,
    fileSize: 1024000
  })
}));
```

## 5. 統合実装例

### 5.1 診断から書類生成までの一連フロー
```typescript
// 1. Figma MCPでUIコンポーネントを取得
const uiComponents = await figmaMCP.getComponents(['DiagnosisFlow', 'ResultCard']);

// 2. ユーザーの回答を収集
const userAnswers = await collectUserAnswers();

// 3. Supabase MCPでデータ保存
const session = await supabaseMCP.insert('diagnosis_sessions', {
  company_id: user.company_id,
  answers: userAnswers,
  created_at: new Date()
});

// 4. マッチング計算
const matchedSubsidies = calculateMatches(userAnswers);

// 5. 結果をリアルタイム更新
await supabaseMCP.update('diagnosis_sessions', {
  id: session.id,
  matched_subsidies: matchedSubsidies
});

// 6. PDF生成
const pdfBuffer = await generateApplicationPDF({
  sessionId: session.id,
  subsidyType: matchedSubsidies[0].type,
  companyData: user.company
});

// 7. Supabase Storageに保存
const fileUrl = await supabaseMCP.uploadFile({
  bucket: 'applications',
  path: `${session.id}/application.pdf`,
  file: pdfBuffer
});

// 8. Playwright MCPでE2Eテスト実行
await playwrightMCP.runTest('diagnosis-to-pdf-flow');
```

### 5.2 パフォーマンス最適化
```typescript
// Supabase MCPでクエリ最適化
const optimizedQuery = await supabaseMCP.query({
  from: 'applications',
  select: `
    id,
    status,
    companies!inner(name, industry),
    diagnosis_sessions!inner(matched_subsidies)
  `,
  filters: {
    'companies.industry': 'it',
    'diagnosis_sessions.created_at': 'gte.2024-01-01'
  },
  limit: 100,
  order: 'created_at.desc'
});
```

## 6. 継続的改善

### 6.1 A/Bテスト実装
```typescript
// Playwright MCPでA/Bテストを自動化
const abTestResults = await playwrightMCP.runABTest({
  variants: {
    A: '/diagnosis-v1',
    B: '/diagnosis-v2'
  },
  metrics: ['completion_rate', 'time_to_complete', 'user_satisfaction'],
  duration: '7days',
  sampleSize: 1000
});
```

### 6.2 監視とアラート
```typescript
// カスタムモニタリング with Supabase
await supabaseMCP.createFunction({
  name: 'monitor_diagnosis_performance',
  schedule: '*/5 * * * *', // 5分ごと
  body: `
    SELECT 
      COUNT(*) as total_sessions,
      AVG(completion_time) as avg_time,
      COUNT(CASE WHEN completed THEN 1 END)::float / COUNT(*) as completion_rate
    FROM diagnosis_sessions
    WHERE created_at > NOW() - INTERVAL '1 hour'
  `
});
```

このように、各MCP/プラグインを効果的に組み合わせることで、開発効率と品質を大幅に向上させることができます。