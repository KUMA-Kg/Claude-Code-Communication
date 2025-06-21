# スマート質問フロー設計

## 1. 質問最適化の仕組み

### 基本原則
1. **一度聞いたことは二度聞かない**
2. **関連する情報はまとめて聞く**
3. **条件に応じて必要な質問だけ表示**
4. **過去の回答から予測・提案**

---

## 2. 補助金検索フロー例

### Step 1: 初回アクセス時の最小質問セット

```yaml
質問グループ1: 企業基本情報
  - COMPANY_NAME: 
      質問: "企業名を入力してください"
      型: text
      必須: true
      
  - EMPLOYEE_COUNT:
      質問: "従業員数を教えてください"
      型: number
      必須: true
      条件分岐:
        - 20人以下 → 小規模事業者向け補助金を優先
        - 21-300人 → 中小企業向け補助金
        - 300人以上 → 大企業は対象外の補助金を除外

  - INDUSTRY:
      質問: "主な事業分野を選択してください"
      型: select
      選択肢: [製造業, IT・ソフトウェア, サービス業, 小売業, ...]
      必須: true
      
質問グループ2: 補助金の目的
  - PURPOSE:
      質問: "どのような目的で補助金を活用したいですか？"
      型: multiselect
      選択肢:
        - IT_INVESTMENT: "ITツール・システムの導入"
        - EQUIPMENT: "設備投資・機械導入"
        - R_AND_D: "研究開発・新商品開発"
        - BUSINESS_RESTRUCTURE: "事業再構築・新分野展開"
        - PRODUCTIVITY: "生産性向上・業務効率化"
```

### Step 2: 条件付き追加質問

```typescript
// 動的質問生成ロジック
function getConditionalQuestions(answers: Answers): Question[] {
  const additionalQuestions: Question[] = [];
  
  // IT投資を選択した場合
  if (answers.PURPOSE.includes('IT_INVESTMENT')) {
    additionalQuestions.push({
      code: 'IT_INVESTMENT_TYPE',
      question: 'どのようなITツールの導入を検討していますか？',
      type: 'multiselect',
      options: [
        'クラウドサービス',
        '業務管理システム',
        'ECサイト構築',
        'セキュリティツール',
        'AI・機械学習ツール'
      ]
    });
    
    additionalQuestions.push({
      code: 'IT_BUDGET',
      question: 'IT投資の予算規模を教えてください',
      type: 'select',
      options: [
        '100万円未満',
        '100-500万円',
        '500-1000万円',
        '1000万円以上'
      ]
    });
  }
  
  // 製造業の場合の追加質問
  if (answers.INDUSTRY === '製造業') {
    additionalQuestions.push({
      code: 'MANUFACTURING_TYPE',
      question: '製造業の詳細分類を選択してください',
      type: 'select',
      options: [
        '食品製造業',
        '機械製造業',
        '電子部品製造業',
        // ...
      ]
    });
  }
  
  return additionalQuestions;
}
```

---

## 3. 申請書作成時の質問フロー

### 自動入力とスマート質問の組み合わせ

```typescript
interface ApplicationQuestionFlow {
  // Phase 1: 基本情報の確認（自動入力済み）
  basicInfo: {
    companyName: string; // ✅ 自動入力
    employeeCount: number; // ✅ 自動入力
    establishedDate: Date; // ✅ 自動入力
    capital: number; // ❓ 未入力の場合のみ質問
  };
  
  // Phase 2: この補助金特有の情報
  subsidySpecific: {
    // IT導入補助金の場合
    itToolDetails?: {
      vendorName: string; // 新規質問
      toolName: string; // 新規質問
      monthlyFee: number; // 新規質問
    };
    
    // ものづくり補助金の場合
    manufacturingDetails?: {
      targetProduct: string; // 新規質問
      expectedEffect: string; // 新規質問
      investmentBreakdown: object; // 新規質問
    };
  };
  
  // Phase 3: 共通の事業計画
  businessPlan: {
    currentChallenges: string; // 💡 過去の申請から提案
    solutionApproach: string; // 💡 AIが草案を生成
    expectedOutcomes: string; // 💡 類似事例から提案
  };
}
```

