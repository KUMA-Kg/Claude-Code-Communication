import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere, Box, Octahedron, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { QuantumState } from '../../types/quantum';

interface QuantumNodeProps {
  state: QuantumState;
  position: [number, number, number];
  isObserved: boolean;
  probability: number;
  onObserve: () => void;
  dimension: number;
}

export const QuantumNode: React.FC<QuantumNodeProps> = ({
  state,
  position,
  isObserved,
  probability,
  onObserve,
  dimension
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [phase, setPhase] = useState(0);

  // 量子状態の色計算
  const color = useMemo(() => {
    if (isObserved) return '#00ff00';
    const hue = (state.phase * 360) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }, [state.phase, isObserved]);

  // アニメーション
  useFrame((state, delta) => {
    if (!meshRef.current || !groupRef.current) return;

    // 量子揺らぎ
    if (!isObserved) {
      const time = state.clock.elapsedTime;
      meshRef.current.rotation.x = Math.sin(time * 1.5 + phase) * 0.2;
      meshRef.current.rotation.y = Math.cos(time * 1.2 + phase) * 0.2;
      
      // 確率振幅による脈動
      const scale = 1 + Math.sin(time * 2 + phase) * probability * 0.2;
      meshRef.current.scale.setScalar(scale);
      
      // 位相の更新
      setPhase(prev => (prev + delta * state.spin) % (Math.PI * 2));
    }

    // ホバーエフェクト
    const targetScale = hovered ? 1.2 : 1;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );
  });

  // 4D/5D投影の追加位置
  const projectedPosition = useMemo(() => {
    if (dimension === 3) return position;
    
    const [x, y, z] = position;
    const w = Math.sin(phase) * 2; // 4次元成分
    const v = Math.cos(phase * 0.5) * 1.5; // 5次元成分
    
    if (dimension === 4) {
      // 4D → 3D 立体投影
      const scale = 1 / (1 - w * 0.1);
      return [x * scale, y * scale, z * scale];
    } else {
      // 5D → 3D 投影
      const scale = 1 / (1 - w * 0.1 - v * 0.05);
      return [x * scale, y * scale, z * scale];
    }
  }, [position, dimension, phase]);

  // ジオメトリ選択（次元による）
  const renderGeometry = () => {
    switch (dimension) {
      case 3:
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case 4:
        return <octahedronGeometry args={[0.5]} />;
      case 5:
        return <icosahedronGeometry args={[0.5]} />;
      default:
        return <sphereGeometry args={[0.5, 32, 32]} />;
    }
  };

  return (
    <group
      ref={groupRef}
      position={projectedPosition as [number, number, number]}
      onClick={(e) => {
        e.stopPropagation();
        if (!isObserved) onObserve();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* メインノード */}
      <mesh ref={meshRef} castShadow receiveShadow>
        {renderGeometry()}
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isObserved ? 0.5 : probability * 0.3}
          metalness={0.8}
          roughness={0.2}
          distort={isObserved ? 0 : 0.3}
          speed={2}
          transparent
          opacity={isObserved ? 1 : 0.6 + probability * 0.4}
        />
      </mesh>

      {/* 確率雲（非観測時） */}
      {!isObserved && (
        <mesh scale={[2, 2, 2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={probability * 0.2}
            wireframe
          />
        </mesh>
      )}

      {/* 量子もつれインジケーター */}
      {state.entangled && (
        <mesh position={[0, 1, 0]} scale={[0.3, 0.3, 0.3]}>
          <torusGeometry args={[0.5, 0.2, 8, 16]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
        </mesh>
      )}

      {/* ラベル */}
      <Text
        position={[0, -1, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="black"
      >
        {state.candidate.name}
      </Text>

      {/* 確率表示 */}
      <Text
        position={[0, -1.3, 0]}
        fontSize={0.15}
        color={isObserved ? '#00ff00' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
      >
        {isObserved ? 'Observed' : `${(probability * 100).toFixed(1)}%`}
      </Text>

      {/* ホバー時の詳細情報 */}
      {hovered && !isObserved && (
        <group position={[0, 1.5, 0]}>
          <Box args={[3, 1.5, 0.1]} position={[0, 0, -0.1]}>
            <meshBasicMaterial color="black" transparent opacity={0.9} />
          </Box>
          <Text
            position={[0, 0.3, 0]}
            fontSize={0.12}
            color="white"
            anchorX="center"
            anchorY="middle"
            maxWidth={2.8}
            textAlign="center"
          >
            {`Phase: ${(state.phase * 180 / Math.PI).toFixed(0)}°`}
          </Text>
          <Text
            position={[0, 0, 0]}
            fontSize={0.11}
            color="#cyan"
            anchorX="center"
            anchorY="middle"
          >
            {`Spin: ${state.spin > 0 ? '↑' : '↓'}`}
          </Text>
          <Text
            position={[0, -0.3, 0]}
            fontSize={0.11}
            color="#yellow"
            anchorX="center"
            anchorY="middle"
          >
            Click to observe
          </Text>
        </group>
      )}
    </group>
  );
};