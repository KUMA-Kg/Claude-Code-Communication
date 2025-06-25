import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { QuantumState } from '../../types/quantum';

interface WaveFunctionProps {
  states: QuantumState[];
  superposition: number;
  noiseLevel: number;
  time: number;
}

export const WaveFunction: React.FC<WaveFunctionProps> = ({
  states,
  superposition,
  noiseLevel,
  time
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);

  // 波動関数の形状を計算
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    
    const resolution = 50;
    const size = 10;
    
    // 波動関数の3D表現を生成
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const x = (i / resolution - 0.5) * size;
        const z = (j / resolution - 0.5) * size;
        
        // 複数の量子状態の重ね合わせ
        let y = 0;
        let phase = 0;
        
        states.forEach((state, idx) => {
          const dx = x - state.position[0];
          const dz = z - state.position[2];
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          // ガウシアン波束
          const amplitude = state.amplitude * Math.exp(-distance * distance / 4);
          y += amplitude * Math.sin(distance * 2 - state.phase);
          phase += state.phase;
        });
        
        y *= superposition;
        
        positions.push(x, y, z);
        
        // 位相による色
        const hue = (phase / (Math.PI * 2)) % 1;
        colors.push(hue, 0.7, 0.5);
      }
    }
    
    // インデックスを生成
    for (let i = 0; i < resolution - 1; i++) {
      for (let j = 0; j < resolution - 1; j++) {
        const a = i * resolution + j;
        const b = a + 1;
        const c = a + resolution;
        const d = c + 1;
        
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }
    
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    
    return geo;
  }, [states, superposition]);

  // アニメーション
  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // 波動の動的更新
    const positions = meshRef.current.geometry.attributes.position;
    const colors = meshRef.current.geometry.attributes.color;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      let y = 0;
      let phase = 0;
      
      states.forEach((state) => {
        const dx = x - state.position[0];
        const dz = z - state.position[2];
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        const amplitude = state.amplitude * Math.exp(-distance * distance / 4);
        y += amplitude * Math.sin(distance * 2 - state.phase + time);
        phase += state.phase + time * 0.5;
      });
      
      // ノイズを追加
      y += Math.sin(x * 0.5 + time) * Math.cos(z * 0.5 + time) * noiseLevel;
      y *= superposition;
      
      positions.setY(i, y);
      
      // 色の更新
      const hue = (phase / (Math.PI * 2)) % 1;
      colors.setX(i, hue);
    }
    
    positions.needsUpdate = true;
    colors.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.1}>
      <mesh ref={meshRef} geometry={geometry} receiveShadow>
        <meshPhysicalMaterial
          ref={materialRef}
          vertexColors
          transparent
          opacity={0.3}
          metalness={0.1}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0}
          side={THREE.DoubleSide}
          emissive="#001144"
          emissiveIntensity={0.1}
        />
      </mesh>
    </Float>
  );
};