### 入力支援の例

```typescript
// 過去のデータから提案
const getSuggestions = async (
  field: string, 
  context: ApplicationContext
): Promise<Suggestion[]> => {
  
  // 1. 同じ企業の過去の回答
  const previousAnswers = await getCompanyAnswers(
    context.companyId, 
    field
  );
  
  // 2. 同じ業種・規模の他社の回答パターン
  const similarCompanyPatterns = await getSimilarCompanyPatterns(
    context.industry,
    context.companySize,
    field
  );
  
  // 3. この補助金での頻出回答
  const commonAnswers = await getCommonAnswersForSubsidy(
    context.subsidyId,
    field
  );
  
  return [
    ...previousAnswers,
    ...similarCompanyPatterns,
    ...commonAnswers
  ].slice(0, 3); // 上位3つを提案
};
```

---

## 4. データ再利用マトリックス

### 質問コード対応表

| 検索時の質問 | 申請時の利用先 | 変換ルール |
|-------------|--------------|-----------|
| EMPLOYEE_COUNT | 申請書:従業員数欄 | そのまま利用 |
| INDUSTRY | 事業計画書:事業分野 | コードを日本語に変換 |
| IT_BUDGET | 見積書:予算総額 | 範囲から中央値を計算 |
| PURPOSE | 事業計画書:導入目的 | 複数選択を文章化 |

### 自動変換の例

```typescript
// 選択式の回答を文章に変換
function convertPurposeToText(purposes: string[]): string {
  const purposeMap = {
    IT_INVESTMENT: 'IT化による業務効率化',
    EQUIPMENT: '最新設備導入による生産性向上',
    R_AND_D: '新技術開発による競争力強化'
  };
  
  const texts = purposes.map(p => purposeMap[p]);
  
  if (texts.length === 1) {
    return `弊社は${texts[0]}を目的としています。`;
  } else {
    return `弊社は${texts.slice(0, -1).join('、')}および${texts.slice(-1)}を目的としています。`;
  }
}
```

---

## 5. 学習による最適化

### 回答パターンの学習

```sql
-- 企業の回答傾向を記録
CREATE TABLE answer_learning (
    company_id UUID,
    question_pattern JSONB,
    frequency INTEGER,
    last_used TIMESTAMP,
    context JSONB
);

-- 例: ある企業が「現在の課題」でよく使うキーワード
{
  "company_id": "xxx-xxx-xxx",
  "question_pattern": {
    "question_code": "CURRENT_CHALLENGES",
    "common_keywords": ["人手不足", "業務効率化", "DX推進"],
    "typical_length": 200,
    "style": "formal"
  },
  "frequency": 5,
  "last_used": "2024-01-15"
}
```

### 質問スキップの判定

```typescript
// 既に十分な情報がある場合は質問をスキップ
function shouldSkipQuestion(
  questionCode: string,
  companyData: CompanyData
): boolean {
  
  // 1. 直接的な回答が既にある
  if (companyData.answers[questionCode]) {
    return true;
  }
  
  // 2. 他の回答から推測可能
  if (canInferFrom(questionCode, companyData)) {
    return true;
  }
  
  // 3. この補助金では不要
  if (!isRequiredForSubsidy(questionCode, companyData.targetSubsidy)) {
    return true;
  }
  
  return false;
}
```

---

## 6. 実装例: 最小質問数での申請

### ケース: 2回目の申請

```yaml
初回申請時（IT導入補助金）:
  回答数: 25問
  入力時間: 45分
  
2回目申請時（ものづくり補助金）:
  自動入力: 18問（72%）
  新規回答: 7問のみ
  入力時間: 12分（73%削減）
  
3回目申請時（事業再構築補助金）:
  自動入力: 22問（88%）
  新規回答: 3問のみ
  入力時間: 5分（89%削減）
```

これにより、申請を重ねるごとに入力の手間が大幅に削減され、ユーザー体験が向上します。