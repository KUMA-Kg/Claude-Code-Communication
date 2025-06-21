#!/bin/bash

echo "🔍 バックエンドの詳細診断..."
echo ""

# バックエンドプロセスのPIDを取得
BACKEND_PID=$(ps aux | grep "ts-node/register.*src/index.ts" | grep -v grep | awk '{print $2}')

if [ -n "$BACKEND_PID" ]; then
    echo "✅ バックエンドプロセスが見つかりました (PID: $BACKEND_PID)"
    echo ""
    
    # プロセスの詳細情報
    echo "📊 プロセス情報:"
    ps -p $BACKEND_PID -o pid,ppid,user,state,pcpu,pmem,etime,command
    echo ""
    
    # ネットワーク接続の確認
    echo "🔌 ネットワーク接続:"
    lsof -p $BACKEND_PID | grep LISTEN
    echo ""
else
    echo "❌ バックエンドプロセスが見つかりません"
    echo ""
    echo "🚀 バックエンドを再起動してみます..."
    cd /Users/apple/Desktop/claudecode_cursor_demo/Claude-Code-Communication/it-subsidy-assistant/backend
    
    # 全てのnodeプロセスを終了
    pkill -f "node.*backend"
    sleep 2
    
    # 環境変数をエクスポートして直接起動
    export $(cat .env | grep -v '^#' | xargs)
    
    echo "環境変数のチェック:"
    echo "SUPABASE_URL: ${SUPABASE_URL:0:30}..."
    echo "PORT: $PORT"
    echo ""
    
    # 直接ts-nodeで起動してエラーを確認
    echo "🔧 ts-nodeで直接起動..."
    npx ts-node -r tsconfig-paths/register src/index.ts
fi