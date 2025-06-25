#!/bin/bash
# IT補助金アシスタント - ワンクリック起動スクリプト
# 誰でも簡単に起動できる統合起動システム

set -e  # エラー時に即座に停止

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ロゴ表示
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║      IT補助金アシスタント 起動システム      ║"
echo "║         Version 2.0 - Zero Downtime        ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ログディレクトリ作成
mkdir -p logs
mkdir -p tmp

# 起動ログファイル
LOG_FILE="logs/startup-$(date +%Y%m%d-%H%M%S).log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

# 関数: 状態表示
print_status() {
    echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +%H:%M:%S)] ✓ $1${NC}"
}

print_error() {
    echo -e "${RED}[$(date +%H:%M:%S)] ✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[$(date +%H:%M:%S)] ⚠ $1${NC}"
}

# 関数: 依存関係チェック
check_dependencies() {
    print_status "依存関係をチェック中..."
    
    # Node.jsチェック
    if ! command -v node &> /dev/null; then
        print_error "Node.js が見つかりません"
        echo "Node.js をインストールしてください: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js v16以上が必要です (現在: v$NODE_VERSION)"
        exit 1
    fi
    print_success "Node.js $(node -v) 検出"
    
    # npmチェック
    if ! command -v npm &> /dev/null; then
        print_error "npm が見つかりません"
        exit 1
    fi
    print_success "npm $(npm -v) 検出"
    
    # PM2チェック（グローバルインストール）
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 が見つかりません。インストール中..."
        npm install -g pm2
        print_success "PM2 をインストールしました"
    else
        print_success "PM2 検出"
    fi
}

# 関数: 環境設定チェック
check_environment() {
    print_status "環境設定をチェック中..."
    
    # .envファイルチェック
    if [ ! -f "backend/.env" ]; then
        print_warning "backend/.env が見つかりません。テンプレートからコピー中..."
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            print_warning ".env ファイルを作成しました。必要に応じて設定を更新してください。"
        else
            print_error "backend/.env.example が見つかりません"
            exit 1
        fi
    fi
    
    # 必須環境変数チェック
    if [ -f "backend/.env" ]; then
        source backend/.env
        
        if [ -z "$JWT_SECRET" ]; then
            print_warning "JWT_SECRET が設定されていません。生成中..."
            JWT_SECRET=$(openssl rand -base64 32)
            echo "JWT_SECRET=$JWT_SECRET" >> backend/.env
            print_success "JWT_SECRET を生成しました"
        fi
        
        if [ -z "$DATABASE_URL" ]; then
            print_warning "DATABASE_URL が設定されていません"
            print_warning "Supabaseまたは他のデータベースURLを設定してください"
        fi
    fi
    
    print_success "環境設定チェック完了"
}

# 関数: 依存パッケージインストール
install_dependencies() {
    print_status "依存パッケージをインストール中..."
    
    # Backend
    print_status "Backend パッケージをインストール中..."
    cd backend
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        npm install
        print_success "Backend パッケージをインストールしました"
    else
        print_success "Backend パッケージは最新です"
    fi
    
    # ビルド
    print_status "Backend をビルド中..."
    npm run build
    print_success "Backend ビルド完了"
    cd ..
    
    # Frontend
    print_status "Frontend パッケージをインストール中..."
    cd frontend
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        npm install
        print_success "Frontend パッケージをインストールしました"
    else
        print_success "Frontend パッケージは最新です"
    fi
    cd ..
}

# 関数: PM2設定作成
create_pm2_config() {
    print_status "PM2設定を作成中..."
    
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'it-subsidy-backend',
      cwd: './backend',
      script: './dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '../logs/backend-error.log',
      out_file: '../logs/backend-out.log',
      merge_logs: true,
      time: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
      listen_timeout: 10000,
      kill_timeout: 5000
    },
    {
      name: 'it-subsidy-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 5173
      },
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      merge_logs: true,
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF
    
    print_success "PM2設定を作成しました"
}

# 関数: サービス起動
start_services() {
    print_status "サービスを起動中..."
    
    # PM2でサービス起動
    pm2 delete all &> /dev/null || true  # 既存のプロセスをクリーンアップ
    pm2 start ecosystem.config.js
    
    # 起動確認
    sleep 3
    pm2 list
    
    print_success "すべてのサービスが起動しました"
}

# 関数: ヘルスチェック
health_check() {
    print_status "ヘルスチェックを実行中..."
    
    # Backend ヘルスチェック
    MAX_RETRIES=10
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -s http://localhost:3001/v1/health > /dev/null; then
            print_success "Backend は正常に動作しています"
            break
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
                print_error "Backend の起動に失敗しました"
                pm2 logs it-subsidy-backend --lines 50
                exit 1
            fi
            print_warning "Backend 起動待機中... ($RETRY_COUNT/$MAX_RETRIES)"
            sleep 2
        fi
    done
    
    # Frontend ヘルスチェック
    RETRY_COUNT=0
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -s http://localhost:5173 > /dev/null; then
            print_success "Frontend は正常に動作しています"
            break
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
                print_error "Frontend の起動に失敗しました"
                pm2 logs it-subsidy-frontend --lines 50
                exit 1
            fi
            print_warning "Frontend 起動待機中... ($RETRY_COUNT/$MAX_RETRIES)"
            sleep 2
        fi
    done
    
    print_success "すべてのヘルスチェックが完了しました"
}

# 関数: 起動後の情報表示
show_info() {
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         起動が完了しました！             ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
    echo
    echo -e "${BLUE}アクセスURL:${NC}"
    echo -e "  Frontend: ${GREEN}http://localhost:5173${NC}"
    echo -e "  Backend:  ${GREEN}http://localhost:3001${NC}"
    echo -e "  健康診断: ${GREEN}http://localhost:3001/v1/health${NC}"
    echo
    echo -e "${BLUE}便利なコマンド:${NC}"
    echo -e "  状態確認:   ${YELLOW}pm2 status${NC}"
    echo -e "  ログ確認:   ${YELLOW}pm2 logs${NC}"
    echo -e "  再起動:     ${YELLOW}pm2 restart all${NC}"
    echo -e "  停止:       ${YELLOW}pm2 stop all${NC}"
    echo -e "  モニター:   ${YELLOW}pm2 monit${NC}"
    echo
    echo -e "${BLUE}ログファイル:${NC} $LOG_FILE"
    echo
}

# エラーハンドラー
error_handler() {
    print_error "エラーが発生しました"
    print_error "ログを確認してください: $LOG_FILE"
    echo
    echo "トラブルシューティング:"
    echo "1. Node.js v16以上がインストールされているか確認"
    echo "2. ポート3001と5173が使用されていないか確認"
    echo "3. backend/.env ファイルが正しく設定されているか確認"
    echo "4. pm2 logs でエラーログを確認"
    exit 1
}

# エラートラップ設定
trap error_handler ERR

# メイン処理
main() {
    check_dependencies
    check_environment
    install_dependencies
    create_pm2_config
    start_services
    health_check
    show_info
    
    # モニタリングモードの提案
    echo
    read -p "リアルタイムモニタリングを開始しますか？ (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pm2 monit
    fi
}

# 実行
main