import React, { useState, useEffect } from 'react';

// Styles object to replace style jsx
const styles: Record<string, React.CSSProperties> = {
  integratedService: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    transition: 'all 0.3s ease'
  },
  integratedServiceDark: {
    minHeight: '100vh',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    transition: 'all 0.3s ease'
  },
  serviceHeader: {
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  serviceHeaderDark: {
    backgroundColor: '#2a2a2a',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  navTabs: {
    display: 'flex',
    gap: '1rem'
  },
  navTab: {
    padding: '0.5rem 1rem',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s'
  },
  navTabActive: {
    padding: '0.5rem 1rem',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: 'white',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s'
  },
  headerActions: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
  },
  darkModeToggle: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '8px',
    transition: 'all 0.2s'
  },
  serviceContent: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  // Dashboard styles
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    margin: '2rem 0'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    borderLeft: '4px solid',
    transition: 'transform 0.2s'
  },
  statCardDark: {
    backgroundColor: '#2a2a2a',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    borderLeft: '4px solid',
    transition: 'transform 0.2s'
  },
  statIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem'
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    margin: '0.5rem 0'
  },
  statChange: {
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  // Quick actions
  quickActions: {
    marginTop: '3rem'
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '1rem'
  },
  actionButton: {
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    padding: '1.5rem',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
  },
  actionButtonDark: {
    backgroundColor: '#2a2a2a',
    border: '2px solid #3a3a3a',
    padding: '1.5rem',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
  },
  actionIcon: {
    fontSize: '2rem'
  },
  // Navigator styles
  navigatorContainer: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginTop: '1rem'
  },
  navigatorContainerDark: {
    backgroundColor: '#2a2a2a',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginTop: '1rem'
  },
  canvas3d: {
    height: '400px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  floatingNodes: {
    position: 'relative',
    width: '100%',
    height: '100%'
  },
  node: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  node1: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    transition: 'all 0.3s',
    top: '20%',
    left: '20%',
    animation: 'float 3s ease-in-out infinite'
  },
  node2: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    transition: 'all 0.3s',
    top: '50%',
    right: '20%',
    animation: 'float 3s ease-in-out infinite',
    animationDelay: '1s'
  },
  node3: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    transition: 'all 0.3s',
    bottom: '20%',
    left: '40%',
    animation: 'float 3s ease-in-out infinite',
    animationDelay: '2s'
  },
  aiRecommendation: {
    position: 'absolute',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: '1rem 2rem',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  },
  navigatorControls: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
    justifyContent: 'center'
  },
  navigatorButton: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#3b82f6',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  // Document studio styles
  documentStudio: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '2rem',
    marginTop: '1rem'
  },
  templateGallery: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  templateGalleryDark: {
    backgroundColor: '#2a2a2a',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '1rem'
  },
  templateCard: {
    backgroundColor: '#f9fafb',
    padding: '1.5rem',
    borderRadius: '8px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '2px solid transparent'
  },
  templateCardDark: {
    backgroundColor: '#3a3a3a',
    padding: '1.5rem',
    borderRadius: '8px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '2px solid transparent'
  },
  templateIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem'
  },
  aiScore: {
    color: '#10b981',
    fontWeight: '500',
    marginTop: '0.5rem'
  },
  aiAssistantPanel: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  aiAssistantPanelDark: {
    backgroundColor: '#2a2a2a',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  aiSuggestions: {
    marginTop: '1rem'
  },
  suggestion: {
    backgroundColor: '#fef3c7',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '0.75rem',
    borderLeft: '3px solid #f59e0b'
  },
  suggestionDark: {
    backgroundColor: '#3a3a3a',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '0.75rem',
    borderLeft: '3px solid #f59e0b'
  },
  // Collaboration styles
  collabContainer: {
    display: 'grid',
    gridTemplateColumns: '200px 1fr 300px',
    gap: '1.5rem',
    marginTop: '1rem',
    height: '500px'
  },
  panel: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  panelDark: {
    backgroundColor: '#2a2a2a',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1rem'
  },
  userAvatar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    position: 'relative'
  },
  avatar: {
    width: '40px',
    height: '40px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    position: 'absolute',
    bottom: '0',
    right: '0'
  },
  statusDotEditing: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    position: 'absolute',
    bottom: '0',
    right: '0',
    backgroundColor: '#10b981'
  },
  statusDotViewing: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    position: 'absolute',
    bottom: '0',
    right: '0',
    backgroundColor: '#f59e0b'
  },
  statusDotCommenting: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    position: 'absolute',
    bottom: '0',
    right: '0',
    backgroundColor: '#3b82f6'
  },
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #e5e7eb'
  },
  editorHeaderDark: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #3a3a3a'
  },
  liveIndicator: {
    color: '#10b981',
    fontSize: '0.875rem'
  },
  editorContent: {
    minHeight: '300px',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  editorContentDark: {
    minHeight: '300px',
    padding: '1rem',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px'
  },
  cursorIndicator: {
    display: 'inline-block',
    backgroundColor: '#fef3c7',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    marginTop: '1rem'
  },
  cursorIndicatorDark: {
    display: 'inline-block',
    backgroundColor: '#3a3a3a',
    color: '#f59e0b',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    marginTop: '1rem'
  },
  chatMessages: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1rem',
    maxHeight: '350px',
    overflowY: 'auto'
  },
  chatMessage: {
    padding: '0.75rem',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '0.875rem'
  },
  chatMessageDark: {
    padding: '0.75rem',
    backgroundColor: '#3a3a3a',
    borderRadius: '8px',
    fontSize: '0.875rem'
  },
  chatMessageAI: {
    padding: '0.75rem',
    backgroundColor: '#dbeafe',
    borderLeft: '3px solid #3b82f6',
    borderRadius: '8px',
    fontSize: '0.875rem'
  },
  chatMessageAIDark: {
    padding: '0.75rem',
    backgroundColor: '#1e3a8a',
    borderLeft: '3px solid #3b82f6',
    borderRadius: '8px',
    fontSize: '0.875rem'
  },
  // Matching engine styles
  matchingContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    marginTop: '1rem'
  },
  quantumVisualization: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  quantumVisualizationDark: {
    backgroundColor: '#2a2a2a',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  quantumGrid: {
    display: 'grid',
    gap: '2rem',
    position: 'relative',
    height: '300px',
    alignItems: 'center',
    justifyItems: 'center'
  },
  quantumNode: {
    backgroundColor: '#e0f2fe',
    padding: '1.5rem',
    borderRadius: '50%',
    textAlign: 'center',
    width: '150px',
    height: '150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid #3b82f6',
    fontWeight: '500',
    position: 'relative',
    zIndex: 1
  },
  quantumNodeActive: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '1.5rem',
    borderRadius: '50%',
    textAlign: 'center',
    width: '150px',
    height: '150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid #3b82f6',
    fontWeight: '500',
    position: 'relative',
    zIndex: 1,
    animation: 'pulse 2s infinite'
  },
  quantumConnection: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    height: '80%',
    border: '2px dashed #3b82f6',
    borderRadius: '50%',
    animation: 'rotate 10s linear infinite'
  },
  matchingResults: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  matchingResultsDark: {
    backgroundColor: '#2a2a2a',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  matchingResult: {
    backgroundColor: '#f9fafb',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    borderLeft: '4px solid #3b82f6'
  },
  matchingResultDark: {
    backgroundColor: '#3a3a3a',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    borderLeft: '4px solid #3b82f6'
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem'
  },
  scoreBadge: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '0.875rem'
  },
  matchReasons: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  reasonTag: {
    backgroundColor: '#e0f2fe',
    color: '#1e40af',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem'
  },
  reasonTagDark: {
    backgroundColor: '#1e3a8a',
    color: '#dbeafe',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem'
  },
  // Notifications
  notifications: {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  notification: {
    backgroundColor: 'white',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: '300px'
  },
  notificationDark: {
    backgroundColor: '#2a2a2a',
    color: 'white',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: '300px'
  },
  notificationInfo: {
    backgroundColor: 'white',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: '300px',
    borderLeft: '4px solid #3b82f6'
  },
  notificationSuccess: {
    backgroundColor: 'white',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: '300px',
    borderLeft: '4px solid #10b981'
  },
  notificationWarning: {
    backgroundColor: 'white',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: '300px',
    borderLeft: '4px solid #f59e0b'
  },
  notificationError: {
    backgroundColor: 'white',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: '300px',
    borderLeft: '4px solid #ef4444'
  },
  h2: {
    margin: 0,
    marginBottom: '0.5rem'
  },
  h3: {
    margin: 0,
    marginBottom: '0.5rem'
  },
  h4: {
    margin: 0,
    marginBottom: '0.5rem'
  },
  p: {
    margin: 0
  }
};

