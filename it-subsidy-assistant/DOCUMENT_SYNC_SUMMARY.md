# Document Synchronization Summary

## Overview
This document summarizes the synchronization work performed between `DocumentRequirementQuestions.tsx` and `required-documents.ts` to ensure consistency in document requirements across all three subsidies.

## Key Changes Made

### 1. **持続化補助金 (jizokuka) - Complete Document Set Added**
Added missing documents to the baseDocuments in `DocumentRequirementQuestions.tsx`:
- Added all conditional documents (B2, B3, C1, C2, C3, D2, E1, E4, F1, F2, F3)
- These documents start as `required: false` and are conditionally changed based on user answers

### 2. **Category Standardization**
Fixed category mismatches:
- Changed `'corporate'` to `'company'` for employee verification document
- Ensured all categories used have corresponding labels in `documentCategoryLabels`

### 3. **Conditional Logic Updates**
Updated the conditional logic in `determineRequiredDocuments()`:
- For 法人の場合: Now finds and updates the existing B2 document's required status instead of adding a duplicate
- For 見積書 requirements: Updates the existing C1 document based on expense amount
- For equipment/renovation documents: Updates existing C2/C3 documents based on sales channel type
- Removed duplicate document additions for 加点要素 documents

## Document Structure by Subsidy

### IT導入補助金 (it-donyu)
- **Base Documents**: 10 documents (A1-A4, B1-B2, C1-C4)
- **Conditional Additions**: 
  - F1: 創業2年未満の追加書類
  - B3: 労働保険料納付証明書 (optional)
  - D1, D3: 加点要素書類 (optional)

### ものづくり補助金 (monozukuri)
- **Base Documents**: 11 documents (A1, B1-B2, C1-C4, D1-D2, E1-E2)
- **Conditional Additions**:
  - F3: DX推進自己診断結果 (デジタル枠)
  - B4: 炭素生産性向上計画書 (グリーン枠)
  - G1: 共同事業契約書 (共同申請枠)
  - E3: 資金調達確認書 (借入の場合)
  - F1: 認定支援機関確認書 (optional)
  - B3: 大幅賃上げ計画書 (optional)
  - A2, D3: 任意追加書類

### 持続化補助金 (jizokuka)
- **Base Documents**: 19 documents (A1-A4, B1-B3, C1-C3, D1-D2, E1, E4, F1-F3)
- **Conditional Logic**:
  - B2 (履歴事項全部証明書): Required only for 法人
  - B3 (開業届): Required only for 個人事業主 with 創業1年未満
  - C1 (見積書): Required when expense ≥ 50万円
  - C2 (カタログ): Required for equipment purchases
  - C3 (図面): Required for renovations
  - F1-F3: Required based on application frame

## Category Mappings
All documents use these standardized categories:
- `application`: 申請様式
- `company`: 会社関連書類
- `corporate`: 法人関連書類
- `financial`: 財務関連書類
- `project`: 事業計画関連書類
- `quotation`: 見積・価格関係書類
- `support`: 支援機関関連書類
- `other`: その他の書類

## Verification
The synchronization ensures:
1. All documents shown in the questionnaire results match those in the document list page
2. Categories are consistent and properly labeled
3. Conditional logic correctly modifies document requirements based on user answers
4. No duplicate documents are added during the conditional logic processing

## Testing
A test script has been created at `src/tests/document-sync-test.ts` to verify synchronization between the two files. This can be run to check for any future inconsistencies.