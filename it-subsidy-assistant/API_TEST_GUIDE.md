# 補助金API動作確認手順書

## 概要
フェーズ1で設計した拡張可能な補助金選択システムのAPIとデータ構造をブラウザから確認するための手順書です。

## 前提条件
- Node.js 18以上がインストールされていること
- Supabaseプロジェクトが設定されていること
- 必要な環境変数が設定されていること

## セットアップ手順

### 1. 依存関係のインストール

```bash
# バックエンドの依存関係
cd it-subsidy-assistant/backend
npm install

# 追加で必要なパッケージ
npm install socket.io cheerio cron
npm install --save-dev @types/cheerio
```

### 2. 環境変数の設定

`.env`ファイルに以下を追加：
```env
# WebSocketとスケジューラーの設定
ENABLE_WEBSOCKET=true
ENABLE_SCHEDULER=false  # デモ環境では無効化推奨
```

### 3. 拡張サーバーの起動

```bash
# 拡張版サーバーを起動
npm run dev:extended

# または直接実行
npx ts-node src/server-extended.ts
```

### 4. APIテストページへのアクセス

ブラウザで以下のURLを開く：
```
http://localhost:3000/api-test.html
```

## 動作確認手順

### 1. モックデータの投入

1. APIテストページの「簡易管理画面」セクションで「モックデータ投入」ボタンをクリック
2. 以下の補助金データが投入されます：
   - IT導入補助金2025（受付中）
   - 小規模事業者持続化補助金（受付中）
   - 事業再構築補助金（準備中）

### 2. APIエンドポイントのテスト

#### 基本的なAPI確認
1. 「GET /api/subsidies」ボタンをクリック → 補助金一覧が表示される
2. 「GET 補助金詳細 (IT導入)」ボタンをクリック → 詳細情報が表示される
3. 「GET 質問フロー」ボタンをクリック → 動的質問セットが表示される
4. 「GET スケジュール」ボタンをクリック → 締切日程が表示される

#### フィルター機能の確認
1. ステータスフィルターで「受付中」を選択
2. タイプフィルターで「IT導入補助金」を選択
3. 「フィルター適用」ボタンをクリック
4. フィルター条件に合った補助金のみ表示される

### 3. WebSocketリアルタイム更新

1. 「WebSocket」セクションで「接続」ボタンをクリック
2. ステータスインジケーターが緑色になることを確認
3. 「更新シミュレート」ボタンをクリック
4. 通知エリアにリアルタイム更新が表示される

### 4. 管理機能のテスト

1. 「IT導入補助金を締切に変更」ボタンをクリック
2. 補助金一覧でステータスが「締切済」に変更されることを確認
3. WebSocket接続時は自動的に画面が更新される

## API仕様

### 拡張されたエンドポイント

| エンドポイント | メソッド | 説明 | 認証 |
|------------|---------|------|------|
| `/api/subsidies` | GET | 補助金一覧取得（フィルター対応） | 不要 |
| `/api/subsidies/:id` | GET | 補助金詳細取得（拡張情報含む） | 不要 |
| `/api/subsidies/:id/questions` | GET | 動的質問フロー取得 | 不要 |
| `/api/subsidies/:id/validate-answers` | POST | 回答検証 | 必要 |
| `/api/subsidies/:id/schedules` | GET | スケジュール取得 | 不要 |
| `/api/subsidies/:id/alerts` | POST | アラート設定 | 必要 |
| `/api/subsidies/:id/alerts` | DELETE | アラート解除 | 必要 |
| `/api/subsidies/types` | GET | 補助金タイプ一覧 | 不要 |
| `/api/subsidies/:id` | PUT | 補助金情報更新 | 管理者 |

### モックデータ管理エンドポイント

| エンドポイント | メソッド | 説明 |
|------------|---------|------|
| `/api/subsidies/mock/load` | POST | SQLファイルからモックデータ投入 |
| `/api/subsidies/mock/quick-load` | POST | 簡易モックデータ投入 |
| `/api/admin/check-deadlines` | POST | 締切チェック実行 |
| `/api/admin/subsidies/:id/status` | PUT | ステータス変更 |
| `/api/admin/cleanup` | DELETE | データクリーンアップ（開発用） |

### WebSocketイベント

| イベント名 | 方向 | 説明 |
|----------|------|------|
| `subscribe` | Client→Server | チャンネル購読 |
| `unsubscribe` | Client→Server | 購読解除 |
| `simulate_update` | Client→Server | 更新シミュレーション |
| `notification` | Server→Client | 通知配信 |
| `subsidy_update` | Server→Client | 補助金更新通知 |

## トラブルシューティング

### よくある問題と解決方法

1. **APIが404エラーを返す**
   - サーバーが正しく起動しているか確認
   - ポート5000が使用されているか確認
   - `server-extended.ts`を使用しているか確認

2. **WebSocketが接続できない**
   - CORS設定を確認
   - ファイアウォール設定を確認
   - ブラウザのコンソールでエラーを確認

3. **モックデータが投入されない**
   - Supabaseの接続設定を確認
   - データベースの権限設定を確認
   - `exec_sql` RPC関数が存在するか確認

4. **補助金一覧が表示されない**
   - ブラウザの開発者ツールでネットワークタブを確認
   - APIレスポンスのエラーメッセージを確認
   - CORSエラーがないか確認

## 開発のヒント

### Supabase RPC関数の作成（必要な場合）

```sql
-- exec_sql関数の作成（開発環境のみ）
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void AS $$
BEGIN
  EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### package.jsonへのスクリプト追加

```json
{
  "scripts": {
    "dev:extended": "nodemon src/server-extended.ts",
    "test:api": "open http://localhost:3000/api-test.html"
  }
}
```

### デバッグモード

環境変数でデバッグを有効化：
```env
DEBUG=subsidy:*
LOG_LEVEL=debug
```

## 次のステップ

1. **本番環境への移行**
   - 認証機能の実装
   - HTTPS対応
   - レート制限の設定

2. **機能拡張**
   - 追加の補助金タイプ対応
   - 高度な検索機能
   - レポート機能

3. **パフォーマンス最適化**
   - データベースインデックスの最適化
   - キャッシュの実装
   - CDNの活用