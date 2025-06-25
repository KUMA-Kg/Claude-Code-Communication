import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useControls } from 'leva';
import { FigmaService } from '../../services/figmaService';
import { FigmaComponent, DesignToken } from '../../types/figma';
import { motion, AnimatePresence } from 'framer-motion';

interface FigmaProfileWizardProps {
  onComplete: (formData: any) => void;
}

// ドラッグ可能なFigmaコンポーネント
const DraggableFigmaComponent: React.FC<{
  component: FigmaComponent;
  onDrop: (component: FigmaComponent) => void;
}> = ({ component, onDrop }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'figma-component',
    item: { component },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`p-3 bg-white border-2 border-gray-200 rounded-lg cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'hover:border-blue-400 hover:shadow-md'
      }`}
    >
      <h4 className="font-medium text-sm mb-1">{component.name}</h4>
      <p className="text-xs text-gray-500">{component.description || 'No description'}</p>
    </div>
  );
};

// フォームキャンバス
const FormCanvas: React.FC<{
  onComponentDrop: (component: FigmaComponent, position: { x: number; y: number }) => void;
  children?: React.ReactNode;
}> = ({ onComponentDrop, children }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'figma-component',
    drop: (item: { component: FigmaComponent }, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset) {
        const canvasRect = (drop as any).current?.getBoundingClientRect();
        if (canvasRect) {
          onComponentDrop(item.component, {
            x: offset.x - canvasRect.left,
            y: offset.y - canvasRect.top,
          });
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      data-testid="form-canvas"
      className={`relative w-full h-[600px] bg-gray-50 border-2 border-dashed rounded-xl transition-colors ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
      }`}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-blue-600 font-medium">ここにドロップ</p>
        </div>
      )}
    </div>
  );
};

