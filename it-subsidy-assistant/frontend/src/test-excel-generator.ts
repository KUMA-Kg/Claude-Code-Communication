// Test file to demonstrate the updated IT subsidy Excel generator functionality
import { generateITSubsidyDocuments } from './utils/it-subsidy-excel-generator';

// Sample applicant data matching official government requirements
const sampleApplicantData = {
  // 基本情報
  companyName: '株式会社サンプル企業',
  representativeName: '山田太郎',
  representativeTitle: '代表取締役',
  companyNumber: '1234567890123',
  
  // 連絡先情報
  postalCode: '100-0001',
  address: '東京都千代田区千代田1-1-1',
  phoneNumber: '03-1234-5678',
  faxNumber: '03-1234-5679',
  email: 'info@sample-company.jp',
  websiteUrl: 'https://www.sample-company.jp',
  
  // 企業情報
  establishmentDate: '2010年4月1日',
  fiscalYearEnd: '3月',
  capitalAmount: '10,000,000円',
  employeeCount: '50名',
  businessType: '情報通信業',
  
  // 財務情報
  salesRevenue: '500,000千円',
  operatingProfit: '50,000千円',
  
  // プロジェクト情報
  subsidyType: 'デジタル化基盤導入枠',
  projectName: 'クラウド型業務管理システム導入プロジェクト',
  requestAmount: '1,500,000円',
  totalProjectCost: '2,000,000円',
  implementationPeriod: '2025年7月〜2025年12月',
  
  // ITツール情報
  vendorName: '株式会社ITソリューション',
  toolName: 'CloudBiz Pro',
  toolCategory: '業務効率化',
  toolFunction: '顧客管理、在庫管理、売上分析を統合的に管理',
  initialCost: '1,200,000円',
  monthlyFee: '50,000円',
  maintenanceCost: '150,000円',
  
  // 賃金・生産性情報
  currentWage: '350,000円',
  targetWage: '367,500円',
  wageIncreaseRate: '5.0%',
  productivityCurrent: '5,000円/時間',
  productivityTarget: '6,500円/時間'
};

// Function to generate all official forms
export async function generateAllOfficialForms() {
  console.log('Generating all official IT subsidy forms (様式1〜6)...');
  await generateITSubsidyDocuments.allOfficialForms(sampleApplicantData);
  console.log('All forms generated successfully!');
}

// Function to generate individual forms
export async function generateIndividualForms() {
  console.log('Generating individual forms...');
  
  // 様式1: 申請書
  await generateITSubsidyDocuments.form1(sampleApplicantData);
  console.log('Form 1 (申請書) generated!');
  
  // 様式2: 事業計画書
  await generateITSubsidyDocuments.form2(sampleApplicantData);
  console.log('Form 2 (事業計画書) generated!');
  
  // 様式3: 導入ITツール一覧
  await generateITSubsidyDocuments.form3(sampleApplicantData);
  console.log('Form 3 (導入ITツール一覧) generated!');
  
  // 様式4: 賃金引上げ計画書
  await generateITSubsidyDocuments.form4(sampleApplicantData);
  console.log('Form 4 (賃金引上げ計画書) generated!');
  
  // 様式5: 労働生産性向上計画書
  await generateITSubsidyDocuments.form5(sampleApplicantData);
  console.log('Form 5 (労働生産性向上計画書) generated!');
  
  // 様式6: 申請者概要
  await generateITSubsidyDocuments.form6(sampleApplicantData);
  console.log('Form 6 (申請者概要) generated!');
}

// Example usage
if (typeof window !== 'undefined') {
  // Make functions available globally for testing in browser console
  (window as any).generateAllOfficialForms = generateAllOfficialForms;
  (window as any).generateIndividualForms = generateIndividualForms;
  
  console.log('IT Subsidy Excel Generator Test Loaded');
  console.log('Run generateAllOfficialForms() or generateIndividualForms() in console to test');
}