# Worker向け実装指示書

## Worker1への追加指示（オフライン対応）

### Service Worker実装
```javascript
// public/service-worker.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/src/main.tsx',
        '/data/subsidies/it-donyu-2024/questionnaires/detailed_application.json',
        '/data/subsidies/monozukuri-2024/questionnaires/detailed_application.json',
        '/data/subsidies/jizokuka-2024/questionnaires/detailed_application.json'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

---

## Worker2への実装指示（テンプレート機能）

### 1. テンプレート管理システム
```typescript
// src/services/template-service.ts
export interface SubsidyTemplate {
  id: string;
  subsidyType: 'it-donyu' | 'monozukuri' | 'jizokuka';
  version: string;
  createdAt: Date;
  sections: {
    id: string;
    title: string;
    fields: TemplateField[];
  }[];
}

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select';
  required: boolean;
  placeholder?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export class TemplateService {
  // テンプレートの読み込み
  async loadTemplate(subsidyType: string): Promise<SubsidyTemplate> {
    // 実装
  }
  
  // テンプレートのバージョン管理
  async getTemplateVersions(subsidyType: string): Promise<string[]> {
    // 実装
  }
  
  // カスタムテンプレートの保存
  async saveCustomTemplate(template: SubsidyTemplate): Promise<void> {
    // 実装
  }
}
```

### 2. AI支援機能の基盤
```typescript
// src/services/ai-assistant.ts
export class AIAssistant {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  // 事業計画の自動生成
  async generateBusinessPlan(context: {
    businessType: string;
    challenges: string;
    budget: string;
  }): Promise<string> {
    // OpenAI APIを使用した実装
    const prompt = `
      以下の情報を基に、補助金申請用の事業計画を作成してください：
      事業形態: ${context.businessType}
      課題: ${context.challenges}
      予算: ${context.budget}
    `;
    
    // API呼び出しとレスポンス処理
  }
  
  // 文章の改善提案
  async suggestImprovements(text: string): Promise<{
    suggestions: string[];
    improvedText: string;
  }> {
    // 実装
  }
}
```

---

## Worker3への実装指示（セキュリティ・テスト）

### 1. 入力バリデーション
```typescript
// src/utils/validators.ts
export const validators = {
  // メールアドレスのバリデーション
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  // 電話番号のバリデーション
  phone: (value: string): boolean => {
    const phoneRegex = /^0\d{9,10}$/;
    return phoneRegex.test(value.replace(/-/g, ''));
  },
  
  // 法人番号のバリデーション
  corporateNumber: (value: string): boolean => {
    return /^\d{13}$/.test(value);
  },
  
  // XSS対策
  sanitizeInput: (value: string): string => {
    return value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
};
```

### 2. テスト実装
```typescript
// __tests__/components/ProgressDashboard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProgressDashboard from '../src/components/Dashboard/ProgressDashboard';

describe('ProgressDashboard', () => {
  const mockProps = {
    subsidyType: 'it-donyu',
    subsidyName: 'IT導入補助金2025',
    projectData: {
      companyName: 'テスト株式会社',
      businessDescription: 'テスト事業内容'
    }
  };
  
  test('進捗率が正しく計算される', () => {
    render(
      <BrowserRouter>
        <ProgressDashboard {...mockProps} />
      </BrowserRouter>
    );
    
    // テスト実装
  });
  
  test('タスクのチェックが正しく動作する', () => {
    // テスト実装
  });
});
```

### 3. E2Eテスト
```typescript
// e2e/subsidy-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('補助金申請フロー', () => {
  test('診断から申請書作成まで', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // 診断開始
    await page.click('text=診断を開始する');
    
    // 質問に回答
    await page.click('text=製造業');
    await page.click('text=21〜50名');
    // ... 他の質問
    
    // 補助金選択
    await expect(page).toHaveURL('/subsidy-list');
    await page.click('text=IT導入補助金2025');
    
    // 詳細入力
    await page.fill('input[name="company_name"]', 'テスト株式会社');
    // ... 他の入力
    
    // 申請書確認
    await page.click('text=申請書類を作成');
    await expect(page).toHaveURL('/document-output');
  });
});
```

---

## 実装優先順位

1. **本日中に完了**
   - Worker2: テンプレート基本機能
   - Worker3: バリデーション実装

2. **明日完了**
   - Worker1: Service Worker実装
   - Worker2: AI支援機能プロトタイプ
   - Worker3: 単体テスト作成

3. **今週中に完了**
   - 全機能の統合テスト
   - パフォーマンス最適化
   - ドキュメント整備