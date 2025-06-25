import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Download, 
  Sparkles, 
  Type, 
  List, 
  Table,
  Save,
  Eye 
} from 'lucide-react';

interface DocumentBlock {
  id: string;
  type: 'text' | 'list' | 'table';
  content: string;
}

export const SimpleDocumentMagicStudio: React.FC = () => {
  const [blocks, setBlocks] = useState<DocumentBlock[]>([
    { id: '1', type: 'text', content: 'IT補助金申請書' },
    { id: '2', type: 'text', content: '当社は、業務効率化を目的とした...' }
  ]);
  const [activeTab, setActiveTab] = useState('editor');

  const addBlock = (type: 'text' | 'list' | 'table') => {
    const newBlock: DocumentBlock = {
      id: Date.now().toString(),
      type,
      content: type === 'text' ? 'テキストを入力...' : 
               type === 'list' ? '• リスト項目1\n• リスト項目2' :
               '項目1 | 値1\n項目2 | 値2'
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, content } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center">
          <Sparkles className="mr-2 text-purple-500" />
          Document Magic
        </h3>
        
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-600 mb-2">ブロックを追加</h4>
          
          <button
            onClick={() => addBlock('text')}
            className="w-full flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Type className="h-5 w-5 mr-3 text-blue-500" />
            <span>テキスト</span>
          </button>
          
          <button
            onClick={() => addBlock('list')}
            className="w-full flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <List className="h-5 w-5 mr-3 text-green-500" />
            <span>リスト</span>
          </button>
          
          <button
            onClick={() => addBlock('table')}
            className="w-full flex items-center p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <Table className="h-5 w-5 mr-3 text-orange-500" />
            <span>テーブル</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t">
          <h4 className="font-semibold text-sm text-gray-600 mb-2">アクション</h4>
          <button className="w-full flex items-center p-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
            <Save className="h-4 w-4 mr-2" />
            保存
          </button>
          <button className="w-full flex items-center p-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
            <Download className="h-4 w-4 mr-2" />
            エクスポート
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="bg-white border-b px-6">
          <div className="flex space-x-4">
            {['editor', 'preview'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  activeTab === tab 
                    ? 'border-purple-500 text-purple-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'editor' ? (
                  <>
                    <FileText className="h-4 w-4 inline mr-2" />
                    エディター
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 inline mr-2" />
                    プレビュー
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {activeTab === 'editor' ? (
            <div className="max-w-4xl mx-auto space-y-4">
              {blocks.map((block) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        block.type === 'text' ? 'bg-blue-100 text-blue-700' :
                        block.type === 'list' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {block.type === 'text' ? 'テキスト' :
                         block.type === 'list' ? 'リスト' : 'テーブル'}
                      </span>
                      <button
                        onClick={() => deleteBlock(block.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                    
                    <textarea
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, e.target.value)}
                      className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={block.type === 'text' ? 3 : 5}
                      placeholder="内容を入力..."
                    />
                    
                    <div className="mt-3 flex justify-end">
                      <button className="flex items-center px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI提案
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <button
                onClick={() => addBlock('text')}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center text-gray-600"
              >
                <Plus className="h-5 w-5 mr-2" />
                ブロックを追加
              </button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
              <h1 className="text-2xl font-bold mb-6">文書プレビュー</h1>
              {blocks.map((block, index) => (
                <div key={block.id} className="mb-6">
                  {block.type === 'text' && (
                    <p className="text-gray-800 leading-relaxed">{block.content}</p>
                  )}
                  {block.type === 'list' && (
                    <ul className="list-disc list-inside space-y-1">
                      {block.content.split('\n').map((item, i) => (
                        <li key={i}>{item.replace('•', '').trim()}</li>
                      ))}
                    </ul>
                  )}
                  {block.type === 'table' && (
                    <table className="w-full border-collapse border border-gray-300">
                      <tbody>
                        {block.content.split('\n').map((row, i) => (
                          <tr key={i}>
                            {row.split('|').map((cell, j) => (
                              <td key={j} className="border border-gray-300 p-2">
                                {cell.trim()}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleDocumentMagicStudio;