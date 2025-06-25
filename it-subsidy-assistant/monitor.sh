#!/bin/bash
# IT補助金アシスタント - リアルタイム品質監視システム

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 監視設定
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:5173"
CHECK_INTERVAL=5  # 秒
LOG_DIR="logs/monitoring"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=80
ALERT_THRESHOLD_RESPONSE_TIME=1000  # ミリ秒

# ログディレクトリ作成
mkdir -p "$LOG_DIR"

# 監視ログファイル
MONITOR_LOG="$LOG_DIR/monitor-$(date +%Y%m%d).log"

# アラート履歴
declare -A ALERT_HISTORY

# 関数: ヘッダー表示
show_header() {
    clear
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║         IT補助金アシスタント - リアルタイム監視          ║"
    echo "║                  $(date +"%Y-%m-%d %H:%M:%S")                  ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 関数: ステータスアイコン取得
get_status_icon() {
    local status=$1
    if [ "$status" = "healthy" ]; then
        echo -e "${GREEN}●${NC}"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}▲${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
}

# 関数: プログレスバー表示
show_progress_bar() {
    local percent=$1
    local width=20
    local filled=$((percent * width / 100))
    local empty=$((width - filled))
    
    printf "["
    if [ $percent -lt 50 ]; then
        printf "${GREEN}"
    elif [ $percent -lt 80 ]; then
        printf "${YELLOW}"
    else
        printf "${RED}"
    fi
    
    printf "%${filled}s" | tr ' ' '█'
    printf "${NC}"
    printf "%${empty}s" | tr ' ' '░'
    printf "] %3d%%" $percent
}

# 関数: ヘルスチェック
check_health() {
    local url=$1
    local service=$2
    local start_time=$(date +%s%N)
    
    if response=$(curl -s -w "\n%{http_code}" "$url/v1/health" 2>/dev/null); then
        local end_time=$(date +%s%N)
        local response_time=$(((end_time - start_time) / 1000000))
        local http_code=$(echo "$response" | tail -n 1)
        local body=$(echo "$response" | head -n -1)
        
        if [ "$http_code" = "200" ]; then
            echo "healthy|$response_time|$body"
        else
            echo "unhealthy|$response_time|HTTP $http_code"
        fi
    else
        echo "down|0|Connection failed"
    fi
}

# 関数: システムリソース監視
check_system_resources() {
    if command -v pm2 &> /dev/null; then
        local pm2_data=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name | contains("it-subsidy")) | {name: .name, cpu: .monit.cpu, memory: .monit.memory, status: .pm2_env.status}' 2>/dev/null)
        echo "$pm2_data"
    fi
}

# 関数: ログ分析
analyze_logs() {
    local error_count=0
    local warning_count=0
    
    if [ -f "logs/backend-error.log" ]; then
        error_count=$(tail -n 100 logs/backend-error.log 2>/dev/null | grep -c "ERROR" || echo 0)
        warning_count=$(tail -n 100 logs/backend-error.log 2>/dev/null | grep -c "WARN" || echo 0)
    fi
    
    echo "$error_count|$warning_count"
}

# 関数: アラート送信
send_alert() {
    local severity=$1
    local service=$2
    local message=$3
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    # アラートの重複チェック
    local alert_key="${service}_${message}"
    if [ "${ALERT_HISTORY[$alert_key]}" != "" ]; then
        local last_alert_time=${ALERT_HISTORY[$alert_key]}
        local current_time=$(date +%s)
        if [ $((current_time - last_alert_time)) -lt 300 ]; then
            return  # 5分以内の同じアラートは無視
        fi
    fi
    
    ALERT_HISTORY[$alert_key]=$(date +%s)
    
    # ログに記録
    echo "[$timestamp] [$severity] $service: $message" >> "$MONITOR_LOG"
    
    # コンソールに表示
    if [ "$severity" = "ERROR" ]; then
        echo -e "\n${RED}⚠️  アラート: $message${NC}"
    else
        echo -e "\n${YELLOW}⚠  警告: $message${NC}"
    fi
    
    # 音声アラート（macOS）
    if [[ "$OSTYPE" == "darwin"* ]] && [ "$severity" = "ERROR" ]; then
        say "Alert: $service $message" &
    fi
}

