import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SubsidyMatch } from '../../types/subsidy';

interface SubsidyComparisonProps {
  subsidies: SubsidyMatch[];
  onClose: () => void;
}

const SubsidyComparison: React.FC<SubsidyComparisonProps> = ({ subsidies, onClose }) => {
  const comparisonItems = [
    { label: '最大補助額', key: 'maxAmount' },
    { label: '補助率', key: 'subsidyRate' },
    { label: '申請期間', key: 'applicationPeriod' },
    { label: '対象事業者', key: 'targetBusiness' },
    { label: 'マッチ度', key: 'matchScore' },
  ];

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { scale: 0.8, opacity: 0 }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="subsidy-comparison-overlay"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      >
        <motion.div
          className="subsidy-comparison-modal"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="comparison-header">
            <h2 className="comparison-title">補助金比較</h2>
            <button className="comparison-close" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="comparison-content">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>比較項目</th>
                  {subsidies.map(subsidy => (
                    <th key={subsidy.id} style={{ color: subsidy.color }}>
                      {subsidy.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonItems.map(item => (
                  <tr key={item.key}>
                    <td style={{ fontWeight: 'var(--font-weight-medium)' }}>
                      {item.label}
                    </td>
                    {subsidies.map(subsidy => (
                      <td key={subsidy.id}>
                        {item.key === 'matchScore' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                            <div style={{
                              width: '100%',
                              height: '8px',
                              backgroundColor: 'var(--color-gray-200)',
                              borderRadius: 'var(--radius-full)',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${subsidy.matchScore}%`,
                                height: '100%',
                                backgroundColor: subsidy.color,
                                transition: 'width 0.5s ease-out'
                              }} />
                            </div>
                            <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                              {subsidy.matchScore}%
                            </span>
                          </div>
                        ) : item.key === 'targetBusiness' ? (
                          subsidy.targetBusiness.join('、')
                        ) : (
                          subsidy[item.key as keyof SubsidyMatch]
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                
                <tr>
                  <td style={{ fontWeight: 'var(--font-weight-medium)' }}>
                    主な支援内容
                  </td>
                  {subsidies.map(subsidy => (
                    <td key={subsidy.id}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {subsidy.features.map((feature, index) => (
                          <li key={index} style={{ 
                            display: 'flex', 
                            alignItems: 'start', 
                            gap: 'var(--spacing-xs)',
                            marginBottom: 'var(--spacing-xs)'
                          }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ 
                              color: subsidy.color,
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span style={{ fontSize: 'var(--font-size-sm)' }}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: 'var(--spacing-xl)', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-lg)' }}>
                各補助金の詳細情報は、「この補助金で申請を進める」ボタンから確認できます
              </p>
              <button
                className="btn btn-primary btn-md"
                onClick={onClose}
              >
                閉じる
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubsidyComparison;