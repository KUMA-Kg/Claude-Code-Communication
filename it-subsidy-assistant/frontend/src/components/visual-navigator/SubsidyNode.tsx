import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Box, Sphere, MeshDistortMaterial, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { SubsidyData } from '../../types/navigator';

interface SubsidyNodeProps {
  data: SubsidyData;
  isSelected: boolean;
  isHovered: boolean;
  isOnPath: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

const SubsidyNode: React.FC<SubsidyNodeProps> = ({
  data,
  isSelected,
  isHovered,
  isOnPath,
  onClick,
  onHover,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [pulseScale, setPulseScale] = useState(1);
  
  // カラー設定
  const nodeColor = useMemo(() => {
    if (isSelected) return '#10b981'; // 緑
    if (isOnPath) return '#3b82f6'; // 青
    if (isHovered) return '#f59e0b'; // オレンジ
    return data.color;
  }, [isSelected, isOnPath, isHovered, data.color]);
  
  // アニメーション
  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return;
    
    // ホバー時の拡大
    const targetScale = isHovered ? 1.2 : 1;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );
    
    // 選択時の回転
    if (isSelected) {
      groupRef.current.rotation.y += 0.01;
    }
    
    // パス上のノードのパルスアニメーション
    if (isOnPath) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
      setPulseScale(pulse);
    }
    
    // 浮遊アニメーション
    groupRef.current.position.y = 
      data.position[1] + Math.sin(state.clock.elapsedTime + data.position[0]) * 0.1;
  });
  
  return (
    <group
      ref={groupRef}
      position={data.position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* メインノード */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[0.8, 32, 32]} />
        <MeshDistortMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={isSelected ? 0.3 : 0.1}
          metalness={0.8}
          roughness={0.2}
          distort={0.2}
          speed={2}
        />
      </mesh>
      
      {/* 光るリング（選択時） */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[2, 2, 1]}>
          <ringGeometry args={[1.2, 1.5, 32]} />
          <meshBasicMaterial
            color="#10b981"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* パス上のインジケーター */}
      {isOnPath && !isSelected && (
        <mesh scale={[pulseScale, pulseScale, pulseScale]}>
          <ringGeometry args={[1, 1.3, 32]} />
          <meshBasicMaterial
            color="#3b82f6"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* テキストラベル */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="black"
        >
          {data.name}
        </Text>
        
        {/* 補助金額表示 */}
        <Text
          position={[0, 1.2, 0]}
          fontSize={0.15}
          color="#e5e7eb"
          anchorX="center"
          anchorY="middle"
        >
          最大{(data.maxAmount / 10000).toLocaleString()}万円
        </Text>
        
        {/* ホバー時の詳細情報 */}
        {isHovered && (
          <group position={[0, -1.5, 0]}>
            <Box args={[3, 1.2, 0.1]} position={[0, 0, -0.1]}>
              <meshBasicMaterial color="black" transparent opacity={0.8} />
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
              {data.description}
            </Text>
            <Text
              position={[0, -0.1, 0]}
              fontSize={0.11}
              color="#a1a1aa"
              anchorX="center"
              anchorY="middle"
            >
              補助率: 最大{Math.round(data.subsidyRate * 100)}%
            </Text>
          </group>
        )}
      </Billboard>
      
      {/* アイコン（補助金タイプを表現） */}
      <Sphere args={[0.3, 16, 16]} position={[0.7, 0.7, 0]}>
        <meshStandardMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={0.2}
        />
      </Sphere>
    </group>
  );
};

export default SubsidyNode;