import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Eye, 
  Type, 
  Volume2, 
  Keyboard, 
  Accessibility,
  X,
  RotateCcw,
  Sun,
  Contrast,
  MousePointer,
  Clock,
  Brain,
  Languages
} from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';
import { useDarkModeColors } from '../hooks/useDarkMode';

interface AccessibilityControlsProps {
  isOpen: boolean;
  onToggle: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const AccessibilityControls: React.FC<AccessibilityControlsProps> = ({
  isOpen,
  onToggle,
  position = 'bottom-right'
}) => {
  const { colors } = useDarkModeColors();
  const { settings, updateSetting, resetSettings, announceToScreenReader } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'visual' | 'audio' | 'motor' | 'cognitive'>('visual');

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 9999
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      default:
        return { ...baseStyles, bottom: '20px', right: '20px' };
    }
  };

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    updateSetting(key, value);
    announceToScreenReader(`${key}を${value ? '有効' : '無効'}にしました`);
  };

  const tabs = [
    { id: 'visual', label: '視覚', icon: Eye },
    { id: 'audio', label: '聴覚', icon: Volume2 },
    { id: 'motor', label: '運動', icon: MousePointer },
    { id: 'cognitive', label: '認知', icon: Brain }
  ] as const;

  return (
    <div style={getPositionStyles()}>
      {/* トグルボタン */}
      <motion.button
        onClick={onToggle}
        style={{
          background: colors.primary,
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: `0 4px 12px ${colors.shadowLarge}`,
          marginBottom: isOpen ? '16px' : '0'
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="アクセシビリティ設定を開く"
        aria-expanded={isOpen}
        aria-controls="accessibility-panel"
      >
        {isOpen ? <X size={24} /> : <Accessibility size={24} />}
      </motion.button>

      {/* アクセシビリティパネル */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="accessibility-panel"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
              background: colors.background,
              border: `2px solid ${colors.border}`,
              borderRadius: '16px',
              padding: '24px',
              width: '400px',
              maxHeight: '600px',
              overflowY: 'auto',
              boxShadow: `0 20px 40px ${colors.shadowLarge}`,
              ...(position.includes('right') ? { right: '0' } : { left: '0' }),
              ...(position.includes('top') ? { top: '72px' } : { bottom: '72px' })
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="accessibility-title"
            aria-describedby="accessibility-description"
          >
            {/* ヘッダー */}
            <div style={{ marginBottom: '24px' }}>
              <h2 
                id="accessibility-title"
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: colors.text,
                  margin: '0 0 8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <Settings size={24} style={{ color: colors.primary }} />
                アクセシビリティ設定
              </h2>
              <p 
                id="accessibility-description"
                style={{
                  color: colors.textSecondary,
                  fontSize: '14px',
                  margin: 0
                }}
              >
                あなたの使いやすさに合わせて設定を調整できます
              </p>
            </div>

            {/* タブナビゲーション */}
            <div style={{ marginBottom: '24px' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  gap: '4px',
                  background: colors.backgroundSecondary,
                  padding: '4px',
                  borderRadius: '12px'
                }}
                role="tablist"
                aria-label="アクセシビリティカテゴリ"
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: isActive ? colors.primary : 'transparent',
                        color: isActive ? 'white' : colors.textSecondary,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`${tab.id}-panel`}
                      tabIndex={isActive ? 0 : -1}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* タブコンテンツ */}
            <div 
              id={`${activeTab}-panel`}
              role="tabpanel"
              aria-labelledby={`${activeTab}-tab`}
              style={{ minHeight: '300px' }}
            >
              {activeTab === 'visual' && (
                <div>
                  <ControlGroup title="表示設定" icon={<Eye size={18} />}>
                    <ToggleControl
                      label="高コントラスト"
                      description="テキストと背景のコントラストを強化"
                      checked={settings.highContrast}
                      onChange={(value) => handleSettingChange('highContrast', value)}
                      icon={<Contrast size={16} />}
                    />
                    
                    <ToggleControl
                      label="大きなテキスト"
                      description="フォントサイズを125%に拡大"
                      checked={settings.largeText}
                      onChange={(value) => handleSettingChange('largeText', value)}
                      icon={<Type size={16} />}
                    />
                    
                    <ToggleControl
                      label="動きを減らす"
                      description="アニメーションや動きを最小限に"
                      checked={settings.reducedMotion}
                      onChange={(value) => handleSettingChange('reducedMotion', value)}
                      icon={<Clock size={16} />}
                    />
                    
                    <ToggleControl
                      label="フォーカス表示"
                      description="キーボードフォーカスを明確に表示"
                      checked={settings.focusVisible}
                      onChange={(value) => handleSettingChange('focusVisible', value)}
                      icon={<Sun size={16} />}
                    />
                  </ControlGroup>
                </div>
              )}

              {activeTab === 'audio' && (
                <div>
                  <ControlGroup title="音声設定" icon={<Volume2 size={18} />}>
                    <ToggleControl
                      label="効果音を有効"
                      description="操作時の音声フィードバック"
                      checked={settings.soundEnabled}
                      onChange={(value) => handleSettingChange('soundEnabled', value)}
                      icon={<Volume2 size={16} />}
                    />
                    
                    <ToggleControl
                      label="スクリーンリーダー最適化"
                      description="スクリーンリーダーでの読み上げを最適化"
                      checked={settings.screenReaderOptimized}
                      onChange={(value) => handleSettingChange('screenReaderOptimized', value)}
                      icon={<Volume2 size={16} />}
                    />
                  </ControlGroup>
                </div>
              )}

              {activeTab === 'motor' && (
                <div>
                  <ControlGroup title="操作設定" icon={<MousePointer size={18} />}>
                    <ToggleControl
                      label="キーボードナビゲーション"
                      description="キーボードでの操作を強化"
                      checked={settings.keyboardNavigation}
                      onChange={(value) => handleSettingChange('keyboardNavigation', value)}
                      icon={<Keyboard size={16} />}
                    />
                    
                    <ToggleControl
                      label="ホバー効果を維持"
                      description="マウスオーバー効果を固定表示"
                      checked={settings.stickyHover}
                      onChange={(value) => handleSettingChange('stickyHover', value)}
                      icon={<MousePointer size={16} />}
                    />
                    
                    <SliderControl
                      label="クリック遅延"
                      description="誤クリックを防ぐための遅延時間"
                      value={settings.clickDelay}
                      min={0}
                      max={1000}
                      step={100}
                      unit="ms"
                      onChange={(value) => handleSettingChange('clickDelay', value)}
                    />
                  </ControlGroup>
                </div>
              )}

              {activeTab === 'cognitive' && (
                <div>
                  <ControlGroup title="認知支援" icon={<Brain size={18} />}>
                    <ToggleControl
                      label="シンプルインターフェース"
                      description="不要な要素を非表示にして集中しやすく"
                      checked={settings.simplifiedInterface}
                      onChange={(value) => handleSettingChange('simplifiedInterface', value)}
                      icon={<Brain size={16} />}
                    />
                    
                    <ToggleControl
                      label="自動保存"
                      description="入力内容を自動的に保存"
                      checked={settings.autoSave}
                      onChange={(value) => handleSettingChange('autoSave', value)}
                      icon={<Brain size={16} />}
                    />
                    
                    <ToggleControl
                      label="進捗表示"
                      description="現在の進捗状況を常に表示"
                      checked={settings.progressIndicators}
                      onChange={(value) => handleSettingChange('progressIndicators', value)}
                      icon={<Brain size={16} />}
                    />
                    
                    <ToggleControl
                      label="文脈ヘルプ"
                      description="各項目に詳細な説明を表示"
                      checked={settings.contextualHelp}
                      onChange={(value) => handleSettingChange('contextualHelp', value)}
                      icon={<Brain size={16} />}
                    />
                    
                    <SelectControl
                      label="言語"
                      description="表示言語の選択"
                      value={settings.language}
                      options={[
                        { value: 'ja', label: '日本語' },
                        { value: 'en', label: 'English' }
                      ]}
                      onChange={(value) => handleSettingChange('language', value as 'ja' | 'en')}
                      icon={<Languages size={16} />}
                    />
                  </ControlGroup>
                </div>
              )}
            </div>

            {/* リセットボタン */}
            <div style={{ 
              marginTop: '24px', 
              paddingTop: '16px', 
              borderTop: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  resetSettings();
                  announceToScreenReader('アクセシビリティ設定をリセットしました');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'none',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  color: colors.textSecondary,
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = colors.backgroundSecondary;
                  e.currentTarget.style.borderColor = colors.textSecondary;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = colors.border;
                }}
                aria-label="すべての設定をデフォルトに戻す"
              >
                <RotateCcw size={16} />
                設定をリセット
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// コントロールグループコンポーネント
const ControlGroup: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => {
  const { colors } = useDarkModeColors();
  
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: colors.text,
        margin: '0 0 16px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {icon}
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {children}
      </div>
    </div>
  );
};

// トグルコントロールコンポーネント
const ToggleControl: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: React.ReactNode;
}> = ({ label, description, checked, onChange, icon }) => {
  const { colors } = useDarkModeColors();
  
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{ color: colors.textSecondary, paddingTop: '2px' }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none'
        }}>
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: colors.text,
              marginBottom: '2px'
            }}>
              {label}
            </div>
            <div style={{
              fontSize: '12px',
              color: colors.textSecondary,
              lineHeight: '1.4'
            }}>
              {description}
            </div>
          </div>
          
          <div
            style={{
              position: 'relative',
              width: '44px',
              height: '24px',
              background: checked ? colors.primary : colors.border,
              borderRadius: '12px',
              transition: 'background-color 0.2s ease',
              cursor: 'pointer'
            }}
            onClick={() => onChange(!checked)}
            role="switch"
            aria-checked={checked}
            aria-label={label}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onChange(!checked);
              }
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: checked ? '22px' : '2px',
                width: '20px',
                height: '20px',
                background: 'white',
                borderRadius: '50%',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>
        </label>
      </div>
    </div>
  );
};

