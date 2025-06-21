import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { generatePDF } from '../../utils/pdfGenerator';
import { generateExcel } from '../../utils/excelGenerator';

interface DocumentPreviewProps {
  subsidyType: string;
  subsidyName: string;
  formData: any;
  questionnaireData: any;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  subsidyType,
  subsidyName,
  formData,
  questionnaireData
}) => {
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    
    await generatePDF({
      element: previewRef.current,
      filename: `${subsidyName}_申請書_${new Date().toLocaleDateString('ja-JP')}.pdf`
    });
  };

  const handleDownloadExcel = async () => {
    await generateExcel({
      subsidyType,
      subsidyName,
      formData,
      questionnaireData,
      filename: `${subsidyName}_申請書_${new Date().toLocaleDateString('ja-JP')}.xlsx`
    });
  };

  const fieldLabels: { [key: string]: string } = {
    // 基本情報
    company_name: '法人名（商号）',
    company_name_kana: '法人名（フリガナ）',
    corporate_number: '法人番号',
    establishment_date: '設立年月日',
    capital: '資本金',
    representative_name: '代表者氏名',
    contact_email: 'メールアドレス',
    contact_phone: '電話番号',
    employee_count: '従業員数',
    annual_revenue: '年間売上高',
    
    // 事業内容
    business_description: '事業内容',
    main_business: '主な事業内容',
    target_customers: '主な顧客層',
    sales_area: '主な商圏',
    
    // IT導入補助金
    it_tool_category: '導入予定のITツールカテゴリ',
    implementation_purpose: 'IT導入の目的と期待効果',
    implementation_cost: '導入予定費用',
    
    // ものづくり補助金
    project_title: '事業計画名',
    project_category: '申請枠',
    innovation_type: '革新的サービスの内容',
    current_challenges: '現在の課題・問題点',
    solution_approach: '課題解決のアプローチ',
    expected_outcome: '期待される成果・効果',
    total_project_cost: '事業総額',
    subsidy_request_amount: '補助金申請額',
  };

  const formatValue = (key: string, value: any): string => {
    if (!value) return '未入力';
    
    if (key.includes('cost') || key.includes('amount') || key === 'capital' || key.includes('revenue')) {
      return `${Number(value).toLocaleString()} 円`;
    }
    
    if (key.includes('count')) {
      return `${value} 名`;
    }
    
    if (key.includes('date')) {
      try {
        return new Date(value).toLocaleDateString('ja-JP');
      } catch {
        return value;
      }
    }
    
    return value;
  };

  const renderSection = (title: string, fields: string[]) => {
    const sectionData = fields
      .filter(field => formData[field])
      .map(field => ({
        label: fieldLabels[field] || field,
        value: formatValue(field, formData[field])
      }));

    if (sectionData.length === 0) return null;

    return (
      <div className="preview-section">
        <h3 className="preview-section-title">{title}</h3>
        <table className="preview-table">
          <tbody>
            {sectionData.map((item, index) => (
              <tr key={index}>
                <td className="preview-label">{item.label}</td>
                <td className="preview-value">{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="document-preview-container">
      <div className="preview-actions">
        <motion.button
          className="btn btn-ghost btn-md"
          onClick={() => window.history.back()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 10H5M5 10L10 5M5 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          編集に戻る
        </motion.button>
        
        <div className="preview-download-buttons">
          <motion.button
            className="btn btn-outline btn-md"
            onClick={handleDownloadExcel}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2V14M10 14L6 10M10 14L14 10M4 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Excel形式
          </motion.button>
          
          <motion.button
            className="btn btn-primary btn-md"
            onClick={handleDownloadPDF}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2V14M10 14L6 10M10 14L14 10M4 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            PDF形式
          </motion.button>
        </div>
      </div>

      <div className="document-preview" ref={previewRef}>
        <div className="preview-header">
          <h1 className="preview-title">{subsidyName} 申請書</h1>
          <p className="preview-date">作成日: {new Date().toLocaleDateString('ja-JP')}</p>
        </div>

        {renderSection('1. 基本情報', [
          'company_name',
          'company_name_kana',
          'corporate_number',
          'establishment_date',
          'capital',
          'representative_name',
        ])}

        {renderSection('2. 連絡先情報', [
          'contact_email',
          'contact_phone',
        ])}

        {renderSection('3. 事業概要', [
          'employee_count',
          'annual_revenue',
          'business_description',
          'main_business',
          'target_customers',
          'sales_area',
        ])}

        <div className="preview-section">
          <h3 className="preview-section-title">4. 初期診断結果</h3>
          <table className="preview-table">
            <tbody>
              <tr>
                <td className="preview-label">事業形態</td>
                <td className="preview-value">
                  {questionnaireData.businessType === 'manufacturing' ? '製造業' :
                   questionnaireData.businessType === 'retail' ? '小売業' :
                   questionnaireData.businessType === 'service' ? 'サービス業' :
                   questionnaireData.businessType === 'it' ? 'IT関連' : 'その他'}
                </td>
              </tr>
              <tr>
                <td className="preview-label">現在の経営課題</td>
                <td className="preview-value">
                  {questionnaireData.currentChallenges === 'efficiency' ? '業務効率化' :
                   questionnaireData.currentChallenges === 'sales' ? '売上拡大' :
                   questionnaireData.currentChallenges === 'cost' ? 'コスト削減' :
                   questionnaireData.currentChallenges === 'innovation' ? '新商品・サービス開発' : '人材育成・確保'}
                </td>
              </tr>
              <tr>
                <td className="preview-label">IT/デジタル化の現状</td>
                <td className="preview-value">
                  {questionnaireData.digitalizationLevel === 'none' ? 'ほとんど導入していない' :
                   questionnaireData.digitalizationLevel === 'basic' ? '基本的なツールのみ' :
                   questionnaireData.digitalizationLevel === 'partial' ? '一部業務で活用' : '積極的に活用中'}
                </td>
              </tr>
              <tr>
                <td className="preview-label">想定投資予算</td>
                <td className="preview-value">
                  {questionnaireData.budgetRange === 'under-500k' ? '50万円未満' :
                   questionnaireData.budgetRange === '500k-1m' ? '50万〜100万円' :
                   questionnaireData.budgetRange === '1m-3m' ? '100万〜300万円' :
                   questionnaireData.budgetRange === '3m-5m' ? '300万〜500万円' : '500万円以上'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {subsidyType === 'it-donyu' && renderSection('5. IT導入計画', [
          'it_tool_category',
          'implementation_purpose',
          'implementation_cost',
        ])}

        {subsidyType === 'monozukuri' && renderSection('5. 事業計画詳細', [
          'project_title',
          'project_category',
          'innovation_type',
          'current_challenges',
          'solution_approach',
          'expected_outcome',
          'total_project_cost',
          'subsidy_request_amount',
        ])}

        <div className="preview-footer">
          <p className="preview-note">
            この申請書は自動生成されたものです。正式な申請の際は、各補助金の公式サイトで最新の要項をご確認ください。
          </p>
        </div>
      </div>

      <div className="preview-checklist">
        <h3 className="checklist-title">提出前チェックリスト</h3>
        <ul className="checklist-items">
          <li className="checklist-item">
            <input type="checkbox" id="check1" />
            <label htmlFor="check1">すべての必須項目を入力しましたか？</label>
          </li>
          <li className="checklist-item">
            <input type="checkbox" id="check2" />
            <label htmlFor="check2">入力内容に誤りはありませんか？</label>
          </li>
          <li className="checklist-item">
            <input type="checkbox" id="check3" />
            <label htmlFor="check3">必要な添付書類は準備できましたか？</label>
          </li>
          <li className="checklist-item">
            <input type="checkbox" id="check4" />
            <label htmlFor="check4">申請期限を確認しましたか？</label>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentPreview;