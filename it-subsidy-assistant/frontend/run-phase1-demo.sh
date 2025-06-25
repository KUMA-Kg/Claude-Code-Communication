#!/bin/bash

echo "🚀 Phase 1 デモを起動します..."
echo ""

# フロントエンドディレクトリへ移動
cd "$(dirname "$0")"

# 必要な依存関係の確認
if ! command -v npm &> /dev/null; then
    echo "❌ npmがインストールされていません。Node.jsをインストールしてください。"
    exit 1
fi

# 依存関係のインストール（必要な場合）
if [ ! -d "node_modules" ]; then
    echo "📦 依存関係をインストールしています..."
    npm install
fi

# デモページのURL
DEMO_URL="http://localhost:5173/phase1-demo.html"
APP_URL="http://localhost:5173"

echo "✨ デモを開始します..."
echo ""
echo "🌐 アクセス方法："
echo ""
echo "1️⃣ Phase 1 スタンドアロンデモ："
echo "   $DEMO_URL"
echo ""
echo "2️⃣ 統合アプリケーション："
echo "   $APP_URL"
echo ""
echo "📌 機能確認ポイント："
echo "  - ダークモード切り替え（右上のボタン）"
echo "  - グレーアウト機能（準備中の補助金をクリック）"
echo "  - ホバーエフェクト（カードにマウスオーバー）"
echo "  - レスポンシブデザイン（ブラウザサイズ変更）"
echo ""
echo "🛑 終了するには Ctrl+C を押してください"
echo ""

# 開発サーバーを起動
npm run dev