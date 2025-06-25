#!/usr/bin/env node

/**
 * 依存関係チェックスクリプト
 * package.jsonの検証、依存関係の整合性確認、ビルド前検証
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class DependencyChecker {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.frontendDir = path.join(this.projectRoot, 'frontend');
    this.backendDir = path.join(this.projectRoot, 'backend');
    this.errors = [];
    this.warnings = [];
  }

  async run() {
    console.log('🔍 IT補助金アシスタント - 依存関係チェック開始');
    console.log('━'.repeat(60));

    try {
      await this.checkPackageJsonFiles();
      await this.checkLockFiles();
      await this.checkRequiredDependencies();
      await this.checkPeerDependencies();
      await this.checkDevDependencies();
      await this.runAudit();
      await this.checkBuildability();
      await this.generateReport();

      if (this.errors.length > 0) {
        console.error('\n❌ エラーが検出されました:');
        this.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }

      console.log('\n✅ すべての依存関係チェックが正常に完了しました');
    } catch (error) {
      console.error('❌ チェック中にエラーが発生しました:', error.message);
      process.exit(1);
    }
  }

  async checkPackageJsonFiles() {
    console.log('\n📦 package.jsonファイルの検証...');
    
    const packageFiles = [
      { name: 'Root', path: path.join(this.projectRoot, 'package.json') },
      { name: 'Frontend', path: path.join(this.frontendDir, 'package.json') },
      { name: 'Backend', path: path.join(this.backendDir, 'package.json') }
    ];

    for (const file of packageFiles) {
      try {
        await fs.access(file.path);
        const content = await fs.readFile(file.path, 'utf8');
        const packageJson = JSON.parse(content);
        
        // 必須フィールドの確認
        const requiredFields = ['name', 'version', 'scripts'];
        for (const field of requiredFields) {
          if (!packageJson[field]) {
            this.errors.push(`${file.name} package.json: '${field}'フィールドが不足しています`);
          }
        }

        // スクリプトの確認
        if (packageJson.scripts) {
          const requiredScripts = ['build', 'test'];
          for (const script of requiredScripts) {
            if (!packageJson.scripts[script]) {
              this.warnings.push(`${file.name}: '${script}'スクリプトが定義されていません`);
            }
          }
        }

        console.log(`  ✓ ${file.name} package.json: 有効`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          this.errors.push(`${file.name} package.jsonが見つかりません`);
        } else {
          this.errors.push(`${file.name} package.json: 無効なJSON形式`);
        }
      }
    }
  }

  async checkLockFiles() {
    console.log('\n🔒 package-lock.jsonファイルの確認...');
    
    const lockFiles = [
      { name: 'Frontend', path: path.join(this.frontendDir, 'package-lock.json') },
      { name: 'Backend', path: path.join(this.backendDir, 'package-lock.json') }
    ];

    for (const file of lockFiles) {
      try {
        await fs.access(file.path);
        const stats = await fs.stat(file.path);
        
        // package.jsonとの更新時刻比較
        const packageJsonPath = path.join(path.dirname(file.path), 'package.json');
        const packageStats = await fs.stat(packageJsonPath);
        
        if (packageStats.mtime > stats.mtime) {
          this.warnings.push(`${file.name}: package-lock.jsonがpackage.jsonより古い可能性があります`);
        }
        
        console.log(`  ✓ ${file.name} package-lock.json: 存在確認`);
      } catch (error) {
        this.errors.push(`${file.name} package-lock.jsonが見つかりません`);
      }
    }
  }

  async checkRequiredDependencies() {
    console.log('\n🎯 必須依存関係の確認...');

    // フロントエンド必須依存関係
    const frontendRequired = {
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
      'typescript': '^5.0.0',
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0'
    };

    // バックエンド必須依存関係
    const backendRequired = {
      'express': '^4.18.0',
      'typescript': '^5.0.0',
      '@types/node': '^18.0.0 || ^20.0.0',
      '@types/express': '^4.17.0'
    };

    await this.checkDependencySet('Frontend', this.frontendDir, frontendRequired);
    await this.checkDependencySet('Backend', this.backendDir, backendRequired);
  }

  async checkDependencySet(name, directory, required) {
    try {
      const packageJsonPath = path.join(directory, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      for (const [dep, version] of Object.entries(required)) {
        if (!allDeps[dep]) {
          this.errors.push(`${name}: 必須依存関係 '${dep}' が見つかりません`);
        } else {
          console.log(`  ✓ ${name}: ${dep} (${allDeps[dep]})`);
        }
      }
    } catch (error) {
      this.errors.push(`${name}: 依存関係の確認に失敗しました`);
    }
  }

  async checkPeerDependencies() {
    console.log('\n🔗 ピア依存関係の確認...');

    const directories = [
      { name: 'Frontend', path: this.frontendDir },
      { name: 'Backend', path: this.backendDir }
    ];

    for (const dir of directories) {
      try {
        const output = execSync('npm ls --depth=0 --json', {
          cwd: dir.path,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });

        const result = JSON.parse(output);
        if (result.problems) {
          result.problems.forEach(problem => {
            if (problem.includes('peer dep')) {
              this.warnings.push(`${dir.name}: ${problem}`);
            }
          });
        } else {
          console.log(`  ✓ ${dir.name}: ピア依存関係に問題なし`);
        }
      } catch (error) {
        // npm lsが非ゼロで終了する場合があるが、JSONは出力される
        try {
          const result = JSON.parse(error.stdout);
          if (result.problems) {
            result.problems.forEach(problem => {
              if (problem.includes('peer dep')) {
                this.warnings.push(`${dir.name}: ${problem}`);
              }
            });
          }
        } catch {
          this.warnings.push(`${dir.name}: ピア依存関係の確認をスキップ`);
        }
      }
    }
  }

  async checkDevDependencies() {
    console.log('\n🛠️ 開発依存関係の確認...');

    const devDeps = {
      frontend: {
        '@vitejs/plugin-react': 'Viteプラグイン',
        'vite': 'ビルドツール',
        'eslint': 'リンター',
        '@typescript-eslint/parser': 'TypeScript ESLintパーサー',
        '@typescript-eslint/eslint-plugin': 'TypeScript ESLintプラグイン'
      },
      backend: {
        'jest': 'テストフレームワーク',
        '@types/jest': 'Jest型定義',
        'ts-jest': 'TypeScript Jest',
        'nodemon': '開発サーバー',
        'eslint': 'リンター'
      }
    };

    await this.checkDevDependencySet('Frontend', this.frontendDir, devDeps.frontend);
    await this.checkDevDependencySet('Backend', this.backendDir, devDeps.backend);
  }

  async checkDevDependencySet(name, directory, deps) {
    try {
      const packageJsonPath = path.join(directory, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      const devDependencies = packageJson.devDependencies || {};

      for (const [dep, description] of Object.entries(deps)) {
        if (!devDependencies[dep]) {
          this.warnings.push(`${name}: 開発依存関係 '${dep}' (${description}) が見つかりません`);
        } else {
          console.log(`  ✓ ${name}: ${dep} - ${description}`);
        }
      }
    } catch (error) {
      this.warnings.push(`${name}: 開発依存関係の確認に失敗しました`);
    }
  }

  async runAudit() {
    console.log('\n🔒 セキュリティ監査の実行...');

    const directories = [
      { name: 'Frontend', path: this.frontendDir },
      { name: 'Backend', path: this.backendDir }
    ];

    for (const dir of directories) {
      try {
        const output = execSync('npm audit --json', {
          cwd: dir.path,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });

        const audit = JSON.parse(output);
        const { vulnerabilities } = audit.metadata;
        
        if (vulnerabilities) {
          const total = Object.values(vulnerabilities).reduce((sum, val) => sum + val, 0);
          
          if (total > 0) {
            console.log(`  ⚠️ ${dir.name}: ${total}個の脆弱性を検出`);
            
            if (vulnerabilities.critical > 0) {
              this.errors.push(`${dir.name}: ${vulnerabilities.critical}個の致命的な脆弱性があります`);
            }
            if (vulnerabilities.high > 0) {
              this.warnings.push(`${dir.name}: ${vulnerabilities.high}個の高危険度の脆弱性があります`);
            }
            
            console.log(`     Critical: ${vulnerabilities.critical || 0}`);
            console.log(`     High: ${vulnerabilities.high || 0}`);
            console.log(`     Moderate: ${vulnerabilities.moderate || 0}`);
            console.log(`     Low: ${vulnerabilities.low || 0}`);
          } else {
            console.log(`  ✓ ${dir.name}: 脆弱性なし`);
          }
        }
      } catch (error) {
        // npm auditは脆弱性がある場合、非ゼロで終了する
        try {
          const audit = JSON.parse(error.stdout);
          const { vulnerabilities } = audit.metadata;
          
          if (vulnerabilities) {
            const total = Object.values(vulnerabilities).reduce((sum, val) => sum + val, 0);
            
            if (total > 0) {
              console.log(`  ⚠️ ${dir.name}: ${total}個の脆弱性を検出`);
              
              if (vulnerabilities.critical > 0) {
                this.errors.push(`${dir.name}: ${vulnerabilities.critical}個の致命的な脆弱性があります`);
              }
              if (vulnerabilities.high > 0) {
                this.warnings.push(`${dir.name}: ${vulnerabilities.high}個の高危険度の脆弱性があります`);
              }
            }
          }
        } catch {
          this.warnings.push(`${dir.name}: セキュリティ監査の実行に失敗しました`);
        }
      }
    }
  }

  async checkBuildability() {
    console.log('\n🏗️ ビルド可能性の確認...');

    const builds = [
      { 
        name: 'Frontend', 
        path: this.frontendDir,
        command: 'npm run build',
        skipBuild: process.env.SKIP_BUILD === 'true' 
      },
      { 
        name: 'Backend', 
        path: this.backendDir,
        command: 'npm run build',
        skipBuild: process.env.SKIP_BUILD === 'true' 
      }
    ];

    for (const build of builds) {
      if (build.skipBuild) {
        console.log(`  ⏭️ ${build.name}: ビルドをスキップ (SKIP_BUILD=true)`);
        continue;
      }

      try {
        console.log(`  🔨 ${build.name}: ビルド実行中...`);
        
        // タイムアウト付きでビルドを実行
        execSync(build.command, {
          cwd: build.path,
          encoding: 'utf8',
          timeout: 60000, // 60秒タイムアウト
          stdio: 'pipe'
        });
        
        console.log(`  ✓ ${build.name}: ビルド成功`);
      } catch (error) {
        this.errors.push(`${build.name}: ビルドに失敗しました - ${error.message}`);
      }
    }
  }

  async generateReport() {
    console.log('\n📊 レポート生成...');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        status: this.errors.length === 0 ? 'PASS' : 'FAIL'
      },
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(this.projectRoot, 'dependency-check-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 レポートを保存しました: ${reportPath}`);

    if (this.warnings.length > 0) {
      console.log('\n⚠️ 警告:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.errors.some(e => e.includes('脆弱性'))) {
      recommendations.push('npm audit fix を実行して脆弱性を修正してください');
    }

    if (this.warnings.some(w => w.includes('package-lock.json'))) {
      recommendations.push('npm install を実行してpackage-lock.jsonを更新してください');
    }

    if (this.warnings.some(w => w.includes('peer dep'))) {
      recommendations.push('ピア依存関係の警告を確認し、必要に応じてインストールしてください');
    }

    if (this.errors.some(e => e.includes('必須依存関係'))) {
      recommendations.push('不足している必須依存関係をインストールしてください');
    }

    return recommendations;
  }
}

// スクリプト実行
if (require.main === module) {
  const checker = new DependencyChecker();
  checker.run().catch(error => {
    console.error('❌ 予期しないエラー:', error);
    process.exit(1);
  });
}

module.exports = DependencyChecker;