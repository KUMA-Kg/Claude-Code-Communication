const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// OpenAI APIキー
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''; // 環境変数から取得

// ミドルウェア
app.use(cors());
app.use(express.json());

// ヘルスチェック
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Simple AI Server is running' });
});

// AI文書生成エンドポイント
app.post('/api/generate', async (req, res) => {
    const { subsidyType, answers } = req.body;
    
    try {
        // OpenAI API呼び出し
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: '日本の補助金申請書類作成の専門家として、簡潔な回答から完全な申請書類を生成してください。'
                    },
                    {
                        role: 'user',
                        content: buildPrompt(subsidyType, answers)
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // 構造化された文書を返す
        res.json({
            success: true,
            document: parseDocument(content)
        });
        
    } catch (error) {
        console.error('Error:', error);
        
        // フォールバック
        res.json({
            success: true,
            document: generateFallback(subsidyType, answers)
        });
    }
});

// プロンプト構築
function buildPrompt(subsidyType, answers) {
    const subsidyNames = {
        'it-donyu': 'IT導入補助金',
        'monozukuri': 'ものづくり補助金',
        'jizokuka': '持続化補助金',
        'jigyou-saikouchiku': '事業再構築補助金'
    };
    
    return `
${subsidyNames[subsidyType]}の申請書類を作成してください。

【回答内容】
質問1への回答: ${answers.q1}
質問2への回答: ${answers.q2}
質問3への回答: ${answers.q3}

上記の回答を基に、以下の構成で申請書類を作成してください：
1. 事業計画概要（200文字程度）
2. 実施内容（300文字程度）
3. 期待される効果（200文字程度）
4. 実施スケジュール（箇条書き）

各セクションは具体的で説得力のある内容にしてください。
`;
}

// 文書解析
function parseDocument(content) {
    // セクションごとに分割
    const sections = content.split(/\d+\.\s+/).filter(s => s.trim());
    
    return {
        title: '補助金申請書',
        sections: [
            {
                title: '事業計画概要',
                content: sections[0] || '事業計画の概要を記載します。'
            },
            {
                title: '実施内容',
                content: sections[1] || '具体的な実施内容を記載します。'
            },
            {
                title: '期待される効果',
                content: sections[2] || '期待される効果を記載します。'
            },
            {
                title: '実施スケジュール',
                content: sections[3] || '実施スケジュールを記載します。'
            }
        ]
    };
}

// フォールバック文書生成
function generateFallback(subsidyType, answers) {
    return {
        title: '補助金申請書（簡易版）',
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

// サーバー起動
app.listen(PORT, () => {
    console.log(`🚀 Simple AI Server running on http://localhost:${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 Generate endpoint: http://localhost:${PORT}/api/generate`);
});