# マルチステージビルドによるセキュアなコンテナイメージ
FROM node:18-alpine AS base

# セキュリティ強化
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN apk add --no-cache libc6-compat dumb-init

WORKDIR /app

# セキュリティ脆弱性スキャン用
COPY package*.json ./
RUN npm audit --audit-level high

# 依存関係のインストール（開発環境）
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ビルドステージ
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .

# セキュリティ設定の検証
RUN npm run test:security || exit 1

# アプリケーションビルド
RUN npm run build

# 本番環境用最小イメージ
FROM node:18-alpine AS runner

# セキュリティ強化設定
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN apk add --no-cache dumb-init

WORKDIR /app

# 必要なファイルのみコピー
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/security ./security

# セキュリティ設定
ENV NODE_ENV=production
ENV PORT=3000

# 非特権ユーザーで実行
USER nextjs

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

# セキュアな起動
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]