import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { vector, documentType, section } = await req.json()

    // シンプルな予測ロジック（実際のMLモデルの代わり）
    const predictions = generatePredictions(vector, documentType, section)

    return new Response(
      JSON.stringify({ suggestions: predictions }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

function generatePredictions(vector: number[], documentType: string, section: string) {
  // セクション別の予測テンプレート
  const sectionTemplates: Record<string, string[]> = {
    '事業概要': [
      '主要事業として{service}を展開しており、{years}年の実績があります。',
      '従業員{employees}名の体制で、年商{revenue}円の規模で事業を運営しています。',
      '顧客満足度の向上と事業拡大を目指し、継続的な改善に取り組んでいます。'
    ],
    '導入目的': [
      'DX推進により業務プロセスの効率化を図り、生産性を向上させることを目的としています。',
      '競争力強化のため、最新技術を活用したシステム導入を計画しています。',
      '顧客体験の向上と収益拡大を実現するため、デジタル技術の活用を進めます。'
    ],
    '期待効果': [
      '業務時間を約{percent}%削減し、より付加価値の高い業務に注力できる環境を実現します。',
      'データ分析による意思決定の迅速化と精度向上が期待されます。',
      '顧客満足度の向上により、売上{percent}%増を見込んでいます。'
    ]
  }

  const templates = sectionTemplates[section] || [
    '詳細な計画に基づき、着実に実行してまいります。',
    '専門チームを編成し、プロジェクトを推進します。',
    '定期的な進捗確認により、確実な成果を実現します。'
  ]

  // ベクトルの値に基づいてスコアを計算
  const avgScore = vector.reduce((a, b) => a + b, 0) / vector.length

  return templates.map((text, index) => ({
    text: text.replace('{percent}', Math.floor(20 + avgScore * 30).toString())
         .replace('{years}', Math.floor(5 + avgScore * 10).toString())
         .replace('{employees}', '○○')
         .replace('{revenue}', '○○')
         .replace('{service}', '○○サービス'),
    score: Math.max(0.6, Math.min(0.95, avgScore + (index * 0.05)))
  }))
}