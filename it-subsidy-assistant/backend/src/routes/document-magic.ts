import { Router, Request, Response } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import { exec } from 'child_process';
import { authenticateJWT } from '../middleware/auth-jwt';

const router = Router();
const execAsync = promisify(exec);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-development',
});

// Schemas
const DocumentBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'list', 'image', 'table', 'code', 'section']),
  content: z.any(),
  template: z.string().optional(),
  position: z.number(),
});

const GenerateSuggestionsSchema = z.object({
  blockType: z.string(),
  context: z.object({
    previousBlocks: z.array(DocumentBlockSchema).optional(),
    documentType: z.string().optional(),
    businessInfo: z.object({
      industry: z.string().optional(),
      size: z.string().optional(),
      needs: z.array(z.string()).optional(),
    }).optional(),
  }),
});

const TemplateRecognitionSchema = z.object({
  documentContent: z.array(DocumentBlockSchema),
  businessInfo: z.object({
    industry: z.string(),
    size: z.string(),
    subsidyType: z.string(),
  }),
});

const ExportDocumentSchema = z.object({
  blocks: z.array(DocumentBlockSchema),
  format: z.enum(['pdf', 'word', 'html']),
  metadata: z.object({
    title: z.string(),
    author: z.string().optional(),
    company: z.string().optional(),
  }),
});

// AI-powered content generation
router.post('/generate-suggestions', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const data = GenerateSuggestionsSchema.parse(req.body);
    
    // Create prompt based on context
    const prompt = `
      あなたはIT導入補助金申請書類作成の専門家です。
      以下の情報を基に、${data.blockType}ブロックの内容を3つ提案してください。
      
      文書タイプ: ${data.context.documentType || '事業計画書'}
      業種: ${data.context.businessInfo?.industry || '未指定'}
      企業規模: ${data.context.businessInfo?.size || '中小企業'}
      ニーズ: ${data.context.businessInfo?.needs?.join(', ') || '業務効率化'}
      
      提案は具体的で、IT導入補助金の審査基準に適合したものにしてください。
      各提案は1-2文で簡潔にまとめてください。
    `;

    // For development, return mock suggestions
    if (process.env.NODE_ENV === 'development' || !process.env.OPENAI_API_KEY) {
      const mockSuggestions = getMockSuggestions(data.blockType);
      return res.json({ suggestions: mockSuggestions });
    }

    // Generate suggestions using OpenAI
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 500,
    });

    const suggestionsText = completion.choices[0].message?.content || '';
    const suggestions = suggestionsText
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 3);

    res.json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ 
      error: 'Failed to generate suggestions',
      suggestions: getMockSuggestions(req.body.blockType || 'text')
    });
  }
});

// Template recognition and auto-generation
router.post('/recognize-template', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const data = TemplateRecognitionSchema.parse(req.body);
    
    // Analyze document structure and business needs
    const recommendedSections = getRecommendedSections(
      data.businessInfo.industry,
      data.businessInfo.subsidyType
    );

    // Generate missing sections
    const existingSectionTitles = data.documentContent
      .filter(block => block.type === 'section')
      .map(block => block.content.title);

    const missingSections = recommendedSections.filter(
      section => !existingSectionTitles.includes(section.title)
    );

    res.json({
      recommendedTemplate: {
        name: `${data.businessInfo.industry}向けIT導入計画書`,
        missingSections,
        suggestedOrder: recommendedSections,
      },
    });
  } catch (error) {
    console.error('Error recognizing template:', error);
    res.status(500).json({ error: 'Failed to recognize template' });
  }
});

// Smart auto-completion
router.post('/autocomplete', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { text, cursorPosition, blockType } = req.body;
    
    // Simple autocomplete based on common phrases
    const completions = getAutocompletions(text, blockType);
    
    res.json({ completions });
  } catch (error) {
    console.error('Error in autocomplete:', error);
    res.status(500).json({ error: 'Autocomplete failed' });
  }
});

