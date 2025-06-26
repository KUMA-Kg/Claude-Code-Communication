import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import * as ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';

const JizokukaCompletionPage: React.FC = () => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);
  const [companyData, setCompanyData] = useState<any>({});
  const [subsidyData, setSubsidyData] = useState<any>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editableTexts, setEditableTexts] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // セッションストレージから申請データを取得
    const storedCompanyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');
    const storedQuestionnaireData = JSON.parse(sessionStorage.getItem('questionnaireAnswers') || '{}');
    
    // デモ用のデータ（セッションストレージが空の場合）
    const demoCompanyData = {
      companyName: '株式会社サンプル商店',
      representativeName: '山田太郎',
      contactEmail: 'sample@example.com',
      contactPhone: '03-1234-5678',
      businessDescription: '地域密着型の小売業を営んでおります。'
    };
    
    const demoSubsidyData = {
      employeeCount: '1-5',
      annualRevenue: '10m-50m',
      businessType: 'retail',
      currentChallenges: 'sales'
    };
    
    setCompanyData(Object.keys(storedCompanyData).length > 0 ? storedCompanyData : demoCompanyData);
    setSubsidyData(Object.keys(storedQuestionnaireData).length > 0 ? storedQuestionnaireData : demoSubsidyData);

    // 編集可能なテキストの初期化
    setEditableTexts({
      businessPlan: storedCompanyData.businessDescription || 
        `小規模事業者持続化補助金を活用した販路開拓事業として、当社の強みを活かした新たな市場展開を図ります。
        
【事業概要】
既存の事業基盤を活用しながら、デジタルマーケティングの導入により新規顧客の獲得を目指します。特に地域密着型のサービス提供を強化し、顧客満足度の向上と売上拡大を実現します。

【実施計画】
1. ウェブサイトのリニューアルとSEO対策
2. SNSマーケティングの強化
3. 顧客管理システムの導入
4. 販促ツールの制作・配布

【期待効果】
- 新規顧客獲得：月間20件増加
- 売上向上：年間30%増加
- 地域認知度の向上
- 業務効率化による生産性向上`,
      
      projectGoals: `【プロジェクトの目標】
本事業により以下の目標達成を目指します：

1. 売上目標：現在の年間売上から30%の向上
2. 顧客獲得：新規顧客月間20件の獲得
3. 地域貢献：地域経済活性化への貢献
4. 雇用創出：事業拡大に伴う新規雇用の創出

【具体的な成果指標】
- ウェブサイト訪問者数：月間1,000人増加
- SNSフォロワー数：500人増加
- 顧客満足度：85%以上維持
- リピート率：70%以上達成`,

      expectedResults: `【期待される効果・成果】

■ 短期的効果（6ヶ月以内）
- ウェブサイトからの問い合わせ数 50%増加
- SNS経由での新規顧客獲得 月間10件
- 業務効率化による作業時間 20%短縮

■ 中長期的効果（1年後）
- 年間売上高 30%向上
- 新規顧客獲得 年間240件
- 地域での認知度向上とブランド力強化
- 従業員のスキルアップと働きがい向上

■ 地域貢献効果
- 地域企業との連携強化
- 地域経済の活性化への貢献
- 雇用機会の創出`
    });

    // 3秒後に紙吹雪を停止
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const generateApplicationNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `JIZO-${year}${month}${day}-${random}`;
  };

  const applicationNumber = generateApplicationNumber();

  // 編集機能のためのヘルパー関数
  const handleFieldEdit = (fieldKey: string, newValue: string, isSubsidyData: boolean = false) => {
    if (isSubsidyData) {
      const updatedSubsidyData = { ...subsidyData, [fieldKey]: newValue };
      setSubsidyData(updatedSubsidyData);
      sessionStorage.setItem('questionnaireAnswers', JSON.stringify(updatedSubsidyData));
    } else {
      const updatedCompanyData = { ...companyData, [fieldKey]: newValue };
      setCompanyData(updatedCompanyData);
      sessionStorage.setItem('companyData', JSON.stringify(updatedCompanyData));
    }
    setEditingField(null);
  };

  const getDisplayValue = (key: string, value: any, isSubsidyData: boolean = false): string => {
    if (!value) return '未入力';
    
    // 補助金データの選択値を日本語に変換
    if (isSubsidyData) {
      switch (key) {
        case 'businessType':
          const businessTypes: { [key: string]: string } = {
            'manufacturing': '製造業',
            'retail': '小売業',
            'service': 'サービス業',
            'it': 'IT関連',
            'other': 'その他'
          };
          return businessTypes[value] || value;
        case 'employeeCount':
          return value;
        case 'budgetRange':
          const budgetRanges: { [key: string]: string } = {
            'under-500k': '50万円未満',
            '500k-1m': '50万〜100万円',
            '1m-3m': '100万〜300万円',
            '3m-5m': '300万〜500万円',
            'over-5m': '500万円以上'
          };
          return budgetRanges[value] || value;
        case 'currentChallenges':
          const challenges: { [key: string]: string } = {
            'efficiency': '業務効率化',
            'sales': '売上拡大',
            'cost': 'コスト削減',
            'innovation': '新商品・サービス開発',
            'hr': '人材育成・確保'
          };
          return challenges[value] || value;
      }
    }
    
    return value;
  };

  // 文章編集コンポーネント
  const EditableTextArea: React.FC<{
    id: string;
    title: string;
    value: string;
    placeholder?: string;
  }> = ({ id, title, value, placeholder }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    const handleSave = () => {
      setEditableTexts(prev => ({
        ...prev,
        [id]: tempValue
      }));
      setIsEditing(false);
    };

    const handleCancel = () => {
      setTempValue(value);
      setIsEditing(false);
    };

    if (isEditing) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px',
          border: '2px solid #3b82f6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ 
              fontSize: '20px', 
              margin: 0, 
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ✏️ {title} を編集中
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSave}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                💾 保存
              </button>
              <button
                onClick={handleCancel}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
          
          <textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '16px',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              fontSize: '16px',
              lineHeight: '1.6',
              resize: 'vertical',
              outline: 'none'
            }}
            placeholder={placeholder}
            autoFocus
          />
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: '12px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            <span>💡 改行で段落を分け、具体的な数値や期間を含めると効果的です</span>
            <span>{tempValue.length} 文字</span>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer'
      }}
      onClick={() => {
        setTempValue(editableTexts[id] || value);
        setIsEditing(true);
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(0, 0, 0, 0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ 
            fontSize: '20px', 
            margin: 0, 
            color: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📝 {title}
          </h3>
          <span style={{ 
            fontSize: '14px', 
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ✏️ クリックして編集
          </span>
        </div>
        
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          fontSize: '16px',
          lineHeight: '1.6',
          color: '#374151',
          whiteSpace: 'pre-wrap'
        }}>
          {editableTexts[id] || value}
        </div>
      </div>
    );
  };

  // 編集可能フィールドコンポーネント
  const EditableField: React.FC<{
    fieldKey: string;
    label: string;
    value: any;
    isSubsidyData?: boolean;
    type?: 'text' | 'textarea' | 'select';
    options?: Array<{ value: string; label: string }>;
  }> = ({ fieldKey, label, value, isSubsidyData = false, type = 'text', options }) => {
    const [tempValue, setTempValue] = useState(value || '');
    const isEditing = editingField === fieldKey;
    const displayValue = getDisplayValue(fieldKey, value, isSubsidyData);

    const handleSave = () => {
      handleFieldEdit(fieldKey, tempValue, isSubsidyData);
    };

    const handleCancel = () => {
      setTempValue(value || '');
      setEditingField(null);
    };

    if (!isEditMode) {
      return (
        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
          <td style={{ padding: '12px', fontWeight: '500', width: '40%' }}>
            {label}
          </td>
          <td style={{ padding: '12px' }}>
            {displayValue}
          </td>
        </tr>
      );
    }

    return (
      <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: isEditing ? '#f0f9ff' : 'transparent' }}>
        <td style={{ padding: '12px', fontWeight: '500', width: '40%' }}>
          {label}
          {isEditing && <span style={{ color: '#2563eb', marginLeft: '4px' }}>✏️</span>}
        </td>
        <td style={{ padding: '12px' }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {type === 'textarea' ? (
                <textarea
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #3b82f6',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                  autoFocus
                />
              ) : type === 'select' && options ? (
                <select
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #3b82f6',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  autoFocus
                >
                  <option value="">選択してください</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #3b82f6',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                />
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSave}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  保存
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onClick={() => {
                setEditingField(fieldKey);
                setTempValue(value || '');
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span>{displayValue}</span>
              <span style={{ color: '#6b7280', fontSize: '12px' }}>✏️ クリックして編集</span>
            </div>
          )}
        </td>
      </tr>
    );
  };

  const handleDownloadApplication = () => {
    // 申請書のダウンロード処理
    const downloadData = {
      applicationNumber,
      companyData,
      subsidyData,
      editableTexts,
      submissionDate: new Date().toISOString(),
      subsidyType: 'jizokuka',
      subsidyName: '小規模事業者持続化補助金'
    };

    const blob = new Blob([JSON.stringify(downloadData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jizokuka_application_${applicationNumber}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadExcel = async () => {
    try {
      console.log('Excel download started...');
      
      // CSVフォーマットでデータを生成（Excelで開ける）
      const csvContent = generateCSVContent();
      
      // BOMを追加（日本語文字化け防止）
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });
      
      // ダウンロード実行
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `小規模事業者持続化補助金申請書_${applicationNumber}.csv`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // クリーンアップ
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('CSV download completed successfully');
      
      // 元のExcelJS実装はコメントアウト
      /*
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('小規模事業者持続化補助金申請書');

      // スタイル設定
      const headerStyle = {
        font: { bold: true, size: 14, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: '366092' } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        border: {
          top: { style: 'thin' as const },
          left: { style: 'thin' as const },
          bottom: { style: 'thin' as const },
          right: { style: 'thin' as const }
        }
      };

      const subHeaderStyle = {
        font: { bold: true, size: 12 },
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'E7F3FF' } },
        alignment: { horizontal: 'left' as const, vertical: 'middle' as const },
        border: {
          top: { style: 'thin' as const },
          left: { style: 'thin' as const },
          bottom: { style: 'thin' as const },
          right: { style: 'thin' as const }
        }
      };

      const cellStyle = {
        alignment: { horizontal: 'left' as const, vertical: 'top' as const, wrapText: true },
        border: {
          top: { style: 'thin' as const },
          left: { style: 'thin' as const },
          bottom: { style: 'thin' as const },
          right: { style: 'thin' as const }
        }
      };

      // ヘッダー
      worksheet.mergeCells('A1:D1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = '小規模事業者持続化補助金 申請書';
      titleCell.style = headerStyle;
      worksheet.getRow(1).height = 30;

      // 申請番号
      worksheet.mergeCells('A2:D2');
      const numberCell = worksheet.getCell('A2');
      numberCell.value = `申請番号: ${applicationNumber}`;
      numberCell.style = subHeaderStyle;

      let rowIndex = 4;

      // 基本情報セクション
      worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
      const basicInfoHeader = worksheet.getCell(`A${rowIndex}`);
      basicInfoHeader.value = '1. 基本情報';
      basicInfoHeader.style = subHeaderStyle;
      rowIndex++;

      const basicInfo = [
        ['企業名', companyData.companyName || companyData.company_name || '未入力'],
        ['代表者氏名', companyData.representativeName || companyData.representative_name || '未入力'],
        ['メールアドレス', companyData.contactEmail || companyData.contact_email || '未入力'],
        ['電話番号', companyData.contactPhone || companyData.contact_phone || '未入力'],
        ['従業員数', getDisplayValue('employeeCount', subsidyData.employeeCount, true)],
        ['年間売上高', getDisplayValue('annualRevenue', subsidyData.annualRevenue, true)],
      ];

      basicInfo.forEach(([label, value]) => {
        worksheet.getCell(`A${rowIndex}`).value = label;
        worksheet.getCell(`A${rowIndex}`).style = { ...cellStyle, font: { bold: true } };
        worksheet.mergeCells(`B${rowIndex}:D${rowIndex}`);
        worksheet.getCell(`B${rowIndex}`).value = value;
        worksheet.getCell(`B${rowIndex}`).style = cellStyle;
        rowIndex++;
      });

      rowIndex++;

      // 事業計画セクション
      worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
      const planHeader = worksheet.getCell(`A${rowIndex}`);
      planHeader.value = '2. 事業計画';
      planHeader.style = subHeaderStyle;
      rowIndex++;

      // 事業概要
      worksheet.getCell(`A${rowIndex}`).value = '事業概要';
      worksheet.getCell(`A${rowIndex}`).style = { ...cellStyle, font: { bold: true } };
      worksheet.mergeCells(`B${rowIndex}:D${rowIndex + 8}`);
      const businessPlanCell = worksheet.getCell(`B${rowIndex}`);
      businessPlanCell.value = editableTexts.businessPlan;
      businessPlanCell.style = cellStyle;
      rowIndex += 9;

      // プロジェクト目標
      worksheet.getCell(`A${rowIndex}`).value = 'プロジェクト目標';
      worksheet.getCell(`A${rowIndex}`).style = { ...cellStyle, font: { bold: true } };
      worksheet.mergeCells(`B${rowIndex}:D${rowIndex + 6}`);
      const goalsCell = worksheet.getCell(`B${rowIndex}`);
      goalsCell.value = editableTexts.projectGoals;
      goalsCell.style = cellStyle;
      rowIndex += 7;

      // 期待される効果
      worksheet.getCell(`A${rowIndex}`).value = '期待される効果';
      worksheet.getCell(`A${rowIndex}`).style = { ...cellStyle, font: { bold: true } };
      worksheet.mergeCells(`B${rowIndex}:D${rowIndex + 8}`);
      const resultsCell = worksheet.getCell(`B${rowIndex}`);
      resultsCell.value = editableTexts.expectedResults;
      resultsCell.style = cellStyle;

      // 列幅設定
      worksheet.getColumn(1).width = 20;
      worksheet.getColumn(2).width = 25;
      worksheet.getColumn(3).width = 25;
      worksheet.getColumn(4).width = 25;

      // 行の高さを自動調整
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
          row.height = undefined; // 自動調整
        }
      });

      */
    } catch (error) {
      console.error('ダウンロードエラー:', error);
      alert('ファイルのダウンロードに失敗しました。\n\nエラー詳細: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  // CSV生成関数
  const generateCSVContent = () => {
    const rows = [];
    
    // ヘッダー
    rows.push(['小規模事業者持続化補助金 申請書']);
    rows.push([`申請番号: ${applicationNumber}`]);
    rows.push(['']);
    
    // 基本情報
    rows.push(['1. 基本情報']);
    rows.push(['項目', '内容']);
    rows.push(['企業名', companyData.companyName || companyData.company_name || '未入力']);
    rows.push(['代表者氏名', companyData.representativeName || companyData.representative_name || '未入力']);
    rows.push(['メールアドレス', companyData.contactEmail || companyData.contact_email || '未入力']);
    rows.push(['電話番号', companyData.contactPhone || companyData.contact_phone || '未入力']);
    rows.push(['従業員数', getDisplayValue('employeeCount', subsidyData.employeeCount, true)]);
    rows.push(['年間売上高', getDisplayValue('annualRevenue', subsidyData.annualRevenue, true)]);
    rows.push(['']);
    
    // 事業計画
    rows.push(['2. 事業計画']);
    rows.push(['事業概要']);
    rows.push([editableTexts.businessPlan]);
    rows.push(['']);
    rows.push(['プロジェクト目標']);
    rows.push([editableTexts.projectGoals]);
    rows.push(['']);
    rows.push(['期待される効果']);
    rows.push([editableTexts.expectedResults]);
    
    // CSV形式に変換
    return rows.map(row => 
      row.map(cell => {
        // セル内の改行をスペースに変換し、ダブルクォートでエスケープ
        const cellStr = String(cell).replace(/"/g, '""');
        return cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"') 
          ? `"${cellStr}"` 
          : cellStr;
      }).join(',')
    ).join('\n');
  };

  const nextSteps = [
    {
      step: 1,
      title: '必要書類の準備',
      description: '申請に必要な書類を確認し、不足分を準備してください',
      items: [
        '事業計画書（作成済み）',
        '経費明細書',
        '見積書・カタログ等',
        '決算書等（直近分）'
      ]
    },
    {
      step: 2,
      title: '申請システムへの登録',
      description: 'Jグランツ（政府共通申請システム）での正式申請',
      items: [
        'Jグランツアカウント作成',
        '申請書類のアップロード',
        '電子申請の提出'
      ]
    },
    {
      step: 3,
      title: '審査・採択発表',
      description: '審査結果の確認と今後の手続き',
      items: [
        '審査期間：約1-2ヶ月',
        '採択発表：公式サイトで確認',
        '交付決定通知書の受領'
      ]
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f9ff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 紙吹雪エフェクト */}
      {showConfetti && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 100
        }}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: -10,
                left: `${Math.random() * 100}%`,
                width: '10px',
                height: '10px',
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
                animation: `fall 3s linear infinite`,
                animationDelay: `${Math.random() * 3}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
      )}

      <style>
        {`
          @keyframes fall {
            to {
              transform: translateY(100vh) rotate(360deg);
            }
          }
        `}
      </style>

      <div style={{ 
        maxWidth: '1000px', 
        margin: '0 auto', 
        padding: '40px 20px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ 
            fontSize: '72px', 
            marginBottom: '24px',
            animation: 'bounce 2s ease-in-out infinite'
          }}>
            🎉
          </div>
          
          <h1 style={{ 
            fontSize: '48px', 
            color: '#1e40af', 
            marginBottom: '16px',
            fontWeight: 'bold'
          }}>
            申請書作成完了！
          </h1>
          
          <p style={{ 
            fontSize: '24px', 
            color: '#374151', 
            marginBottom: '32px'
          }}>
            小規模事業者持続化補助金の申請書が正常に作成されました
          </p>

          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '3px solid #3b82f6',
            display: 'inline-block'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              color: '#1e40af', 
              marginBottom: '8px',
              fontWeight: '600'
            }}>
              申請番号
            </h3>
            <p style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: '#1e40af',
              fontFamily: 'monospace',
              margin: 0
            }}>
              {applicationNumber}
            </p>
          </div>
        </div>

        {/* 申請内容サマリー */}
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          marginBottom: '32px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              margin: 0,
              color: '#1e40af',
              borderBottom: '2px solid #3b82f6',
              paddingBottom: '8px'
            }}>
              📋 申請内容サマリー
            </h2>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              style={{
                backgroundColor: isEditMode ? '#ef4444' : '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {isEditMode ? '🔒 編集終了' : '✏️ 編集モード'}
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#374151' }}>申請者情報</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <EditableField
                    fieldKey="companyName"
                    label="企業名"
                    value={companyData.companyName || companyData.company_name}
                    type="text"
                  />
                  <EditableField
                    fieldKey="representativeName"
                    label="代表者"
                    value={companyData.representativeName || companyData.representative_name}
                    type="text"
                  />
                  <EditableField
                    fieldKey="contactEmail"
                    label="メールアドレス"
                    value={companyData.contactEmail || companyData.contact_email}
                    type="text"
                  />
                  <EditableField
                    fieldKey="contactPhone"
                    label="電話番号"
                    value={companyData.contactPhone || companyData.contact_phone}
                    type="text"
                  />
                </tbody>
              </table>
            </div>
            
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#374151' }}>事業計画</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <EditableField
                    fieldKey="businessType"
                    label="事業分野"
                    value={subsidyData.businessType}
                    isSubsidyData={true}
                    type="select"
                    options={[
                      { value: 'manufacturing', label: '製造業' },
                      { value: 'retail', label: '小売業' },
                      { value: 'service', label: 'サービス業' },
                      { value: 'it', label: 'IT関連' },
                      { value: 'other', label: 'その他' }
                    ]}
                  />
                  <EditableField
                    fieldKey="employeeCount"
                    label="従業員数"
                    value={subsidyData.employeeCount}
                    isSubsidyData={true}
                    type="select"
                    options={[
                      { value: '1-5', label: '1〜5名' },
                      { value: '6-20', label: '6〜20名' },
                      { value: '21-50', label: '21〜50名' },
                      { value: '51-100', label: '51〜100名' },
                      { value: '101-300', label: '101〜300名' }
                    ]}
                  />
                  <EditableField
                    fieldKey="budgetRange"
                    label="予算規模"
                    value={subsidyData.budgetRange}
                    isSubsidyData={true}
                    type="select"
                    options={[
                      { value: 'under-500k', label: '50万円未満' },
                      { value: '500k-1m', label: '50万〜100万円' },
                      { value: '1m-3m', label: '100万〜300万円' },
                      { value: '3m-5m', label: '300万〜500万円' },
                      { value: 'over-5m', label: '500万円以上' }
                    ]}
                  />
                  <EditableField
                    fieldKey="currentChallenges"
                    label="主な課題"
                    value={subsidyData.currentChallenges}
                    isSubsidyData={true}
                    type="select"
                    options={[
                      { value: 'efficiency', label: '業務効率化' },
                      { value: 'sales', label: '売上拡大' },
                      { value: 'cost', label: 'コスト削減' },
                      { value: 'innovation', label: '新商品・サービス開発' },
                      { value: 'hr', label: '人材育成・確保' }
                    ]}
                  />
                </tbody>
              </table>
            </div>
          </div>
          
          {isEditMode && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #3b82f6'
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💡 <strong>編集のヒント:</strong> 各フィールドをクリックして直接編集できます。Enterキーで保存、Escapeキーでキャンセルできます。
              </p>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          marginBottom: '32px'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            marginBottom: '24px',
            color: '#1e40af',
            borderBottom: '2px solid #3b82f6',
            paddingBottom: '8px'
          }}>
            📥 申請書のダウンロード
          </h2>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={handleDownloadExcel}
              style={{
                backgroundColor: '#16a34a',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              📊 Excel形式でダウンロード
            </button>

            <button
              onClick={handleDownloadApplication}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              📄 JSON形式でダウンロード
            </button>
            
            <button
              onClick={() => navigate('/document-output')}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              📋 詳細プレビュー
            </button>
          </div>
        </div>

        {/* 編集可能な申請書内容 */}
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          marginBottom: '32px'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            marginBottom: '24px',
            color: '#1e40af',
            borderBottom: '2px solid #3b82f6',
            paddingBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📝 申請書内容の編集
          </h2>
          
          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #3b82f6',
            marginBottom: '24px'
          }}>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💡 <strong>編集のポイント:</strong> 各セクションをクリックして内容を編集できます。具体的な数値や期間、実施方法を含めることで申請書の説得力が向上します。
            </p>
          </div>

          <EditableTextArea
            id="businessPlan"
            title="事業概要・実施計画"
            value={editableTexts.businessPlan}
            placeholder="事業の概要、実施する内容、具体的な計画を記載してください..."
          />

          <EditableTextArea
            id="projectGoals"
            title="プロジェクトの目標"
            value={editableTexts.projectGoals}
            placeholder="プロジェクトで達成したい目標を具体的に記載してください..."
          />

          <EditableTextArea
            id="expectedResults"
            title="期待される効果・成果"
            value={editableTexts.expectedResults}
            placeholder="期待される効果や成果を具体的な数値とともに記載してください..."
          />
        </div>

        {/* 次のステップ */}
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          marginBottom: '32px'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            marginBottom: '24px',
            color: '#1e40af',
            borderBottom: '2px solid #3b82f6',
            paddingBottom: '8px'
          }}>
            🚀 今後の手順
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {nextSteps.map((step, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '20px',
                  padding: '20px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {step.step}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#1e40af' }}>
                    {step.title}
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '12px' }}>
                    {step.description}
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {step.items.map((item, itemIndex) => (
                      <li key={itemIndex} style={{ marginBottom: '4px', color: '#374151' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 重要な注意事項 */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '32px'
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            marginBottom: '12px',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚠️ 重要な注意事項
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e' }}>
            <li style={{ marginBottom: '8px' }}>
              本システムで作成した申請書は下書きです。正式申請はJグランツで行ってください。
            </li>
            <li style={{ marginBottom: '8px' }}>
              申請期限を必ず確認し、余裕を持って提出してください。
            </li>
            <li style={{ marginBottom: '8px' }}>
              不明な点は商工会議所や認定支援機関にご相談ください。
            </li>
          </ul>
        </div>

        {/* フッターアクション */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '12px 32px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              marginRight: '16px'
            }}
          >
            トップページに戻る
          </button>
          
          <button
            onClick={() => {
              // 新しい申請を開始（セッションをクリア）
              sessionStorage.clear();
              navigate('/');
            }}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '12px 32px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            新しい申請を開始
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-30px);
            }
            60% {
              transform: translateY(-15px);
            }
          }
        `}
      </style>
    </div>
  );
};

export default JizokukaCompletionPage;