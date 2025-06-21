import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  category: 'preparation' | 'input' | 'review' | 'submit';
}

interface Deadline {
  id: string;
  title: string;
  date: Date;
  type: 'application' | 'document' | 'payment';
  status: 'upcoming' | 'warning' | 'overdue';
}

interface ProgressDashboardProps {
  subsidyType: string;
  subsidyName: string;
  projectData: any;
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ subsidyType, subsidyName, projectData }) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [completionRate, setCompletionRate] = useState(0);

  // タスクの初期化
  useEffect(() => {
    const initialTasks: Task[] = [
      // 準備段階
      {
        id: 'prep-1',
        title: '事業計画の作成',
        description: '補助金申請に必要な事業計画を詳細に記載',
        completed: !!projectData?.businessDescription,
        required: true,
        category: 'preparation'
      },
      {
        id: 'prep-2',
        title: '必要書類の準備',
        description: '決算書、登記簿謄本などの必要書類を準備',
        completed: false,
        required: true,
        category: 'preparation'
      },
      {
        id: 'prep-3',
        title: '見積書の取得',
        description: '導入予定のITツール・サービスの見積書を取得',
        completed: false,
        required: true,
        category: 'preparation'
      },
      
      // 入力段階
      {
        id: 'input-1',
        title: '基本情報の入力',
        description: '企業情報、連絡先などの基本情報を入力',
        completed: !!projectData?.companyName,
        required: true,
        category: 'input'
      },
      {
        id: 'input-2',
        title: '事業計画の詳細入力',
        description: '具体的な事業計画と期待効果を記載',
        completed: !!projectData?.projectPlan,
        required: true,
        category: 'input'
      },
      {
        id: 'input-3',
        title: '予算計画の入力',
        description: '補助金申請額と自己負担額の計画を入力',
        completed: !!projectData?.implementation_cost || !!projectData?.total_project_cost,
        required: true,
        category: 'input'
      },
      
      // レビュー段階
      {
        id: 'review-1',
        title: '入力内容の確認',
        description: 'すべての入力内容に誤りがないか確認',
        completed: false,
        required: true,
        category: 'review'
      },
      {
        id: 'review-2',
        title: '添付書類の確認',
        description: '必要な添付書類がすべて揃っているか確認',
        completed: false,
        required: true,
        category: 'review'
      },
      
      // 提出段階
      {
        id: 'submit-1',
        title: '申請書の最終確認',
        description: '申請書全体の最終チェック',
        completed: false,
        required: true,
        category: 'submit'
      },
      {
        id: 'submit-2',
        title: '電子申請システムへの登録',
        description: '公式の電子申請システムに申請書を提出',
        completed: false,
        required: true,
        category: 'submit'
      }
    ];

    setTasks(initialTasks);
  }, [projectData]);

  // 期限の設定
  useEffect(() => {
    const today = new Date();
    const applicationDeadline = new Date(today);
    applicationDeadline.setMonth(applicationDeadline.getMonth() + 2); // 2ヶ月後

    const documentDeadline = new Date(today);
    documentDeadline.setMonth(documentDeadline.getMonth() + 1); // 1ヶ月後

    const initialDeadlines: Deadline[] = [
      {
        id: 'deadline-1',
        title: '申請書提出期限',
        date: applicationDeadline,
        type: 'application',
        status: 'upcoming'
      },
      {
        id: 'deadline-2',
        title: '必要書類準備期限',
        date: documentDeadline,
        type: 'document',
        status: documentDeadline.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000 ? 'warning' : 'upcoming'
      }
    ];

    setDeadlines(initialDeadlines);
  }, []);

  // 完了率の計算
  useEffect(() => {
    const requiredTasks = tasks.filter(task => task.required);
    const completedRequiredTasks = requiredTasks.filter(task => task.completed);
    const rate = requiredTasks.length > 0 
      ? Math.round((completedRequiredTasks.length / requiredTasks.length) * 100)
      : 0;
    setCompletionRate(rate);
  }, [tasks]);

  const handleTaskToggle = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const getCategoryLabel = (category: Task['category']) => {
    const labels = {
      preparation: '準備段階',
      input: '入力段階',
      review: 'レビュー段階',
      submit: '提出段階'
    };
    return labels[category];
  };

  const getCategoryProgress = (category: Task['category']) => {
    const categoryTasks = tasks.filter(task => task.category === category && task.required);
    const completedTasks = categoryTasks.filter(task => task.completed);
    return categoryTasks.length > 0 
      ? Math.round((completedTasks.length / categoryTasks.length) * 100)
      : 0;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    const diff = date.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <h2 style={{ fontSize: '32px', marginBottom: '32px' }}>申請進捗ダッシュボード</h2>
      
      {/* 全体進捗 */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>{subsidyName} - 全体進捗</h3>
        
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: '500' }}>完了率</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>{completionRate}%</span>
          </div>
          <div style={{ backgroundColor: '#e5e7eb', height: '20px', borderRadius: '10px', overflow: 'hidden' }}>
            <div
              style={{
                backgroundColor: '#2563eb',
                height: '100%',
                width: `${completionRate}%`,
                transition: 'width 0.3s',
                borderRadius: '10px'
              }}
            />
          </div>
        </div>

        {/* カテゴリ別進捗 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {(['preparation', 'input', 'review', 'submit'] as const).map(category => {
            const progress = getCategoryProgress(category);
            return (
              <div key={category} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  {getCategoryLabel(category)}
                </div>
                <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
                  <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                      style={{ transition: 'stroke-dashoffset 0.3s' }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>
                    {progress}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 期限情報 */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>重要な期限</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {deadlines.map(deadline => {
            const daysUntil = getDaysUntil(deadline.date);
            const isWarning = daysUntil <= 7;
            const isOverdue = daysUntil < 0;
            
            return (
              <div
                key={deadline.id}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: isOverdue ? '#fee2e2' : isWarning ? '#fef3c7' : '#f3f4f6',
                  border: `2px solid ${isOverdue ? '#dc2626' : isWarning ? '#f59e0b' : 'transparent'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>{deadline.title}</h4>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>
                      {formatDate(deadline.date)}
                    </p>
                  </div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: isOverdue ? '#dc2626' : isWarning ? '#f59e0b' : '#059669'
                  }}>
                    {isOverdue ? '期限超過' : `残り${daysUntil}日`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* タスクリスト */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>タスクリスト</h3>
        
        {(['preparation', 'input', 'review', 'submit'] as const).map(category => {
          const categoryTasks = tasks.filter(task => task.category === category);
          
          return (
            <div key={category} style={{ marginBottom: '24px' }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '12px',
                padding: '8px',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px'
              }}>
                {getCategoryLabel(category)}
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categoryTasks.map(task => (
                  <div
                    key={task.id}
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      backgroundColor: task.completed ? '#f0fdf4' : '#fafafa',
                      border: '1px solid',
                      borderColor: task.completed ? '#86efac' : '#e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handleTaskToggle(task.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => {}}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          marginTop: '2px'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <h5 style={{
                          fontSize: '16px',
                          marginBottom: '4px',
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? '#6b7280' : '#111827'
                        }}>
                          {task.title}
                          {task.required && (
                            <span style={{ color: '#dc2626', marginLeft: '8px' }}>*</span>
                          )}
                        </h5>
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          textDecoration: task.completed ? 'line-through' : 'none'
                        }}>
                          {task.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* アクションボタン */}
      <div style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/input-form')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          申請書の編集に戻る
        </button>
        <button
          onClick={() => navigate('/document-output')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          申請書を確認する
        </button>
      </div>
    </div>
  );
};

export default ProgressDashboard;