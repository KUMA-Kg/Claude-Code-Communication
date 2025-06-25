import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleFieldProps {
  count?: number;
  spread?: number;
  color?: string;
}

const ParticleField: React.FC<ParticleFieldProps> = ({
  count = 500,
  spread = 30,
  color = '#8b5cf6',
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // パーティクルの位置を生成
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    const colorObj = new THREE.Color(color);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // ランダムな位置
      positions[i3] = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = (Math.random() - 0.5) * spread;
      positions[i3 + 2] = (Math.random() - 0.5) * spread;
      
      // 色の設定
      colors[i3] = colorObj.r;
      colors[i3 + 1] = colorObj.g;
      colors[i3 + 2] = colorObj.b;
      
      // サイズ
      sizes[i] = Math.random() * 0.5;
    }
    
    return { positions, colors, sizes };
  }, [count, spread, color]);
  
  // アニメーション
  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.elapsedTime;
    const positions = pointsRef.current.geometry.attributes.position;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positions.array[i3];
      const y = positions.array[i3 + 1];
      const z = positions.array[i3 + 2];
      
      // ゆったりとした浮遊アニメーション
      positions.array[i3 + 1] = y + Math.sin(time * 0.5 + x) * 0.001;
      
      // 境界でのループ
      if (Math.abs(positions.array[i3]) > spread / 2) {
        positions.array[i3] *= -0.9;
      }
      if (Math.abs(positions.array[i3 + 1]) > spread / 2) {
        positions.array[i3 + 1] *= -0.9;
      }
      if (Math.abs(positions.array[i3 + 2]) > spread / 2) {
        positions.array[i3 + 2] *= -0.9;
      }
    }
    
    positions.needsUpdate = true;
    
    // 全体の回転
    pointsRef.current.rotation.y = time * 0.05;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particles.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default ParticleField;