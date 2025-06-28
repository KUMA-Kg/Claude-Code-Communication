import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, FileText, CheckCircle, Calendar, ExternalLink, Printer, AlertCircle, 
  MapPin, ChevronDown, ChevronUp, Clock, Info, Shield, Award, Users, 
  Briefcase, Home, TrendingUp, HelpCircle, CheckSquare, Square, FileCheck,
  BookOpen, Zap, Target, Star, ArrowRight, Eye, EyeOff, Filter,
  Sparkles, Lock, Unlock, RefreshCw, Save, Share2, Search
} from 'lucide-react';
import { getDocumentGuidesBySubsidyType, DocumentGuide } from '../data/enhanced-document-guidance';
import { subsidySchedules } from '../data/subsidy-schedules';
import SubsidyTimeline from './SubsidyTimeline';
import NextActionGuide from './NextActionGuide';
import { generateITSubsidyDocuments } from '../utils/it-subsidy-excel-generator';
import '../styles/modern-ui.css';
import '../styles/enhanced-documents.css';

interface RequiredDocumentsListEnhancedProps {
  subsidyType: string;
  subsidyName: string;
  requiredDocuments?: any[];
}

interface DocumentCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  bgGradient: string;
  documents: DocumentGuide[];
}

interface Tooltip {
  id: string;
  content: string;
  visible: boolean;
}

