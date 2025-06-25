import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, TubeGeometry } from 'three';
import * as THREE from 'three';

interface QuantumPathProps {
  start: [number, number, number];
  end: [number, number, number];
  strength: number;
  color: string;
}

export const QuantumPath: React.FC<QuantumPathProps> = ({
  start,
  end,
  strength,
  color
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // エンタングルメントパスの生成
  const geometry = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const midPoint = startVec.clone().add(endVec).multiplyScalar(0.5);
    
    // 量子的な曲線を作成
    const curve = new CatmullRomCurve3([
      startVec,
      new THREE.Vector3(
        midPoint.x + (Math.random() - 0.5) * 2,
        midPoint.y + Math.sin(Date.now() * 0.001) * 1,
        midPoint.z + (Math.random() - 0.5) * 2
      ),
      endVec
    ]);
    
    return new TubeGeometry(curve, 32, 0.05 * strength, 8, false);
  }, [start, end, strength]);
  
  // アニメーション
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // パルスアニメーション
    meshRef.current.material.emissiveIntensity = 
      0.5 + Math.sin(time * 3) * 0.3 * strength;
    
    // 位相シフト
    if (meshRef.current.material.map) {
      meshRef.current.material.map.offset.x = (time * 0.5) % 1;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
        transparent
        opacity={0.6 * strength}
        side={THREE.DoubleSide}
      >
        <canvasTexture
          attach="map"
          image={(() => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const ctx = canvas.getContext('2d')!;
            
            // 量子エンタングルメントパターン
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, 'rgba(0,255,255,0)');
            gradient.addColorStop(0.5, 'rgba(0,255,255,1)');
            gradient.addColorStop(1, 'rgba(0,255,255,0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 波動パターン
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let i = 0; i < canvas.width; i++) {
              const y = canvas.height / 2 + Math.sin(i * 0.1) * 20;
              if (i === 0) ctx.moveTo(i, y);
              else ctx.lineTo(i, y);
            }
            
            ctx.stroke();
            
            return canvas;
          })()}
          wrapS={THREE.RepeatWrapping}
          wrapT={THREE.RepeatWrapping}
        />
      </meshPhysicalMaterial>
    </mesh>
  );
};