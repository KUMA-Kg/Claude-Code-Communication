const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'AI Document Generation Server is running' });
});

// Document generation endpoint
app.post('/api/documents/generate', async (req, res) => {
    try {
        const { businessDescription, toolDescription, expectedEffect, subsidyType } = req.body;
        
        // Simple validation
        if (!businessDescription || !toolDescription || !expectedEffect) {
            return res.status(400).json({ error: 'すべての項目を入力してください' });
        }
        
        // Generate document content (simplified version without OpenAI)
        const content = generateDocumentContent({
            businessDescription,
            toolDescription,
            expectedEffect,
            subsidyType
        });
        
        res.json({
            success: true,
            content,
            metadata: {
                generatedAt: new Date().toISOString(),
                subsidyType: subsidyType || 'IT導入補助金2025'
            }
        });
    } catch (error) {
        console.error('Error generating document:', error);
        res.status(500).json({ error: '申請書の生成中にエラーが発生しました' });
    }
});

// Document content generator
function generateDocumentContent(data) {
    const date = new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    return `【${data.subsidyType || 'IT導入補助金2025'} 申請書】

申請日: ${date}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 事業者情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 事業概要
${data.businessDescription}

■ 事業の特徴と強み
当社は${extractBusinessType(data.businessDescription)}を主力事業としており、
地域社会への貢献と持続可能な成長を目指しています。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. 導入予定のITツール
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 導入ツールの概要
${data.toolDescription}

■ 選定理由
・現在の業務課題に最適なソリューションである
・費用対効果が高く、投資回収が見込める
・導入実績が豊富で信頼性が高い
・サポート体制が充実している

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. 期待される効果と目標
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 解決したい課題
${data.expectedEffect}

■ 定量的効果（見込み）
・業務時間削減: 月間${estimateTimeSaving(data.expectedEffect)}時間
・コスト削減: 年間${estimateCostSaving(data.expectedEffect)}万円
・生産性向上: ${estimateProductivityGain(data.expectedEffect)}%

■ 定性的効果
・従業員の働きやすさ向上
・顧客満足度の向上
・データに基づく経営判断の実現
・競争力の強化

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. 導入計画
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 導入スケジュール
第1フェーズ（1-2ヶ月目）: 要件定義・システム設計
第2フェーズ（3-4ヶ月目）: システム構築・テスト
第3フェーズ（5-6ヶ月目）: 本格稼働・効果測定

■ 推進体制
プロジェクトリーダー: 経営層
実務担当者: 各部門責任者
ITベンダー: 導入支援・技術サポート

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. 投資計画と効果
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 投資額（概算）
・ソフトウェア費用: ${estimateSoftwareCost(data.toolDescription)}万円
・導入支援費用: ${estimateImplementationCost(data.toolDescription)}万円
・教育研修費用: 30万円

■ 投資回収見込み
導入後${estimateROIPeriod(data)}ヶ月での投資回収を見込む

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. 補足事項
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
本申請にあたり、IT導入補助金の趣旨を十分に理解し、
適切な活用により事業の発展と地域経済への貢献を約束いたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【自動生成日時】 ${new Date().toLocaleString('ja-JP')}
【文書ID】 ${generateDocumentId()}`;
}

// Helper functions
function extractBusinessType(description) {
    if (description.includes('製造')) return '製造業';
    if (description.includes('小売') || description.includes('販売')) return '小売業';
    if (description.includes('IT') || description.includes('ソフトウェア')) return 'IT関連事業';
    if (description.includes('サービス')) return 'サービス業';
    if (description.includes('飲食')) return '飲食業';
    return '事業';
}

function estimateTimeSaving(effect) {
    if (effect.includes('自動化')) return '80-120';
    if (effect.includes('効率化')) return '40-60';
    return '20-40';
}

function estimateCostSaving(effect) {
    if (effect.includes('大幅') || effect.includes('significant')) return '200-300';
    if (effect.includes('削減')) return '100-150';
    return '50-100';
}

function estimateProductivityGain(effect) {
    if (effect.includes('倍') || effect.includes('大幅')) return '50-70';
    if (effect.includes('向上') || effect.includes('改善')) return '20-30';
    return '10-20';
}

function estimateSoftwareCost(tool) {
    if (tool.includes('統合') || tool.includes('ERP')) return '300-500';
    if (tool.includes('クラウド') || tool.includes('SaaS')) return '100-200';
    return '50-100';
}

function estimateImplementationCost(tool) {
    if (tool.includes('カスタマイズ') || tool.includes('統合')) return '100-150';
    return '50-80';
}

function estimateROIPeriod(data) {
    if (data.expectedEffect.includes('大幅') && data.toolDescription.includes('自動化')) return '12-18';
    return '18-24';
}

function generateDocumentId() {
    const date = new Date();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `DOC-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${random}`;
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AI Document Generation Server is running on http://localhost:${PORT}`);
    console.log('📝 Ready to generate subsidy application documents');
});