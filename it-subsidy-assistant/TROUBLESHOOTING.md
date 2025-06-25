# IT補助金アシスタント トラブルシューティングガイド

## 🚨 緊急対応フロー

依存関係エラーが発生した場合の即座の対処法：

```bash
# 1. クリーンインストール
rm -rf node_modules package-lock.json
npm install

# 2. 依存関係チェック
./scripts/dependency-check.js

# 3. ビルド前検証
./scripts/pre-build-validation.sh
```

## 📋 問題カテゴリー別対処法

### 1. 依存関係の問題

#### 症状: `Module not found` エラー

**原因**: package.jsonに必要な依存関係が記載されていない

**解決方法**:
```bash
# 不足しているパッケージを特定
npm ls <package-name>

# パッケージをインストール
npm install --save <package-name>  # 本番依存関係
npm install --save-dev <package-name>  # 開発依存関係

# package-lock.jsonを更新
npm install
```

#### 症状: `npm ci` が失敗する

**原因**: package-lock.jsonとpackage.jsonの不整合

**解決方法**:
```bash
# オプション1: package-lock.jsonを再生成
rm package-lock.json
npm install

# オプション2: キャッシュをクリアして再インストール
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 症状: ピア依存関係の警告

**原因**: 必要なピア依存関係がインストールされていない

**解決方法**:
```bash
# ピア依存関係を確認
npm ls --depth=0

# 警告に従ってインストール
npm install --save <peer-dependency>
```

### 2. TypeScriptエラー

#### 症状: 型定義が見つからない

**原因**: @typesパッケージの不足

**解決方法**:
```bash
# 型定義パッケージをインストール
npm install --save-dev @types/node @types/react @types/express

# tsconfig.jsonの確認
cat tsconfig.json | grep "types"
```

#### 症状: 型エラーが大量発生

**原因**: TypeScriptバージョンの不一致

**解決方法**:
```bash
# TypeScriptバージョンを統一
npm install --save-dev typescript@^5.0.0

# 全プロジェクトで同じバージョンを使用
cd frontend && npm install --save-dev typescript@^5.0.0
cd ../backend && npm install --save-dev typescript@^5.0.0
```

### 3. ビルドエラー

#### 症状: フロントエンドビルドが失敗

**原因**: Vite設定の問題、インポートパスエラー

**解決方法**:
```bash
# Vite設定を確認
cat frontend/vite.config.ts

# エイリアスパスを確認
grep -r "@/" frontend/src

# 環境変数を確認
cd frontend
npm run build -- --debug
```

#### 症状: バックエンドビルドが失敗

**原因**: TypeScript設定、パスエイリアスの問題

**解決方法**:
```bash
# TypeScript設定を確認
cd backend
npx tsc --showConfig

# パスマッピングを確認
grep -A5 "paths" tsconfig.json

# 手動でビルド
npx tsc --build --verbose
```

### 4. 実行時エラー

#### 症状: `Cannot connect to database`

**原因**: Supabase接続設定の問題

**解決方法**:
```bash
# 環境変数を確認
cd backend
cat .env | grep SUPABASE

# 接続テスト
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
client.from('test').select('*').then(console.log).catch(console.error);
"
```

#### 症状: CORS エラー

**原因**: フロントエンドとバックエンドのオリジン設定不一致

**解決方法**:
```bash
# バックエンドのCORS設定を確認
cd backend
grep -r "cors" src/

# 環境変数でCORSオリジンを設定
echo "CORS_ORIGIN=http://localhost:3000" >> .env
```

### 5. セキュリティ警告

#### 症状: npm audit で脆弱性検出

**原因**: 依存関係に既知の脆弱性

**解決方法**:
```bash
# 自動修正を試行
npm audit fix

# 強制的に修正（破壊的変更の可能性）
npm audit fix --force

# 特定のパッケージを更新
npm update <package-name>

# 詳細レポートを確認
npm audit --json > audit-report.json
```

## 🔧 高度なデバッグ技法

### 1. 依存関係の完全リセット

```bash
#!/bin/bash
# clean-install.sh

# すべてのnode_modulesとlockファイルを削除
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
find . -name "package-lock.json" -type f -delete

# npmキャッシュをクリア
npm cache clean --force

# 再インストール
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. 環境診断スクリプト

```bash
#!/bin/bash
# diagnose.sh

echo "=== 環境診断 ==="
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"
echo "TypeScript: $(npx tsc -v)"

echo -e "\n=== 依存関係チェック ==="
cd frontend
echo "Frontend:"
npm ls --depth=0 | grep -E "(react|typescript|vite)"

cd ../backend
echo -e "\nBackend:"
npm ls --depth=0 | grep -E "(express|typescript|@types/node)"

echo -e "\n=== ビルドテスト ==="
cd ../frontend
echo "Frontend build:"
npm run build --silent && echo "✓ 成功" || echo "✗ 失敗"

cd ../backend
echo "Backend build:"
npm run build --silent && echo "✓ 成功" || echo "✗ 失敗"
```

### 3. Docker環境での検証

```dockerfile
# Dockerfile.debug
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# デバッグ情報を出力
RUN echo "=== Build Complete ===" && \
    ls -la dist/ && \
    node --version && \
    npm list --depth=0

CMD ["npm", "start"]
```

## 📊 パフォーマンス問題

### ビルド時間が長い

```bash
# ビルドキャッシュを活用
npm run build -- --cache

# 並列ビルドを有効化
npm run build -- --parallel

# 不要な依存関係を削除
npm prune --production
```

### メモリ不足エラー

```bash
# Node.jsのメモリ制限を増やす
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# または package.json に追加
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
}
```

## 🆘 それでも解決しない場合

1. **エラーログの収集**
   ```bash
   npm run build --verbose 2>&1 | tee build.log
   npm run dev --debug 2>&1 | tee dev.log
   ```

2. **システム情報の収集**
   ```bash
   npx envinfo --system --npmPackages --binaries
   ```

3. **最小限の再現環境を作成**
   ```bash
   # 新しいディレクトリで最小構成を作成
   mkdir minimal-repro
   cd minimal-repro
   npm init -y
   # 問題のあるパッケージのみインストール
   ```

4. **Issue作成時に含める情報**
   - エラーメッセージ全文
   - 実行したコマンド
   - package.jsonの内容
   - 環境情報（OS、Node.jsバージョン等）
   - 再現手順

## 📚 参考リンク

- [npm ドキュメント](https://docs.npmjs.com/)
- [TypeScript エラーリファレンス](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
- [Vite トラブルシューティング](https://vitejs.dev/guide/troubleshooting.html)
- [Node.js デバッグガイド](https://nodejs.org/en/docs/guides/debugging-getting-started/)

---
最終更新: 2024年6月
バージョン: 1.0.0