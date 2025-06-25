import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane, Text } from '@react-three/drei';
import * as THREE from 'three';
import { QuantumState } from '../../types/quantum';

interface ParallelUniversesProps {
  universeCount: number;
  states: QuantumState[];
  selectedUniverse: number;
  onUniverseSelect: (index: number) => void;
}

export const ParallelUniverses: React.FC<ParallelUniversesProps> = ({
  universeCount,
  states,
  selectedUniverse,
  onUniverseSelect
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // 各宇宙の状態を計算
  const universeStates = useMemo(() => {
    return Array.from({ length: universeCount }, (_, universeIndex) => {
      // 各宇宙で異なる確率分布を生成
      return states.map(state => ({
        ...state,
        amplitude: state.amplitude * (1 + (Math.random() - 0.5) * 0.3),
        phase: state.phase + universeIndex * Math.PI / 3,
        position: [
          state.position[0] + (Math.random() - 0.5) * 0.5,
          state.position[1] + universeIndex * 5 - 5,
          state.position[2] + (Math.random() - 0.5) * 0.5
        ] as [number, number, number]
      }));
    });
  }, [states, universeCount]);

  // アニメーション
  useFrame((state) => {
    if (!groupRef.current) return;
    
    // 選択された宇宙をハイライト
    groupRef.current.children.forEach((child, index) => {
      const scale = index === selectedUniverse ? 1.1 : 0.9;
      child.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    });
  });

  return (
    <group ref={groupRef}>
      {universeStates.map((universeState, universeIndex) => (
        <group
          key={universeIndex}
          position={[0, universeIndex * 8 - 8, -10]}
          onClick={() => onUniverseSelect(universeIndex)}
        >
          {/* 宇宙の境界面 */}
          <Plane
            args={[20, 6]}
            rotation={[0, 0, 0]}
            position={[0, 0, -1]}
          >
            <meshPhysicalMaterial
              color={universeIndex === selectedUniverse ? '#4444ff' : '#222244'}
              transparent
              opacity={0.2}
              metalness={0.8}
              roughness={0.2}
              side={THREE.DoubleSide}
            />
          </Plane>
          
          {/* 宇宙ラベル */}
          <Text
            position={[-8, 2.5, 0]}
            fontSize={0.5}
            color={universeIndex === selectedUniverse ? '#ffffff' : '#888888'}
            anchorX="left"
            anchorY="middle"
          >
            Universe {universeIndex + 1}
          </Text>
          
          {/* ミニマップ的な状態表示 */}
          <group scale={[0.3, 0.3, 0.3]}>
            {universeState.map((state, stateIndex) => (
              <mesh
                key={stateIndex}
                position={state.position}
              >
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshBasicMaterial
                  color={`hsl(${(state.phase * 180 / Math.PI) % 360}, 70%, 50%)`}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            ))}
          </group>
          
          {/* 確率分布の可視化 */}
          <mesh position={[5, 0, 0]}>
            <planeGeometry args={[4, 3]} />
            <meshBasicMaterial
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            >
              <canvasTexture
                attach="map"
                image={(() => {
                  const canvas = document.createElement('canvas');
                  canvas.width = 256;
                  canvas.height = 192;
                  const ctx = canvas.getContext('2d')!;
                  
                  // グラデーション背景
                  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                  gradient.addColorStop(0, 'rgba(0,0,0,0.8)');
                  gradient.addColorStop(1, 'rgba(0,0,32,0.8)');
                  ctx.fillStyle = gradient;
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  
                  // 確率分布グラフ
                  ctx.strokeStyle = '#00ffff';
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  
                  universeState.forEach((state, i) => {
                    const x = (i / universeState.length) * canvas.width;
                    const y = canvas.height - (state.amplitude * 0.8 * canvas.height);
                    
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                  });
                  
                  ctx.stroke();
                  
                  return canvas;
                })()}
              />
            </meshBasicMaterial>
          </mesh>
        </group>
      ))}
    </group>
  );
};