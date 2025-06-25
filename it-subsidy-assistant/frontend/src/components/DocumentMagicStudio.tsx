import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Download,
  Eye,
  Sparkles,
  Type,
  List,
  Image,
  Table,
  Code,
  Briefcase,
  Users,
  TrendingUp,
  FileCheck,
  Zap,
  Wand2,
  Save,
  Share2,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { useToast } from '@/components/ui/use-toast';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
// import { Separator } from '@/components/ui/separator';
// import { 
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from '@/components/ui/tooltip';

// Types
interface DocumentBlock {
  id: string;
  type: 'text' | 'list' | 'image' | 'table' | 'code' | 'section';
  content: any;
  template?: string;
  aiSuggestions?: string[];
  position: number;
}

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  blocks: Partial<DocumentBlock>[];
  category: string;
}

interface MagicParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
}

// Block Components
const BlockComponent: React.FC<{
  block: DocumentBlock;
  onUpdate: (id: string, content: any) => void;
  onDelete: (id: string) => void;
  onAISuggest: (id: string) => void;
}> = ({ block, onUpdate, onDelete, onAISuggest }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const renderBlockContent = () => {
    switch (block.type) {
      case 'text':
        return (
          <div className="relative group">
            {isEditing ? (
              <textarea
                className="w-full p-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500"
                value={block.content.text || ''}
                onChange={(e) => onUpdate(block.id, { ...block.content, text: e.target.value })}
                onBlur={() => setIsEditing(false)}
                rows={4}
                placeholder="テキストを入力..."
                autoFocus
              />
            ) : (
              <div
                className="p-3 min-h-[100px] cursor-text hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsEditing(true)}
              >
                {block.content.text || <span className="text-gray-400">クリックして編集</span>}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onAISuggest(block.id)}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-2">
            {(block.content.items || []).map((item: string, index: number) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newItems = [...(block.content.items || [])];
                    newItems[index] = e.target.value;
                    onUpdate(block.id, { ...block.content, items: newItems });
                  }}
                  className="flex-1 p-1 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none transition-colors"
                  placeholder="リスト項目"
                />
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newItems = [...(block.content.items || []), ''];
                onUpdate(block.id, { ...block.content, items: newItems });
              }}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              項目を追加
            </Button>
          </div>
        );

      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {(block.content.headers || []).map((header: string, index: number) => (
                    <th key={index} className="border p-2 bg-gray-50 font-medium">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => {
                          const newHeaders = [...(block.content.headers || [])];
                          newHeaders[index] = e.target.value;
                          onUpdate(block.id, { ...block.content, headers: newHeaders });
                        }}
                        className="w-full bg-transparent outline-none"
                        placeholder="ヘッダー"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(block.content.rows || []).map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border p-2">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => {
                            const newRows = [...(block.content.rows || [])];
                            newRows[rowIndex][cellIndex] = e.target.value;
                            onUpdate(block.id, { ...block.content, rows: newRows });
                          }}
                          className="w-full outline-none"
                          placeholder="データ"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'section':
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={block.content.title || ''}
              onChange={(e) => onUpdate(block.id, { ...block.content, title: e.target.value })}
              className="text-xl font-bold w-full outline-none border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 transition-colors"
              placeholder="セクションタイトル"
            />
            <textarea
              value={block.content.description || ''}
              onChange={(e) => onUpdate(block.id, { ...block.content, description: e.target.value })}
              className="w-full p-2 text-gray-600 outline-none resize-none"
              placeholder="セクションの説明..."
              rows={2}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative"
    >
      <Card className="p-4 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-200">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="secondary" className="text-xs">
            {block.type === 'text' && 'テキスト'}
            {block.type === 'list' && 'リスト'}
            {block.type === 'table' && 'テーブル'}
            {block.type === 'section' && 'セクション'}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(block.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
        {renderBlockContent()}
        {block.aiSuggestions && block.aiSuggestions.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-md">
            <div className="flex items-center mb-2">
              <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">AI提案</span>
            </div>
            <div className="space-y-1">
              {block.aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onUpdate(block.id, { ...block.content, text: suggestion });
                    onUpdate(block.id, { ...block.content, aiSuggestions: [] });
                  }}
                  className="block w-full text-left text-sm text-blue-700 hover:bg-blue-100 p-2 rounded transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

// Draggable Block Item
const DraggableBlock: React.FC<{
  type: string;
  icon: React.ReactNode;
  label: string;
}> = ({ type, icon, label }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'block',
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <motion.div
      ref={drag}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`p-4 bg-white border-2 border-gray-200 rounded-lg cursor-move hover:border-blue-400 hover:shadow-md transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex flex-col items-center space-y-2">
        <div className="text-blue-600">{icon}</div>
        <span className="text-sm font-medium">{label}</span>
      </div>
    </motion.div>
  );
};

// Main Component
export const DocumentMagicStudio: React.FC = () => {
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState<MagicParticle[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  // const { toast } = useToast();
  const toast = (options: any) => {
    console.log('Toast:', options.title || options.description);
  };

  // Templates
  const templates: DocumentTemplate[] = [
    {
      id: 'business-plan',
      name: '事業計画書',
      description: 'IT導入補助金申請用の標準的な事業計画書',
      icon: <Briefcase className="h-6 w-6" />,
      category: 'business',
      blocks: [
        { type: 'section', content: { title: '事業概要', description: '' } },
        { type: 'text', content: { text: '' } },
        { type: 'section', content: { title: '導入目的と効果', description: '' } },
        { type: 'list', content: { items: ['', '', ''] } },
        { type: 'table', content: { headers: ['項目', '現状', '導入後'], rows: [['', '', ''], ['', '', '']] } },
      ],
    },
    {
      id: 'impact-report',
      name: '効果測定レポート',
      description: 'IT導入による効果を数値化したレポート',
      icon: <TrendingUp className="h-6 w-6" />,
      category: 'report',
      blocks: [
        { type: 'section', content: { title: '導入効果サマリー', description: '' } },
        { type: 'table', content: { headers: ['指標', '改善率', '金額換算'], rows: [['', '', ''], ['', '', '']] } },
        { type: 'section', content: { title: '詳細分析', description: '' } },
        { type: 'text', content: { text: '' } },
      ],
    },
  ];

  // Drop zone
  const [{ isOver }, drop] = useDrop({
    accept: 'block',
    drop: (item: { type: string }) => {
      addBlock(item.type);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Add block
  const addBlock = (type: string) => {
    const newBlock: DocumentBlock = {
      id: Date.now().toString(),
      type: type as any,
      content: getDefaultContent(type),
      position: blocks.length,
    };
    setBlocks([...blocks, newBlock]);
    createMagicEffect();
  };

  // Get default content
  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'text':
        return { text: '' };
      case 'list':
        return { items: [''] };
      case 'table':
        return { headers: ['列1', '列2'], rows: [['', ''], ['', '']] };
      case 'section':
        return { title: '', description: '' };
      default:
        return {};
    }
  };

  // Create magic particle effect
  const createMagicEffect = () => {
    const newParticles: MagicParticle[] = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        color: ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981'][Math.floor(Math.random() * 4)],
        duration: Math.random() * 2 + 1,
      });
    }
    setParticles([...particles, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 3000);
  };

  // Update block
  const updateBlock = (id: string, content: any) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, content } : block
    ));
  };

  // Delete block
  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
    createMagicEffect();
  };

  // AI suggest
  const handleAISuggest = async (blockId: string) => {
    setIsProcessing(true);
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const suggestions = [
        'IT導入により業務効率が大幅に向上し、年間約30%のコスト削減が見込まれます。',
        'デジタル化により、リアルタイムでのデータ分析が可能となり、迅速な意思決定を支援します。',
        'クラウドシステムの導入により、リモートワークにも対応し、働き方改革を推進します。',
      ];
      
      setBlocks(blocks.map(block => 
        block.id === blockId 
          ? { ...block, aiSuggestions: suggestions }
          : block
      ));
      
      toast({
        title: 'AI提案を生成しました',
        description: '提案をクリックして適用してください',
      });
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'AI提案の生成に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply template
  const applyTemplate = (template: DocumentTemplate) => {
    setActiveTemplate(template.id);
    const newBlocks = template.blocks.map((block, index) => ({
      id: Date.now().toString() + index,
      type: block.type!,
      content: block.content!,
      position: index,
    }));
    setBlocks(newBlocks);
    createMagicEffect();
    toast({
      title: 'テンプレートを適用しました',
      description: template.name,
    });
  };

  // Export document
  const exportDocument = async (format: 'pdf' | 'word' | 'html') => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      toast({
        title: 'エクスポート完了',
        description: `ドキュメントを${format.toUpperCase()}形式でエクスポートしました`,
      });
    } catch (error) {
      toast({
        title: 'エクスポートエラー',
        description: 'ドキュメントのエクスポートに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Magic Particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {particles.map(particle => (
              <motion.div
                key={particle.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: `${particle.x}%`,
                  y: `${particle.y}%`,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: particle.duration }}
                className="absolute"
                style={{
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  borderRadius: '50%',
                  filter: 'blur(1px)',
                }}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="container mx-auto p-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                  <Wand2 className="h-10 w-10 mr-3 text-blue-600" />
                  Document Magic Studio
                </h1>
                <p className="text-gray-600 mt-2">AIパワーで文書作成時間を90%削減</p>
              </div>
              <div className="flex items-center space-x-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Save className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>保存</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="h-5 w-5 mr-2" />
                  プレビュー
                </Button>
                <div className="relative">
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    onClick={() => exportDocument('pdf')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-5 w-5 mr-2" />
                    )}
                    エクスポート
                  </Button>
                  {isProcessing && (
                    <Progress value={progress} className="absolute -bottom-2 left-0 right-0 h-1" />
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="col-span-3"
            >
              <Card className="p-4 sticky top-6">
                <Tabs defaultValue="blocks" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="blocks">ブロック</TabsTrigger>
                    <TabsTrigger value="templates">テンプレート</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="blocks" className="space-y-4 mt-4">
                    <DraggableBlock type="text" icon={<Type className="h-6 w-6" />} label="テキスト" />
                    <DraggableBlock type="list" icon={<List className="h-6 w-6" />} label="リスト" />
                    <DraggableBlock type="table" icon={<Table className="h-6 w-6" />} label="テーブル" />
                    <DraggableBlock type="section" icon={<FileText className="h-6 w-6" />} label="セクション" />
                  </TabsContent>
                  
                  <TabsContent value="templates" className="space-y-3 mt-4">
                    {templates.map(template => (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card 
                          className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => applyTemplate(template)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="text-blue-600">{template.icon}</div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{template.name}</h4>
                              <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </TabsContent>
                </Tabs>
              </Card>
            </motion.div>

            {/* Canvas */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-9"
            >
              <Card 
                ref={drop}
                className={`min-h-[80vh] p-6 transition-all ${
                  isOver ? 'border-2 border-blue-400 bg-blue-50/50' : ''
                }`}
              >
                {blocks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Sparkles className="h-16 w-16 mb-4" />
                    <h3 className="text-xl font-medium mb-2">ドキュメントを作成しましょう</h3>
                    <p className="text-center mb-6">
                      左のパネルからブロックをドラッグ＆ドロップ<br />
                      またはテンプレートを選択してください
                    </p>
                    <div className="flex items-center space-x-2 text-sm">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span>AIが自動的に内容を提案します</span>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="space-y-4 max-w-4xl mx-auto">
                      <AnimatePresence>
                        {blocks.map(block => (
                          <BlockComponent
                            key={block.id}
                            block={block}
                            onUpdate={updateBlock}
                            onDelete={deleteBlock}
                            onAISuggest={handleAISuggest}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                )}
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b flex items-center justify-between">
                  <h3 className="text-xl font-semibold">ドキュメントプレビュー</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <ScrollArea className="h-[calc(90vh-8rem)] p-6">
                  <div className="prose max-w-none">
                    {blocks.map(block => (
                      <div key={block.id} className="mb-6">
                        {block.type === 'section' && (
                          <>
                            <h2 className="text-2xl font-bold mb-2">{block.content.title}</h2>
                            {block.content.description && (
                              <p className="text-gray-600">{block.content.description}</p>
                            )}
                          </>
                        )}
                        {block.type === 'text' && (
                          <p className="whitespace-pre-wrap">{block.content.text}</p>
                        )}
                        {block.type === 'list' && (
                          <ul className="list-disc pl-6">
                            {block.content.items?.map((item: string, index: number) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        )}
                        {block.type === 'table' && (
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                {block.content.headers?.map((header: string, index: number) => (
                                  <th key={index} className="border p-2 bg-gray-100 font-semibold">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {block.content.rows?.map((row: string[], rowIndex: number) => (
                                <tr key={rowIndex}>
                                  {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="border p-2">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  );
};

// Add missing import
import { X } from 'lucide-react';