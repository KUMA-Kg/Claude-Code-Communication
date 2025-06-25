#!/bin/bash
# IT補助金アシスタント - 統合テストスクリプト

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# テスト結果
TESTS_PASSED=0
TESTS_FAILED=0

# ログファイル
TEST_LOG="logs/test-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║      IT補助金アシスタント 統合テスト      ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# 関数: テスト結果表示
print_test_result() {
    local test_name=$1
    local result=$2
    local message=$3
    
    if [ "$result" = "pass" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} $test_name - $message"
        ((TESTS_FAILED++))
    fi
}

# 関数: HTTPテスト
test_http_endpoint() {
    local endpoint=$1
    local expected_code=$2
    local test_name=$3
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_code" ]; then
        print_test_result "$test_name" "pass"
    else
        print_test_result "$test_name" "fail" "Expected $expected_code, got $response"
    fi
}

# 関数: レスポンスタイムテスト
test_response_time() {
    local endpoint=$1
    local max_time=$2
    local test_name=$3
    
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "$endpoint" 2>/dev/null || echo "99999")
    response_time_ms=$(echo "$response_time * 1000" | bc | cut -d'.' -f1)
    
    if [ "$response_time_ms" -lt "$max_time" ]; then
        print_test_result "$test_name (${response_time_ms}ms)" "pass"
    else
        print_test_result "$test_name" "fail" "Response time ${response_time_ms}ms exceeds ${max_time}ms"
    fi
}

# 関数: プロセステスト
test_process() {
    local process_name=$1
    local test_name=$2
    
    if pgrep -f "$process_name" > /dev/null; then
        print_test_result "$test_name" "pass"
    else
        print_test_result "$test_name" "fail" "Process not found"
    fi
}

# 関数: ポートテスト
test_port() {
    local port=$1
    local test_name=$2
    
    if lsof -i :$port > /dev/null 2>&1; then
        print_test_result "$test_name" "pass"
    else
        print_test_result "$test_name" "fail" "Port $port not listening"
    fi
}

# 関数: ファイルテスト
test_file_exists() {
    local file=$1
    local test_name=$2
    
    if [ -f "$file" ]; then
        print_test_result "$test_name" "pass"
    else
        print_test_result "$test_name" "fail" "File not found"
    fi
}

# 関数: 環境変数テスト
test_env_var() {
    local var_name=$1
    local test_name=$2
    
    if [ -n "${!var_name}" ]; then
        print_test_result "$test_name" "pass"
    else
        print_test_result "$test_name" "fail" "Environment variable not set"
    fi
}

echo -e "\n${BLUE}▶ 基本チェック${NC}"
test_file_exists "package.json" "プロジェクトルート確認"
test_file_exists "backend/package.json" "Backend package.json"
test_file_exists "frontend/package.json" "Frontend package.json"
test_file_exists "ecosystem.config.js" "PM2設定ファイル"

echo -e "\n${BLUE}▶ プロセステスト${NC}"
test_process "pm2" "PM2プロセス"
test_port 3001 "Backend ポート (3001)"
test_port 5173 "Frontend ポート (5173)"

echo -e "\n${BLUE}▶ HTTPエンドポイントテスト${NC}"
test_http_endpoint "http://localhost:3001/v1/health" "200" "Backend ヘルスチェック"
test_http_endpoint "http://localhost:5173" "200" "Frontend アクセス"
test_http_endpoint "http://localhost:3001/v1/subsidies" "200" "補助金API"

echo -e "\n${BLUE}▶ パフォーマンステスト${NC}"
test_response_time "http://localhost:3001/v1/health" 100 "ヘルスチェック応答時間"
test_response_time "http://localhost:5173" 500 "Frontend初期ロード"

echo -e "\n${BLUE}▶ セキュリティテスト${NC}"
# APIキーが環境変数に設定されているか
if [ -f "backend/.env" ]; then
    source backend/.env
    if [ -n "$JWT_SECRET" ] && [ ${#JWT_SECRET} -ge 32 ]; then
        print_test_result "JWT_SECRET長さ確認" "pass"
    else
        print_test_result "JWT_SECRET長さ確認" "fail" "32文字以上必要"
    fi
fi

# CORS設定テスト
cors_test=$(curl -s -I -X OPTIONS http://localhost:3001/v1/health \
    -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: GET" | grep "Access-Control-Allow-Origin" || echo "")
    
if [ -n "$cors_test" ]; then
    print_test_result "CORS設定" "pass"
else
    print_test_result "CORS設定" "fail" "CORS not configured"
fi

echo -e "\n${BLUE}▶ ログテスト${NC}"
test_file_exists "logs/backend-out.log" "Backend ログファイル"
test_file_exists "logs/frontend-out.log" "Frontend ログファイル"

# エラーログチェック
if [ -f "logs/backend-error.log" ]; then
    error_count=$(wc -l < logs/backend-error.log)
    if [ "$error_count" -eq 0 ]; then
        print_test_result "Backend エラーログ" "pass"
    else
        print_test_result "Backend エラーログ" "fail" "$error_count errors found"
    fi
else
    print_test_result "Backend エラーログ" "pass"
fi

echo -e "\n${BLUE}▶ 機能テスト${NC}"
# AI文書生成エンドポイント
test_http_endpoint "http://localhost:3001/v1/document-magic/suggestions" "401" "AI文書生成API (認証なし)"

# データベース接続テスト
db_health=$(curl -s http://localhost:3001/v1/health | grep -o '"database":[^,}]*' || echo "")
if [[ "$db_health" == *"true"* ]]; then
    print_test_result "データベース接続" "pass"
else
    print_test_result "データベース接続" "fail" "Database not connected"
fi

# 結果サマリー
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}テスト結果サマリー${NC}"
echo -e "合格: ${GREEN}$TESTS_PASSED${NC}"
echo -e "失敗: ${RED}$TESTS_FAILED${NC}"
echo -e "合計: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ すべてのテストが合格しました！${NC}"
    exit 0
else
    echo -e "\n${RED}❌ 一部のテストが失敗しました${NC}"
    echo -e "詳細はログを確認してください: $TEST_LOG"
    exit 1
fi