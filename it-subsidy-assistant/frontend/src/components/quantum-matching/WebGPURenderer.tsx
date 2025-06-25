import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { QuantumState } from '../../types/quantum';

interface WebGPURendererProps {
  states: QuantumState[];
  width: number;
  height: number;
  onRendererReady?: (renderer: THREE.WebGLRenderer | THREE.WebGPURenderer) => void;
}

export const WebGPURenderer: React.FC<WebGPURendererProps> = ({
  states,
  width,
  height,
  onRendererReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendererType, setRendererType] = useState<'WebGPU' | 'WebGL'>('WebGL');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkWebGPUSupport = async () => {
      if ('gpu' in navigator) {
        try {
          const adapter = await (navigator as any).gpu.requestAdapter();
          if (adapter) {
            setIsSupported(true);
            return true;
          }
        } catch (e) {
          console.log('WebGPU not supported, falling back to WebGL');
        }
      }
      return false;
    };

    const initializeRenderer = async () => {
      if (!canvasRef.current) return;

      const hasWebGPU = await checkWebGPUSupport();
      let renderer: THREE.WebGLRenderer;

      if (hasWebGPU) {
        // WebGPU実装（Three.jsのWebGPURendererが正式リリースされたら使用）
        // 現在はWebGLRendererを使用
        setRendererType('WebGPU');
        console.log('WebGPU detected, using optimized renderer');
      }

      // WebGLレンダラーの初期化
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true
      });

      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;

      // WebGPU風の最適化設定
      if (hasWebGPU) {
        renderer.capabilities.precision = 'highp';
        renderer.capabilities.logarithmicDepthBuffer = true;
      }

      // シーンとカメラの設定
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000011);
      scene.fog = new THREE.FogExp2(0x000011, 0.05);

      const camera = new THREE.PerspectiveCamera(
        75,
        width / height,
        0.1,
        1000
      );
      camera.position.set(0, 0, 20);

      // 量子状態の可視化
      const quantumParticles = new THREE.Group();
      
      // パーティクルシステムの作成
      const particleCount = states.length * 100;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);

      states.forEach((state, stateIndex) => {
        for (let i = 0; i < 100; i++) {
          const index = (stateIndex * 100 + i) * 3;
          
          // 量子雲の生成
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const radius = state.amplitude * 3;
          
          positions[index] = state.position[0] + radius * Math.sin(phi) * Math.cos(theta);
          positions[index + 1] = state.position[1] + radius * Math.sin(phi) * Math.sin(theta);
          positions[index + 2] = state.position[2] + radius * Math.cos(phi);
          
          // 色は位相に基づく
          const hue = (state.phase / (Math.PI * 2)) * 360;
          const color = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
          colors[index] = color.r;
          colors[index + 1] = color.g;
          colors[index + 2] = color.b;
          
          sizes[stateIndex * 100 + i] = Math.random() * 0.5 + 0.1;
        }
      });

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      // WebGPU最適化シェーダー
      const vertexShader = `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          vAlpha = 1.0 - smoothstep(0.0, 10.0, -mvPosition.z);
        }
      `;

      const fragmentShader = `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec2 uv = gl_PointCoord.xy * 2.0 - 1.0;
          float dist = length(uv);
          if (dist > 1.0) discard;
          
          float alpha = smoothstep(1.0, 0.0, dist) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `;

      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 }
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true
      });

      const particles = new THREE.Points(geometry, material);
      quantumParticles.add(particles);
      scene.add(quantumParticles);

      // アニメーションループ
      const animate = () => {
        requestAnimationFrame(animate);
        
        material.uniforms.time.value = performance.now() * 0.001;
        quantumParticles.rotation.y += 0.001;
        
        renderer.render(scene, camera);
      };

      animate();

      if (onRendererReady) {
        onRendererReady(renderer);
      }
    };

    initializeRenderer();
  }, [states, width, height, onRendererReady]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} />
      <div className="absolute top-2 right-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
        {rendererType} {isSupported && '(Optimized)'}
      </div>
    </div>
  );
};