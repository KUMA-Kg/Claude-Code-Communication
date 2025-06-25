import React, { useRef, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface TouchControlsProps {
  onPinch?: (scale: number) => void;
  onRotate?: (rotation: [number, number, number]) => void;
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onTap?: (position: [number, number]) => void;
  children?: React.ReactNode;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onPinch,
  onRotate,
  onSwipe,
  onTap,
  children
}) => {
  const { camera, gl } = useThree();
  const rotationRef = useRef([0, 0, 0]);
  const scaleRef = useRef(1);
  const lastTapRef = useRef(0);

  // ジェスチャー設定
  const bind = useGesture({
    // ピンチズーム
    onPinch: ({ offset: [scale], event }) => {
      event?.preventDefault();
      scaleRef.current = scale;
      
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.zoom = scale;
        camera.updateProjectionMatrix();
      }
      
      if (onPinch) onPinch(scale);
    },
    
    // ドラッグで回転
    onDrag: ({ offset: [x, y], event }) => {
      event?.preventDefault();
      const rotationSpeed = 0.01;
      rotationRef.current = [
        y * rotationSpeed,
        x * rotationSpeed,
        0
      ];
      
      if (onRotate) onRotate(rotationRef.current as [number, number, number]);
    },
    
    // スワイプ検出
    onDragEnd: ({ velocity: [vx, vy], direction: [dx, dy] }) => {
      const threshold = 0.5;
      
      if (Math.abs(vx) > threshold || Math.abs(vy) > threshold) {
        let direction: 'left' | 'right' | 'up' | 'down';
        
        if (Math.abs(vx) > Math.abs(vy)) {
          direction = dx > 0 ? 'right' : 'left';
        } else {
          direction = dy > 0 ? 'down' : 'up';
        }
        
        if (onSwipe) onSwipe(direction);
      }
    },
    
    // タップ検出（ダブルタップ対応）
    onClick: ({ event }) => {
      const currentTime = Date.now();
      const tapInterval = currentTime - lastTapRef.current;
      lastTapRef.current = currentTime;
      
      // タッチ位置を正規化座標に変換
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      if (tapInterval < 300) {
        // ダブルタップでリセット
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.zoom = 1;
          camera.updateProjectionMatrix();
        }
        scaleRef.current = 1;
        rotationRef.current = [0, 0, 0];
      } else {
        // シングルタップ
        if (onTap) onTap([x, y]);
      }
    }
  }, {
    drag: {
      filterTaps: true,
      threshold: 10
    },
    pinch: {
      scaleBounds: { min: 0.5, max: 3 },
      rubberband: true
    }
  });

  useEffect(() => {
    const element = gl.domElement;
    const handlers = bind();
    
    // タッチイベントのバインド
    Object.entries(handlers).forEach(([event, handler]) => {
      element.addEventListener(event, handler as EventListener, { passive: false });
    });
    
    // タッチ操作のビジュアルフィードバック
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      
      // タッチポイントの可視化
      Array.from(e.touches).forEach(touch => {
        const indicator = document.createElement('div');
        indicator.className = 'touch-indicator';
        indicator.style.cssText = `
          position: fixed;
          left: ${touch.clientX - 20}px;
          top: ${touch.clientY - 20}px;
          width: 40px;
          height: 40px;
          border: 2px solid cyan;
          border-radius: 50%;
          pointer-events: none;
          animation: touchPulse 0.5s ease-out;
          z-index: 9999;
        `;
        document.body.appendChild(indicator);
        
        setTimeout(() => indicator.remove(), 500);
      });
    };
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    // スタイル注入
    const style = document.createElement('style');
    style.textContent = `
      @keyframes touchPulse {
        0% {
          transform: scale(0.5);
          opacity: 1;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }
      
      .touch-controls-hint {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 14px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      .touch-controls-hint.show {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // クリーンアップ
      Object.entries(handlers).forEach(([event, handler]) => {
        element.removeEventListener(event, handler as EventListener);
      });
      element.removeEventListener('touchstart', handleTouchStart);
      document.head.removeChild(style);
    };
  }, [bind, gl.domElement]);

  return (
    <>
      {children}
      <div className="touch-controls-hint">
        ピンチでズーム • ドラッグで回転 • スワイプで切替
      </div>
    </>
  );
};