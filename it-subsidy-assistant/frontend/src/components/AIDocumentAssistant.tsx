import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { styles } from '../styles';

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  metadata?: {
    field?: string;
    value?: any;
    sectionCompleted?: boolean;
    suggestions?: string[];
  };
}

interface DocumentQuestion {
  id: string;
  question: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'multiline' | 'multiselect';
  options?: string[];
  validation?: (value: any) => boolean;
  helpText?: string;
  aiSuggestions?: string[];
  required?: boolean;
  value?: any;
}

interface DocumentSection {
  id: string;
  title: string;
  questions: DocumentQuestion[];
  completed: boolean;
}

interface DocumentData {
  subsidyType: string;
  subsidyName: string;
  sections: DocumentSection[];
  metadata: {
    createdAt: Date;
    lastUpdated: Date;
    completionPercentage: number;
    currentQuestionIndex: number;
    totalQuestions: number;
  };
}

// 補助金別の質問定義
const SUBSIDY_QUESTIONS: { [key: string]: DocumentSection[] } = {
  'it-donyu': [
    {
      id: 'basic-info',
      title: '基本情報',
      completed: false,
      questions: [
        {
          id: 'company_name',
          question: '法人名を教えてください。',
          type: 'text',
          required: true,
          aiSuggestions: ['例：株式会社○○', '法人格も含めて正式名称で入力してください'],
        },
        {
          id: 'industry',
          question: '業種は何ですか？',
          type: 'select',
          options: ['製造業', '情報通信業', '卸売業', '小売業', 'サービス業', 'その他'],
          required: true,
          helpText: '主たる事業の業種を選択してください',
        },
        {
          id: 'employee_count',
          question: '従業員数は何名ですか？',
          type: 'number',
          required: true,
          helpText: '正社員のみの人数を入力してください',
        },
        {
          id: 'annual_revenue',
          question: '前年度の売上高はいくらですか？（千円単位）',
          type: 'number',
          required: true,
          aiSuggestions: ['決算書の売上高を千円単位で入力'],
        },
      ],
    },
    {
      id: 'it-needs',
      title: 'IT導入ニーズ',
      completed: false,
      questions: [
        {
          id: 'current_issues',
          question: '現在の業務課題は何ですか？',
          type: 'multiselect',
          options: [
            '業務効率が悪い',
            '情報共有ができていない',
            '顧客管理が煩雑',
            '在庫管理が困難',
            'データ分析ができない',
            'セキュリティが不安',
            'その他'
          ],
          required: true,
          helpText: '該当するものをすべて選択してください',
        },
        {
          id: 'target_process',
          question: 'どの業務プロセスを改善したいですか？',
          type: 'multiline',
          required: true,
          aiSuggestions: [
            '具体的な業務名と現在の課題を記載',
            '例：受注処理（手作業で時間がかかる）、在庫管理（リアルタイムで把握できない）'
          ],
        },
        {
          id: 'expected_effect',
          question: 'IT導入によって期待する効果は何ですか？',
          type: 'multiline',
          required: true,
          aiSuggestions: [
            '定量的な効果（時間削減、コスト削減など）',
            '定性的な効果（業務品質向上、顧客満足度向上など）'
          ],
        },
      ],
    },
    {
      id: 'it-tool-selection',
      title: 'ITツール選定',
      completed: false,
      questions: [
        {
          id: 'tool_category',
          question: '導入予定のITツールのカテゴリは？',
          type: 'select',
          options: [
            '会計・財務管理',
            '顧客管理（CRM）',
            '在庫・生産管理',
            'ECサイト構築',
            'グループウェア',
            'セキュリティ対策',
            'その他'
          ],
          required: true,
        },
        {
          id: 'tool_name',
          question: '具体的なツール名があれば教えてください',
          type: 'text',
          helpText: '未定の場合は「検討中」と入力',
        },
        {
          id: 'implementation_cost',
          question: '導入予算はいくらですか？（千円単位）',
          type: 'number',
          required: true,
          aiSuggestions: ['初期費用と年間費用を合計した金額'],
        },
        {
          id: 'implementation_period',
          question: '導入完了予定時期はいつですか？',
          type: 'date',
          required: true,
          helpText: '補助金の事業実施期間内で設定してください',
        },
      ],
    },
  ],
  'monozukuri': [
    {
      id: 'basic-info',
      title: '基本情報',
      completed: false,
      questions: [
        {
          id: 'company_name',
          question: '法人名を教えてください。',
          type: 'text',
          required: true,
        },
        {
          id: 'manufacturing_type',
          question: '製造業の種類は？',
          type: 'select',
          options: ['機械製造', '電子部品', '食品加工', '繊維', '化学', 'その他'],
          required: true,
        },
        {
          id: 'employee_count',
          question: '従業員数は何名ですか？',
          type: 'number',
          required: true,
        },
        {
          id: 'capital',
          question: '資本金はいくらですか？（千円単位）',
          type: 'number',
          required: true,
        },
      ],
    },
    {
      id: 'innovation-plan',
      title: '革新的事業計画',
      completed: false,
      questions: [
        {
          id: 'project_title',
          question: '事業計画のタイトルは？',
          type: 'text',
          required: true,
          aiSuggestions: ['革新性が伝わるタイトルを付けてください'],
        },
        {
          id: 'innovation_content',
          question: '革新的なサービスや試作品開発の内容を教えてください',
          type: 'multiline',
          required: true,
          aiSuggestions: [
            '既存技術との違い',
            '新規性・革新性のポイント',
            '技術的な優位性'
          ],
        },
        {
          id: 'market_needs',
          question: '市場ニーズや顧客の課題は何ですか？',
          type: 'multiline',
          required: true,
          helpText: '具体的な顧客の声や市場調査結果があれば記載',
        },
        {
          id: 'competitive_advantage',
          question: '競合他社と比較した優位性は？',
          type: 'multiline',
          required: true,
          aiSuggestions: [
            '技術面での優位性',
            '価格競争力',
            '品質・性能面での差別化'
          ],
        },
      ],
    },
    {
      id: 'implementation-plan',
      title: '実施計画',
      completed: false,
      questions: [
        {
          id: 'development_process',
          question: '開発プロセスを教えてください',
          type: 'multiline',
          required: true,
          helpText: '開発の各段階と期間を具体的に記載',
        },
        {
          id: 'required_equipment',
          question: '必要な設備・機器は？',
          type: 'multiline',
          required: true,
          aiSuggestions: ['設備名、メーカー、型番、価格など'],
        },
        {
          id: 'total_cost',
          question: '事業に必要な総額は？（千円単位）',
          type: 'number',
          required: true,
        },
        {
          id: 'expected_outcome',
          question: '事業成果の見込みは？',
          type: 'multiline',
          required: true,
          aiSuggestions: [
            '売上増加見込み',
            '生産性向上率',
            '新規雇用予定数'
          ],
        },
      ],
    },
  ],
  'jizokuka': [
    {
      id: 'basic-info',
      title: '基本情報',
      completed: false,
      questions: [
        {
          id: 'company_name',
          question: '事業者名を教えてください。',
          type: 'text',
          required: true,
        },
        {
          id: 'business_type',
          question: '事業形態は？',
          type: 'select',
          options: ['個人事業主', '法人（株式会社）', '法人（有限会社）', '法人（その他）'],
          required: true,
        },
        {
          id: 'employee_count',
          question: '従業員数は何名ですか？',
          type: 'number',
          required: true,
          helpText: '小規模事業者の要件：商業・サービス業5名以下、製造業20名以下',
        },
        {
          id: 'business_years',
          question: '創業から何年経過していますか？',
          type: 'number',
          required: true,
        },
      ],
    },
    {
      id: 'business-plan',
      title: '経営計画',
      completed: false,
      questions: [
        {
          id: 'current_situation',
          question: '現在の経営状況を教えてください',
          type: 'multiline',
          required: true,
          aiSuggestions: [
            '売上・利益の推移',
            '主要顧客・取引先',
            '強み・弱み'
          ],
        },
        {
          id: 'target_market',
          question: '今後狙っていきたい市場やターゲット顧客は？',
          type: 'multiline',
          required: true,
          helpText: '具体的な顧客層や地域を記載',
        },
        {
          id: 'sales_strategy',
          question: '販路開拓の方法は？',
          type: 'multiselect',
          options: [
            'ホームページ制作・改良',
            'チラシ・パンフレット作成',
            '展示会出展',
            '新商品開発',
            '店舗改装',
            'その他'
          ],
          required: true,
        },
        {
          id: 'investment_details',
          question: '具体的な取り組み内容と投資額は？',
          type: 'multiline',
          required: true,
          aiSuggestions: [
            '取り組み内容ごとに金額を記載',
            '見積書の有無も明記'
          ],
        },
      ],
    },
    {
      id: 'expected-results',
      title: '期待される成果',
      completed: false,
      questions: [
        {
          id: 'sales_increase',
          question: '売上増加の見込みは？（％）',
          type: 'number',
          required: true,
          helpText: '現在の売上を100とした場合の増加率',
        },
        {
          id: 'customer_increase',
          question: '新規顧客獲得の見込み数は？',
          type: 'number',
          required: true,
        },
        {
          id: 'employment_plan',
          question: '新規雇用の予定はありますか？',
          type: 'select',
          options: ['予定なし', '1名', '2名', '3名以上'],
          required: true,
        },
        {
          id: 'long_term_vision',
          question: '3年後のビジョンを教えてください',
          type: 'multiline',
          required: true,
          aiSuggestions: [
            '事業規模の拡大計画',
            '新事業への展開',
            '地域への貢献'
          ],
        },
      ],
    },
  ],
};

