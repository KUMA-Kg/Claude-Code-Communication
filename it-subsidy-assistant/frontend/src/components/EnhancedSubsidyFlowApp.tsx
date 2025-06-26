import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIConversationalForm from './AIConversationalForm';
import SubsidySelectionScreen from './SubsidySelectionScreen';
import DocumentRequirementScreen from './DocumentRequirementScreen';
import DocumentFormScreen from './DocumentFormScreen';
import EnhancedConfirmationScreen from './EnhancedConfirmationScreen';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import StepIndicator from './ui/StepIndicator';
import { X, FileSpreadsheet } from 'lucide-react';
import { cn } from '../lib/utils';
import '../../templates/darkmode.css';

// ダークモード統合
const initializeDarkMode = () => {
  const script = document.createElement('script');
  script.src = '/templates/darkmode.js';
  document.body.appendChild(script);
};

interface SubsidyMatch {
  subsidyType: string;
  subsidyName: string;
  score: number;
  matchLevel: 'high' | 'medium' | 'low';
  description: string;
  icon: string;
}

interface DocumentRequirement {
  id: string;
  name: string;
  category: string;
  description: string;
  required_for_categories?: string[];
  required_for_frames?: string[];
  required_for_all?: boolean;
  required_when?: string;
  template_questions: string[];
}

interface FormData {
  [documentId: string]: {
    [questionIndex: string]: string;
  };
}

type FlowStep = 'conversation' | 'selection' | 'documents' | 'forms' | 'confirmation';

const FLOW_STEPS = [
  { id: 'conversation', label: 'ヒアリング', description: '基本情報の入力' },
  { id: 'selection', label: '補助金選択', description: '最適な補助金を選択' },
  { id: 'documents', label: '必要書類確認', description: '提出書類の確認' },
  { id: 'forms', label: '書類作成', description: '申請書類の作成' },
  { id: 'confirmation', label: '確認・完了', description: '内容確認と出力' }
];

