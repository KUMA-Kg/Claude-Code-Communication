export interface FigmaFile {
  name: string;
  lastModified: string;
  version: string;
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  styles: Record<string, FigmaStyle>;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  effects?: FigmaEffect[];
  cornerRadius?: number;
  characters?: string;
  style?: FigmaTextStyle;
  description?: string;
}

export interface FigmaComponent {
  id: string;
  name: string;
  type: string;
  description: string;
  properties: Record<string, any>;
}

export interface FigmaStyle {
  name: string;
  description: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  fills?: FigmaFill[];
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  effects?: FigmaEffect[];
}

export interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  gradientStops?: FigmaGradientStop[];
}

export interface FigmaStroke {
  type: 'SOLID' | 'GRADIENT_LINEAR';
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  strokeWeight?: number;
}

export interface FigmaEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible?: boolean;
  radius?: number;
  offset?: { x: number; y: number };
  color?: FigmaColor;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaGradientStop {
  position: number;
  color: FigmaColor;
}

export interface FigmaTextStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  letterSpacing: number;
  lineHeight: number;
  textAlign: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
}

export interface DesignToken {
  id: string;
  name: string;
  type: string;
  value: any;
}

export interface FigmaConfig {
  apiKey: string;
  fileKey: string;
  enableRealtime?: boolean;
}