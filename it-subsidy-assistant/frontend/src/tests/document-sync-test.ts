// Document Synchronization Test
// This test verifies that documents between DocumentRequirementQuestions.tsx and required-documents.ts are properly synchronized

import { requiredDocuments, documentCategoryLabels } from '../data/required-documents';

// Mock the determineRequiredDocuments function from DocumentRequirementQuestions.tsx
const determineRequiredDocuments = (subsidyType: string, answers: any) => {
  const baseDocuments = {
    'it-donyu': [
      // A. 申請基本書類
      { id: 'A1', name: '交付申請書', required: true, category: 'application' },
      { id: 'A2', name: '事業計画書', required: true, category: 'project' },
      { id: 'A3', name: '宣誓書', required: true, category: 'other' },
      { id: 'A4', name: '法人/個人確認書類', required: true, category: 'company' },
      // B. 財務関係書類
      { id: 'B1', name: '直近2期分の決算書', required: true, category: 'financial' },
      { id: 'B2', name: '納税証明書', required: true, category: 'financial' },
      // C. ITツール関連
      { id: 'C1', name: 'IT導入支援事業者との共同事業体契約書', required: true, category: 'project' },
      { id: 'C2', name: 'ITツール見積書', required: true, category: 'quotation' },
      { id: 'C3', name: 'ITツール機能要件適合証明書', required: true, category: 'project' },
      { id: 'C4', name: '導入計画書', required: true, category: 'project' }
    ],
    'monozukuri': [
      // A. 事業計画関連
      { id: 'A1', name: '事業計画書（システム入力＋別紙Word）', required: true, category: 'project' },
      // B. 誓約・加点様式
      { id: 'B1', name: '補助対象経費誓約書【様式1】', required: true, category: 'other' },
      { id: 'B2', name: '賃金引上げ計画の誓約書【様式2】', required: true, category: 'other' },
      // C. 現況確認資料
      { id: 'C1', name: '履歴事項全部証明書（法人）', required: true, category: 'company' },
      { id: 'C2', name: '直近期の決算書一式', required: true, category: 'financial' },
      { id: 'C3', name: '従業員数確認資料', required: true, category: 'company' },
      { id: 'C4', name: '労働者名簿', required: true, category: 'company' },
      // D. 見積・仕様関係
      { id: 'D1', name: '見積書（原則2社以上）', required: true, category: 'quotation' },
      { id: 'D2', name: 'カタログ・仕様書', required: true, category: 'quotation' },
      // E. 税・反社・資金調達
      { id: 'E1', name: '納税証明書（法人税／消費税）', required: true, category: 'financial' },
      { id: 'E2', name: '暴力団排除等に関する誓約書', required: true, category: 'other' }
    ],
    'jizokuka': [
      // A. 申請様式（必須）
      { id: 'A1', name: '様式1 小規模事業者持続化補助金事業に係る申請書', required: true, category: 'application' },
      { id: 'A2', name: '様式2 経営計画書', required: true, category: 'application' },
      { id: 'A3', name: '様式3 補助事業計画書', required: true, category: 'application' },
      { id: 'A4', name: '様式4 補助金交付申請書', required: true, category: 'application' },
      // B. 現況確認資料
      { id: 'B1', name: '直近の確定申告書（写し）', required: true, category: 'financial' },
      { id: 'B2', name: '履歴事項全部証明書（法人のみ）', required: false, category: 'corporate' },
      { id: 'B3', name: '開業届（個人事業主で創業1年未満）', required: false, category: 'corporate' },
      // C. 見積・価格関係（条件付き）
      { id: 'C1', name: '見積書（税抜50万円以上の経費）', required: false, category: 'quotation' },
      { id: 'C2', name: 'カタログ・仕様書', required: false, category: 'quotation' },
      { id: 'C3', name: '図面・レイアウト図', required: false, category: 'quotation' },
      // D. 商工会議所・商工会関係
      { id: 'D1', name: '事業支援計画書（様式6）', required: true, category: 'support' },
      { id: 'D2', name: '商工会議所・商工会の会員証明', required: false, category: 'support' },
      // E. 加点要素書類（任意）
      { id: 'E1', name: '事業継続力強化計画認定書', required: false, category: 'other' },
      { id: 'E4', name: '賃金引上げ表明書（様式7）', required: false, category: 'other' },
      // F. 申請枠別の追加書類
      { id: 'F1', name: '創業計画書（創業枠申請者）', required: false, category: 'other' },
      { id: 'F2', name: '事業承継診断書（事業承継枠）', required: false, category: 'other' },
      { id: 'F3', name: '災害証明書（災害枠）', required: false, category: 'other' }
    ]
  };

  return baseDocuments[subsidyType as keyof typeof baseDocuments] || [];
};