# 関数: ダッシュボード表示
show_dashboard() {
    local backend_health=$(check_health "$BACKEND_URL" "Backend")
    local frontend_health=$(check_health "$FRONTEND_URL" "Frontend")
    local log_analysis=$(analyze_logs)
    local system_resources=$(check_system_resources)
    
    # ヘルスデータ解析
    IFS='|' read -r backend_status backend_time backend_msg <<< "$backend_health"
    IFS='|' read -r frontend_status frontend_time frontend_msg <<< "$frontend_health"
    IFS='|' read -r error_count warning_count <<< "$log_analysis"
    
    # ダッシュボード表示
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}▶ サービス状態${NC}"
    echo -e "  Backend:  $(get_status_icon $backend_status) $backend_status (${backend_time}ms)"
    echo -e "  Frontend: $(get_status_icon $frontend_status) $frontend_status (${frontend_time}ms)"
    
    echo -e "\n${MAGENTA}▶ システムリソース${NC}"
    if [ -n "$system_resources" ]; then
        echo "$system_resources" | while IFS= read -r line; do
            if [ -n "$line" ]; then
                local name=$(echo "$line" | jq -r '.name' 2>/dev/null)
                local cpu=$(echo "$line" | jq -r '.cpu' 2>/dev/null)
                local memory=$(echo "$line" | jq -r '.memory' 2>/dev/null)
                local status=$(echo "$line" | jq -r '.status' 2>/dev/null)
                
                if [ "$name" != "null" ]; then
                    local memory_mb=$((memory / 1024 / 1024))
                    echo -e "  $name:"
                    echo -n "    CPU:    "
                    show_progress_bar ${cpu%.*}
                    echo
                    echo -e "    Memory: ${memory_mb}MB"
                    echo -e "    Status: $status"
                fi
            fi
        done
    else
        echo "  PM2データ取得不可"
    fi
    
    echo -e "\n${MAGENTA}▶ ログ分析（直近100行）${NC}"
    echo -e "  エラー:   ${RED}$error_count${NC}"
    echo -e "  警告:     ${YELLOW}$warning_count${NC}"
    
    echo -e "\n${MAGENTA}▶ アラート閾値${NC}"
    echo -e "  CPU使用率:      ${ALERT_THRESHOLD_CPU}%"
    echo -e "  メモリ使用率:   ${ALERT_THRESHOLD_MEMORY}%"
    echo -e "  応答時間:       ${ALERT_THRESHOLD_RESPONSE_TIME}ms"
    
    # アラートチェック
    if [ "$backend_status" = "down" ]; then
        send_alert "ERROR" "Backend" "サービスがダウンしています"
    elif [ $backend_time -gt $ALERT_THRESHOLD_RESPONSE_TIME ]; then
        send_alert "WARNING" "Backend" "応答時間が遅い: ${backend_time}ms"
    fi
    
    if [ "$frontend_status" = "down" ]; then
        send_alert "ERROR" "Frontend" "サービスがダウンしています"
    fi
    
    if [ $error_count -gt 10 ]; then
        send_alert "WARNING" "Logs" "エラーが多発しています: $error_count件"
    fi
}

# 関数: 詳細モード
detailed_mode() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}▶ 詳細ログ（最新5件）${NC}"
    
    if [ -f "logs/backend-out.log" ]; then
        echo -e "${BLUE}Backend:${NC}"
        tail -n 5 logs/backend-out.log | sed 's/^/  /'
    fi
    
    if [ -f "logs/backend-error.log" ] && [ -s "logs/backend-error.log" ]; then
        echo -e "\n${RED}Backend Errors:${NC}"
        tail -n 3 logs/backend-error.log | sed 's/^/  /'
    fi
}

# 関数: キー入力処理
handle_input() {
    read -t 0.1 -n 1 key
    case $key in
        q|Q) return 1 ;;
        d|D) SHOW_DETAILS=true ;;
        c|C) SHOW_DETAILS=false; clear ;;
        r|R) clear ;;
    esac
    return 0
}

# メイン監視ループ
monitor_loop() {
    SHOW_DETAILS=false
    
    echo -e "${GREEN}監視を開始しました。${NC}"
    echo -e "コマンド: [${YELLOW}d${NC}]詳細 [${YELLOW}c${NC}]クリア [${YELLOW}r${NC}]更新 [${YELLOW}q${NC}]終了"
    echo
    
    while true; do
        show_header
        show_dashboard
        
        if [ "$SHOW_DETAILS" = true ]; then
            detailed_mode
        fi
        
        echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "次回更新: ${CHECK_INTERVAL}秒後 | [d]詳細 [c]クリア [r]更新 [q]終了"
        
        # キー入力待機
        for ((i=0; i<$CHECK_INTERVAL*10; i++)); do
            if ! handle_input; then
                echo -e "\n${GREEN}監視を終了しました。${NC}"
                return
            fi
            sleep 0.1
        done
    done
}

# エクスポート機能
export_report() {
    local report_file="$LOG_DIR/health-report-$(date +%Y%m%d-%H%M%S).txt"
    {
        echo "IT補助金アシスタント - ヘルスレポート"
        echo "生成日時: $(date)"
        echo "=================================="
        echo
        show_dashboard
        echo
        echo "=================================="
        echo "監視ログ: $MONITOR_LOG"
    } > "$report_file"
    
    echo -e "${GREEN}レポートを保存しました: $report_file${NC}"
}

# メインメニュー
main_menu() {
    clear
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║       IT補助金アシスタント - 品質監視システム            ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo
    echo "1) リアルタイム監視を開始"
    echo "2) ヘルスチェック（1回のみ）"
    echo "3) レポートをエクスポート"
    echo "4) PM2モニターを開く"
    echo "5) 終了"
    echo
    read -p "選択してください [1-5]: " choice
    
    case $choice in
        1) monitor_loop ;;
        2) show_dashboard; echo; read -p "Enterキーで続行..." ;;
        3) export_report; read -p "Enterキーで続行..." ;;
        4) pm2 monit ;;
        5) exit 0 ;;
        *) echo "無効な選択です"; sleep 1 ;;
    esac
}

# 実行
while true; do
    main_menu
done