const AIDocumentAssistant: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'word' | 'excel'>('pdf');

  // 初期化
  useEffect(() => {
    initializeChat();
  }, []);

  // メッセージが更新されたらスクロール
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = () => {
    const initialMessage: Message = {
      id: '1',
      type: 'ai',
      content: 'こんにちは！IT補助金申請書の作成をお手伝いします。\n\nまず、どの補助金に申請されますか？\n\n1. IT導入補助金2025\n2. ものづくり補助金\n3. 小規模事業者持続化補助金\n\n番号または補助金名でお答えください。',
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
  };

  const getCurrentQuestion = (): DocumentQuestion | null => {
    if (!documentData || !currentQuestionId) return null;
    
    for (const section of documentData.sections) {
      const question = section.questions.find(q => q.id === currentQuestionId);
      if (question) return question;
    }
    return null;
  };

  const getNextQuestion = (): DocumentQuestion | null => {
    if (!documentData) return null;
    
    for (const section of documentData.sections) {
      for (const question of section.questions) {
        if (question.required && !question.value) {
          return question;
        }
      }
    }
    
    // 必須項目が全て完了したら、任意項目を確認
    for (const section of documentData.sections) {
      for (const question of section.questions) {
        if (!question.required && !question.value) {
          return question;
        }
      }
    }
    
    return null;
  };

  const updateQuestionValue = (questionId: string, value: any) => {
    if (!documentData) return;

    const updatedSections = documentData.sections.map(section => ({
      ...section,
      questions: section.questions.map(question => 
        question.id === questionId ? { ...question, value } : question
      ),
    }));

    // セクションの完了状態を更新
    updatedSections.forEach(section => {
      section.completed = section.questions.every(q => !q.required || q.value);
    });

    // 完了率と進捗を計算
    const allQuestions = updatedSections.flatMap(s => s.questions);
    const requiredQuestions = allQuestions.filter(q => q.required);
    const completedRequired = requiredQuestions.filter(q => q.value).length;
    const completionPercentage = Math.round((completedRequired / requiredQuestions.length) * 100);
    
    const currentIndex = allQuestions.findIndex(q => q.id === currentQuestionId) + 1;

    setDocumentData({
      ...documentData,
      sections: updatedSections,
      metadata: {
        ...documentData.metadata,
        lastUpdated: new Date(),
        completionPercentage,
        currentQuestionIndex: currentIndex,
        totalQuestions: allQuestions.length,
      },
    });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // AIの応答を処理
    setTimeout(() => {
      processAIResponse(userMessage.content);
    }, 1000);
  };

  const processAIResponse = (userInput: string) => {
    let aiResponse: Message;

    // 補助金選択の処理
    if (!documentData) {
      let subsidyType = '';
      let subsidyName = '';
      
      if (userInput.includes('1') || userInput.toLowerCase().includes('it導入')) {
        subsidyType = 'it-donyu';
        subsidyName = 'IT導入補助金2025';
      } else if (userInput.includes('2') || userInput.includes('ものづくり')) {
        subsidyType = 'monozukuri';
        subsidyName = 'ものづくり補助金';
      } else if (userInput.includes('3') || userInput.includes('持続化')) {
        subsidyType = 'jizokuka';
        subsidyName = '小規模事業者持続化補助金';
      }
      
      if (subsidyType) {
        initializeDocument(subsidyType, subsidyName);
        const firstQuestion = SUBSIDY_QUESTIONS[subsidyType][0].questions[0];
        setCurrentQuestionId(firstQuestion.id);
        
        aiResponse = {
          id: Date.now().toString(),
          type: 'ai',
          content: `${subsidyName}を選択されました。\n\nそれでは、申請書の作成を始めましょう。\n\n${firstQuestion.question}`,
          timestamp: new Date(),
          metadata: { 
            field: firstQuestion.id,
            suggestions: firstQuestion.aiSuggestions,
          },
        };
      } else {
        aiResponse = {
          id: Date.now().toString(),
          type: 'ai',
          content: '申し訳ございません。1〜3の番号でお選びください。',
          timestamp: new Date(),
        };
      }
    } else if (currentQuestionId) {
      // 現在の質問への回答を保存
      const currentQuestion = getCurrentQuestion();
      if (currentQuestion) {
        // 複数選択の場合の処理
        if (currentQuestion.type === 'multiselect') {
          const selectedOptions = userInput.split(/[、,]/).map(s => s.trim());
          updateQuestionValue(currentQuestionId, selectedOptions);
        } else {
          updateQuestionValue(currentQuestionId, userInput);
        }
      }
      
      // 次の質問を取得
      const nextQuestion = getNextQuestion();
      if (nextQuestion) {
        setCurrentQuestionId(nextQuestion.id);
        
        let questionText = nextQuestion.question;
        
        // オプションがある場合は選択肢を表示
        if (nextQuestion.options) {
          questionText += '\n\n選択肢：\n';
          nextQuestion.options.forEach((option, index) => {
            questionText += `${index + 1}. ${option}\n`;
          });
        }
        
        // ヘルプテキストがある場合は追加
        if (nextQuestion.helpText) {
          questionText += `\n💡 ${nextQuestion.helpText}`;
        }
        
        aiResponse = {
          id: Date.now().toString(),
          type: 'ai',
          content: questionText,
          timestamp: new Date(),
          metadata: { 
            field: nextQuestion.id,
            suggestions: nextQuestion.aiSuggestions,
          },
        };
      } else {
        // すべての質問が完了
        aiResponse = {
          id: Date.now().toString(),
          type: 'ai',
          content: '素晴らしい！すべての必須項目の入力が完了しました。\n\n申請書の内容を右側のプレビューでご確認ください。\n\n次のアクションをお選びください：\n\n1. 内容を修正する\n2. PDFでエクスポート\n3. Wordでエクスポート\n4. Excelでエクスポート',
          timestamp: new Date(),
        };
        setCurrentQuestionId(null);
      }
    } else {
      // エクスポートや修正の処理
      if (userInput.includes('修正')) {
        aiResponse = {
          id: Date.now().toString(),
          type: 'ai',
          content: '修正したい項目名を教えてください。または、プレビューで項目の「編集」ボタンをクリックしてください。',
          timestamp: new Date(),
        };
      } else if (userInput.includes('PDF') || userInput.includes('2')) {
        handleExport('pdf');
        return;
      } else if (userInput.includes('Word') || userInput.includes('3')) {
        handleExport('word');
        return;
      } else if (userInput.includes('Excel') || userInput.includes('4')) {
        handleExport('excel');
        return;
      } else {
        aiResponse = {
          id: Date.now().toString(),
          type: 'ai',
          content: 'どのようなお手伝いが必要でしょうか？\n\n・内容を修正する場合は「修正」\n・エクスポートする場合は形式（PDF/Word/Excel）をお知らせください',
          timestamp: new Date(),
        };
      }
    }

    setMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);
  };

  const initializeDocument = (subsidyType: string, subsidyName: string) => {
    const sections = SUBSIDY_QUESTIONS[subsidyType];
    const allQuestions = sections.flatMap(s => s.questions);
    
    setDocumentData({
      subsidyType,
      subsidyName,
      sections: JSON.parse(JSON.stringify(sections)), // Deep copy
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date(),
        completionPercentage: 0,
        currentQuestionIndex: 0,
        totalQuestions: allQuestions.length,
      },
    });
  };

  const handleExport = async (format: 'pdf' | 'word' | 'excel') => {
    try {
      if (!documentData) return;

      setIsTyping(true);
      
      // エクスポートデータの準備
      const exportData = {
        subsidyType: documentData.subsidyType,
        subsidyName: documentData.subsidyName,
        sections: documentData.sections,
        metadata: {
          exportDate: new Date().toLocaleDateString('ja-JP'),
          completionPercentage: documentData.metadata.completionPercentage,
        },
      };

      // 形式に応じてエクスポート処理
      if (format === 'pdf') {
        // PDF生成（実際の実装では適切なライブラリを使用）
        console.log('Generating PDF...', exportData);
      } else if (format === 'word') {
        // Word文書生成
        const content = generateWordDocument(exportData);
        downloadFile(content, `${documentData.subsidyName}_申請書.doc`, 'application/msword');
      } else if (format === 'excel') {
        // Excel生成（実際の実装では適切なライブラリを使用）
        console.log('Generating Excel...', exportData);
      }
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `${format.toUpperCase()}形式でのエクスポートが完了しました。ダウンロードが開始されます。`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'エクスポート中にエラーが発生しました。もう一度お試しください。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateWordDocument = (data: any) => {
    const { subsidyName, sections, metadata } = data;
    
    let content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${subsidyName} 申請書</title>
        <style>
          body { font-family: 'MS Gothic', sans-serif; line-height: 1.6; }
          h1 { text-align: center; color: #2563eb; margin-bottom: 30px; }
          h2 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
          .section { margin-bottom: 30px; }
          .question { margin-bottom: 20px; }
          .label { font-weight: bold; color: #374151; }
          .answer { margin-left: 20px; padding: 10px; background-color: #f9fafb; }
          .metadata { text-align: right; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="metadata">作成日: ${metadata.exportDate}</div>
        <h1>${subsidyName} 申請書</h1>
    `;

    sections.forEach((section: DocumentSection) => {
      content += `<div class="section"><h2>${section.title}</h2>`;
      section.questions.forEach(question => {
        if (question.value) {
          content += `
            <div class="question">
              <div class="label">${question.question}</div>
              <div class="answer">${Array.isArray(question.value) ? question.value.join('、') : question.value}</div>
            </div>
          `;
        }
      });
      content += '</div>';
    });

    content += '</body></html>';
    return content;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEditField = (questionId: string) => {
    setEditingField(questionId);
    const question = documentData?.sections
      .flatMap(s => s.questions)
      .find(q => q.id === questionId);
    
    if (question) {
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `「${question.question}」を修正します。\n\n現在の値: ${question.value || '未入力'}\n\n新しい値を入力してください。`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setCurrentQuestionId(questionId);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', backgroundColor: '#f9fafb' }}>
      {/* チャットパネル */}
      <div style={{ 
        flex: showPreview ? '0 0 50%' : '1', 
        display: 'flex', 
        flexDirection: 'column',
        borderRight: showPreview ? '1px solid #e5e7eb' : 'none',
        transition: 'flex 0.3s ease'
      }}>
        {/* チャットヘッダー */}
        <div style={{ 
          padding: '20px', 
          backgroundColor: 'white', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px'
            }}>
              🤖
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>AI書類作成アシスタント</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                {documentData ? `${documentData.subsidyName} 申請書作成中` : 'オンライン'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {showPreview ? '📄 プレビューを隠す' : '📄 プレビューを表示'}
          </button>
        </div>

        {/* 進捗インジケーター */}
        {documentData && (
          <div style={{ padding: '16px 20px', backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                質問 {documentData.metadata.currentQuestionIndex} / {documentData.metadata.totalQuestions}
              </span>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                完了率: {documentData.metadata.completionPercentage}%
              </span>
            </div>
            <div style={{
              backgroundColor: '#e5e7eb',
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: '#2563eb',
                height: '100%',
                width: `${documentData.metadata.completionPercentage}%`,
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        )}

        {/* AI提案表示エリア */}
        {messages.length > 0 && messages[messages.length - 1].metadata?.suggestions && (
          <div style={{ 
            padding: '12px 20px', 
            backgroundColor: '#eff6ff',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: '500', marginBottom: '8px' }}>
              💡 AIからの提案
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#3730a3' }}>
              {messages[messages.length - 1].metadata.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* メッセージエリア */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              {message.type === 'ai' && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px',
                  flexShrink: 0
                }}>
                  🤖
                </div>
              )}
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: message.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: message.type === 'user' ? '#2563eb' : 'white',
                  color: message.type === 'user' ? 'white' : '#111827',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {message.content}
              </div>
              {message.type === 'user' && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0
                }}>
                  👤
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px'
              }}>
                🤖
              </div>
              <div style={{
                padding: '12px 16px',
                backgroundColor: 'white',
                borderRadius: '18px 18px 18px 4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span className="typing-dot"></span>
                  <span className="typing-dot" style={{ animationDelay: '0.2s' }}></span>
                  <span className="typing-dot" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div style={{ 
          padding: '20px', 
          backgroundColor: 'white', 
          borderTop: '1px solid #e5e7eb' 
        }}>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }} style={{ display: 'flex', gap: '12px' }}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="メッセージを入力..."
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '24px',
                border: '1px solid #e5e7eb',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              style={{
                padding: '12px 24px',
                borderRadius: '24px',
                border: 'none',
                backgroundColor: inputValue.trim() && !isTyping ? '#2563eb' : '#e5e7eb',
                color: inputValue.trim() && !isTyping ? 'white' : '#9ca3af',
                cursor: inputValue.trim() && !isTyping ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              送信
            </button>
          </form>
        </div>
      </div>

      {/* プレビューパネル */}
      {showPreview && (
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '20px',
          backgroundColor: '#f9fafb'
        }}>
          {documentData ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                marginBottom: '32px',
                textAlign: 'center',
                color: '#111827'
              }}>
                {documentData.subsidyName} 申請書
              </h2>

              <div style={{ 
                marginBottom: '24px', 
                padding: '16px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  作成日: {documentData.metadata.createdAt.toLocaleDateString('ja-JP')}
                </span>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  最終更新: {documentData.metadata.lastUpdated.toLocaleTimeString('ja-JP')}
                </span>
              </div>

              {documentData.sections.map((section) => (
                <div key={section.id} style={{ marginBottom: '32px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      margin: 0,
                      color: '#1f2937'
                    }}>
                      {section.title}
                    </h3>
                    {section.completed && (
                      <span style={{
                        fontSize: '14px',
                        color: '#10b981',
                        backgroundColor: '#d1fae5',
                        padding: '4px 12px',
                        borderRadius: '12px'
                      }}>
                        ✓ 完了
                      </span>
                    )}
                  </div>
                  
                  <div style={{ 
                    borderLeft: '3px solid #e5e7eb',
                    paddingLeft: '20px'
                  }}>
                    {section.questions.map((question) => (
                      <div key={question.id} style={{ 
                        marginBottom: '20px',
                        padding: '16px',
                        backgroundColor: question.value ? '#f9fafb' : '#fef2f2',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '8px'
                        }}>
                          <label style={{ 
                            fontWeight: '500',
                            color: '#374151',
                            fontSize: '15px'
                          }}>
                            {question.question}
                            {question.required && <span style={{ color: '#ef4444' }}> *</span>}
                          </label>
                          <button
                            onClick={() => handleEditField(question.id)}
                            style={{
                              padding: '4px 12px',
                              fontSize: '13px',
                              color: '#2563eb',
                              backgroundColor: 'transparent',
                              border: '1px solid #2563eb',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#2563eb';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#2563eb';
                            }}
                          >
                            編集
                          </button>
                        </div>
                        <div style={{
                          fontSize: '15px',
                          color: question.value ? '#111827' : '#9ca3af',
                          lineHeight: '1.6'
                        }}>
                          {question.value ? (
                            Array.isArray(question.value) ? question.value.join('、') : question.value
                          ) : (
                            '未入力'
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* エクスポートボタン */}
              {documentData.metadata.completionPercentage === 100 && (
                <div style={{ 
                  marginTop: '40px',
                  padding: '24px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <h4 style={{ marginBottom: '16px', color: '#1f2937' }}>
                    申請書の作成が完了しました
                  </h4>
                  <div style={{ 
                    display: 'flex',
                    gap: '16px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => handleExport('pdf')}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      📄 PDF
                    </button>
                    <button
                      onClick={() => handleExport('word')}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      📝 Word
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      📊 Excel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
              <p style={{ fontSize: '18px' }}>
                補助金を選択して申請書の作成を開始してください
              </p>
            </div>
          )}
        </div>
      )}

      {/* アニメーション用のスタイル */}
      <style>{`
        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #6b7280;
          animation: bounce 1.4s infinite ease-in-out;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default AIDocumentAssistant;