// スライダーコントロールコンポーネント
const SliderControl: React.FC<{
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}> = ({ label, description, value, min, max, step, unit, onChange }) => {
  const { colors } = useDarkModeColors();
  
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div>
          <div style={{
            fontSize: '14px',
            fontWeight: '500',
            color: colors.text
          }}>
            {label}
          </div>
          <div style={{
            fontSize: '12px',
            color: colors.textSecondary
          }}>
            {description}
          </div>
        </div>
        <span style={{
          fontSize: '14px',
          fontWeight: '500',
          color: colors.primary
        }}>
          {value}{unit}
        </span>
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: colors.backgroundSecondary,
          outline: 'none',
          cursor: 'pointer'
        }}
        aria-label={`${label}: ${value}${unit}`}
      />
    </div>
  );
};

// セレクトコントロールコンポーネント
const SelectControl: React.FC<{
  label: string;
  description: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  icon: React.ReactNode;
}> = ({ label, description, value, options, onChange, icon }) => {
  const { colors } = useDarkModeColors();
  
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{ color: colors.textSecondary, paddingTop: '2px' }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '500',
          color: colors.text,
          marginBottom: '2px'
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '12px',
          color: colors.textSecondary,
          marginBottom: '8px',
          lineHeight: '1.4'
        }}>
          {description}
        </div>
        
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            background: colors.background,
            color: colors.text,
            fontSize: '14px',
            cursor: 'pointer'
          }}
          aria-label={label}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};