import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Lock, 
  Unlock, 
  Brain, 
  FileText, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader,
  Zap,
  Shield,
  Database,
  Globe
} from 'lucide-react';
import { ResponsiveLayout, ResponsiveContainer, ResponsiveGrid } from '../components/layout/ResponsiveLayout';
import { AccessibleInput, AccessibleTextarea, AccessibleSelect } from '../components/accessibility/AccessibleForm';
import { RealtimeIndicator, RealtimeToast } from '../components/realtime/RealtimeIndicator';
import { ExportDialog } from '../components/export/ExportDialog';
import { useDarkModeColors, useDarkMode } from '../hooks/useDarkMode';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../hooks/useAuth';
import { useRealtimeData } from '../hooks/useRealtimeData';
import { authService } from '../services/auth.service';
import { subsidyService } from '../services/subsidy.service';

// デモページコンポーネント
export const IntegratedDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const { colors } = useDarkModeColors();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { isMobile, isTablet } = useResponsive();
  const { user, signIn, signOut } = useAuth();
  
  // 状態管理
  const [activeSection, setActiveSection] = useState<'auth' | 'matching' | 'export' | 'realtime'>('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // フォームデータ
  const [loginData, setLoginData] = useState({ email: 'demo@example.com', password: 'demo123' });
  const [companyData, setCompanyData] = useState({
    businessType: 'manufacturing',
    employeeCount: '21-50',
    annualRevenue: '100m-500m',
    currentChallenges: 'efficiency',
    digitalizationLevel: 'partial',
    budgetRange: '1m-3m'
  });
  
  // APIレスポンスデータ
  const [matchingResults, setMatchingResults] = useState<any[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // リアルタイムデータ
  const { data: realtimeData, isConnected } = useRealtimeData({
    table: 'subsidies',
    select: '*',
    filter: { is_active: true }
  });

  // セクションのメタデータ
  const sections = [
    { 
      id: 'auth', 
      title: '認証システム', 
      icon: Lock, 
      color: colors.primary,
      description: 'Supabase統合認証'
    },
    { 
      id: 'matching', 
      title: 'AIマッチング', 
      icon: Brain, 
      color: colors.success,
      description: '補助金自動マッチング'
    },
    { 
      id: 'export', 
      title: 'データ出力', 
      icon: FileText, 
      color: colors.warning,
      description: '多形式エクスポート'
    },
    { 
      id: 'realtime', 
      title: 'リアルタイム', 
      icon: Zap, 
      color: colors.error,
      description: 'WebSocket通信'
    }
  ];

  // 通知表示
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // ログイン処理
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await authService.login({
        email: loginData.email,
        password: loginData.password
      });
      
      if (response.success) {
        showNotification('ログインに成功しました！', 'success');
      } else {
        showNotification(response.error?.message || 'ログインに失敗しました', 'error');
      }
    } catch (error) {
      showNotification('ログインエラーが発生しました', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // AIマッチング実行
  const handleAIMatching = async () => {
    setIsLoading(true);
    try {
      const response = await subsidyService.getAIMatching({
        companyData: {
          businessType: companyData.businessType,
          employeeCount: companyData.employeeCount,
          annualRevenue: companyData.annualRevenue
        },
        questionnaireData: {
          currentChallenges: companyData.currentChallenges,
          digitalizationLevel: companyData.digitalizationLevel,
          budgetRange: companyData.budgetRange
        }
      });
      
      if (response.success && response.data) {
        setMatchingResults(response.data);
        showNotification(`${response.data.length}件の補助金が見つかりました！`, 'success');
      } else {
        showNotification('マッチングに失敗しました', 'error');
      }
    } catch (error) {
      showNotification('マッチングエラーが発生しました', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveLayout
      title="統合デモンストレーション"
      showSidebar={!isMobile}
      sidebarContent={
        <div>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: colors.text 
          }}>
            機能一覧
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: isActive ? section.color + '20' : 'transparent',
                    border: `2px solid ${isActive ? section.color : 'transparent'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={20} style={{ color: section.color }} />
                  <div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: colors.text
                    }}>
                      {section.title}
                    </div>
                    <div style={{ 
                      fontSize: '12px',
                      color: colors.textSecondary
                    }}>
                      {section.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ 
            marginTop: '32px', 
            padding: '16px',
            background: colors.backgroundSecondary,
            borderRadius: '8px'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
              システム状態
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <StatusItem icon={Database} label="Supabase" status={isConnected} />
              <StatusItem icon={Shield} label="認証" status={!!user} />
              <StatusItem icon={Globe} label="API" status={true} />
              <StatusItem icon={Zap} label="リアルタイム" status={isConnected} />
            </div>
          </div>
        </div>
      }
      headerActions={
        <RealtimeIndicator 
          isConnected={isConnected} 
          lastUpdated={new Date()}
          showDetails={!isMobile}
        />
      }
    >
      <ResponsiveContainer maxWidth="xl">
        {/* メインヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '48px' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}
          >
            <Sparkles size={32} style={{ color: colors.primary }} />
            <h1 style={{ 
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: '700',
              color: colors.text,
              margin: 0
            }}>
              エンタープライズ統合デモ
            </h1>
          </motion.div>
          <p style={{ 
            fontSize: isMobile ? '14px' : '16px',
            color: colors.textSecondary,
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Worker1が実装した全機能の統合デモンストレーション
          </p>
        </div>

        {/* 通知トースト */}
        <AnimatePresence>
          {notification && (
            <RealtimeToast
              message={notification.message}
              type={notification.type}
              isVisible={true}
              onClose={() => setNotification(null)}
            />
          )}
        </AnimatePresence>

        {/* セクションコンテンツ */}
        <AnimatePresence mode="wait">
          {/* 認証セクション */}
          {activeSection === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SectionCard
                title="Supabase認証システム"
                description="エンタープライズレベルの認証フロー"
                icon={user ? Unlock : Lock}
                color={colors.primary}
              >
                {!user ? (
                  <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <AccessibleInput
                      id="email"
                      label="メールアドレス"
                      type="email"
                      value={loginData.email}
                      onChange={(value) => setLoginData({ ...loginData, email: value })}
                      placeholder="demo@example.com"
                      hint="デモ用アカウントが設定されています"
                    />
                    
                    <AccessibleInput
                      id="password"
                      label="パスワード"
                      type="password"
                      value={loginData.password}
                      onChange={(value) => setLoginData({ ...loginData, password: value })}
                      placeholder="••••••••"
                      showPasswordToggle
                    />
                    
                    <button
                      onClick={handleLogin}
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: colors.primary,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Loader size={16} className="animate-spin" />
                          認証中...
                        </>
                      ) : (
                        <>
                          ログイン
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <CheckCircle size={48} style={{ color: colors.success, marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>
                      認証済み
                    </h3>
                    <p style={{ color: colors.textSecondary, marginBottom: '24px' }}>
                      {user.email}でログイン中
                    </p>
                    <button
                      onClick={() => authService.logout()}
                      style={{
                        padding: '8px 24px',
                        background: 'none',
                        border: `2px solid ${colors.error}`,
                        borderRadius: '8px',
                        color: colors.error,
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      ログアウト
                    </button>
                  </div>
                )}
              </SectionCard>
            </motion.div>
          )}

          {/* AIマッチングセクション */}
          {activeSection === 'matching' && (
            <motion.div
              key="matching"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SectionCard
                title="AI補助金マッチング"
                description="企業データから最適な補助金を自動選定"
                icon={Brain}
                color={colors.success}
              >
                <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 2 }} gap="16px">
                  <AccessibleSelect
                    id="businessType"
                    label="事業形態"
                    value={companyData.businessType}
                    onChange={(value) => setCompanyData({ ...companyData, businessType: value })}
                    options={[
                      { value: 'manufacturing', label: '製造業' },
                      { value: 'retail', label: '小売業' },
                      { value: 'service', label: 'サービス業' },
                      { value: 'it', label: 'IT関連' }
                    ]}
                  />
                  
                  <AccessibleSelect
                    id="employeeCount"
                    label="従業員数"
                    value={companyData.employeeCount}
                    onChange={(value) => setCompanyData({ ...companyData, employeeCount: value })}
                    options={[
                      { value: '1-5', label: '1〜5名' },
                      { value: '6-20', label: '6〜20名' },
                      { value: '21-50', label: '21〜50名' },
                      { value: '51-100', label: '51〜100名' }
                    ]}
                  />
                  
                  <AccessibleSelect
                    id="currentChallenges"
                    label="現在の課題"
                    value={companyData.currentChallenges}
                    onChange={(value) => setCompanyData({ ...companyData, currentChallenges: value })}
                    options={[
                      { value: 'efficiency', label: '業務効率化' },
                      { value: 'sales', label: '売上拡大' },
                      { value: 'cost', label: 'コスト削減' },
                      { value: 'innovation', label: '新商品開発' }
                    ]}
                  />
                  
                  <AccessibleSelect
                    id="budgetRange"
                    label="投資予算"
                    value={companyData.budgetRange}
                    onChange={(value) => setCompanyData({ ...companyData, budgetRange: value })}
                    options={[
                      { value: 'under-500k', label: '50万円未満' },
                      { value: '500k-1m', label: '50〜100万円' },
                      { value: '1m-3m', label: '100〜300万円' },
                      { value: 'over-3m', label: '300万円以上' }
                    ]}
                  />
                </ResponsiveGrid>

                <button
                  onClick={handleAIMatching}
                  disabled={isLoading || !user}
                  style={{
                    width: '100%',
                    marginTop: '24px',
                    padding: '12px',
                    background: user ? colors.success : colors.textTertiary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: isLoading || !user ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      マッチング中...
                    </>
                  ) : (
                    <>
                      <Brain size={16} />
                      AIマッチング実行
                    </>
                  )}
                </button>

                {!user && (
                  <p style={{ 
                    textAlign: 'center', 
                    marginTop: '12px',
                    color: colors.warning,
                    fontSize: '14px'
                  }}>
                    ※ ログインが必要です
                  </p>
                )}

                {/* マッチング結果 */}
                {matchingResults.length > 0 && (
                  <div style={{ marginTop: '32px' }}>
                    <h4 style={{ fontSize: '18px', marginBottom: '16px' }}>
                      マッチング結果（{matchingResults.length}件）
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {matchingResults.slice(0, 3).map((result, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '16px',
                            background: colors.backgroundSecondary,
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`
                          }}
                        >
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <h5 style={{ fontSize: '16px', margin: 0 }}>
                              {result.subsidy?.name || `補助金 ${index + 1}`}
                            </h5>
                            <span style={{
                              padding: '4px 12px',
                              background: colors.success + '20',
                              color: colors.success,
                              borderRadius: '12px',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}>
                              {result.match_score}%
                            </span>
                          </div>
                          <p style={{ 
                            fontSize: '14px',
                            color: colors.textSecondary,
                            margin: 0
                          }}>
                            最大補助額: {result.subsidy?.subsidy_amount_max?.toLocaleString()}円
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            </motion.div>
          )}

          {/* データ出力セクション */}
          {activeSection === 'export' && (
            <motion.div
              key="export"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SectionCard
                title="高度なデータ出力"
                description="CSV、Excel、PDF形式での多機能エクスポート"
                icon={FileText}
                color={colors.warning}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '32px'
                  }}>
                    <FileText size={64} style={{ color: colors.warning }} />
                    <p style={{ color: colors.textSecondary }}>
                      申請データを様々な形式で出力できます
                    </p>
                  </div>

                  <button
                    onClick={() => setExportDialogOpen(true)}
                    disabled={!user || matchingResults.length === 0}
                    style={{
                      padding: '12px 32px',
                      background: user && matchingResults.length > 0 ? colors.warning : colors.textTertiary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: !user || matchingResults.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FileText size={20} />
                    エクスポート設定を開く
                  </button>

                  {(!user || matchingResults.length === 0) && (
                    <p style={{ 
                      marginTop: '16px',
                      color: colors.warning,
                      fontSize: '14px'
                    }}>
                      {!user ? '※ ログインが必要です' : '※ マッチング結果が必要です'}
                    </p>
                  )}
                </div>

                {/* 出力形式の特徴 */}
                <ResponsiveGrid cols={{ mobile: 1, tablet: 3, desktop: 3 }} gap="16px" style={{ marginTop: '32px' }}>
                  <ExportFeature
                    title="CSV形式"
                    description="データ分析や他システムとの連携に最適"
                    features={['軽量・高速', 'Excel対応', 'カスタム区切り文字']}
                    color="#10b981"
                  />
                  <ExportFeature
                    title="Excel形式"
                    description="高度な書式設定と複数シート対応"
                    features={['複数シート', '書式設定', '関数・グラフ対応']}
                    color="#059669"
                  />
                  <ExportFeature
                    title="PDF形式"
                    description="印刷・共有に最適な固定レイアウト"
                    features={['レイアウト保持', '印刷最適化', 'セキュリティ対応']}
                    color="#dc2626"
                  />
                </ResponsiveGrid>
              </SectionCard>
            </motion.div>
          )}

          {/* リアルタイムセクション */}
          {activeSection === 'realtime' && (
            <motion.div
              key="realtime"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SectionCard
                title="リアルタイム更新"
                description="WebSocketによる双方向通信"
                icon={Zap}
                color={colors.error}
              >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 24px',
                    background: isConnected ? colors.success + '20' : colors.error + '20',
                    borderRadius: '12px',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: isConnected ? colors.success : colors.error,
                      animation: isConnected ? 'pulse 2s infinite' : 'none'
                    }} />
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: isConnected ? colors.success : colors.error
                    }}>
                      {isConnected ? 'リアルタイム接続中' : '接続されていません'}
                    </span>
                  </div>
                </div>

                {/* リアルタイムデータ表示 */}
                {realtimeData.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '18px', marginBottom: '16px' }}>
                      アクティブな補助金（{realtimeData.length}件）
                    </h4>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px',
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}>
                      {realtimeData.map((subsidy: any) => (
                        <motion.div
                          key={subsidy.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          style={{
                            padding: '12px',
                            background: colors.backgroundSecondary,
                            borderRadius: '6px',
                            border: `1px solid ${colors.border}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '500' }}>
                              {subsidy.name}
                            </div>
                            <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                              最大 {subsidy.subsidy_amount_max?.toLocaleString()}円
                            </div>
                          </div>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: colors.success,
                            animation: 'pulse 2s infinite'
                          }} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <style jsx>{`
                  @keyframes pulse {
                    0% {
                      opacity: 1;
                      transform: scale(1);
                    }
                    50% {
                      opacity: 0.5;
                      transform: scale(1.2);
                    }
                    100% {
                      opacity: 1;
                      transform: scale(1);
                    }
                  }
                `}</style>
              </SectionCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* エクスポートダイアログ */}
        <ExportDialog
          isOpen={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          data={{
            companyData,
            questionnaireData: companyData,
            subsidyType: 'demo',
            subsidyName: 'デモ補助金',
            matchingResults
          }}
        />
      </ResponsiveContainer>
    </ResponsiveLayout>
  );
};

// セクションカードコンポーネント
const SectionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  children: React.ReactNode;
}> = ({ title, description, icon: Icon, color, children }) => {
  const { colors } = useDarkModeColors();
  
  return (
    <div style={{
      background: colors.background,
      borderRadius: '16px',
      padding: '32px',
      boxShadow: `0 4px 20px ${colors.shadowLarge}`,
      border: `2px solid ${color}20`
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: color + '20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={24} style={{ color }} />
        </div>
        <div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '700',
            margin: '0 0 4px 0'
          }}>
            {title}
          </h2>
          <p style={{ 
            fontSize: '14px',
            color: colors.textSecondary,
            margin: 0
          }}>
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
};

// ステータスアイテムコンポーネント
const StatusItem: React.FC<{
  icon: React.ComponentType<any>;
  label: string;
  status: boolean;
}> = ({ icon: Icon, label, status }) => {
  const { colors } = useDarkModeColors();
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={14} style={{ color: colors.textSecondary }} />
        <span style={{ fontSize: '12px', color: colors.textSecondary }}>
          {label}
        </span>
      </div>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: status ? colors.success : colors.error
      }} />
    </div>
  );
};

// エクスポート機能コンポーネント
const ExportFeature: React.FC<{
  title: string;
  description: string;
  features: string[];
  color: string;
}> = ({ title, description, features, color }) => {
  const { colors } = useDarkModeColors();
  
  return (
    <div style={{
      padding: '20px',
      background: colors.backgroundSecondary,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        background: color + '20',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '12px'
      }}>
        <FileText size={20} style={{ color }} />
      </div>
      <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>
        {title}
      </h4>
      <p style={{ 
        fontSize: '12px',
        color: colors.textSecondary,
        marginBottom: '12px',
        lineHeight: '1.4'
      }}>
        {description}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {features.map((feature, index) => (
          <div key={index} style={{
            fontSize: '11px',
            color: colors.textSecondary,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckCircle size={12} style={{ color }} />
            {feature}
          </div>
        ))}
      </div>
    </div>
  );
};