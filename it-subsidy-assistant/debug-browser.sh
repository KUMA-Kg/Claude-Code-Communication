#!/bin/bash

echo "🔍 ブラウザ問題のデバッグ..."
echo ""

# 1. 両方のサーバーの状態確認
echo "📡 サーバー状態:"
echo -n "フロントエンド (5173): "
curl -s http://127.0.0.1:5173 > /dev/null && echo "✅ OK" || echo "❌ NG"

echo -n "バックエンド (3001): "
curl -s http://localhost:3001/health > /dev/null && echo "✅ OK" || echo "❌ NG"
echo ""

# 2. フロントエンドのビルドエラーをチェック
echo "🏗️ フロントエンドのビルド状態:"
cd /Users/apple/Desktop/claudecode_cursor_demo/Claude-Code-Communication/it-subsidy-assistant/frontend

# package.jsonの依存関係を確認
echo "依存関係の確認:"
if [ -f "package.json" ]; then
    grep -A 5 '"dependencies"' package.json
fi
echo ""

# 3. 簡易的なHTMLファイルを作成してテスト
echo "🧪 簡易テストページを作成..."
cat > public/test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>接続テスト</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .status { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .ok { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h1>IT補助金アシストツール - 接続テスト</h1>
    
    <div id="frontend-status" class="status">フロントエンド: チェック中...</div>
    <div id="backend-status" class="status">バックエンド: チェック中...</div>
    
    <h2>手動テスト</h2>
    <button onclick="testBackend()">バックエンドをテスト</button>
    <div id="result"></div>
    
    <script>
        // フロントエンドの状態
        document.getElementById('frontend-status').className = 'status ok';
        document.getElementById('frontend-status').innerText = 'フロントエンド: ✅ 正常に動作中';
        
        // バックエンドのテスト
        async function testBackend() {
            try {
                const response = await fetch('http://localhost:3001/health');
                const data = await response.json();
                document.getElementById('backend-status').className = 'status ok';
                document.getElementById('backend-status').innerText = 'バックエンド: ✅ ' + data.message;
                document.getElementById('result').innerText = JSON.stringify(data, null, 2);
            } catch (error) {
                document.getElementById('backend-status').className = 'status error';
                document.getElementById('backend-status').innerText = 'バックエンド: ❌ ' + error.message;
                document.getElementById('result').innerText = 'エラー: ' + error.message;
            }
        }
        
        // 自動テスト
        testBackend();
    </script>
</body>
</html>
EOF

echo "✅ テストページを作成しました"
echo ""
echo "📱 以下のURLでテストページにアクセス:"
echo "   http://127.0.0.1:5173/test.html"
echo ""
echo "🔧 もしReactアプリが表示されない場合:"
echo "   1. ブラウザの開発者ツール（F12）でコンソールエラーを確認"
echo "   2. ネットワークタブで失敗しているリクエストを確認"
echo ""

# 4. Reactアプリのエラーをチェック
echo "⚛️ Reactアプリのチェック:"
if [ -f "src/main.tsx" ]; then
    echo "main.tsx: ✅ 存在"
else
    echo "main.tsx: ❌ 存在しない"
fi

if [ -f "src/App.tsx" ]; then
    echo "App.tsx: ✅ 存在"
else
    echo "App.tsx: ❌ 存在しない"
fi