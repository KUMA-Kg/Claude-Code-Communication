#!/bin/bash
# IT補助金アシスタント - 安全な停止スクリプト

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║      IT補助金アシスタント 停止システム      ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# 関数定義
print_status() {
    echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +%H:%M:%S)] ✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[$(date +%H:%M:%S)] ⚠ $1${NC}"
}

# グレースフルシャットダウン
graceful_shutdown() {
    print_status "サービスを安全に停止中..."
    
    # PM2でグレースフル停止
    if command -v pm2 &> /dev/null; then
        # 現在の状態を保存
        pm2 save
        
        # グレースフルに停止
        pm2 stop all --silent || true
        
        print_success "すべてのサービスを停止しました"
        
        # プロセスリストから削除するか確認
        read -p "PM2プロセスリストからも削除しますか？ (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            pm2 delete all --silent || true
            print_success "プロセスリストをクリアしました"
        fi
    else
        print_warning "PM2が見つかりません"
    fi
    
    # ポートが解放されたか確認
    sleep 2
    if lsof -i :3001 &> /dev/null; then
        print_warning "ポート3001がまだ使用中です"
    else
        print_success "ポート3001が解放されました"
    fi
    
    if lsof -i :5173 &> /dev/null; then
        print_warning "ポート5173がまだ使用中です"
    else
        print_success "ポート5173が解放されました"
    fi
}

# ログの保存を提案
save_logs() {
    echo
    read -p "ログを保存しますか？ (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        TIMESTAMP=$(date +%Y%m%d-%H%M%S)
        LOG_ARCHIVE="logs/archive-$TIMESTAMP"
        mkdir -p "$LOG_ARCHIVE"
        
        # PM2ログを保存
        pm2 logs --nostream --lines 1000 > "$LOG_ARCHIVE/pm2-logs.txt" 2>&1 || true
        
        # アプリケーションログをコピー
        cp logs/*.log "$LOG_ARCHIVE/" 2>/dev/null || true
        
        print_success "ログを保存しました: $LOG_ARCHIVE"
    fi
}

# メイン処理
main() {
    graceful_shutdown
    save_logs
    
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║      サービスが停止しました              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
    echo
    echo -e "再起動するには: ${YELLOW}./start.sh${NC}"
    echo
}

# 実行
main