// CSS animations
const animationStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
    70% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
  }
  
  @keyframes rotate {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// IT補助金アシスタント統合サービス
export default function IntegratedService() {
  const [activeView, setActiveView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // ダークモード設定の読み込み
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }

    // Add animation styles to head
    const styleElement = document.createElement('style');
    styleElement.textContent = animationStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    document.body.classList.toggle('dark-mode');
  };

  // 通知の追加
  const addNotification = (message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, newNotification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  // 各機能セクション
  const renderDashboard = () => (
    <div className="dashboard-view">
      <h2 style={styles.h2}>🎯 統合ダッシュボード</h2>
      <div style={styles.statsGrid}>
        <StatCard
          icon="🚀"
          title="アクティブな申請"
          value="3"
          change="+2"
          color="#3b82f6"
        />
        <StatCard
          icon="✅"
          title="承認済み"
          value="12"
          change="+5"
          color="#10b981"
        />
        <StatCard
          icon="💰"
          title="総補助金額"
          value="¥4,500万"
          change="+¥1,200万"
          color="#f59e0b"
        />
        <StatCard
          icon="📊"
          title="成功率"
          value="92%"
          change="+5%"
          color="#8b5cf6"
        />
      </div>

      <div style={styles.quickActions}>
        <h3 style={styles.h3}>クイックアクション</h3>
        <div style={styles.actionGrid}>
          <ActionButton
            icon="🎯"
            label="AIナビゲーター"
            onClick={() => setActiveView('navigator')}
          />
          <ActionButton
            icon="📝"
            label="書類作成"
            onClick={() => setActiveView('documents')}
          />
          <ActionButton
            icon="🤝"
            label="コラボレーション"
            onClick={() => setActiveView('collaboration')}
          />
          <ActionButton
            icon="🔍"
            label="マッチング分析"
            onClick={() => setActiveView('matching')}
          />
        </div>
      </div>
    </div>
  );

  const renderNavigator = () => (
    <div className="navigator-view">
      <h2 style={styles.h2}>🎯 Visual AI Navigator</h2>
      <div style={darkMode ? styles.navigatorContainerDark : styles.navigatorContainer}>
        <div style={styles.canvas3d}>
          <div className="placeholder-3d">
            <div style={styles.floatingNodes}>
              <div style={styles.node1}>IT導入補助金</div>
              <div style={styles.node2}>ものづくり補助金</div>
              <div style={styles.node3}>小規模事業者持続化補助金</div>
            </div>
            <div style={styles.aiRecommendation}>
              <p style={styles.p}>🤖 AI推奨: あなたの企業には「IT導入補助金」が最適です</p>
              <p style={styles.p}>マッチング率: 96%</p>
            </div>
          </div>
        </div>
        <div style={styles.navigatorControls}>
          <button 
            style={styles.navigatorButton}
            onClick={() => addNotification('3D分析を開始しました', 'info')}
          >
            🎮 インタラクティブモード
          </button>
          <button 
            style={styles.navigatorButton}
            onClick={() => addNotification('AI分析完了', 'success')}
          >
            🧠 AI分析実行
          </button>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="documents-view">
      <h2 style={styles.h2}>📝 Document Magic Studio</h2>
      <div style={styles.documentStudio}>
        <div style={darkMode ? styles.templateGalleryDark : styles.templateGallery}>
          <h3 style={styles.h3}>テンプレートギャラリー</h3>
          <div style={styles.templateGrid}>
            <TemplateCard
              icon="💼"
              title="事業計画書"
              aiScore="95%"
              onClick={() => addNotification('事業計画書テンプレートを読み込みました', 'success')}
            />
            <TemplateCard
              icon="📊"
              title="収支計画書"
              aiScore="92%"
              onClick={() => addNotification('収支計画書テンプレートを読み込みました', 'success')}
            />
            <TemplateCard
              icon="🎯"
              title="実施計画書"
              aiScore="88%"
              onClick={() => addNotification('実施計画書テンプレートを読み込みました', 'success')}
            />
          </div>
        </div>
        <div style={darkMode ? styles.aiAssistantPanelDark : styles.aiAssistantPanel}>
          <h3 style={styles.h3}>🤖 AIアシスタント</h3>
          <div style={styles.aiSuggestions}>
            <div style={darkMode ? styles.suggestionDark : styles.suggestion}>
              💡 過去の成功事例から、技術革新の具体例を3つ以上含めることを推奨します
            </div>
            <div style={darkMode ? styles.suggestionDark : styles.suggestion}>
              📈 ROI予測: 導入後6ヶ月で20%の業務効率化が見込まれます
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCollaboration = () => (
    <div className="collaboration-view">
      <h2 style={styles.h2}>🤝 Live Collaboration Hub</h2>
      <div style={styles.collabContainer}>
        <div style={darkMode ? styles.panelDark : styles.panel}>
          <h3 style={styles.h3}>アクティブユーザー</h3>
          <div style={styles.userList}>
            <UserAvatar name="田中" status="editing" />
            <UserAvatar name="佐藤" status="viewing" />
            <UserAvatar name="鈴木" status="commenting" />
          </div>
        </div>
        <div style={darkMode ? styles.panelDark : styles.panel}>
          <div style={darkMode ? styles.editorHeaderDark : styles.editorHeader}>
            <span>📄 事業計画書 - セクション3</span>
            <span style={styles.liveIndicator}>● ライブ</span>
          </div>
          <div style={darkMode ? styles.editorContentDark : styles.editorContent}>
            <p style={styles.p}>現在3名が同時編集中...</p>
            <div style={darkMode ? styles.cursorIndicatorDark : styles.cursorIndicator}>田中さんが編集中 ✏️</div>
          </div>
        </div>
        <div style={darkMode ? styles.panelDark : styles.panel}>
          <h3 style={styles.h3}>💬 チャット</h3>
          <div style={styles.chatMessages}>
            <ChatMessage user="佐藤" message="セクション3の数値を更新しました" />
            <ChatMessage user="AI" message="自動保存完了 ✅" isAI />
          </div>
        </div>
      </div>
    </div>
  );

  const renderMatching = () => (
    <div className="matching-view">
      <h2 style={styles.h2}>⚛️ Quantum Matching Engine</h2>
      <div style={styles.matchingContainer}>
        <div style={darkMode ? styles.quantumVisualizationDark : styles.quantumVisualization}>
          <div style={styles.quantumGrid}>
            <div style={styles.quantumNodeActive}>企業プロファイル</div>
            <div style={styles.quantumNode}>補助金要件</div>
            <div style={styles.quantumNode}>成功パターン</div>
            <div style={styles.quantumConnection}></div>
          </div>
        </div>
        <div style={darkMode ? styles.matchingResultsDark : styles.matchingResults}>
          <h3 style={styles.h3}>マッチング結果</h3>
          <MatchingResult
            subsidy="IT導入補助金"
            score={96}
            reasons={['デジタル化推進', '業務効率化', '売上向上']}
          />
          <MatchingResult
            subsidy="ものづくり補助金"
            score={78}
            reasons={['設備投資', '技術革新']}
          />
        </div>
      </div>
    </div>
  );

  // コンポーネント
  const StatCard = ({ icon, title, value, change, color }) => (
    <div style={{ ...(darkMode ? styles.statCardDark : styles.statCard), borderColor: color }}>
      <div style={styles.statIcon}>{icon}</div>
      <div className="stat-content">
        <h4 style={styles.h4}>{title}</h4>
        <p style={styles.statValue}>{value}</p>
        <span style={{ ...styles.statChange, color }}>{change}</span>
      </div>
    </div>
  );

  const ActionButton = ({ icon, label, onClick }) => (
    <button style={darkMode ? styles.actionButtonDark : styles.actionButton} onClick={onClick}>
      <span style={styles.actionIcon}>{icon}</span>
      <span className="action-label">{label}</span>
    </button>
  );

  const TemplateCard = ({ icon, title, aiScore, onClick }) => (
    <div style={darkMode ? styles.templateCardDark : styles.templateCard} onClick={onClick}>
      <div style={styles.templateIcon}>{icon}</div>
      <h4 style={styles.h4}>{title}</h4>
      <div style={styles.aiScore}>AI適合度: {aiScore}</div>
    </div>
  );

  const UserAvatar = ({ name, status }) => (
    <div style={styles.userAvatar}>
      <div style={styles.avatar}>{name[0]}</div>
      <div style={
        status === 'editing' ? styles.statusDotEditing :
        status === 'viewing' ? styles.statusDotViewing :
        styles.statusDotCommenting
      }></div>
    </div>
  );

  const ChatMessage = ({ user, message, isAI }) => (
    <div style={
      darkMode ? 
        (isAI ? styles.chatMessageAIDark : styles.chatMessageDark) :
        (isAI ? styles.chatMessageAI : styles.chatMessage)
    }>
      <strong>{user}:</strong> {message}
    </div>
  );

  const MatchingResult = ({ subsidy, score, reasons }) => (
    <div style={darkMode ? styles.matchingResultDark : styles.matchingResult}>
      <div style={styles.resultHeader}>
        <h4 style={styles.h4}>{subsidy}</h4>
        <div style={styles.scoreBadge}>{score}%</div>
      </div>
      <div style={styles.matchReasons}>
        {reasons.map((reason, i) => (
          <span key={i} style={darkMode ? styles.reasonTagDark : styles.reasonTag}>{reason}</span>
        ))}
      </div>
    </div>
  );

  // メインレンダー
  return (
    <div style={darkMode ? styles.integratedServiceDark : styles.integratedService}>
      {/* ヘッダー */}
      <header style={darkMode ? styles.serviceHeaderDark : styles.serviceHeader}>
        <div style={styles.headerTitle}>
          <span>🚀</span>
          <span>IT補助金アシスタント Pro</span>
        </div>
        
        <nav style={styles.navTabs}>
          <button
            style={activeView === 'dashboard' ? styles.navTabActive : styles.navTab}
            onClick={() => setActiveView('dashboard')}
          >
            ダッシュボード
          </button>
          <button
            style={activeView === 'navigator' ? styles.navTabActive : styles.navTab}
            onClick={() => setActiveView('navigator')}
          >
            AIナビゲーター
          </button>
          <button
            style={activeView === 'documents' ? styles.navTabActive : styles.navTab}
            onClick={() => setActiveView('documents')}
          >
            書類作成
          </button>
          <button
            style={activeView === 'collaboration' ? styles.navTabActive : styles.navTab}
            onClick={() => setActiveView('collaboration')}
          >
            コラボレーション
          </button>
          <button
            style={activeView === 'matching' ? styles.navTabActive : styles.navTab}
            onClick={() => setActiveView('matching')}
          >
            マッチング分析
          </button>
        </nav>

        <div style={styles.headerActions}>
          <button style={styles.darkModeToggle} onClick={toggleDarkMode}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <div className="user-info">
            {user ? `👤 ${user.name}` : 'ゲスト'}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main style={styles.serviceContent}>
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'navigator' && renderNavigator()}
        {activeView === 'documents' && renderDocuments()}
        {activeView === 'collaboration' && renderCollaboration()}
        {activeView === 'matching' && renderMatching()}
      </main>

      {/* 通知 */}
      <div style={styles.notifications}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            style={
              notification.type === 'success' ? styles.notificationSuccess :
              notification.type === 'warning' ? styles.notificationWarning :
              notification.type === 'error' ? styles.notificationError :
              styles.notificationInfo
            }
          >
            {notification.type === 'success' && '✅'}
            {notification.type === 'info' && 'ℹ️'}
            {notification.type === 'warning' && '⚠️'}
            {notification.type === 'error' && '❌'}
            <span>{notification.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}