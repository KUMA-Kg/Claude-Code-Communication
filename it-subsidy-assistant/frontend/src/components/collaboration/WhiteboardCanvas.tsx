import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useCollaboration } from '../../hooks/useCollaboration';
import { Button } from '../ui/Button';
import { 
  Pencil, 
  Square, 
  Circle, 
  Type,
  Eraser,
  Download,
  Trash2,
  Undo,
  Redo
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  color: string;
}

interface WhiteboardCanvasProps {
  roomId: string;
  users: User[];
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id: string;
  userId: string;
  points: Point[];
  color: string;
  width: number;
  timestamp: number;
}

interface Shape {
  id: string;
  userId: string;
  type: 'rectangle' | 'circle' | 'text';
  position: Point;
  size: { width: number; height: number };
  color: string;
  text?: string;
  timestamp: number;
}

type Tool = 'pencil' | 'rectangle' | 'circle' | 'text' | 'eraser';

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({ roomId, users }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [history, setHistory] = useState<{ strokes: Stroke[]; shapes: Shape[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const { socket } = useCollaboration();

  useEffect(() => {
    if (!socket) return;

    socket.on('whiteboard-stroke-added', (data: { stroke: Stroke }) => {
      setStrokes(prev => [...prev, data.stroke]);
    });

    socket.on('whiteboard-shape-added', (data: { shape: Shape }) => {
      setShapes(prev => [...prev, data.shape]);
    });

    return () => {
      socket.off('whiteboard-stroke-added');
      socket.off('whiteboard-shape-added');
    };
  }, [socket]);

  useEffect(() => {
    redrawCanvas();
  }, [strokes, shapes]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw strokes
    strokes.forEach(stroke => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      stroke.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    });

    // Draw shapes
    shapes.forEach(shape => {
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.color + '20';
      ctx.lineWidth = 2;

      switch (shape.type) {
        case 'rectangle':
          ctx.strokeRect(shape.position.x, shape.position.y, shape.size.width, shape.size.height);
          ctx.fillRect(shape.position.x, shape.position.y, shape.size.width, shape.size.height);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(
            shape.position.x + shape.size.width / 2,
            shape.position.y + shape.size.height / 2,
            Math.min(shape.size.width, shape.size.height) / 2,
            0,
            Math.PI * 2
          );
          ctx.stroke();
          ctx.fill();
          break;
        case 'text':
          if (shape.text) {
            ctx.font = '16px sans-serif';
            ctx.fillStyle = shape.color;
            ctx.fillText(shape.text, shape.position.x, shape.position.y);
          }
          break;
      }
    });
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setIsDrawing(true);

    if (tool === 'pencil') {
      setCurrentStroke([pos]);
    } else if (tool === 'text') {
      const text = prompt('テキストを入力してください');
      if (text) {
        const shape: Shape = {
          id: `shape_${Date.now()}`,
          userId: 'current-user',
          type: 'text',
          position: pos,
          size: { width: 100, height: 30 },
          color,
          text,
          timestamp: Date.now()
        };
        
        setShapes(prev => [...prev, shape]);
        
        if (socket) {
          socket.emit('whiteboard-shape', { roomId, shape });
        }
      }
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const pos = getMousePos(e);

    if (tool === 'pencil') {
      setCurrentStroke(prev => [...prev, pos]);
      
      // Draw current stroke
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      if (currentStroke.length > 0) {
        ctx.moveTo(currentStroke[currentStroke.length - 1].x, currentStroke[currentStroke.length - 1].y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const pos = getMousePos(e);
    setIsDrawing(false);

    if (tool === 'pencil' && currentStroke.length > 0) {
      const stroke: Stroke = {
        id: `stroke_${Date.now()}`,
        userId: 'current-user',
        points: currentStroke,
        color,
        width: lineWidth,
        timestamp: Date.now()
      };

      setStrokes(prev => [...prev, stroke]);
      setCurrentStroke([]);

      if (socket) {
        socket.emit('whiteboard-stroke', { roomId, stroke });
      }
    } else if (tool === 'rectangle' || tool === 'circle') {
      const startPos = currentStroke[0] || pos;
      const shape: Shape = {
        id: `shape_${Date.now()}`,
        userId: 'current-user',
        type: tool,
        position: {
          x: Math.min(startPos.x, pos.x),
          y: Math.min(startPos.y, pos.y)
        },
        size: {
          width: Math.abs(pos.x - startPos.x),
          height: Math.abs(pos.y - startPos.y)
        },
        color,
        timestamp: Date.now()
      };

      setShapes(prev => [...prev, shape]);

      if (socket) {
        socket.emit('whiteboard-shape', { roomId, shape });
      }
    }

    // Save to history
    saveToHistory();
  };

  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ strokes: [...strokes], shapes: [...shapes] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setStrokes(prevState.strokes);
      setShapes(prevState.shapes);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setStrokes(nextState.strokes);
      setShapes(nextState.shapes);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const clearCanvas = () => {
    setStrokes([]);
    setShapes([]);
    saveToHistory();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          {/* Tools */}
          <div className="flex items-center space-x-1 p-1 bg-gray-100 rounded-lg">
            <Button
              size="sm"
              variant={tool === 'pencil' ? 'default' : 'ghost'}
              onClick={() => setTool('pencil')}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'rectangle' ? 'default' : 'ghost'}
              onClick={() => setTool('rectangle')}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'circle' ? 'default' : 'ghost'}
              onClick={() => setTool('circle')}
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'text' ? 'default' : 'ghost'}
              onClick={() => setTool('text')}
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'eraser' ? 'default' : 'ghost'}
              onClick={() => setTool('eraser')}
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>

          {/* Colors */}
          <div className="flex items-center space-x-1 p-1 bg-gray-100 rounded-lg">
            {colors.map(c => (
              <button
                key={c}
                className={`w-6 h-6 rounded ${color === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>

          {/* Line width */}
          <div className="flex items-center space-x-2 px-3">
            <label className="text-sm text-gray-600">線の太さ:</label>
            <input
              type="range"
              min="1"
              max="10"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-600">{lineWidth}px</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearCanvas}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={downloadCanvas}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-4 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-200 rounded-lg cursor-crosshair w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
        />
      </div>

      {/* Active users */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">描画中のユーザー:</span>
          <div className="flex -space-x-2">
            {users.map(user => (
              <div
                key={user.id}
                className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};