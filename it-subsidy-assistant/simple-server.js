const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4000;

const server = http.createServer((req, res) => {
  console.log(`リクエスト受信: ${req.url}`);
  
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>IT補助金アシストツール</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          button { padding: 10px 20px; margin: 10px; cursor: pointer; }
          .primary { background: #3B82F6; color: white; border: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>IT補助金アシストツール</h1>
        <p>シンプルサーバーで動作中</p>
        <button class="primary" onclick="location.href='/flow'">申請フローを開始</button>
        <hr>
        <p>ポート: ${PORT}</p>
        <p>URL: http://localhost:${PORT}/</p>
      </body>
      </html>
    `);
  } else if (req.url === '/flow') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>申請フロー</title></head>
      <body>
        <h1>申請フロー画面</h1>
        <p>ここから5つの質問が始まります</p>
        <button onclick="location.href='/'">戻る</button>
      </body>
      </html>
    `);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, 'localhost', () => {
  console.log(`
===========================================
✅ サーバーが起動しました！
===========================================
🌐 アクセスURL: http://localhost:${PORT}/
📋 申請フロー: http://localhost:${PORT}/flow
===========================================
  `);
});

// エラーハンドリング
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ ポート${PORT}は既に使用されています`);
  } else {
    console.error('サーバーエラー:', err);
  }
});