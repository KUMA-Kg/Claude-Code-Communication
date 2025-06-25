# Live Collaboration Hub Integration Guide

## 概要

IT補助金アシスタントに統合されたLive Collaboration Hub機能は、複数のチームメンバーがリアルタイムで補助金申請書類を共同編集できる革新的な機能です。

## 主要機能

### 1. リアルタイム共同編集
- **ライブカーソル**: 他のユーザーのカーソル位置をリアルタイムで表示
- **プレゼンスインジケーター**: 現在編集中のユーザーを視覚的に表示
- **自動ロック機能**: 編集中のセクションを自動的にロック

### 2. ホワイトボード機能
- **描画ツール**: ペン、図形、テキストツールを提供
- **リアルタイム同期**: 描画内容が即座に全ユーザーに反映
- **エクスポート機能**: ホワイトボードの内容をPNG形式で保存

### 3. アクティビティフィード
- **リアルタイム通知**: ユーザーのアクションを即座に通知
- **履歴表示**: 過去のアクティビティを時系列で表示
- **フィルタリング**: アクティビティタイプでフィルタリング可能

### 4. ビデオ通話機能
- **WebRTC統合**: プラグイン不要のビデオ通話
- **画面共有**: 申請書類を共有しながら議論
- **録画機能**: 重要な会議を録画保存（オプション）

### 5. バージョン管理・競合解決
- **自動バージョニング**: すべての変更を自動的にバージョン管理
- **競合検出**: 同時編集による競合を自動検出
- **3つの解決方法**:
  - 自分の変更を優先
  - 相手の変更を優先
  - 手動マージ

## セットアップ手順

### バックエンド設定

1. **データベーススキーマの適用**
```bash
# コラボレーション機能用のテーブルを作成
psql -U your_user -d your_database -f backend/database/collaboration-schema.sql
psql -U your_user -d your_database -f backend/database/version-control-schema.sql
```

2. **環境変数の設定**
```env
# WebSocket設定
WEBSOCKET_PORT=3002
WEBSOCKET_CORS_ORIGIN=http://localhost:5173

# WebRTC設定（オプション）
TURN_SERVER_URL=turn:your-turn-server.com:3478
TURN_USERNAME=username
TURN_PASSWORD=password
```

3. **サーバーの起動**
```bash
cd backend
npm install socket.io uuid
npm run dev
```

### フロントエンド設定

1. **依存関係のインストール**
```bash
cd frontend
npm install socket.io-client framer-motion date-fns @radix-ui/react-tabs
```

2. **環境変数の設定**
```env
VITE_WEBSOCKET_URL=http://localhost:3001
```

3. **ルーティングの追加**
```typescript
// src/routes/index.tsx に追加
import { CollaborationHub } from '../components/collaboration/CollaborationHub';

<Route path="/collaborate/:subsidyId" element={
  <ProtectedRoute>
    <CollaborationHub />
  </ProtectedRoute>
} />
```

## 使用方法

### 1. コラボレーションセッションの開始

```typescript
// 補助金詳細画面にボタンを追加
<Button onClick={() => navigate(`/collaborate/${subsidyId}`)}>
  共同編集を開始
</Button>
```

### 2. 招待リンクの共有

コラボレーションハブ内の「共有」ボタンをクリックすると、招待リンクがクリップボードにコピーされます。

### 3. リアルタイム編集

- セクションをクリックして編集開始
- 他のユーザーが編集中のセクションは自動的にロックされます
- 変更は自動保存されます

### 4. ホワイトボードの使用

1. 「ホワイトボード」タブをクリック
2. ツールを選択（ペン、図形、テキスト）
3. キャンバス上で描画
4. 「ダウンロード」ボタンで保存

### 5. 競合の解決

競合が発生した場合、自動的にダイアログが表示されます：

1. 両方の変更を確認
2. 解決方法を選択
3. 「解決を確定」をクリック

## API リファレンス

### WebSocket イベント

#### クライアント → サーバー

```typescript
// ルームに参加
socket.emit('join-room', {
  roomId: string,
  subsidyId: string,
  user: {
    id: string,
    name: string,
    email: string
  }
});

// カーソル移動
socket.emit('cursor-move', {
  roomId: string,
  cursor: { x: number, y: number }
});

// ドキュメント変更
socket.emit('document-change', {
  roomId: string,
  changes: any,
  version: number
});
```

#### サーバー → クライアント

```typescript
// ルーム参加完了
socket.on('room-joined', {
  roomId: string,
  user: User,
  users: User[],
  documentVersion: number
});

// ユーザー参加通知
socket.on('user-joined', {
  user: User
});

// 競合検出
socket.on('document-conflict', {
  currentVersion: number,
  changes: any
});
```

### REST API エンドポイント

```typescript
// アクティビティ履歴取得
GET /api/v1/collaboration/rooms/:roomId/activities
Query params:
  - limit: number (default: 50)

// コラボレーションルーム作成
POST /api/v1/collaboration/rooms
Body: {
  subsidyId: string
}
```

## トラブルシューティング

### 接続できない場合

1. WebSocketサーバーが起動しているか確認
2. ファイアウォール設定を確認
3. CORSの設定を確認

### 競合が頻繁に発生する場合

1. 同時編集するセクションを分ける
2. 編集前に他のユーザーと調整
3. 自動マージ可能な変更を心がける

### パフォーマンスの問題

1. 参加人数を10人以下に制限
2. 大きなファイルの共有は避ける
3. 定期的にブラウザキャッシュをクリア

## セキュリティ考慮事項

1. **認証**: すべてのWebSocket接続はJWTトークンで認証
2. **権限管理**: 補助金へのアクセス権限を持つユーザーのみ参加可能
3. **データ暗号化**: WebSocket通信はHTTPS環境でWSS使用を推奨
4. **セッション管理**: 非アクティブなセッションは自動的に終了

## 今後の拡張予定

1. **AIアシスタント統合**: リアルタイムでの文書作成支援
2. **テンプレート共有**: チーム間でのテンプレート共有機能
3. **監査ログ**: すべての変更履歴の詳細な記録
4. **オフライン対応**: オフライン時の変更を後で同期

## サポート

問題が発生した場合は、以下の情報を含めてサポートチームに連絡してください：

- ブラウザとバージョン
- エラーメッセージ
- 再現手順
- ネットワーク環境