import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface FormData {
  [key: string]: any;
}

const AIConversationalForm: React.FC<{
  onComplete: (data: FormData) => void;
  subsidyType: string;
}> = ({ onComplete, subsidyType }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [formData, setFormData] = useState<FormData>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const questions = [
    { id: 'businessType', prompt: 'こんにちは！補助金申請をサポートします。まず、あなたの事業はどのような業種ですか？' },
    { id: 'employeeCount', prompt: '従業員数を教えてください。' },
    { id: 'annualRevenue', prompt: '年間売上高はどのくらいですか？' },
    { id: 'challenges', prompt: '現在の事業課題は何ですか？' },
    { id: 'projectPlan', prompt: '補助金を活用してどのような事業を計画していますか？' }
  ];

  useEffect(() => {
    // 初回メッセージ
    if (messages.length === 0) {
      addAIMessage(questions[0].prompt);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addAIMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // ユーザーメッセージ追加
    addUserMessage(inputValue);
    const userInput = inputValue;
    setInputValue('');

    // フォームデータ更新
    const questionId = questions[currentQuestion].id;
    setFormData(prev => ({ ...prev, [questionId]: userInput }));

    // AI応答のシミュレーション
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsTyping(false);

    if (currentQuestion < questions.length - 1) {
      // 次の質問へ
      setCurrentQuestion(prev => prev + 1);
      
      // AI予測による自動入力提案
      const suggestion = generateAISuggestion(currentQuestion + 1, formData);
      if (suggestion) {
        addAIMessage(`${questions[currentQuestion + 1].prompt}\n\n💡 予測入力: ${suggestion}`);
      } else {
        addAIMessage(questions[currentQuestion + 1].prompt);
      }
    } else {
      // 完了メッセージ
      addAIMessage('ありがとうございました！入力内容を確認して申請書を作成します。');
      setTimeout(() => {
        onComplete(formData);
      }, 2000);
    }
  };

  const generateAISuggestion = (questionIndex: number, currentData: FormData): string | null => {
    // AI予測ロジックのシミュレーション
    const suggestions: { [key: string]: string } = {
      projectPlan: currentData.businessType === '製造業' 
        ? '製造プロセスのデジタル化により、生産効率を30%向上させる計画です。'
        : currentData.businessType === 'サービス業'
        ? '顧客管理システムの導入により、サービス品質と顧客満足度を向上させます。'
        : null
    };

    return suggestions[questions[questionIndex]?.id] || null;
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      transition: 'all 0.3s ease'
    }}>
      {/* ヘッダー */}
      <div style={{
        padding: '20px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          backgroundColor: 'var(--accent-color)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px'
        }}>
          🤖
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            AI補助金アシスタント
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            質問に答えるだけで申請書が完成します
          </p>
        </div>
      </div>

      {/* チャットエリア */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '16px',
                backgroundColor: message.type === 'user' 
                  ? 'var(--accent-color)'
                  : 'var(--bg-secondary)',
                color: message.type === 'user' 
                  ? 'white'
                  : 'var(--text-primary)',
                boxShadow: 'var(--shadow)',
                wordWrap: 'break-word'
              }}>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
                <span style={{
                  fontSize: '12px',
                  opacity: 0.7,
                  marginTop: '4px',
                  display: 'block'
                }}>
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '16px',
              width: 'fit-content'
            }}
          >
            <div style={{ display: 'flex', gap: '4px' }}>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: 'var(--text-secondary)',
                  borderRadius: '50%'
                }}
              />
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: 'var(--text-secondary)',
                  borderRadius: '50%'
                }}
              />
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: 'var(--text-secondary)',
                  borderRadius: '50%'
                }}
              />
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <form onSubmit={handleSubmit} style={{
        padding: '20px',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        gap: '12px'
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="メッセージを入力..."
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '24px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: '16px',
            outline: 'none',
            transition: 'all 0.3s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent-color)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-color)';
          }}
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          style={{
            padding: '12px 24px',
            borderRadius: '24px',
            border: 'none',
            backgroundColor: inputValue.trim() ? 'var(--accent-color)' : 'var(--text-muted)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          送信
          <span style={{ fontSize: '20px' }}>→</span>
        </button>
      </form>

      {/* プログレスバー */}
      <div style={{
        height: '4px',
        backgroundColor: 'var(--bg-tertiary)',
        position: 'relative'
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(currentQuestion / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{
            height: '100%',
            backgroundColor: 'var(--success-color)',
            position: 'absolute',
            left: 0,
            top: 0
          }}
        />
      </div>
    </div>
  );
};

export default AIConversationalForm;