const FigmaProfileWizard: React.FC<FigmaProfileWizardProps> = ({ onComplete }) => {
  const [figmaService, setFigmaService] = useState<FigmaService | null>(null);
  const [components, setComponents] = useState<FigmaComponent[]>([]);
  const [designTokens, setDesignTokens] = useState<DesignToken[]>([]);
  const [formElements, setFormElements] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('default');

  // デバッグコントロール
  const { showGrid, snapToGrid, gridSize } = useControls('Form Builder', {
    showGrid: { value: true, label: 'Show Grid' },
    snapToGrid: { value: true, label: 'Snap to Grid' },
    gridSize: { value: 20, min: 10, max: 50, step: 5 },
  });

  // Figma接続
  const connectToFigma = useCallback(async () => {
    setIsLoading(true);
    try {
      // 実際の実装では環境変数から取得
      const apiKey = process.env.REACT_APP_FIGMA_API_KEY || 'demo-key';
      const fileKey = process.env.REACT_APP_FIGMA_FILE_KEY || 'demo-file';
      
      const service = new FigmaService(apiKey, fileKey);
      setFigmaService(service);
      
      // コンポーネントとデザイントークンを取得
      const [fetchedComponents, fetchedTokens] = await Promise.all([
        service.getComponents(),
        service.getDesignTokens(),
      ]);
      
      setComponents(fetchedComponents);
      setDesignTokens(fetchedTokens);
      setIsConnected(true);
      
      // リアルタイム同期を開始
      service.connectWebSocket((data) => {
        console.log('Figma update:', data);
        handleFigmaUpdate(data);
      });
      
    } catch (error) {
      console.error('Figma connection error:', error);
      // デモ用のモックデータ
      setComponents(getMockComponents());
      setDesignTokens(getMockDesignTokens());
      setIsConnected(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Figmaからの更新を処理
  const handleFigmaUpdate = (data: any) => {
    if (data.type === 'component-update') {
      setComponents(prev => prev.map(comp => 
        comp.id === data.componentId ? { ...comp, ...data.updates } : comp
      ));
    } else if (data.type === 'token-update') {
      setDesignTokens(prev => prev.map(token => 
        token.id === data.tokenId ? { ...token, value: data.value } : token
      ));
    }
  };

  // コンポーネントをドロップ
  const handleComponentDrop = (component: FigmaComponent, position: { x: number; y: number }) => {
    const newElement = {
      id: `element-${Date.now()}`,
      componentId: component.id,
      component,
      position: snapToGrid ? {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize,
      } : position,
      props: {},
    };
    
    setFormElements([...formElements, newElement]);
  };

  // テーマ変更
  const applyTheme = (themeName: string) => {
    setSelectedTheme(themeName);
    const themeTokens = designTokens.filter(token => token.name.includes(themeName));
    
    // CSSカスタムプロパティとして適用
    themeTokens.forEach(token => {
      if (token.type === 'color') {
        document.documentElement.style.setProperty(
          `--${token.name}`,
          token.value
        );
      }
    });
  };

  // フォーム送信
  const handleSubmit = () => {
    const formData = formElements.reduce((acc, element) => {
      // フォーム要素から値を収集
      return { ...acc, [element.component.name]: element.props.value || '' };
    }, {});
    
    onComplete(formData);
  };

  // モックデータ
  const getMockComponents = (): FigmaComponent[] => [
    {
      id: 'input-1',
      name: 'Text Input',
      type: 'COMPONENT',
      description: 'Basic text input field',
      properties: { placeholder: 'Enter text' },
    },
    {
      id: 'select-1',
      name: 'Dropdown Select',
      type: 'COMPONENT',
      description: 'Dropdown selection field',
      properties: { options: ['Option 1', 'Option 2'] },
    },
    {
      id: 'button-1',
      name: 'Primary Button',
      type: 'COMPONENT',
      description: 'Primary action button',
      properties: { variant: 'primary' },
    },
  ];

  const getMockDesignTokens = (): DesignToken[] => [
    { id: 'color-primary', name: 'color-primary', type: 'color', value: '#3b82f6' },
    { id: 'color-secondary', name: 'color-secondary', type: 'color', value: '#10b981' },
    { id: 'spacing-small', name: 'spacing-small', type: 'spacing', value: '8px' },
  ];

  // クリーンアップ
  useEffect(() => {
    return () => {
      figmaService?.disconnect();
    };
  }, [figmaService]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-100">
        {/* 左サイドバー - Figmaコンポーネント */}
        <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Figmaコンポーネント</h2>
          
          {!isConnected ? (
            <button
              data-testid="connect-figma"
              onClick={connectToFigma}
              disabled={isLoading}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Connecting...' : 'Figmaに接続'}
            </button>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="font-medium mb-2">テーマ選択</h3>
                <select
                  data-testid="theme-selector"
                  value={selectedTheme}
                  onChange={(e) => applyTheme(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="default">Default</option>
                  <option value="corporate-blue">Corporate Blue</option>
                  <option value="modern-green">Modern Green</option>
                </select>
              </div>
              
              <div data-testid="figma-components" className="space-y-3">
                {components.map((component) => (
                  <DraggableFigmaComponent
                    key={component.id}
                    component={component}
                    onDrop={handleComponentDrop}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* メインエリア - フォームキャンバス */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">プロファイルフォームビルダー</h1>
            
            <FormCanvas onComponentDrop={handleComponentDrop}>
              {/* グリッド表示 */}
              {showGrid && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <pattern
                      id="grid"
                      width={gridSize}
                      height={gridSize}
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                        fill="none"
                        stroke="gray"
                        strokeWidth="0.5"
                        opacity="0.2"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              )}
              
              {/* 配置されたフォーム要素 */}
              <AnimatePresence>
                {formElements.map((element) => (
                  <motion.div
                    key={element.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    style={{
                      position: 'absolute',
                      left: element.position.x,
                      top: element.position.y,
                    }}
                    className="bg-white p-4 rounded-lg shadow-md border-2 border-transparent hover:border-blue-400"
                  >
                    {renderFormElement(element)}
                  </motion.div>
                ))}
              </AnimatePresence>
            </FormCanvas>
            
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setFormElements([])}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                クリア
              </button>
              <button
                data-testid="primary-button"
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                フォームを保存
              </button>
            </div>
          </div>
        </div>

        {/* 右サイドバー - デザイントークン */}
        <div className="w-64 bg-white shadow-lg p-6 overflow-y-auto">
          <h3 className="font-bold mb-4">デザイントークン</h3>
          <div className="space-y-3">
            {designTokens.map((token) => (
              <div key={token.id} className="p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium">{token.name}</p>
                <p className="text-xs text-gray-500">
                  {token.type}: {JSON.stringify(token.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

// フォーム要素のレンダリング
const renderFormElement = (element: any) => {
  switch (element.component.name) {
    case 'Text Input':
      return (
        <input
          data-testid="figma-input-component"
          type="text"
          placeholder={element.component.properties.placeholder}
          className="w-full p-2 border rounded"
          onChange={(e) => element.props.value = e.target.value}
        />
      );
    case 'Dropdown Select':
      return (
        <select className="w-full p-2 border rounded">
          {element.component.properties.options?.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case 'Primary Button':
      return (
        <button className="px-4 py-2 bg-blue-500 text-white rounded">
          Button
        </button>
      );
    default:
      return <div>Unknown component</div>;
  }
};

export default FigmaProfileWizard;