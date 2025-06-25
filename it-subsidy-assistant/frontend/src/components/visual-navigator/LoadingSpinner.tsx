import React from 'react';
import { Html, useProgress } from '@react-three/drei';

const LoadingSpinner: React.FC = () => {
  const { progress } = useProgress();
  
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-8">
        <div className="relative w-20 h-20">
          {/* 外側のリング */}
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          {/* 回転するリング */}
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          {/* 中央のドット */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="mt-4 text-white text-sm font-medium">
          3D環境を読み込み中... {Math.round(progress)}%
        </p>
      </div>
    </Html>
  );
};

export default LoadingSpinner;