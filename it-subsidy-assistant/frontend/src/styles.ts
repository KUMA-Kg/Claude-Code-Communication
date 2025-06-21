// 統一されたスタイル定義
export const styles = {
  // コンテナ
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  
  // ボタンスタイル
  button: {
    primary: {
      backgroundColor: '#2563eb',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    },
    secondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '500',
      border: '1px solid #e5e7eb',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    },
  },
  
  // カードスタイル
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  
  // 選択可能なカード
  selectableCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '2px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  selectableCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  
  // プログレスバー
  progressBar: {
    container: {
      backgroundColor: '#e5e7eb',
      height: '8px',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '24px',
    },
    fill: {
      backgroundColor: '#2563eb',
      height: '100%',
      transition: 'width 0.3s ease',
    },
  },
  
  // ヘッダー
  header: {
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
  },
  
  // グリッド
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  
  // フレックス
  flex: {
    center: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    between: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    start: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    },
  },
  
  // テキスト
  text: {
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      marginBottom: '16px',
      color: '#111827',
    },
    subtitle: {
      fontSize: '20px',
      color: '#6b7280',
      marginBottom: '32px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px',
    },
  },
};