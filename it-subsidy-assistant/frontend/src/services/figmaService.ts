import { FigmaComponent, FigmaFile, FigmaNode, DesignToken } from '../types/figma';

export class FigmaService {
  private apiKey: string;
  private fileKey: string;
  private websocket: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(apiKey: string, fileKey: string) {
    this.apiKey = apiKey;
    this.fileKey = fileKey;
  }

  // Figmaファイルの取得
  async getFile(): Promise<FigmaFile> {
    const response = await fetch(
      `https://api.figma.com/v1/files/${this.fileKey}`,
      {
        headers: {
          'X-Figma-Token': this.apiKey,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Figma API error: ${response.statusText}`);
    }
    
    return response.json();
  }

  // コンポーネントの取得
  async getComponents(): Promise<FigmaComponent[]> {
    const file = await this.getFile();
    const components: FigmaComponent[] = [];
    
    // コンポーネントを再帰的に探索
    const findComponents = (node: FigmaNode) => {
      if (node.type === 'COMPONENT') {
        components.push({
          id: node.id,
          name: node.name,
          type: node.type,
          description: node.description || '',
          properties: this.extractProperties(node),
        });
      }
      
      if ('children' in node && Array.isArray(node.children)) {
        node.children.forEach(findComponents);
      }
    };
    
    file.document.children.forEach(findComponents);
    return components;
  }

  // デザイントークンの抽出
  async getDesignTokens(): Promise<DesignToken[]> {
    const file = await this.getFile();
    const tokens: DesignToken[] = [];
    
    // スタイルからトークンを抽出
    Object.entries(file.styles || {}).forEach(([id, style]) => {
      tokens.push({
        id,
        name: style.name,
        type: style.styleType,
        value: this.styleToValue(style),
      });
    });
    
    return tokens;
  }

  // WebSocket接続の確立（リアルタイム同期）
  connectWebSocket(onUpdate: (data: any) => void) {
    // Figma Plugin APIを使用したリアルタイム同期
    // 注: 実際の実装にはFigma Pluginが必要
    this.websocket = new WebSocket('wss://figma-sync.example.com');
    
    this.websocket.onopen = () => {
      console.log('Figma WebSocket connected');
      this.websocket?.send(JSON.stringify({
        type: 'subscribe',
        fileKey: this.fileKey,
      }));
    };
    
    this.websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onUpdate(data);
      
      // リスナーに通知
      const listeners = this.listeners.get(data.type);
      if (listeners) {
        listeners.forEach(listener => listener(data));
      }
    };
    
    this.websocket.onerror = (error) => {
      console.error('Figma WebSocket error:', error);
    };
  }

  // イベントリスナーの登録
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  // イベントリスナーの削除
  off(event: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  // WebSocket接続の切断
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  // プロパティの抽出
  private extractProperties(node: FigmaNode): Record<string, any> {
    const properties: Record<string, any> = {};
    
    if ('fills' in node) {
      properties.fills = node.fills;
    }
    if ('strokes' in node) {
      properties.strokes = node.strokes;
    }
    if ('effects' in node) {
      properties.effects = node.effects;
    }
    if ('cornerRadius' in node) {
      properties.cornerRadius = node.cornerRadius;
    }
    
    return properties;
  }

  // スタイルを値に変換
  private styleToValue(style: any): any {
    // スタイルタイプに応じて適切な値を返す
    switch (style.styleType) {
      case 'FILL':
        return style.fills?.[0] || {};
      case 'TEXT':
        return {
          fontSize: style.fontSize,
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
        };
      case 'EFFECT':
        return style.effects || [];
      default:
        return style;
    }
  }

  // ノードをReactコンポーネントに変換
  async nodeToReactComponent(nodeId: string): Promise<string> {
    const response = await fetch(
      `https://api.figma.com/v1/files/${this.fileKey}/nodes?ids=${nodeId}`,
      {
        headers: {
          'X-Figma-Token': this.apiKey,
        },
      }
    );
    
    const data = await response.json();
    const node = data.nodes[nodeId];
    
    if (!node) {
      throw new Error('Node not found');
    }
    
    return this.generateReactCode(node.document);
  }

  // Reactコードの生成
  private generateReactCode(node: FigmaNode): string {
    let code = '';
    
    switch (node.type) {
      case 'FRAME':
      case 'GROUP':
        code = `
<div style={{
  width: ${node.absoluteBoundingBox?.width}px,
  height: ${node.absoluteBoundingBox?.height}px,
  ${this.generateStyleFromNode(node)}
}}>
  ${node.children?.map(child => this.generateReactCode(child)).join('\n') || ''}
</div>`;
        break;
        
      case 'TEXT':
        code = `
<span style={{
  ${this.generateStyleFromNode(node)}
}}>
  ${node.characters || ''}
</span>`;
        break;
        
      case 'RECTANGLE':
        code = `
<div style={{
  width: ${node.absoluteBoundingBox?.width}px,
  height: ${node.absoluteBoundingBox?.height}px,
  ${this.generateStyleFromNode(node)}
}} />`;
        break;
        
      default:
        code = `<!-- Unsupported node type: ${node.type} -->`;
    }
    
    return code;
  }

  // ノードからスタイルを生成
  private generateStyleFromNode(node: any): string {
    const styles: string[] = [];
    
    if (node.fills?.[0]) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID') {
        const { r, g, b, a } = fill.color;
        styles.push(`backgroundColor: 'rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})'`);
      }
    }
    
    if (node.cornerRadius) {
      styles.push(`borderRadius: ${node.cornerRadius}px`);
    }
    
    if (node.strokes?.[0]) {
      const stroke = node.strokes[0];
      if (stroke.type === 'SOLID') {
        const { r, g, b, a } = stroke.color;
        styles.push(`border: ${node.strokeWeight}px solid rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`);
      }
    }
    
    return styles.join(',\n  ');
  }
}