// Document export
router.post('/export', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const data = ExportDocumentSchema.parse(req.body);
    const exportId = uuidv4();
    const outputDir = join(__dirname, '../../exports');
    
    let filePath: string;
    
    switch (data.format) {
      case 'pdf':
        filePath = await exportToPDF(data, exportId, outputDir);
        break;
      case 'html':
        filePath = await exportToHTML(data, exportId, outputDir);
        break;
      case 'word':
        filePath = await exportToWord(data, exportId, outputDir);
        break;
      default:
        throw new Error('Unsupported format');
    }
    
    res.json({
      success: true,
      exportId,
      downloadUrl: `/api/documents/download/${exportId}`,
      format: data.format,
    });
  } catch (error) {
    console.error('Error exporting document:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Document analysis for improvement suggestions
router.post('/analyze', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { blocks } = req.body;
    
    const analysis = analyzeDocument(blocks);
    const suggestions = generateImprovementSuggestions(analysis);
    
    res.json({
      analysis,
      suggestions,
      score: calculateDocumentScore(analysis),
    });
  } catch (error) {
    console.error('Error analyzing document:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Helper functions
function getMockSuggestions(blockType: string): string[] {
  const suggestions: Record<string, string[]> = {
    text: [
      'IT導入により業務効率が平均30%向上し、年間約500万円のコスト削減が見込まれます。',
      'クラウドシステムの活用により、リモートワーク対応と災害時の事業継続性が確保されます。',
      'デジタル化により顧客データの一元管理が可能となり、マーケティング効果が2倍に向上します。',
    ],
    list: [
      '業務プロセスの自動化による人的ミスの削減',
      'リアルタイムデータ分析による迅速な意思決定',
      'ペーパーレス化による環境負荷軽減とコスト削減',
    ],
    section: [
      '導入効果と投資回収計画',
      'セキュリティ対策と情報管理体制',
      '導入スケジュールと推進体制',
    ],
  };
  
  return suggestions[blockType] || suggestions.text;
}

function getRecommendedSections(industry: string, subsidyType: string) {
  const baseSections = [
    { title: '事業概要', description: '企業の基本情報と現状' },
    { title: '導入目的と課題', description: 'IT導入で解決したい課題' },
    { title: '導入システムの概要', description: '導入予定のITツール・システム' },
    { title: '期待される効果', description: '定量的・定性的効果' },
    { title: '実施スケジュール', description: '導入計画とマイルストーン' },
    { title: '推進体制', description: '導入・運用体制' },
    { title: '投資計画', description: '費用と投資回収見込み' },
  ];
  
  // Industry-specific sections
  const industrySections: Record<string, any[]> = {
    '製造業': [
      { title: '生産性向上計画', description: 'IoT/AI活用による効率化' },
      { title: '品質管理体制', description: 'デジタル品質管理' },
    ],
    '小売業': [
      { title: '顧客体験向上施策', description: 'オムニチャネル戦略' },
      { title: '在庫最適化計画', description: 'AIによる需要予測' },
    ],
    'サービス業': [
      { title: '顧客管理システム', description: 'CRM導入計画' },
      { title: 'サービス品質向上', description: 'デジタル化による改善' },
    ],
  };
  
  return [...baseSections, ...(industrySections[industry] || [])];
}

function getAutocompletions(text: string, blockType: string): string[] {
  const lastWord = text.split(' ').pop() || '';
  
  const completionMap: Record<string, string[]> = {
    '業務': ['業務効率化', '業務プロセス', '業務改善', '業務自動化'],
    'IT': ['IT導入', 'ITシステム', 'ITツール', 'IT投資'],
    '効率': ['効率化', '効率向上', '効率的な運用'],
    'コスト': ['コスト削減', 'コスト効果', 'コストパフォーマンス'],
    'デジタル': ['デジタル化', 'デジタルトランスフォーメーション', 'デジタル変革'],
  };
  
  for (const [prefix, suggestions] of Object.entries(completionMap)) {
    if (lastWord.startsWith(prefix)) {
      return suggestions;
    }
  }
  
  return [];
}

async function exportToPDF(data: any, exportId: string, outputDir: string): Promise<string> {
  const doc = new PDFDocument();
  const filePath = join(outputDir, `${exportId}.pdf`);
  
  doc.pipe(createWriteStream(filePath));
  
  // Add metadata
  doc.info.Title = data.metadata.title;
  doc.info.Author = data.metadata.author || 'IT補助金アシスタント';
  
  // Add content
  doc.fontSize(20).text(data.metadata.title, { align: 'center' });
  doc.moveDown();
  
  for (const block of data.blocks) {
    switch (block.type) {
      case 'section':
        doc.fontSize(16).text(block.content.title);
        if (block.content.description) {
          doc.fontSize(12).text(block.content.description);
        }
        doc.moveDown();
        break;
      case 'text':
        doc.fontSize(12).text(block.content.text);
        doc.moveDown();
        break;
      case 'list':
        for (const item of block.content.items || []) {
          doc.fontSize(12).text(`• ${item}`);
        }
        doc.moveDown();
        break;
      // Add more block types as needed
    }
  }
  
  doc.end();
  return filePath;
}

async function exportToHTML(data: any, exportId: string, outputDir: string): Promise<string> {
  const filePath = join(outputDir, `${exportId}.html`);
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${data.metadata.title}</title>
      <style>
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        h2 { color: #555; margin-top: 30px; }
        ul { padding-left: 30px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
      </style>
    </head>
    <body>
      <h1>${data.metadata.title}</h1>
  `;
  
  for (const block of data.blocks) {
    html += renderBlockToHTML(block);
  }
  
  html += '</body></html>';
  
  const fs = require('fs').promises;
  await fs.writeFile(filePath, html);
  
  return filePath;
}

async function exportToWord(data: any, exportId: string, outputDir: string): Promise<string> {
  // For Word export, we'll convert HTML to DOCX using pandoc if available
  const htmlPath = await exportToHTML(data, exportId, outputDir);
  const docxPath = join(outputDir, `${exportId}.docx`);
  
  try {
    await execAsync(`pandoc "${htmlPath}" -o "${docxPath}"`);
    return docxPath;
  } catch (error) {
    // If pandoc is not available, return HTML
    console.warn('Pandoc not available, returning HTML instead of DOCX');
    return htmlPath;
  }
}

function renderBlockToHTML(block: any): string {
  switch (block.type) {
    case 'section':
      return `<h2>${block.content.title}</h2>${block.content.description ? `<p>${block.content.description}</p>` : ''}`;
    case 'text':
      return `<p>${block.content.text}</p>`;
    case 'list':
      return `<ul>${(block.content.items || []).map((item: string) => `<li>${item}</li>`).join('')}</ul>`;
    case 'table':
      let html = '<table><thead><tr>';
      for (const header of block.content.headers || []) {
        html += `<th>${header}</th>`;
      }
      html += '</tr></thead><tbody>';
      for (const row of block.content.rows || []) {
        html += '<tr>';
        for (const cell of row) {
          html += `<td>${cell}</td>`;
        }
        html += '</tr>';
      }
      html += '</tbody></table>';
      return html;
    default:
      return '';
  }
}

function analyzeDocument(blocks: any[]) {
  const analysis = {
    totalBlocks: blocks.length,
    blockTypes: {} as Record<string, number>,
    contentLength: 0,
    hasAllRequiredSections: false,
    missingElements: [] as string[],
    strengths: [] as string[],
    weaknesses: [] as string[],
  };
  
  // Count block types
  for (const block of blocks) {
    analysis.blockTypes[block.type] = (analysis.blockTypes[block.type] || 0) + 1;
    
    // Calculate content length
    if (block.type === 'text' && block.content.text) {
      analysis.contentLength += block.content.text.length;
    }
  }
  
  // Check for required sections
  const requiredSections = ['事業概要', '導入目的', '期待される効果', '実施スケジュール'];
  const existingSections = blocks
    .filter(b => b.type === 'section')
    .map(b => b.content.title);
  
  analysis.hasAllRequiredSections = requiredSections.every(req => 
    existingSections.some(exist => exist.includes(req))
  );
  
  analysis.missingElements = requiredSections.filter(req => 
    !existingSections.some(exist => exist.includes(req))
  );
  
  // Identify strengths and weaknesses
  if (analysis.contentLength > 1000) {
    analysis.strengths.push('十分な詳細情報が記載されています');
  } else {
    analysis.weaknesses.push('内容が不十分な可能性があります');
  }
  
  if (analysis.blockTypes.table > 0) {
    analysis.strengths.push('データが表形式で整理されています');
  }
  
  if (analysis.blockTypes.list > 2) {
    analysis.strengths.push('要点が箇条書きで分かりやすく整理されています');
  }
  
  return analysis;
}

function generateImprovementSuggestions(analysis: any): string[] {
  const suggestions: string[] = [];
  
  if (analysis.missingElements.length > 0) {
    suggestions.push(`以下のセクションを追加することを推奨します: ${analysis.missingElements.join(', ')}`);
  }
  
  if (analysis.contentLength < 1000) {
    suggestions.push('各セクションにより詳細な説明を追加してください');
  }
  
  if (!analysis.blockTypes.table) {
    suggestions.push('効果測定や投資計画を表形式で整理することを推奨します');
  }
  
  if (!analysis.blockTypes.list) {
    suggestions.push('主要なポイントを箇条書きでまとめると読みやすくなります');
  }
  
  return suggestions;
}

function calculateDocumentScore(analysis: any): number {
  let score = 50; // Base score
  
  // Add points for completeness
  if (analysis.hasAllRequiredSections) score += 20;
  
  // Add points for content length
  score += Math.min(20, analysis.contentLength / 100);
  
  // Add points for structure
  if (analysis.blockTypes.table) score += 5;
  if (analysis.blockTypes.list) score += 5;
  
  // Subtract points for missing elements
  score -= analysis.missingElements.length * 5;
  
  return Math.max(0, Math.min(100, score));
}

export default router;