const EnhancedSubsidyFlowApp: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('conversation');
  const [conversationData, setConversationData] = useState<any>({});
  const [matches, setMatches] = useState<SubsidyMatch[]>([]);
  const [selectedSubsidy, setSelectedSubsidy] = useState<SubsidyMatch | null>(null);
  const [requiredDocuments, setRequiredDocuments] = useState<DocumentRequirement[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [showExcelPreview, setShowExcelPreview] = useState(false);

  useEffect(() => {
    initializeDarkMode();
  }, []);

  const handleConversationComplete = (data: any) => {
    setConversationData(data);
    
    // AI分析による補助金マッチング
    const subsidyMatches = analyzeAndMatchSubsidies(data);
    setMatches(subsidyMatches);
    setCurrentStep('selection');
  };

  const analyzeAndMatchSubsidies = (data: any): SubsidyMatch[] => {
    // AIマッチングロジック
    const matches: SubsidyMatch[] = [];
    
    if (data.businessType === '製造業' || data.businessType?.includes('製造')) {
      matches.push({
        subsidyType: 'monozukuri',
        subsidyName: 'ものづくり補助金',
        score: 95,
        matchLevel: 'high',
        description: '製造業の設備投資に最適',
        icon: '🏭'
      });
    }
    
    if (data.employeeCount < 20 || data.businessType?.includes('小規模')) {
      matches.push({
        subsidyType: 'jizokuka',
        subsidyName: '小規模事業者持続化補助金',
        score: 90,
        matchLevel: 'high',
        description: '小規模事業者の販路開拓を支援',
        icon: '🏪'
      });
    }
    
    // IT導入補助金は全業種対象
    matches.push({
      subsidyType: 'it-donyu',
      subsidyName: 'IT導入補助金2025',
      score: 85,
      matchLevel: 'high',
      description: 'デジタル化・IT化を支援',
      icon: '💻'
    });
    
    return matches.sort((a, b) => b.score - a.score);
  };

  const handleSubsidySelect = (subsidy: SubsidyMatch) => {
    setSelectedSubsidy(subsidy);
    setCurrentStep('documents');
  };

  const handleDocumentsNext = (documents: DocumentRequirement[]) => {
    setRequiredDocuments(documents);
    setCurrentStep('forms');
  };

  const handleFormsNext = (data: FormData) => {
    setFormData(data);
    setCurrentStep('confirmation');
  };

  const handleEditDocument = (documentIndex: number) => {
    setCurrentStep('forms');
  };

  const handleBackToConversation = () => {
    setCurrentStep('conversation');
    setConversationData({});
    setMatches([]);
    setSelectedSubsidy(null);
    setRequiredDocuments([]);
    setFormData({});
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'conversation':
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <AIConversationalForm 
              onComplete={handleConversationComplete}
              subsidyType=""
            />
          </motion.div>
        );
      
      case 'selection':
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <SubsidySelectionScreen 
              matches={matches}
              onSelect={handleSubsidySelect}
              onBack={handleBackToConversation}
            />
          </motion.div>
        );
      
      case 'documents':
        return selectedSubsidy ? (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <DocumentRequirementScreen 
              selectedSubsidy={selectedSubsidy}
              onNext={handleDocumentsNext}
              onBack={() => setCurrentStep('selection')}
            />
          </motion.div>
        ) : null;
      
      case 'forms':
        return selectedSubsidy ? (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <DocumentFormScreen 
              requiredDocuments={requiredDocuments}
              subsidyName={selectedSubsidy.subsidyName}
              onNext={handleFormsNext}
              onBack={() => setCurrentStep('documents')}
              conversationData={conversationData}
            />
          </motion.div>
        ) : null;
      
      case 'confirmation':
        return selectedSubsidy ? (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <EnhancedConfirmationScreen 
              requiredDocuments={requiredDocuments}
              formData={formData}
              subsidyName={selectedSubsidy.subsidyName}
              onBack={() => setCurrentStep('forms')}
              onEdit={handleEditDocument}
            />
          </motion.div>
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative transition-all duration-300 flex flex-col">
      {/* Excel プレビューボタン（会話型フォーム以外で表示） */}
      {currentStep !== 'conversation' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-5 right-5 z-50"
        >
          <Button
            onClick={() => setShowExcelPreview(!showExcelPreview)}
            size="lg"
            className="rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl transition-shadow"
          >
            <FileSpreadsheet className="w-6 h-6" />
          </Button>
        </motion.div>
      )}

      {/* プログレスインジケーター（会話型フォーム以外で表示） */}
      {currentStep !== 'conversation' && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b">
          {/* Progress Bar */}
          <Progress 
            value={
              currentStep === 'selection' ? 20 :
              currentStep === 'documents' ? 40 :
              currentStep === 'forms' ? 60 :
              currentStep === 'confirmation' ? 80 : 0
            } 
            className="h-1 rounded-none"
          />
          
          {/* Step Indicator */}
          <div className="container mx-auto px-4 py-6">
            <StepIndicator 
              steps={FLOW_STEPS.slice(1)} 
              currentStep={currentStep}
              orientation="horizontal"
            />
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        currentStep !== 'conversation' && "pt-24"
      )}>
        <AnimatePresence mode="wait">
          {renderCurrentStep()}
        </AnimatePresence>
      </div>

      {/* Excel プレビューパネル */}
      <AnimatePresence>
        {showExcelPreview && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-0 right-0 bottom-0 w-96 bg-background border-l shadow-xl p-6 overflow-y-auto z-40"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Excel出力プレビュー</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExcelPreview(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Basic Information Card */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">基本情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">業種:</span>
                  <Badge variant="secondary">
                    {conversationData.businessType || '未入力'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">従業員数:</span>
                  <Badge variant="secondary">
                    {conversationData.employeeCount || '未入力'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">年商:</span>
                  <Badge variant="secondary">
                    {conversationData.annualRevenue || '未入力'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Selected Subsidy Card */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">選択した補助金</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={selectedSubsidy ? "default" : "outline"} className="w-full justify-center py-2">
                  {selectedSubsidy?.subsidyName || '未選択'}
                </Badge>
              </CardContent>
            </Card>

            {/* Progress Card */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">入力進捗</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-bold text-primary">
                      {Object.keys(formData).length}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {requiredDocuments.length} 項目
                    </span>
                  </div>
                  <Progress 
                    value={(Object.keys(formData).length / requiredDocuments.length) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Download Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                // Excel出力処理
                console.log('Excel出力');
              }}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel形式でダウンロード
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-auto border-t bg-muted/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 IT補助金アシスタント. All rights reserved.
            </div>
            <nav className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                利用規約
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                プライバシーポリシー
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                お問い合わせ
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EnhancedSubsidyFlowApp;