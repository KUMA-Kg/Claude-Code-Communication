# IT補助金アシストツール - 機能デモ

## 📱 実装済み機能

### 1. ホームページ
- システム概要と3つのメイン機能
- 対応補助金の紹介（IT導入、ものづくり、持続化）
- 直感的なナビゲーション

### 2. 詳細質問票機能 (`/questionnaire`)
#### 特徴:
- 申請枠決定後の書類作成用質問システム
- セクション別進行（企業情報 → 事業詳細 → 資金計画）
- リアルタイムバリデーション
- 進捗バー表示

#### 対応補助金:
- **IT導入補助金**: ITツール詳細、導入効果測定
- **ものづくり補助金**: 革新性、設備投資計画、CAGR計算  
- **小規模事業者持続化補助金**: 販路開拓戦略、商工会連携

### 3. エクセル処理機能 (`/excel`) ⭐ **新機能**

#### サンプルファイルダウンロード:
```
📁 サンプルファイルダウンロード
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   企業情報   │   事業情報   │   財務情報   │  統合サンプル │
│ (ダウンロード)│ (ダウンロード)│ (ダウンロード)│ (ダウンロード)│
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### エクセルファイルアップロード:
```
┌─────────────────────────────────────────┐
│           📤 ファイルアップロード            │
│                                       │
│  エクセルファイルから情報を抽出し、         │
│  補助金申請書類を自動生成               │
│                                       │
│  [ファイルを選択] または ドラッグ&ドロップ    │
└─────────────────────────────────────────┘
```

#### データ抽出・解析:
```
処理完了 ✅ データ抽出完了

┌─────────────┬─────────────┬─────────────┐
│   企業情報   │   事業情報   │   財務情報   │
├─────────────┼─────────────┼─────────────┤
│企業名: ○○○  │主要事業: ○○ │総費用: ○○○円│
│代表者: ○○○  │課題: ○○○   │補助金: ○○○円│
│売上: ○○○万円│目標: ○○○   │経費項目: ○件│
│従業員: ○○人 │             │             │
└─────────────┴─────────────┴─────────────┘
```

#### 申請書類自動生成:
```
📋 補助金申請書類生成
┌─────────────┬─────────────┬─────────────┐
│  IT導入補助金  │ ものづくり補助金│  持続化補助金  │
│ (実施内容説明書)│  (事業計画書)  │  (経営計画書)  │
│  [ダウンロード] │  [ダウンロード] │  [ダウンロード] │
└─────────────┴─────────────┴─────────────┘
```

### 4. 申請ガイド機能 (`/guide`)
- 申請プロセスの可視化
- 必要書類チェックリスト
- 申請スケジュール管理
- 支払いスケジュール表示

## 🔄 使用フロー例

### エクセル処理のデモフロー:

1. **サンプルダウンロード**
   ```
   「統合サンプル」ボタンクリック
   ↓
   「補助金申請_統合サンプルデータ_2025-06-19.xlsx」ダウンロード
   ```

2. **ファイルアップロード**
   ```
   ダウンロードしたファイルをドラッグ&ドロップ
   ↓
   「データを抽出」ボタンクリック
   ```

3. **データ抽出結果**
   ```
   企業情報: 株式会社サンプル企業
   代表者: 山田太郎
   売上: 50,000万円
   従業員: 25人
   
   事業情報: ITシステム開発・保守
   課題: 受注増加に対応できない
   目標: 売上30%向上
   
   財務情報: 総費用 5,000,000円
   補助金: 2,500,000円
   経費項目: 5件
   ```

4. **書類生成**
   ```
   「IT導入補助金」ボタンクリック
   ↓
   「IT導入補助金_申請書_2025-06-19.xlsx」ダウンロード
   ```

## 💡 技術的特徴

### スマートデータ抽出:
- シート名による自動分類
- セル内容の自動認識
- 数値データの自動変換
- エラーハンドリング

### リアルタイム処理:
- ファイルアップロード即座に解析
- 進捗表示
- エラー・警告の即時表示

### 正式書類生成:
- ExcelJSによる高品質出力
- 補助金ごとの専用フォーマット
- 実際の申請で使用可能

## 🎯 アクセス方法

- **メインURL**: `http://localhost:5173/`
- **詳細質問票**: `http://localhost:5173/questionnaire`
- **エクセル処理**: `http://localhost:5173/excel`
- **申請ガイド**: `http://localhost:5173/guide`

各機能が完全に実装されており、実用的な補助金申請支援システムとして動作しています。