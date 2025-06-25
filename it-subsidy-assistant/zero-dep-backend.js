const http = require('http');
const url = require('url');

const PORT = 3002;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''; // 環境変数から取得

// CORSヘッダーを追加
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// リクエストボディを読み取る
function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

// フォールバック文書生成
function generateFallback(subsidyType, answers) {
    return {
        title: '補助金申請書',
        sections: [
            {
                title: '事業計画概要',
                content: `${answers.q1}という課題を解決するため、本補助金を活用した革新的な事業を計画しています。これにより、業務効率の大幅な改善と競争力の向上を実現します。`
            },
            {
                title: '実施内容',
                content: `${answers.q2}を中心とした施策を展開します。具体的には、最新技術の導入と業務プロセスの改革を同時に進め、持続可能な成長基盤を構築します。`
            },
            {
                title: '期待される効果',
                content: `本事業により、${answers.q3}を実現します。定量的には30%の生産性向上、定性的には顧客満足度の大幅な改善が期待されます。`
            },
            {
                title: '実施スケジュール',
                content: `・第1四半期：準備・計画策定\n・第2四半期：システム導入・構築\n・第3四半期：運用開始・改善\n・第4四半期：効果測定・展開`
            }
        ]
    };
}

// HTTPサーバー作成
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // CORSヘッダーを設定
    setCorsHeaders(res);
    
    // OPTIONSリクエストへの対応
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // ヘルスチェック
    if (pathname === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            message: 'Zero Dependency AI Server is running' 
        }));
        return;
    }
    
    // AI文書生成
    if (pathname === '/api/generate' && req.method === 'POST') {
        try {
            const body = await readBody(req);
            const { subsidyType, answers } = body;
            
            // 簡単のため、フォールバックデータを返す
            // 実際のOpenAI API呼び出しはhttpsモジュールで実装可能
            const document = generateFallback(subsidyType, answers);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                document: document
            }));
            
        } catch (error) {
            console.error('Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
        return;
    }
    
    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
});

// サーバー起動
server.listen(PORT, () => {
    console.log(`🚀 Zero Dependency AI Server running on http://localhost:${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 Generate endpoint: http://localhost:${PORT}/api/generate`);
    console.log(`\n✨ HTMLファイルを開いて使用してください:`);
    console.log(`   file://${__dirname}/simple-ai-form.html`);
});