const RequiredDocumentsListEnhanced: React.FC<RequiredDocumentsListEnhancedProps> = ({
  subsidyType,
  subsidyName,
  requiredDocuments: propDocuments
}) => {
  const navigate = useNavigate();
  const [checkedDocuments, setCheckedDocuments] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['common', 'subsidy-specific']));
  const [documentGuides, setDocumentGuides] = useState<DocumentGuide[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked' | 'unchecked'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tooltips, setTooltips] = useState<Map<string, boolean>>(new Map());
  const [animatingDocs, setAnimatingDocs] = useState<Set<string>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 補助金タイプに基づいて適切な書類ガイドを取得
    const guides = getDocumentGuidesBySubsidyType(subsidyType);
    setDocumentGuides(guides);
    
    // ローカルストレージから保存された進捗を復元
    const savedProgress = localStorage.getItem(`subsidy-docs-${subsidyType}`);
    if (savedProgress) {
      setCheckedDocuments(new Set(JSON.parse(savedProgress)));
    }
  }, [subsidyType]);

  // 進捗を自動保存
  useEffect(() => {
    if (checkedDocuments.size > 0) {
      localStorage.setItem(`subsidy-docs-${subsidyType}`, JSON.stringify(Array.from(checkedDocuments)));
    }
  }, [checkedDocuments, subsidyType]);

  const handleDocumentCheck = (docId: string, checked: boolean) => {
    // アニメーション開始
    setAnimatingDocs(new Set([docId]));
    
    setTimeout(() => {
      const newChecked = new Set(checkedDocuments);
      if (checked) {
        newChecked.add(docId);
      } else {
        newChecked.delete(docId);
      }
      setCheckedDocuments(newChecked);
      
      // アニメーション終了
      setTimeout(() => {
        setAnimatingDocs(new Set());
      }, 300);
    }, 150);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleTooltip = (docId: string) => {
    const newTooltips = new Map(tooltips);
    newTooltips.set(docId, !tooltips.get(docId));
    setTooltips(newTooltips);
  };

  const clearProgress = () => {
    if (window.confirm('すべての進捗をクリアしてもよろしいですか？')) {
      setCheckedDocuments(new Set());
      localStorage.removeItem(`subsidy-docs-${subsidyType}`);
    }
  };

  const shareProgress = () => {
    const progress = Array.from(checkedDocuments);
    const shareData = {
      subsidyType,
      progress,
      date: new Date().toISOString()
    };
    const shareUrl = `${window.location.origin}/share?data=${btoa(JSON.stringify(shareData))}`;
    navigator.clipboard.writeText(shareUrl);
    alert('進捗共有リンクをクリップボードにコピーしました！');
  };

  // フィルタリングされた書類
  const filteredGuides = documentGuides.filter(doc => {
    // 検索フィルタ
    if (searchTerm && !doc.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !doc.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // ステータスフィルタ
    if (filterStatus === 'checked' && !checkedDocuments.has(doc.id)) return false;
    if (filterStatus === 'unchecked' && checkedDocuments.has(doc.id)) return false;
    
    return true;
  });

  // カテゴリ別に書類を整理
  const documentCategories: DocumentCategory[] = [
    {
      id: 'common',
      title: '共通書類（全申請者必須）',
      icon: <FileText className="w-5 h-5" />,
      description: 'すべての補助金申請に共通して必要な基本書類',
      color: '#2563eb',
      bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      documents: filteredGuides.filter(d => d.category === 'common')
    },
    {
      id: 'subsidy-specific',
      title: `${subsidyName}専用書類`,
      icon: <Award className="w-5 h-5" />,
      description: 'この補助金特有の必須書類',
      color: '#7c3aed',
      bgGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      documents: filteredGuides.filter(d => d.category === 'subsidy-specific')
    },
    {
      id: 'conditional',
      title: '条件付き書類',
      icon: <Shield className="w-5 h-5" />,
      description: '特定の条件に該当する場合のみ必要',
      color: '#059669',
      bgGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      documents: filteredGuides.filter(d => d.category === 'conditional')
    }
  ].filter(cat => cat.documents.length > 0);

  const requiredDocumentsCount = documentGuides.filter(d => d.category !== 'conditional').length;
  const checkedRequiredCount = Array.from(checkedDocuments).filter(id => 
    documentGuides.find(d => d.id === id && d.category !== 'conditional')
  ).length;
  const completionRate = requiredDocumentsCount > 0 
    ? Math.round((checkedRequiredCount / requiredDocumentsCount) * 100)
    : 0;

  const canProceed = documentGuides
    .filter(d => d.category !== 'conditional')
    .every(d => checkedDocuments.has(d.id));

  const handlePrint = () => {
    // 印刷用にスタイルを調整
    document.body.classList.add('printing');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing');
    }, 1000);
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'p':
            e.preventDefault();
            handlePrint();
            break;
          case 's':
            e.preventDefault();
            shareProgress();
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [checkedDocuments]);

  // 補助金タイプ別の追加情報
  const getSubsidySpecificInfo = () => {
    switch (subsidyType) {
      case 'it-donyu':
        return {
          title: 'IT導入補助金の重要ポイント',
          icon: <Zap className="w-6 h-6" />,
          points: [
            { icon: <Clock className="w-4 h-4" />, text: 'gBizIDプライムの取得には2～3週間かかります。早めに申請しましょう。' },
            { icon: <Shield className="w-4 h-4" />, text: 'SECURITY ACTIONの自己宣言は申請前に必須です。' },
            { icon: <Users className="w-4 h-4" />, text: 'IT導入支援事業者は事前に登録された事業者から選ぶ必要があります。' }
          ]
        };
      case 'monozukuri':
        return {
          title: 'ものづくり補助金の重要ポイント',
          icon: <Briefcase className="w-6 h-6" />,
          points: [
            { icon: <Award className="w-4 h-4" />, text: '認定支援機関の確認書が必須です。早めに相談しましょう。' },
            { icon: <TrendingUp className="w-4 h-4" />, text: '賃金引上げは必須要件です。未達成の場合は返還の可能性があります。' },
            { icon: <FileText className="w-4 h-4" />, text: '事業計画書は10ページ以内で作成する必要があります。' }
          ]
        };
      case 'jizokuka':
        return {
          title: '持続化補助金の重要ポイント',
          icon: <Home className="w-6 h-6" />,
          points: [
            { icon: <Users className="w-4 h-4" />, text: '商工会議所・商工会の会員である必要があります。' },
            { icon: <HelpCircle className="w-4 h-4" />, text: '申請書作成のサポートを商工会議所で受けられます。' },
            { icon: <Target className="w-4 h-4" />, text: '小規模事業者（従業員20名以下）が対象です。' }
          ]
        };
      default:
        return null;
    }
  };

  const subsidyInfo = getSubsidySpecificInfo();

  // 現在の書類を描画する関数
  const renderDocumentCard = (doc: DocumentGuide) => {
    const isChecked = checkedDocuments.has(doc.id);
    const isAnimating = animatingDocs.has(doc.id);
    const showTooltip = tooltips.get(doc.id) || false;

    return (
      <div
        key={doc.id}
        className={`document-card ${isChecked ? 'checked' : ''} ${isAnimating ? 'animating' : ''}`}
        style={{
          transform: isAnimating ? 'scale(1.02)' : 'scale(1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div className="document-card-inner">
          {/* チェックボックスエリア */}
          <div className="document-checkbox-area">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => handleDocumentCheck(doc.id, e.target.checked)}
                className="sr-only"
              />
              <div className="checkbox-custom">
                {isChecked ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
              </div>
            </label>
          </div>

          {/* アイコンエリア */}
          <div className="document-icon-area">
            <div className="document-icon">{doc.icon}</div>
          </div>

          {/* コンテンツエリア */}
          <div className="document-content">
            <div className="document-header">
              <h4 className="document-title">{doc.name}</h4>
              <div className="document-badges">
                {doc.category !== 'conditional' && (
                  <span className="badge badge-required">必須</span>
                )}
                {doc.processingTime && (
                  <span className="badge badge-time">
                    <Clock className="w-3 h-3" />
                    {doc.processingTime}
                  </span>
                )}
                {doc.fee && (
                  <span className="badge badge-fee">{doc.fee}</span>
                )}
              </div>
            </div>
            
            <p className="document-description">{doc.description}</p>
            
            <div className="document-details">
              <div className="detail-item">
                <MapPin className="w-4 h-4" />
                <span>取得場所: {doc.location}</span>
              </div>
              
              {doc.note && (
                <div className="document-note">
                  <AlertCircle className="w-4 h-4" />
                  <span>{doc.note}</span>
                </div>
              )}
            </div>
          </div>

          {/* ヘルプボタン */}
          <div className="document-help">
            <button
              className="help-button"
              onClick={() => toggleTooltip(doc.id)}
              aria-label="詳細情報"
            >
              <Info className="w-4 h-4" />
            </button>
            {showTooltip && (
              <div className="tooltip-content">
                <div className="tooltip-arrow" />
                <h5>取得のポイント</h5>
                <ul>
                  <li>オンライン申請が可能な場合は積極的に活用しましょう</li>
                  <li>余裕を持って早めに申請することをお勧めします</li>
                  <li>不明な点は発行機関に直接お問い合わせください</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 締切日計算（IT導入補助金用）
  const getDeadlineInfo = () => {
    if (!subsidySchedules[subsidyType]) return null;
    
    const schedule = subsidySchedules[subsidyType];
    const today = new Date();
    const deadline = new Date(schedule.deadline);
    const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const getDeadlineStatus = () => {
      if (daysUntilDeadline < 0) {
        return { color: '#6b7280', message: '締切終了', icon: '⏰' };
      } else if (daysUntilDeadline <= 7) {
        return { color: '#ef4444', message: '締切間近！', icon: '🚨' };
      } else if (daysUntilDeadline <= 30) {
        return { color: '#f59e0b', message: '準備を急ぎましょう', icon: '⚡' };
      } else {
        return { color: '#10b981', message: '余裕があります', icon: '✅' };
      }
    };

    const status = getDeadlineStatus();
    
    return {
      deadline,
      daysUntilDeadline,
      status
    };
  };

  const deadlineInfo = getDeadlineInfo();

  return (
    <div className="enhanced-documents-container" ref={printRef}>
      {/* 締切カウントダウン（最上部に移動） */}
      {deadlineInfo && (
        <div style={{
          background: `linear-gradient(135deg, ${deadlineInfo.status.color}20 0%, ${deadlineInfo.status.color}10 100%)`,
          border: `2px solid ${deadlineInfo.status.color}`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: deadlineInfo.status.color,
              color: 'white',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              <div>{Math.abs(deadlineInfo.daysUntilDeadline)}</div>
              <div style={{ fontSize: '14px', fontWeight: 'normal' }}>日</div>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', color: deadlineInfo.status.color }}>
                申請締切まで{deadlineInfo.daysUntilDeadline > 0 ? 'あと' : ''}
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#4b5563' }}>
                締切日: {deadlineInfo.deadline.toLocaleDateString('ja-JP')}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '20px' }}>{deadlineInfo.status.icon}</span>
                <span style={{ color: deadlineInfo.status.color, fontWeight: '600' }}>
                  {deadlineInfo.status.message}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/minimal-form/' + subsidyType)}
            style={{
              padding: '12px 24px',
              background: `linear-gradient(135deg, ${deadlineInfo.status.color} 0%, ${deadlineInfo.status.color}dd 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
            }}
          >
            <Sparkles className="w-5 h-5" />
            今すぐ申請準備を始める
          </button>
        </div>
      )}

      {/* AI申請書作成プロモーション */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        color: 'white',
        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '20px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>✨</span>
              かんたん10問でAI申請書作成
            </h3>
            <p style={{ margin: 0, fontSize: '15px', opacity: 0.95, lineHeight: '1.6' }}>
              質問に答えるだけで、専門知識不要！<br/>
              AIが最適な申請書を自動作成します。作成時間を<strong>90%削減</strong>できます。
            </p>
          </div>
          <button
            onClick={() => navigate('/minimal-form/' + subsidyType)}
            style={{
              padding: '12px 28px',
              backgroundColor: 'white',
              color: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            今すぐ申請書を作成 →
          </button>
        </div>
      </div>

      {/* ページ説明 */}
      <div style={{ 
        backgroundColor: '#e0f2fe', 
        padding: '16px 20px', 
        borderRadius: '8px',
        marginBottom: '24px',
        border: '1px solid #0284c7'
      }}>
        <p style={{ margin: 0, fontSize: '16px', color: '#0c4a6e' }}>
          📌 <strong>このページでは補助金提出までの工程・スケジュールの確認と補助金資料の作成ができるよ</strong>
        </p>
      </div>

      {/* ヘッダー */}
      <header className="documents-header">
        <div className="header-content">
          <div className="header-main">
            <h1 className="header-title">
              <Sparkles className="inline-block w-8 h-8 mr-3" />
              {subsidyName} - 必要書類ガイド
            </h1>
            <p className="header-subtitle">
              申請に必要な書類をわかりやすくチェックできます
            </p>
          </div>
          
          {/* アクションボタン */}
          <div className="header-actions">
            <button
              onClick={clearProgress}
              className="action-button action-button-secondary"
              title="進捗をクリア"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={shareProgress}
              className="action-button action-button-secondary"
              title="進捗を共有"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="action-button action-button-secondary"
              title="印刷 (Ctrl+P)"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* IT導入補助金書類ダウンロードセクション */}
      {subsidyType === 'it-donyu' && (
        <div style={{
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #d1d5db'
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            fontSize: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#1f2937'
          }}>
            <Download className="w-6 h-6" style={{ color: '#3b82f6' }} />
            IT導入補助金 申請書類ダウンロード
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '16px' 
          }}>
            {/* 入力済み申請書一式 */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onClick={() => {
              const savedData = localStorage.getItem('subsidyFormData');
              const applicantData = savedData ? JSON.parse(savedData) : {};
              generateITSubsidyDocuments.allOfficialForms(applicantData);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText className="w-8 h-8" style={{ color: '#10b981' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    公式様式一式ダウンロード
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                    様式1〜6の全ての公式申請書類
                  </p>
                </div>
              </div>
            </div>

            {/* 賃金報告書 */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onClick={() => {
              const savedData = localStorage.getItem('subsidyFormData');
              const applicantData = savedData ? JSON.parse(savedData) : {};
              generateITSubsidyDocuments.form4(applicantData);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <TrendingUp className="w-8 h-8" style={{ color: '#f59e0b' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    様式4: 賃金引上げ計画書
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                    賃金引上げ計画の公式様式
                  </p>
                </div>
              </div>
            </div>

            {/* 実施内容説明書 */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onClick={() => {
              const savedData = localStorage.getItem('subsidyFormData');
              const applicantData = savedData ? JSON.parse(savedData) : {};
              generateITSubsidyDocuments.form2(applicantData);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Target className="w-8 h-8" style={{ color: '#8b5cf6' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    様式2: 事業計画書
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                    事業計画と実施体制の公式様式
                  </p>
                </div>
              </div>
            </div>

            {/* 価格説明書 */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onClick={() => {
              const savedData = localStorage.getItem('subsidyFormData');
              const applicantData = savedData ? JSON.parse(savedData) : {};
              generateITSubsidyDocuments.form3(applicantData);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Briefcase className="w-8 h-8" style={{ color: '#3b82f6' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    様式3: 導入ITツール一覧
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                    ITツールと費用内訳の公式様式
                  </p>
                </div>
              </div>
            </div>

            {/* ブランクテンプレート一式 */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onClick={() => {
              const savedData = localStorage.getItem('subsidyFormData');
              const applicantData = savedData ? JSON.parse(savedData) : {};
              generateITSubsidyDocuments.form5(applicantData);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileCheck className="w-8 h-8" style={{ color: '#6b7280' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    様式5: 労働生産性向上計画書
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                    労働生産性向上計画の公式様式
                  </p>
                </div>
              </div>
            </div>

            {/* IT導入補助金申請ガイド */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onClick={() => {
              const savedData = localStorage.getItem('subsidyFormData');
              const applicantData = savedData ? JSON.parse(savedData) : {};
              generateITSubsidyDocuments.form6(applicantData);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookOpen className="w-8 h-8" style={{ color: '#ef4444' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    様式6: 申請者概要
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                    企業情報・財務情報の公式様式
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#fef3c7',
            borderRadius: '6px',
            border: '1px solid #fcd34d',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Info className="w-5 h-5" style={{ color: '#f59e0b', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
              すべての書類はExcel形式でダウンロードされます。申請前に最新の公募要領を確認し、必要に応じて内容を調整してください。
            </p>
          </div>
        </div>
      )}

      {/* 進捗バーとフィルター */}
      <div className="progress-section">
        <div className="progress-container">
          <div className="progress-header">
            <div className="progress-info">
              <h3 className="progress-title">書類準備状況</h3>
              <p className="progress-subtitle">
                必須書類: {checkedRequiredCount} / {requiredDocumentsCount} 完了
              </p>
            </div>
            <div className="progress-percentage">
              <div className="percentage-circle" style={{
                background: `conic-gradient(${completionRate === 100 ? '#10b981' : '#3b82f6'} ${completionRate * 3.6}deg, #e5e7eb ${completionRate * 3.6}deg)`
              }}>
                <div className="percentage-inner">
                  <span className="percentage-value">{completionRate}</span>
                  <span className="percentage-unit">%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div 
                className="progress-bar-fill"
                style={{ 
                  width: `${completionRate}%`,
                  background: completionRate === 100 
                    ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                    : 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
                }}
              >
                <div className="progress-bar-shimmer" />
              </div>
            </div>
          </div>

          {/* フィルターオプション */}
          <div className="filter-controls">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="filter-toggle"
            >
              <Filter className="w-4 h-4" />
              フィルター
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showFilters && (
              <div className="filter-options">
                <div className="search-box">
                  <Search className="w-4 h-4" />
                  <input
                    type="text"
                    placeholder="書類を検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                
                <div className="filter-buttons">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`filter-button ${filterStatus === 'all' ? 'active' : ''}`}
                  >
                    すべて
                  </button>
                  <button
                    onClick={() => setFilterStatus('checked')}
                    className={`filter-button ${filterStatus === 'checked' ? 'active' : ''}`}
                  >
                    準備済み
                  </button>
                  <button
                    onClick={() => setFilterStatus('unchecked')}
                    className={`filter-button ${filterStatus === 'unchecked' ? 'active' : ''}`}
                  >
                    未準備
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 重要な注意事項 */}
      <div className="important-notice">
        <div className="notice-icon">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="notice-content">
          <h3 className="notice-title">
            <BookOpen className="w-5 h-5 inline-block mr-2" />
            書類準備を始める前に
          </h3>
          <p className="notice-subtitle">
            以下の書類は取得に時間がかかるため、早めの準備をお勧めします：
          </p>
          <div className="time-required-list">
            {subsidyType === 'it-donyu' && (
              <>
                <div className="time-required-item">
                  <Lock className="w-5 h-5" />
                  <div>
                    <strong>gBizIDプライム</strong>
                    <span className="time-badge">2～3週間</span>
                  </div>
                </div>
                <div className="time-required-item">
                  <FileText className="w-5 h-5" />
                  <div>
                    <strong>マイナンバーカード</strong>
                    <span className="time-badge">1ヶ月程度</span>
                  </div>
                </div>
              </>
            )}
            <div className="time-required-item">
              <FileCheck className="w-5 h-5" />
              <div>
                <strong>履歴事項全部証明書</strong>
                <span className="time-badge">オンライン: 即日</span>
              </div>
            </div>
            <div className="time-required-item">
              <Target className="w-5 h-5" />
              <div>
                <strong>納税証明書</strong>
                <span className="time-badge">即日～1週間</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 補助金別の重要ポイント */}
      {subsidyInfo && (
        <div className="subsidy-info-card">
          <div className="subsidy-info-header">
            <div className="subsidy-info-icon">
              {subsidyInfo.icon}
            </div>
            <h3 className="subsidy-info-title">{subsidyInfo.title}</h3>
          </div>
          <div className="subsidy-points-list">
            {subsidyInfo.points.map((point, index) => (
              <div key={index} className="subsidy-point-item">
                <div className="point-icon">
                  {point.icon}
                </div>
                <p className="point-text">{point.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 書類カテゴリ別表示 */}
      <div className="documents-section">
        <div className="section-header">
          <span className="section-icon">📑</span>
          <h2 className="section-title">必要書類一覧</h2>
        </div>

        {documentCategories.map((category) => (
          <div key={category.id} className="document-category">
            <div 
              className="category-header"
              onClick={() => toggleCategory(category.id)}
            >
              <div className="category-header-left">
                <div 
                  className="category-icon-wrapper"
                  style={{ background: category.bgGradient }}
                >
                  {category.icon}
                </div>
                <div className="category-info">
                  <h3>{category.title}</h3>
                  <p className="category-description">{category.description}</p>
                </div>
              </div>
              <div className="category-meta">
                <span className="document-count">
                  {category.documents.length}件
                </span>
                <ChevronDown 
                  className={`chevron-icon ${expandedCategories.has(category.id) ? 'expanded' : ''}`}
                />
              </div>
            </div>
            
            {expandedCategories.has(category.id) && (
              <div className="category-documents">
                {category.documents.map(doc => renderDocumentCard(doc))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* スケジュール可視化 - タイムライン表示 
          ※締切カウントダウンをページ上部に移動したため、詳細タイムラインはコメントアウト
          必要に応じて復活させることも可能
      */}
      {/* {subsidySchedules[subsidyType] && (
        <SubsidyTimeline 
          schedule={subsidySchedules[subsidyType]}
          completedMilestones={new Set(
            documentGuides
              .filter(d => checkedDocuments.has(d.id))
              .map(d => {
                // 書類の準備状況からマイルストーンの完了を推測
                if (subsidyType === 'it-donyu') {
                  if (d.name.includes('gBizID')) return 'gbiz-id';
                  if (d.name.includes('SECURITY ACTION')) return 'security-action';
                }
                return null;
              })
              .filter(Boolean) as string[]
          )}
        />
      )} */}

      {/* 役立つリンク集 */}
      <div className="links-section">
        <h3 className="links-title">
          <ExternalLink className="w-6 h-6" />
          書類取得に役立つリンク
        </h3>
        <div className="links-grid">
          <a
            href="https://gbiz-id.go.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="link-card"
          >
            <ExternalLink className="w-4 h-4" />
            gBizID（電子申請用）
          </a>
          <a
            href="https://www.touki-kyoutaku-online.moj.go.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="link-card"
          >
            <ExternalLink className="w-4 h-4" />
            登記ねっと（登記簿謄本）
          </a>
          <a
            href="https://www.nta.go.jp/taxes/nozei/nozei-shomei/01.htm"
            target="_blank"
            rel="noopener noreferrer"
            className="link-card"
          >
            <ExternalLink className="w-4 h-4" />
            国税庁（納税証明書）
          </a>
          {subsidyType === 'it-donyu' && (
            <a
              href="https://www.ipa.go.jp/security/security-action/"
              target="_blank"
              rel="noopener noreferrer"
              className="link-card"
            >
              <ExternalLink className="w-4 h-4" />
              SECURITY ACTION
            </a>
          )}
        </div>
      </div>

      {/* 次のアクションガイド - 書類準備完了後の具体的なステップ */}
      {subsidySchedules[subsidyType] && canProceed && (
        <NextActionGuide
          nextActions={subsidySchedules[subsidyType].nextActions}
          applicationLinks={subsidySchedules[subsidyType].applicationLinks}
          subsidyName={subsidyName}
        />
      )}

      {/* アクションボタン */}
      <div className="action-section">
        <button
          onClick={() => navigate(`/minimal-form/${subsidyType}`)}
          className="btn-primary"
          style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
            padding: '16px 32px',
            fontSize: '18px'
          }}
        >
          <>
            <Sparkles className="w-5 h-5" />
            10問でAI申請書作成
          </>
        </button>
        <button
          onClick={() => navigate(`/guide/${subsidyType}-documents`)}
          className="btn-secondary"
        >
          <BookOpen className="w-5 h-5" />
          詳細ガイドを見る
        </button>
      </div>
    </div>
  );
};

export default RequiredDocumentsListEnhanced;