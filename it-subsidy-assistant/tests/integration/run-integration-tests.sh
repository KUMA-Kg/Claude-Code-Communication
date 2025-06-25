#!/bin/bash

# Phase 1 統合テスト実行スクリプト
# Worker3 - 統合テスト検証

set -e

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 IT補助金アシスタント Phase 1 統合テスト開始${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# プロジェクトルート
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
TEST_DIR="$PROJECT_ROOT/tests"

# 環境変数設定
export FRONTEND_URL="http://localhost:3000"
export BACKEND_URL="http://localhost:3001"
export NODE_ENV="test"

# 結果ファイル
REPORT_FILE="$PROJECT_ROOT/integration-test-report.md"
LOG_FILE="$PROJECT_ROOT/integration-test.log"

# ログ関数
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# 1. 環境準備
log "\n${BLUE}1. テスト環境準備${NC}"

# バックエンドの環境設定
if [ ! -f "$BACKEND_DIR/.env" ]; then
    log "  ${YELLOW}⚠️ .envファイルが見つかりません。.env.phase1からコピーします${NC}"
    cp "$BACKEND_DIR/.env.phase1" "$BACKEND_DIR/.env"
fi

# 依存関係チェック
log "  📦 依存関係の確認..."
cd "$BACKEND_DIR" && npm install --silent
cd "$FRONTEND_DIR" && npm install --silent

# 2. サーバー起動
log "\n${BLUE}2. サーバー起動${NC}"

# 既存プロセスの終了
log "  🔄 既存プロセスをクリーンアップ..."
pkill -f "node.*server-phase1" || true
pkill -f "vite" || true
sleep 2

# バックエンドサーバー起動
log "  🚀 バックエンドサーバー起動中..."
cd "$BACKEND_DIR"
npm run dev:phase1 > "$PROJECT_ROOT/backend.log" 2>&1 &
BACKEND_PID=$!
log "    PID: $BACKEND_PID"

# フロントエンドサーバー起動
log "  🚀 フロントエンドサーバー起動中..."
cd "$FRONTEND_DIR"
npm run dev > "$PROJECT_ROOT/frontend.log" 2>&1 &
FRONTEND_PID=$!
log "    PID: $FRONTEND_PID"

# サーバー起動待機
log "  ⏳ サーバー起動を待機中..."
sleep 10

# ヘルスチェック
log "  🏥 ヘルスチェック..."
if curl -s "$BACKEND_URL/api/health" > /dev/null; then
    log "    ${GREEN}✓ バックエンドサーバー: 正常${NC}"
else
    log "    ${RED}✗ バックエンドサーバー: 応答なし${NC}"
    cat "$PROJECT_ROOT/backend.log" | tail -20
    exit 1
fi

if curl -s "$FRONTEND_URL" > /dev/null; then
    log "    ${GREEN}✓ フロントエンドサーバー: 正常${NC}"
else
    log "    ${RED}✗ フロントエンドサーバー: 応答なし${NC}"
    cat "$PROJECT_ROOT/frontend.log" | tail -20
    exit 1
fi

# 3. 統合テスト実行
log "\n${BLUE}3. 統合テスト実行${NC}"

# レポート初期化
cat > "$REPORT_FILE" << EOF
# Phase 1 統合テスト結果レポート

実行日時: $(date '+%Y-%m-%d %H:%M:%S')
環境: Development
フロントエンド: $FRONTEND_URL
バックエンド: $BACKEND_URL

## テスト結果サマリー

EOF

# テストカテゴリー
declare -a TEST_CATEGORIES=(
    "phase1-integration.test.js:Phase 1 統合テスト"
    "basic-security.test.js:セキュリティテスト"
    "error-handling.test.js:エラーハンドリングテスト"
)

TOTAL_PASSED=0
TOTAL_FAILED=0

# 各テストカテゴリーを実行
for TEST_SPEC in "${TEST_CATEGORIES[@]}"; do
    TEST_FILE="${TEST_SPEC%%:*}"
    TEST_NAME="${TEST_SPEC##*:}"
    
    log "\n  🧪 ${TEST_NAME} 実行中..."
    echo -e "\n### ${TEST_NAME}\n" >> "$REPORT_FILE"
    
    # テストファイルを探す
    TEST_PATH=$(find "$TEST_DIR" -name "$TEST_FILE" | head -1)
    
    if [ -n "$TEST_PATH" ]; then
        cd "$(dirname "$TEST_PATH")"
        
        # Jestでテスト実行
        if npx jest "$TEST_FILE" --json --outputFile="test-results.json" > test-output.log 2>&1; then
            log "    ${GREEN}✓ テスト成功${NC}"
            
            # 結果をパース
            PASSED=$(jq '.numPassedTests' test-results.json)
            FAILED=$(jq '.numFailedTests' test-results.json)
            TOTAL=$(jq '.numTotalTests' test-results.json)
            
            echo "- 総テスト数: ${TOTAL}" >> "$REPORT_FILE"
            echo "- 成功: ${PASSED} ✅" >> "$REPORT_FILE"
            echo "- 失敗: ${FAILED} ❌" >> "$REPORT_FILE"
            
            TOTAL_PASSED=$((TOTAL_PASSED + PASSED))
            TOTAL_FAILED=$((TOTAL_FAILED + FAILED))
        else
            log "    ${RED}✗ テスト失敗${NC}"
            echo "**テスト失敗** ❌" >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
            tail -50 test-output.log >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
            
            # 失敗詳細をログに記録
            cat test-output.log >> "$LOG_FILE"
        fi
    else
        log "    ${YELLOW}⚠️ テストファイルが見つかりません: $TEST_FILE${NC}"
        echo "**テストファイルが見つかりません** ⚠️" >> "$REPORT_FILE"
    fi
done

# 4. 手動テスト項目の実行
log "\n${BLUE}4. 手動統合テスト項目${NC}"
echo -e "\n## 手動テスト項目\n" >> "$REPORT_FILE"

# API疎通確認
log "  🔌 API疎通確認..."
if curl -s "$BACKEND_URL/api/subsidies" | jq . > /dev/null 2>&1; then
    log "    ${GREEN}✓ /api/subsidies エンドポイント正常${NC}"
    echo "- [x] API疎通確認: /api/subsidies ✅" >> "$REPORT_FILE"
else
    log "    ${RED}✗ /api/subsidies エンドポイント異常${NC}"
    echo "- [ ] API疎通確認: /api/subsidies ❌" >> "$REPORT_FILE"
fi

# CORS確認
log "  🔐 CORS設定確認..."
CORS_HEADER=$(curl -s -I -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/health" | grep -i "access-control-allow-origin")
if [ -n "$CORS_HEADER" ]; then
    log "    ${GREEN}✓ CORS設定正常${NC}"
    echo "- [x] CORS設定確認 ✅" >> "$REPORT_FILE"
else
    log "    ${RED}✗ CORS設定異常${NC}"
    echo "- [ ] CORS設定確認 ❌" >> "$REPORT_FILE"
fi

# 5. 結果サマリー
log "\n${BLUE}5. テスト結果サマリー${NC}"
echo -e "\n## 総合結果\n" >> "$REPORT_FILE"

TOTAL_TESTS=$((TOTAL_PASSED + TOTAL_FAILED))
if [ $TOTAL_FAILED -eq 0 ]; then
    log "  ${GREEN}✅ 全テスト成功！ (${TOTAL_PASSED}/${TOTAL_TESTS})${NC}"
    echo "**結果: 全テスト成功** ✅" >> "$REPORT_FILE"
    echo "- 成功: ${TOTAL_PASSED}" >> "$REPORT_FILE"
    echo "- 失敗: ${TOTAL_FAILED}" >> "$REPORT_FILE"
    RESULT_CODE=0
else
    log "  ${RED}❌ テスト失敗 (${TOTAL_PASSED}/${TOTAL_TESTS})${NC}"
    echo "**結果: テスト失敗** ❌" >> "$REPORT_FILE"
    echo "- 成功: ${TOTAL_PASSED}" >> "$REPORT_FILE"
    echo "- 失敗: ${TOTAL_FAILED}" >> "$REPORT_FILE"
    RESULT_CODE=1
fi

# 6. クリーンアップ
log "\n${BLUE}6. クリーンアップ${NC}"
log "  🧹 プロセス終了中..."

# サーバープロセス終了
kill $BACKEND_PID 2>/dev/null || true
kill $FRONTEND_PID 2>/dev/null || true

log "  ${GREEN}✓ クリーンアップ完了${NC}"

# レポート出力
log "\n${BLUE}📄 統合テストレポート: $REPORT_FILE${NC}"
log "${BLUE}📝 詳細ログ: $LOG_FILE${NC}"

exit $RESULT_CODE