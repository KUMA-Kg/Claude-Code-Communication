import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Load test data
const companiesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'test-data/companies.json'), 'utf-8')
);
const scenariosData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'test-data/test-scenarios.json'), 'utf-8')
);

/**
 * Generate realistic test data for IT subsidy applications
 */
async function generateTestData() {
  console.log('🚀 Starting test data generation...');

  try {
    // 1. Create test users
    console.log('\n📝 Creating test users...');
    const testUsers = await createTestUsers();

    // 2. Create test companies
    console.log('\n🏢 Creating test companies...');
    const testCompanies = await createTestCompanies(testUsers);

    // 3. Create test applications
    console.log('\n📋 Creating test applications...');
    const testApplications = await createTestApplications(testCompanies);

    // 4. Create test documents
    console.log('\n📄 Creating test documents...');
    await createTestDocuments(testApplications);

    // 5. Create test subsidy data
    console.log('\n💰 Creating subsidy master data...');
    await createSubsidyMasterData();

    console.log('\n✅ Test data generation completed successfully!');
    
    // Generate summary report
    await generateSummaryReport({
      users: testUsers.length,
      companies: testCompanies.length,
      applications: testApplications.length
    });

  } catch (error) {
    console.error('❌ Error generating test data:', error);
    process.exit(1);
  }
}

/**
 * Create test users with various roles
 */
async function createTestUsers() {
  const testUsers = [
    {
      email: 'admin@test.example.com',
      password: 'Test123!@#',
      role: 'admin',
      name: 'テスト管理者'
    },
    {
      email: 'company1@test.example.com',
      password: 'Test123!@#',
      role: 'company',
      name: 'テスト企業1担当者'
    },
    {
      email: 'company2@test.example.com',
      password: 'Test123!@#',
      role: 'company',
      name: 'テスト企業2担当者'
    },
    {
      email: 'consultant@test.example.com',
      password: 'Test123!@#',
      role: 'consultant',
      name: 'テストコンサルタント'
    }
  ];

  const createdUsers = [];

  for (const userData of testUsers) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    });

    if (authError) {
      console.warn(`⚠️  User ${userData.email} might already exist:`, authError.message);
      continue;
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user!.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error(`❌ Error creating profile for ${userData.email}:`, profileError);
      continue;
    }

    createdUsers.push(profileData);
    console.log(`✅ Created user: ${userData.email}`);
  }

  return createdUsers;
}

/**
 * Create test companies with various profiles
 */
async function createTestCompanies(users: any[]) {
  const createdCompanies = [];
  const companyUsers = users.filter(u => u.role === 'company');

  for (let i = 0; i < companiesData.testCompanies.length; i++) {
    const companyData = companiesData.testCompanies[i];
    const user = companyUsers[i % companyUsers.length]; // Distribute companies among users

    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: companyData.name,
        industry: companyData.industry,
        employee_count: companyData.employeeCount,
        annual_revenue: companyData.annualRevenue,
        established_year: companyData.establishedYear,
        has_it_department: companyData.hasITDepartment,
        current_it_level: companyData.currentITLevel,
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating company ${companyData.name}:`, error);
      continue;
    }

    createdCompanies.push({
      ...data,
      testId: companyData.id,
      challenges: companyData.challenges,
      targetBranch: companyData.targetBranch
    });
    console.log(`✅ Created company: ${companyData.name}`);
  }

  return createdCompanies;
}

/**
 * Create test applications with various statuses
 */
async function createTestApplications(companies: any[]) {
  const createdApplications = [];
  const statuses = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed'];

  for (const company of companies) {
    const scenario = scenariosData.testScenarios.find(
      (s: any) => s.companyId === company.testId
    );

    if (!scenario) continue;

    const { data, error } = await supabase
      .from('applications')
      .insert({
        company_id: company.id,
        subsidy_type: scenario.expectedBranch,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        application_data: {
          scenario: scenario.name,
          questions: scenario.followUpQuestions,
          expectedTools: scenario.expectedTools,
          challenges: company.challenges
        },
        requested_amount: Math.floor(scenario.expectedMaxAmount * 0.8),
        subsidy_rate: scenario.expectedSubsidyRate,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating application for ${company.name}:`, error);
      continue;
    }

    createdApplications.push(data);
    console.log(`✅ Created application: ${scenario.name}`);
  }

  return createdApplications;
}

/**
 * Create test documents for applications
 */
