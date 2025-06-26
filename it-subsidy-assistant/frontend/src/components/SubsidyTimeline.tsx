import React from 'react';
import { Clock, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SubsidySchedule, Milestone } from '../data/subsidy-schedules';
import '../styles/timeline.css';

interface SubsidyTimelineProps {
  schedule: SubsidySchedule;
  completedMilestones: Set<string>;
}

const SubsidyTimeline: React.FC<SubsidyTimelineProps> = ({ schedule, completedMilestones }) => {
  const today = new Date();
  const deadline = new Date(schedule.deadline);
  const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // 締切までの日数に応じた色とメッセージ
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

  const deadlineStatus = getDeadlineStatus();

  // マイルストーンの現在の状態を判定
  const getMilestoneStatus = (milestone: Milestone): 'completed' | 'current' | 'upcoming' => {
    if (completedMilestones.has(milestone.id)) {
      return 'completed';
    }
    const daysUntilMilestone = daysUntilDeadline - milestone.daysBeforeDeadline;
    if (daysUntilMilestone <= 0) {
      return 'current';
    }
    return 'upcoming';
  };

  return (
    <div className="subsidy-timeline">
      {/* 締切カウントダウン */}
      <div className="deadline-countdown" style={{ borderColor: deadlineStatus.color }}>
        <div className="countdown-header">
          <Calendar className="w-6 h-6" style={{ color: deadlineStatus.color }} />
          <h3>申請締切まで</h3>
        </div>
        <div className="countdown-content">
          <div className="countdown-days" style={{ color: deadlineStatus.color }}>
            <span className="days-number">{Math.abs(daysUntilDeadline)}</span>
            <span className="days-unit">日</span>
          </div>
          <div className="deadline-info">
            <p className="deadline-date">締切日: {deadline.toLocaleDateString('ja-JP')}</p>
            <p className="deadline-message" style={{ color: deadlineStatus.color }}>
              <span className="status-icon">{deadlineStatus.icon}</span>
              {deadlineStatus.message}
            </p>
          </div>
        </div>
      </div>

      {/* タイムライン */}
      <div className="timeline-container">
        <h3 className="timeline-title">
          <Clock className="w-5 h-5" />
          申請までのスケジュール
        </h3>
        
        <div className="timeline">
          {schedule.milestones.map((milestone, index) => {
            const status = getMilestoneStatus(milestone);
            const daysFromNow = milestone.daysBeforeDeadline - daysUntilDeadline;
            
            return (
              <div key={milestone.id} className={`timeline-item ${status}`}>
                <div className="timeline-connector">
                  {index < schedule.milestones.length - 1 && <div className="connector-line" />}
                </div>
                
                <div className="timeline-marker">
                  <div className="marker-icon">
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span>{milestone.icon}</span>
                    )}
                  </div>
                </div>
                
                <div className="timeline-content">
                  <h4 className="milestone-title">{milestone.title}</h4>
                  <p className="milestone-description">{milestone.description}</p>
                  <div className="milestone-timing">
                    {status === 'completed' ? (
                      <span className="timing-completed">✅ 完了済み</span>
                    ) : daysFromNow > 0 ? (
                      <span className="timing-future">あと{daysFromNow}日後</span>
                    ) : daysFromNow === 0 ? (
                      <span className="timing-today">🎯 今日実施</span>
                    ) : (
                      <span className="timing-overdue">
                        <AlertCircle className="w-4 h-4" />
                        {Math.abs(daysFromNow)}日超過
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubsidyTimeline;