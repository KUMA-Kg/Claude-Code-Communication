// バックエンド起動テストスクリプト
console.log('🔍 バックエンドの起動テストを開始します...');

// dotenvで環境変数を読み込む
require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');

// 環境変数の設定
process.env.NODE_OPTIONS = '-r tsconfig-paths/register';

// ts-nodeでindex.tsを実行
const tsNode = spawn('npx', ['ts-node', 'src/index.ts'], {
  cwd: __dirname,
  env: process.env,
  stdio: 'inherit'
});

tsNode.on('error', (err) => {
  console.error('❌ エラーが発生しました:', err.message);
  process.exit(1);
});

tsNode.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ プロセスが異常終了しました (code: ${code})`);
  }
});

// Ctrl+Cで終了
process.on('SIGINT', () => {
  console.log('\n⏹️  テストを終了します...');
  tsNode.kill();
  process.exit(0);
});