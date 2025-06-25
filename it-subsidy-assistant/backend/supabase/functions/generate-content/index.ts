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
    const { prompt, temperature = 0.7, maxTokens = 150 } = await req.json()

    // AI生成のシミュレーション（実際のGPTモデルの代わり）
    const suggestions = generateAISuggestions(prompt, temperature, maxTokens)

    return new Response(
      JSON.stringify({ suggestions }),
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

function generateAISuggestions(prompt: string, temperature: number, maxTokens: number) {
  // プロンプトから文脈を抽出
  const context = extractContext(prompt)
  
  // 業種別の提案パターン
  const industrySuggestions: Record<string, string[]> = {
    'IT': [
      '最新のクラウド技術とAIを活用し、革新的なソリューションを提供します。',
      'アジャイル開発手法により、迅速かつ柔軟な対応を実現します。',
      'セキュリティを最優先に、信頼性の高いシステムを構築します。'
    ],
    '製造業': [
      'IoT技術の導入により、生産効率を大幅に向上させます。',
      'リアルタイムデータ分析で、品質管理の精度を高めます。',
      'スマートファクトリー化により、競争力を強化します。'
    ],
    'サービス業': [
      '顧客体験の向上を最優先に、サービス品質を改善します。',
      'データドリブンなアプローチで、顧客ニーズを的確に把握します。',
      'オムニチャネル戦略により、シームレスなサービスを提供します。'
    ]
  }

  const baseSuggestions = industrySuggestions[context.industry] || [
    '業務プロセスの最適化により、効率性を向上させます。',
    'デジタル技術の活用で、新たな価値を創造します。',
    '継続的な改善により、持続可能な成長を実現します。'
  ]

  // 温度パラメータに基づいて創造性を調整
  return baseSuggestions.map((text, index) => {
    const variationFactor = temperature * (Math.random() - 0.5)
    const confidence = Math.max(0.6, Math.min(0.9, 0.75 + variationFactor))
    
    return {
      text: applyContextualVariations(text, context),
      confidence
    }
  })
}

function extractContext(prompt: string): any {
  const context: any = {}
  
  // 業種の抽出
  if (prompt.includes('IT')) context.industry = 'IT'
  else if (prompt.includes('製造業')) context.industry = '製造業'
  else if (prompt.includes('サービス業')) context.industry = 'サービス業'
  else context.industry = 'その他'
  
  // 企業規模の抽出
  if (prompt.includes('小規模')) context.size = '小規模'
  else if (prompt.includes('中規模')) context.size = '中規模'
  else if (prompt.includes('大規模')) context.size = '大規模'
  else context.size = '中規模'
  
  return context
}

function applyContextualVariations(text: string, context: any): string {
  // 企業規模に応じた調整
  if (context.size === '小規模') {
    text = text.replace('大幅に', '着実に')
    text = text.replace('革新的な', '実用的な')
  } else if (context.size === '大規模') {
    text = text.replace('着実に', '飛躍的に')
    text = text.replace('実用的な', '革新的な')
  }
  
  return text
}