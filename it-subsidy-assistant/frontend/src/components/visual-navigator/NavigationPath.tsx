import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three';
import { Line, Trail } from '@react-three/drei';
import { SubsidyData } from '../../types/navigator';

interface NavigationPathProps {
  subsidies: SubsidyData[];
  path: string[];
  animated?: boolean;
}

const NavigationPath: React.FC<NavigationPathProps> = ({
  subsidies,
  path,
  animated = true,
}) => {
  const trailRef = useRef<any>(null);
  
  // パスのポイントを計算
  const pathPoints = useMemo(() => {
    return path
      .map(id => subsidies.find(s => s.id === id))
      .filter(Boolean)
      .map(subsidy => new Vector3(...subsidy!.position));
  }, [path, subsidies]);
  
  // スムーズな曲線を生成
  const curve = useMemo(() => {
    if (pathPoints.length < 2) return null;
    return new CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.5);
  }, [pathPoints]);
  
  // 曲線上のポイントを取得
  const curvePoints = useMemo(() => {
    if (!curve) return [];
    return curve.getPoints(50);
  }, [curve]);
  
  // アニメーション用のフロー効果
  useFrame((state) => {
    if (!animated || !trailRef.current) return;
    
    // パルスアニメーション
    const time = state.clock.elapsedTime;
    if (trailRef.current.material) {
      trailRef.current.material.opacity = Math.sin(time * 2) * 0.2 + 0.6;
    }
  });
  
  if (curvePoints.length < 2) return null;
  
  return (
    <group>
      {/* メインパス */}
      <Line
        points={curvePoints}
        color="#3b82f6"
        lineWidth={3}
        transparent
        opacity={0.8}
        dashed={false}
      />
      
      {/* グローエフェクト */}
      <Line
        points={curvePoints}
        color="#60a5fa"
        lineWidth={8}
        transparent
        opacity={0.3}
        dashed={false}
      />
      
      {/* アニメーションパーティクル */}
      {animated && (
        <Trail
          ref={trailRef}
          width={0.5}
          length={10}
          color="#3b82f6"
          attenuation={(t) => t * t}
        >
          <mesh>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="#60a5fa" />
          </mesh>
        </Trail>
      )}
      
      {/* パスマーカー */}
      {curvePoints.map((point, index) => {
        if (index % 10 !== 0 || index === 0 || index === curvePoints.length - 1) {
          return null;
        }
        return (
          <mesh key={index} position={point}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} />
          </mesh>
        );
      })}
      
      {/* 方向矢印 */}
      {pathPoints.map((point, index) => {
        if (index === pathPoints.length - 1) return null;
        
        const nextPoint = pathPoints[index + 1];
        const direction = nextPoint.clone().sub(point).normalize();
        const midPoint = point.clone().add(nextPoint).multiplyScalar(0.5);
        
        return (
          <group key={index} position={midPoint}>
            <mesh rotation={[0, Math.atan2(direction.x, direction.z), 0]}>
              <coneGeometry args={[0.2, 0.5, 8]} />
              <meshStandardMaterial
                color="#3b82f6"
                emissive="#3b82f6"
                emissiveIntensity={0.2}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export default NavigationPath;