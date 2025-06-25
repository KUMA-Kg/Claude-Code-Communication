import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Info, Play, FileText, Clock, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
// import { Badge } from '../components/ui/Badge';
// import { Progress } from '../components/ui/Progress';
import SimpleDocumentMagicStudio from '../components/SimpleDocumentMagicStudio';
import { ParticleSystem } from '../components/magic/ParticleSystem';
import { RealtimeCollaboration } from '../components/magic/RealtimeCollaboration';
import { useAuth } from '../hooks/useAuth';
import '../styles/document-magic.css';

// Demo stats animation
const AnimatedStat: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => {
  const [displayValue, setDisplayValue] = useState('0');
  
  useEffect(() => {
    const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
    const duration = 2000;
    const steps = 50;
    const increment = numericValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        current = numericValue;
        clearInterval(timer);
      }
      setDisplayValue(value.replace(/[0-9]+/, Math.floor(current).toString()));
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      className="text-center"
    >
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-3xl font-bold magic-text">{displayValue}</div>
      <div className="text-gray-600">{label}</div>
    </motion.div>
  );
};

export const DocumentMagicStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDemo, setShowDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);

  // Demo user for collaboration showcase
  const demoUser = user || {
    id: 'demo-user',
    name: 'デモユーザー',
    email: 'demo@example.com',
  };

  // Start demo with progress animation
  const startDemo = () => {
    setShowDemo(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setDemoProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);
  };

  return (
    <div className="min-h-screen magic-studio">
      {/* Particle effects */}
      <ParticleSystem
        isActive={true}
        particleCount={30}
        interactive={true}
        speed={0.5}
      />
      
      {/* Magic cursor trail */}
      {/* <MagicCursor color="#8B5CF6" /> */}

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              戻る
            </Button>
            <span className="magic-sparkle" style={{
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: '#e5e7eb',
              fontSize: '12px',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center'
            }}>
              <Sparkles className="h-4 w-4 mr-1" />
              プレミアム機能
            </span>
          </div>
        </div>
      </motion.header>

      {!showDemo ? (
        /* Landing section */
        <div className="container mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-12"
          >
            <h1 className="text-6xl font-bold mb-6 magic-text">
              Document Magic Studio
            </h1>
            <p className="text-2xl text-gray-600 mb-8">
              AIの魔法で、文書作成時間を90%削減
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                onClick={startDemo}
                className="magic-button text-lg px-8 py-6"
              >
                <Play className="h-6 w-6 mr-2" />
                魔法のデモを開始
              </Button>
            </motion.div>
          </motion.div>

          {/* Features showcase */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <AnimatedStat
              label="作成時間削減"
              value="90%"
              icon={<Clock className="h-12 w-12 text-blue-500 mx-auto" />}
            />
            <AnimatedStat
              label="AI提案精度"
              value="95%"
              icon={<Sparkles className="h-12 w-12 text-purple-500 mx-auto" />}
            />
            <AnimatedStat
              label="同時編集可能"
              value="10人"
              icon={<Users className="h-12 w-12 text-green-500 mx-auto" />}
            />
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'ドラッグ&ドロップ',
                description: '直感的なブロック配置で簡単文書作成',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                title: 'AI自動補完',
                description: '文脈を理解してリアルタイムで提案',
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                title: 'テンプレート認識',
                description: '業界別の最適なテンプレートを自動選択',
                gradient: 'from-green-500 to-emerald-500',
              },
              {
                title: 'リアルタイム共同編集',
                description: 'チームで同時に文書を作成・編集',
                gradient: 'from-orange-500 to-red-500',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="magic-card h-full p-6">
                  <div className={`h-2 w-full bg-gradient-to-r ${feature.gradient} rounded-full mb-4`} />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16"
          >
            <Card className="magic-glow p-8">
              <div className="flex items-start space-x-4">
                <Info className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-4">使い方</h3>
                  <ol className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="font-semibold text-blue-600 mr-2">1.</span>
                      左パネルからブロックをドラッグ&ドロップ、またはテンプレートを選択
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-purple-600 mr-2">2.</span>
                      AIが自動的に内容を提案 - クリックして適用
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-green-600 mr-2">3.</span>
                      リアルタイムプレビューで確認しながら編集
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-orange-600 mr-2">4.</span>
                      完成したらPDF・Word・HTMLでエクスポート
                    </li>
                  </ol>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      ) : (
        /* Demo section */
        <div className="relative">
          {/* Loading overlay */}
          {demoProgress < 100 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <Card className="p-8 max-w-md w-full">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  魔法の準備中...
                </h3>
                <Progress value={demoProgress} className="mb-4" />
                <p className="text-center text-gray-600">
                  AIエンジンを起動しています
                </p>
              </Card>
            </motion.div>
          )}

          {/* Document Magic Studio */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: demoProgress >= 100 ? 1 : 0 }}
            transition={{ delay: 0.5 }}
          >
            <SimpleDocumentMagicStudio />
            
            {/* Realtime collaboration overlay */}
            <RealtimeCollaboration
              documentId="demo-document"
              currentUser={demoUser}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
};