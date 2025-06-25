import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface MagicParticlesProps {
  count?: number;
  colors?: string[];
  interactive?: boolean;
}

const MagicParticles: React.FC<MagicParticlesProps> = ({ 
  count = 50, 
  colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'],
  interactive = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const particles = useRef<Particle[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスサイズの設定
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // パーティクルの初期化
    const initParticles = () => {
      particles.current = [];
      for (let i = 0; i < count; i++) {
        particles.current.push(createParticle());
      }
    };

    // パーティクルの作成
    const createParticle = (x?: number, y?: number): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      return {
        x: x || Math.random() * canvas.width,
        y: y || Math.random() * canvas.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        maxLife: Math.random() * 100 + 100
      };
    };

    // マウス移動イベント
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      // マウス位置に新しいパーティクルを追加
      if (Math.random() > 0.8 && particles.current.length < count * 2) {
        particles.current.push(createParticle(e.clientX, e.clientY));
      }
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // アニメーション
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // パーティクルの更新と描画
      particles.current = particles.current.filter(particle => {
        // 位置の更新
        particle.x += particle.vx;
        particle.y += particle.vy;

        // 重力効果
        particle.vy += 0.05;

        // マウスとの相互作用
        if (interactive) {
          const dx = mousePos.current.x - particle.x;
          const dy = mousePos.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const force = (100 - distance) / 100;
            particle.vx += (dx / distance) * force * 0.5;
            particle.vy += (dy / distance) * force * 0.5;
          }
        }

        // ライフサイクル
        particle.life -= 1 / particle.maxLife;

        // 画面外に出たら削除
        if (particle.life <= 0 || 
            particle.x < -50 || particle.x > canvas.width + 50 ||
            particle.y < -50 || particle.y > canvas.height + 50) {
          return false;
        }

        // パーティクルの描画
        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        
        // 円形のパーティクル
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // 光の尾を追加
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        gradient.addColorStop(0, particle.color + '40');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(
          particle.x - particle.size * 3,
          particle.y - particle.size * 3,
          particle.size * 6,
          particle.size * 6
        );

        ctx.restore();

        return true;
      });

      // パーティクル数を維持
      while (particles.current.length < count) {
        particles.current.push(createParticle());
      }

      // 接続線の描画（近くのパーティクル同士）
      for (let i = 0; i < particles.current.length; i++) {
        for (let j = i + 1; j < particles.current.length; j++) {
          const p1 = particles.current[i];
          const p2 = particles.current[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.save();
            ctx.globalAlpha = (1 - distance / 100) * 0.2 * Math.min(p1.life, p2.life);
            ctx.strokeStyle = p1.color;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [count, colors, interactive]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.6
      }}
    />
  );
};

export default MagicParticles;