// Test function to verify synchronization
export const testDocumentSync = () => {
  const subsidyTypes = ['it-donyu', 'monozukuri', 'jizokuka'];
  const results: any[] = [];

  subsidyTypes.forEach(subsidyType => {
    console.log(`\n=== Testing ${subsidyType} ===`);
    
    // Get documents from both sources
    const requiredDocsFromFile = requiredDocuments[subsidyType] || [];
    const baseDocsFromQuestions = determineRequiredDocuments(subsidyType, {});
    
    // Check for missing documents in required-documents.ts
    const missingInFile: any[] = [];
    baseDocsFromQuestions.forEach(doc => {
      const found = requiredDocsFromFile.find(d => d.id === doc.id);
      if (!found) {
        missingInFile.push(doc);
      } else {
        // Check if names match
        if (found.name !== doc.name) {
          console.warn(`Name mismatch for ${doc.id}: "${doc.name}" vs "${found.name}"`);
        }
        // Check if categories match
        if (found.category !== doc.category) {
          console.warn(`Category mismatch for ${doc.id}: "${doc.category}" vs "${found.category}"`);
        }
      }
    });

    // Check for missing documents in DocumentRequirementQuestions
    const missingInQuestions: any[] = [];
    requiredDocsFromFile.forEach(doc => {
      const found = baseDocsFromQuestions.find(d => d.id === doc.id);
      if (!found) {
        missingInQuestions.push(doc);
      }
    });

    // Check categories are defined
    const usedCategories = new Set([
      ...requiredDocsFromFile.map(d => d.category),
      ...baseDocsFromQuestions.map(d => d.category)
    ]);
    
    const undefinedCategories: string[] = [];
    usedCategories.forEach(cat => {
      if (!documentCategoryLabels[cat]) {
        undefinedCategories.push(cat);
      }
    });

    results.push({
      subsidyType,
      missingInFile,
      missingInQuestions,
      undefinedCategories,
      totalInFile: requiredDocsFromFile.length,
      totalInQuestions: baseDocsFromQuestions.length
    });
  });

  return results;
};

// Run the test
const results = testDocumentSync();
console.log('\n=== SYNCHRONIZATION TEST RESULTS ===');
results.forEach(result => {
  console.log(`\n${result.subsidyType}:`);
  console.log(`  Documents in required-documents.ts: ${result.totalInFile}`);
  console.log(`  Documents in DocumentRequirementQuestions: ${result.totalInQuestions}`);
  
  if (result.missingInFile.length > 0) {
    console.log(`  Missing in required-documents.ts:`);
    result.missingInFile.forEach((doc: any) => {
      console.log(`    - ${doc.id}: ${doc.name} (${doc.category})`);
    });
  }
  
  if (result.missingInQuestions.length > 0) {
    console.log(`  Missing in DocumentRequirementQuestions:`);
    result.missingInQuestions.forEach((doc: any) => {
      console.log(`    - ${doc.id}: ${doc.name} (${doc.category})`);
    });
  }
  
  if (result.undefinedCategories.length > 0) {
    console.log(`  Undefined categories: ${result.undefinedCategories.join(', ')}`);
  }
});