async function createTestDocuments(applications: any[]) {
  const documentTypes = [
    { type: 'business_plan', name: '事業計画書', required: true },
    { type: 'quotation', name: '見積書', required: true },
    { type: 'company_registry', name: '登記簿謄本', required: true },
    { type: 'financial_statement', name: '決算書', required: false },
    { type: 'tax_certificate', name: '納税証明書', required: false }
  ];

  for (const application of applications) {
    for (const docType of documentTypes) {
      // Skip some optional documents randomly
      if (!docType.required && Math.random() > 0.7) continue;

      const { error } = await supabase
        .from('documents')
        .insert({
          application_id: application.id,
          document_type: docType.type,
          file_name: `${docType.name}_${application.id}.pdf`,
          file_path: `/test-documents/${application.id}/${docType.type}.pdf`,
          file_size: Math.floor(Math.random() * 5000000) + 100000, // 100KB to 5MB
          mime_type: 'application/pdf',
          status: 'verified',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error(`❌ Error creating document for application ${application.id}:`, error);
      }
    }
  }
  console.log('✅ Created test documents');
}

/**
 * Create subsidy master data
 */
async function createSubsidyMasterData() {
  const subsidies = [
    {
      code: 'DIGITALIZATION',
      name: '電子化枠',
      description: '紙ベース業務のデジタル化を支援',
      max_amount: 1500000,
      min_amount: 30000,
      subsidy_rate: 0.5,
      requirements: ['紙業務が50%以上', 'デジタル化計画の提出'],
      eligible_tools: ['電子帳簿システム', '文書管理システム', 'ワークフロー']
    },
    {
      code: 'SECURITY',
      name: 'セキュリティ枠',
      description: 'サイバーセキュリティ対策を支援',
      max_amount: 1000000,
      min_amount: 50000,
      subsidy_rate: 0.5,
      requirements: ['セキュリティリスク評価', '対策計画の提出'],
      eligible_tools: ['EDR', 'SIEM', 'WAF', 'セキュリティ監視']
    },
    {
      code: 'INVOICE',
      name: 'インボイス枠',
      description: 'インボイス制度対応を支援',
      max_amount: 500000,
      min_amount: 30000,
      subsidy_rate: 0.5,
      requirements: ['適格請求書発行事業者登録', '会計システム導入'],
      eligible_tools: ['会計ソフト', '請求書発行システム', '受発注システム']
    },
    {
      code: 'MULTI_COMPANY',
      name: '複数社枠',
      description: '複数企業での共同IT導入を支援',
      max_amount: 3000000,
      min_amount: 100000,
      subsidy_rate: 0.5,
      requirements: ['2社以上での共同申請', '連携計画の提出'],
      eligible_tools: ['グループウェア', 'EDI', '共同利用システム']
    },
    {
      code: 'GENERAL',
      name: '通常枠',
      description: '一般的な業務効率化を支援',
      max_amount: 2000000,
      min_amount: 30000,
      subsidy_rate: 0.5,
      requirements: ['生産性向上計画', '3年間の数値目標'],
      eligible_tools: ['ERP', 'CRM', 'BI', 'RPA']
    }
  ];

  for (const subsidy of subsidies) {
    const { error } = await supabase
      .from('subsidies')
      .upsert({
        ...subsidy,
        is_active: true,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'code'
      });

    if (error) {
      console.error(`❌ Error creating subsidy ${subsidy.name}:`, error);
    }
  }
  console.log('✅ Created subsidy master data');
}

/**
 * Generate summary report
 */
async function generateSummaryReport(stats: any) {
  const report = `
# Test Data Generation Report
Generated at: ${new Date().toISOString()}

## Summary
- Users created: ${stats.users}
- Companies created: ${stats.companies}
- Applications created: ${stats.applications}

## Test Accounts
- Admin: admin@test.example.com / Test123!@#
- Company User 1: company1@test.example.com / Test123!@#
- Company User 2: company2@test.example.com / Test123!@#
- Consultant: consultant@test.example.com / Test123!@#

## Test Scenarios
${scenariosData.testScenarios.map((s: any) => `- ${s.name}: ${s.expectedBranch}`).join('\n')}

## Notes
- All test data is marked with test flags for easy cleanup
- Passwords are set to 'Test123!@#' for all test accounts
- Test documents are referenced but not actually uploaded
`;

  fs.writeFileSync(
    path.join(__dirname, 'test-data-report.md'),
    report
  );
  console.log('\n📊 Test data report generated: scripts/test-data-report.md');
}

// Run the script
if (require.main === module) {
  generateTestData();
}