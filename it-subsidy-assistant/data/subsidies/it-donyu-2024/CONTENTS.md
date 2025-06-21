# IT導入補助金2025 収集資料一覧

## 📁 収集完了した資料

### 1. 公募要領 (guidelines/)
- ✅ `it2025_koubo_tsujyo.pdf` - 通常枠公募要領
- ✅ `it2025_koubo_denshi.pdf` - 電子化枠公募要領
- ✅ `it2025_koubo_fukusu.pdf` - 複数社枠公募要領
- ✅ `it2025_koubo_invoice.pdf` - インボイス枠公募要領
- ✅ `it2025_koubo_security.pdf` - セキュリティ枠公募要領

### 2. 申請書・様式 (forms/)
#### 実施内容説明書
- ✅ `it2025_jisshinaiyosetsumei_cate5.xlsx` - カテゴリー5実施内容説明書
- ✅ `it2025_jisshinaiyosetsumei_cate6.xlsx` - カテゴリー6実施内容説明書
- ✅ `it2025_jisshinaiyosetsumei_cate7.xlsx` - カテゴリー7実施内容説明書

#### 価格説明書
- ✅ `it2025_kakakusetsumei_cate5.xlsx` - カテゴリー5価格説明書
- ✅ `it2025_kakakusetsumei_cate6.xlsx` - カテゴリー6価格説明書
- ✅ `it2025_kakakusetsumei_cate7.xlsx` - カテゴリー7価格説明書

#### 取引関係書類
- ✅ `it2025_torihiki_denshi.xlsx` - 電子化枠取引関係書類
- ✅ `it2025_torihiki_denshi.pdf` - 電子化枠取引関係書類（PDF版）
- ✅ `it2025_torihiki_security.xlsx` - セキュリティ枠取引関係書類
- ✅ `it2025_torihiki_security.pdf` - セキュリティ枠取引関係書類（PDF版）

#### その他様式
- ✅ `it2025_chingin_houkoku.xlsx` - 賃金報告書
- ✅ `it2025_hanbai_it_jigyousya.xlsx` - 販売IT事業者情報
- ✅ `it2025_sentei_gaibu_fukusu.docx` - 外部専門家選定理由書（複数社枠）
- ✅ `it2025_sentei_it_fukusu.docx` - IT事業者選定理由書（複数社枠）
- ✅ `it2025_yoshikikeisan_fukusu.xlsx` - 様式計算書（複数社枠）

### 3. マニュアル・規程 (others/)
#### 申請マニュアル
- ✅ `it2025_manual_kofu.pdf` - 交付申請マニュアル
- ✅ `it2025_manual_kofu_fukusu.pdf` - 交付申請マニュアル（複数社枠）
- ✅ `it2025_manual_jisseki.pdf` - 実績報告マニュアル

#### 交付規程
- ✅ `it2025_kitei_tsujyo.pdf` - 通常枠交付規程
- ✅ `it2025_kitei_denshi.pdf` - 電子化枠交付規程
- ✅ `it2025_kitei_fukusu.pdf` - 複数社枠交付規程
- ✅ `it2025_kitei_invoice.pdf` - インボイス枠交付規程
- ✅ `it2025_kitei_security.pdf` - セキュリティ枠交付規程

#### その他
- ✅ `it2025_kakuninjikou_jisseki.pdf` - 実績確認事項

---

## 📊 枠別整理

### 通常枠
- 公募要領、交付規程

### 電子化枠
- 公募要領、交付規程、取引関係書類

### 複数社枠
- 公募要領、交付規程、専門家選定理由書、交付申請マニュアル

### インボイス枠
- 公募要領、交付規程

### セキュリティ枠
- 公募要領、交付規程、取引関係書類

---

## 🎯 活用できる主要資料

1. **通常枠公募要領** (`it2025_koubo_tsujyo.pdf`)
   - 最も基本的な枠の要領
   - 補助対象、補助率、申請要件などの基本情報

2. **実施内容説明書** (カテゴリー5,6,7)
   - 実際の申請で使用する様式
   - どんな情報を入力するかがわかる

3. **交付申請マニュアル** (`it2025_manual_kofu.pdf`)
   - 申請の流れと手順
   - 画面操作の説明

これらの資料から、システムに必要な質問項目と申請フローを抽出できます。

---

## 📋 書類カテゴリー別整理

書類は提出の必要性により3つのカテゴリーに分類されます。詳細は[DOCUMENT_CATEGORIES.md](./DOCUMENT_CATEGORIES.md)を参照してください。

- **①全員必須書類**: すべての申請者が必ず提出・参照する書類（3件）
- **②分岐によっては必要な書類**: 申請する枠や条件によって必要になる書類（25件）
- **③任意提出の書類**: 提出は任意で、加点要素などになる書類（2件）

---

## 🎯 申請枠判定機能

申請者の課題やニーズに基づいて最適な申請枠を判定する質問票を用意しています。

- **質問票**: [questionnaires/frame_selection.json](./questionnaires/frame_selection.json)
- **判定サービス**: `src/services/subsidies/it-donyu/frameSelector.ts`

最大3つの質問で以下の5つの申請枠から最適なものを判定し、必要書類を自動的にフィルタリングします：
1. 通常枠
2. 電子化枠
3. 複数社枠
4. インボイス枠
5. セキュリティ枠