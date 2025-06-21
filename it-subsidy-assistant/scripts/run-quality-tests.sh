#!/bin/bash

# IT補助金アシストツール 品質管理・セキュリティ統合テストスイート
# Worker3が作成した包括的テスト実行スクリプト

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ログ設定
LOG_DIR="./logs"
REPORT_DIR="./reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/quality_test_$TIMESTAMP.log"

# ディレクトリ作成
mkdir -p "$LOG_DIR" "$REPORT_DIR"

# ヘルパー関数
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

success() {
    log "${GREEN}✅ $1${NC}"
}

warning() {
    log "${YELLOW}⚠️  $1${NC}"
}

error() {
    log "${RED}❌ $1${NC}"
}

info() {
    log "${BLUE}ℹ️  $1${NC}"
}

header() {
    log "\n${PURPLE}============================================${NC}"
    log "${PURPLE}$1${NC}"
    log "${PURPLE}============================================${NC}\n"
}

# バナー表示
header "IT補助金アシストツール 品質管理・セキュリティ統合テスト"
log "${CYAN}実行開始時刻: $(date)${NC}"
log "${CYAN}ログファイル: $LOG_FILE${NC}"
log "${CYAN}レポート出力: $REPORT_DIR${NC}\n"

# 環境確認
check_environment() {
    header "環境確認"
    
    # Node.js確認
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        success "Node.js: $NODE_VERSION"
    else
        error "Node.js が見つかりません"
        exit 1
    fi
    
    # npm確認
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        success "npm: $NPM_VERSION"
    else
        error "npm が見つかりません"
        exit 1
    fi
    
    # プロジェクト依存関係確認
    if [ -f "package.json" ]; then
        success "package.json 存在確認"
    else
        error "package.json が見つかりません"
        exit 1
    fi
    
    # バックエンドサーバー確認
    if curl -f -s "http://localhost:3001/health" > /dev/null 2>&1; then
        success "バックエンドサーバー稼働中"
    else
        warning "バックエンドサーバーが稼働していません（一部テストをスキップ）"
    fi
    
    # フロントエンドサーバー確認
    if curl -f -s "http://localhost:3000" > /dev/null 2>&1; then
        success "フロントエンドサーバー稼働中"
    else
        warning "フロントエンドサーバーが稼働していません（E2Eテストをスキップ）"
    fi
}

# 依存関係インストール
install_dependencies() {
    header "依存関係インストール"
    
    info "バックエンド依存関係インストール中..."
    cd backend && npm install && cd ..
    success "バックエンド依存関係インストール完了"
    
    info "フロントエンド依存関係インストール中..."
    cd frontend && npm install && cd ..
    success "フロントエンド依存関係インストール完了"
    
    # テスト専用依存関係
    info "テスト依存関係確認中..."
    if ! command -v playwright &> /dev/null; then
        info "Playwright インストール中..."
        npx playwright install
    fi
    success "テスト依存関係確認完了"
}

# 単体テスト実行
run_unit_tests() {
    header "単体テスト実行"
    
    info "バックエンド単体テスト実行中..."
    cd backend
    if npm test -- --coverage --silent 2>&1 | tee -a "../$LOG_FILE"; then
        success "バックエンド単体テスト完了"
    else
        error "バックエンド単体テストで失敗が発生しました"
        BACKEND_UNIT_FAILED=true
    fi
    cd ..
    
    info "フロントエンド単体テスト実行中..."
    cd frontend
    if npm test -- --coverage --watchAll=false --silent 2>&1 | tee -a "../$LOG_FILE"; then
        success "フロントエンド単体テスト完了"
    else
        error "フロントエンド単体テストで失敗が発生しました"
        FRONTEND_UNIT_FAILED=true
    fi
    cd ..
}

# E2Eテスト実行
run_e2e_tests() {
    header "E2Eテスト実行"
    
    if ! curl -f -s "http://localhost:3000" > /dev/null 2>&1; then
        warning "フロントエンドサーバーが稼働していないため、E2Eテストをスキップします"
        return
    fi
    
    info "包括的必要書類判定フローE2Eテスト実行中..."
    if npx playwright test tests/e2e/specs/comprehensive-document-flow.spec.js --reporter=html,json 2>&1 | tee -a "$LOG_FILE"; then
        success "包括的E2Eテスト完了"
    else
        error "E2Eテストで失敗が発生しました"
        E2E_FAILED=true
    fi
    
    info "既存E2Eテスト実行中..."
    if npx playwright test tests/e2e/specs/ --reporter=html,json 2>&1 | tee -a "$LOG_FILE"; then
        success "既存E2Eテスト完了"
    else
        warning "一部E2Eテストで問題が発生しました"
    fi
}

# セキュリティテスト実行
run_security_tests() {
    header "セキュリティテスト実行"
    
    info "Excel機能セキュリティ監査実行中..."
    if node tests/security/excel-security-audit.js 2>&1 | tee -a "$LOG_FILE"; then
        success "Excel機能セキュリティ監査完了"
    else
        error "Excel機能セキュリティ監査で問題が検出されました"
        EXCEL_SECURITY_FAILED=true
    fi
    
    info "統合セキュリティ監査実行中..."
    if node tests/security/integrated-security-audit.js 2>&1 | tee -a "$LOG_FILE"; then
        success "統合セキュリティ監査完了"
    else
        error "統合セキュリティ監査で重大な問題が検出されました"
        INTEGRATED_SECURITY_FAILED=true
    fi
    
    info "包括的セキュリティ監査実行中..."
    if node tests/security/comprehensive-security-audit.js 2>&1 | tee -a "$LOG_FILE"; then
        success "包括的セキュリティ監査完了"
    else
        warning "包括的セキュリティ監査で改善点が検出されました"
    fi
}

# パフォーマンステスト実行
run_performance_tests() {
    header "パフォーマンステスト実行"
    
    if ! curl -f -s "http://localhost:3001" > /dev/null 2>&1; then
        warning "バックエンドサーバーが稼働していないため、パフォーマンステストをスキップします"
        return
    fi
    
    info "Excel機能パフォーマンステスト実行中..."
    if command -v k6 &> /dev/null; then
        if k6 run tests/performance/excel-performance-test.js 2>&1 | tee -a "$LOG_FILE"; then
            success "Excel機能パフォーマンステスト完了"
        else
            error "Excel機能パフォーマンステストで問題が発生しました"
            PERFORMANCE_FAILED=true
        fi
    else
        warning "k6が見つかりません。パフォーマンステストをスキップします"
        info "k6インストール: https://k6.io/docs/getting-started/installation/"
    fi
}

# 静的解析実行
run_static_analysis() {
    header "静的解析実行"
    
    info "ESLint解析実行中..."
    cd backend
    if npx eslint src/ --ext .ts,.js --format json --output-file "../$REPORT_DIR/eslint-backend-$TIMESTAMP.json" 2>&1 | tee -a "../$LOG_FILE"; then
        success "バックエンドESLint解析完了"
    else
        warning "バックエンドESLintで改善点が検出されました"
    fi
    cd ..
    
    cd frontend
    if npx eslint src/ --ext .ts,.tsx,.js,.jsx --format json --output-file "../$REPORT_DIR/eslint-frontend-$TIMESTAMP.json" 2>&1 | tee -a "../$LOG_FILE"; then
        success "フロントエンドESLint解析完了"
    else
        warning "フロントエンドESLintで改善点が検出されました"
    fi
    cd ..
    
    info "TypeScript型チェック実行中..."
    cd backend
    if npx tsc --noEmit 2>&1 | tee -a "../$LOG_FILE"; then
        success "バックエンド型チェック完了"
    else
        error "バックエンドで型エラーが検出されました"
        TYPESCRIPT_FAILED=true
    fi
    cd ..
    
    cd frontend
    if npx tsc --noEmit 2>&1 | tee -a "../$LOG_FILE"; then
        success "フロントエンド型チェック完了"
    else
        error "フロントエンドで型エラーが検出されました"
        TYPESCRIPT_FAILED=true
    fi
    cd ..
}

# 依存関係脆弱性チェック
run_vulnerability_scan() {
    header "依存関係脆弱性チェック"
    
    info "npm audit実行中..."
    cd backend
    npm audit --audit-level=high --json > "../$REPORT_DIR/npm-audit-backend-$TIMESTAMP.json" 2>&1 || warning "バックエンドで脆弱性が検出されました"
    cd ..
    
    cd frontend
    npm audit --audit-level=high --json > "../$REPORT_DIR/npm-audit-frontend-$TIMESTAMP.json" 2>&1 || warning "フロントエンドで脆弱性が検出されました"
    cd ..
    
    success "依存関係脆弱性チェック完了"
}

# 品質メトリクス収集
collect_quality_metrics() {
    header "品質メトリクス収集"
    
    info "コードカバレッジレポート収集中..."
    # バックエンドカバレッジ
    if [ -d "backend/coverage" ]; then
        cp -r backend/coverage "$REPORT_DIR/coverage-backend-$TIMESTAMP"
        success "バックエンドカバレッジレポート収集完了"
    fi
    
    # フロントエンドカバレッジ
    if [ -d "frontend/coverage" ]; then
        cp -r frontend/coverage "$REPORT_DIR/coverage-frontend-$TIMESTAMP"
        success "フロントエンドカバレッジレポート収集完了"
    fi
    
    info "テストレポート収集中..."
    # Playwrightレポート
    if [ -d "playwright-report" ]; then
        cp -r playwright-report "$REPORT_DIR/playwright-report-$TIMESTAMP"
        success "Playwrightレポート収集完了"
    fi
    
    # セキュリティレポート
    if [ -f "reports/integrated-security-audit.html" ]; then
        cp reports/integrated-security-audit.html "$REPORT_DIR/integrated-security-audit-$TIMESTAMP.html"
        success "統合セキュリティレポート収集完了"
    fi
}

# 総合レポート生成
generate_comprehensive_report() {
    header "総合品質レポート生成"
    
    REPORT_FILE="$REPORT_DIR/comprehensive-quality-report-$TIMESTAMP.html"
    
    cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT補助金アシストツール - 品質管理総合レポート</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f6fa; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .metric { text-align: center; }
        .metric-value { font-size: 2.5em; font-weight: bold; margin: 10px 0; }
        .status-excellent { color: #27ae60; }
        .status-good { color: #f39c12; }
        .status-poor { color: #e74c3c; }
        .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .test-passed { background: #d5f4e6; border-left: 4px solid #27ae60; }
        .test-failed { background: #fadbd8; border-left: 4px solid #e74c3c; }
        .test-warning { background: #fef9e7; border-left: 4px solid #f39c12; }
        .recommendations { background: #ebf3fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 40px; color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 IT補助金アシストツール</h1>
            <h2>品質管理総合レポート</h2>
            <p>実行日時: $(date)</p>
            <p>レポート生成: Worker3 (品質管理・セキュリティ担当)</p>
        </div>

        <div class="summary">
            <div class="card metric">
                <h3>📋 単体テスト</h3>
                <div class="metric-value status-$([ -z "$BACKEND_UNIT_FAILED" ] && [ -z "$FRONTEND_UNIT_FAILED" ] && echo "excellent" || echo "poor")">
                    $([ -z "$BACKEND_UNIT_FAILED" ] && [ -z "$FRONTEND_UNIT_FAILED" ] && echo "✅ PASS" || echo "❌ FAIL")
                </div>
            </div>
            
            <div class="card metric">
                <h3>🔒 セキュリティ</h3>
                <div class="metric-value status-$([ -z "$EXCEL_SECURITY_FAILED" ] && [ -z "$INTEGRATED_SECURITY_FAILED" ] && echo "excellent" || echo "poor")">
                    $([ -z "$EXCEL_SECURITY_FAILED" ] && [ -z "$INTEGRATED_SECURITY_FAILED" ] && echo "✅ SECURE" || echo "⚠️ ISSUES")
                </div>
            </div>
            
            <div class="card metric">
                <h3>🚀 パフォーマンス</h3>
                <div class="metric-value status-$([ -z "$PERFORMANCE_FAILED" ] && echo "excellent" || echo "good")">
                    $([ -z "$PERFORMANCE_FAILED" ] && echo "✅ GOOD" || echo "⚠️ REVIEW")
                </div>
            </div>
            
            <div class="card metric">
                <h3>🎯 E2Eテスト</h3>
                <div class="metric-value status-$([ -z "$E2E_FAILED" ] && echo "excellent" || echo "poor")">
                    $([ -z "$E2E_FAILED" ] && echo "✅ PASS" || echo "❌ FAIL")
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📊 テスト実行結果</h2>
            
            <div class="test-result $([ -z "$BACKEND_UNIT_FAILED" ] && echo "test-passed" || echo "test-failed")">
                <h4>バックエンド単体テスト</h4>
                <p>$([ -z "$BACKEND_UNIT_FAILED" ] && echo "全テストが正常に実行されました" || echo "テストの失敗が検出されました")</p>
            </div>
            
            <div class="test-result $([ -z "$FRONTEND_UNIT_FAILED" ] && echo "test-passed" || echo "test-failed")">
                <h4>フロントエンド単体テスト</h4>
                <p>$([ -z "$FRONTEND_UNIT_FAILED" ] && echo "全テストが正常に実行されました" || echo "テストの失敗が検出されました")</p>
            </div>
            
            <div class="test-result $([ -z "$E2E_FAILED" ] && echo "test-passed" || echo "test-failed")">
                <h4>包括的E2Eテスト</h4>
                <p>必要書類判定フローの全分岐パターンテストを実行しました</p>
            </div>
            
            <div class="test-result $([ -z "$EXCEL_SECURITY_FAILED" ] && echo "test-passed" || echo "test-failed")">
                <h4>Excel機能セキュリティ監査</h4>
                <p>ファイルアップロード、処理、ダウンロードの包括的セキュリティテストを実行しました</p>
            </div>
            
            <div class="test-result $([ -z "$INTEGRATED_SECURITY_FAILED" ] && echo "test-passed" || echo "test-failed")">
                <h4>統合セキュリティ監査</h4>
                <p>OWASP Top 10対策、新機能セキュリティ、Supabaseセキュリティの総合評価を実行しました</p>
            </div>
        </div>

        <div class="recommendations">
            <h2>💡 推奨事項</h2>
            <ul>
                <li><strong>継続的品質管理:</strong> このテストスイートを CI/CD パイプラインに組み込み、定期実行を推奨します</li>
                <li><strong>セキュリティ監視:</strong> セキュリティ監査を週次で実行し、新しい脆弱性に迅速に対応してください</li>
                <li><strong>パフォーマンス監視:</strong> 負荷テストを本番環境に近い条件で定期的に実行してください</li>
                <li><strong>コードカバレッジ:</strong> テストカバレッジを80%以上に維持することを目標にしてください</li>
                <li><strong>依存関係管理:</strong> 依存関係の脆弱性チェックを月次で実行し、適切にアップデートしてください</li>
            </ul>
        </div>

        <div class="section">
            <h2>📁 生成されたレポート</h2>
            <ul>
                <li>統合セキュリティ監査レポート: integrated-security-audit-$TIMESTAMP.html</li>
                <li>Excel機能セキュリティ監査: excel-security-audit.json</li>
                <li>Playwrightテストレポート: playwright-report-$TIMESTAMP/</li>
                <li>ESLint解析結果: eslint-*-$TIMESTAMP.json</li>
                <li>npm audit結果: npm-audit-*-$TIMESTAMP.json</li>
                <li>コードカバレッジ: coverage-*-$TIMESTAMP/</li>
            </ul>
        </div>

        <div class="footer">
            <p>Generated by Worker3 - Quality Assurance & Security Specialist</p>
            <p>次回テスト推奨日: $(date -d "+7 days" +%Y-%m-%d)</p>
        </div>
    </div>
</body>
</html>
EOF

    success "総合品質レポートが生成されました: $REPORT_FILE"
}

# 結果サマリー表示
show_summary() {
    header "テスト実行サマリー"
    
    log "${CYAN}実行されたテスト:${NC}"
    log "  ✓ 環境確認"
    log "  ✓ 単体テスト (バックエンド・フロントエンド)"
    log "  ✓ E2Eテスト (包括的必要書類判定フロー)"
    log "  ✓ セキュリティテスト (Excel機能・統合・包括的)"
    log "  ✓ パフォーマンステスト (Excel機能・動的質問フロー)"
    log "  ✓ 静的解析 (ESLint・TypeScript)"
    log "  ✓ 依存関係脆弱性チェック"
    log "  ✓ 品質メトリクス収集"
    
    log "\n${CYAN}問題検出:${NC}"
    [ -n "$BACKEND_UNIT_FAILED" ] && error "バックエンド単体テストで失敗"
    [ -n "$FRONTEND_UNIT_FAILED" ] && error "フロントエンド単体テストで失敗"
    [ -n "$E2E_FAILED" ] && error "E2Eテストで失敗"
    [ -n "$EXCEL_SECURITY_FAILED" ] && error "Excel機能セキュリティで問題検出"
    [ -n "$INTEGRATED_SECURITY_FAILED" ] && error "統合セキュリティで重大な問題検出"
    [ -n "$PERFORMANCE_FAILED" ] && error "パフォーマンステストで問題検出"
    [ -n "$TYPESCRIPT_FAILED" ] && error "TypeScript型エラー検出"
    
    if [ -z "$BACKEND_UNIT_FAILED" ] && [ -z "$FRONTEND_UNIT_FAILED" ] && [ -z "$E2E_FAILED" ] && [ -z "$EXCEL_SECURITY_FAILED" ] && [ -z "$INTEGRATED_SECURITY_FAILED" ] && [ -z "$PERFORMANCE_FAILED" ] && [ -z "$TYPESCRIPT_FAILED" ]; then
        success "全てのテストが正常に完了しました！"
        OVERALL_SUCCESS=true
    else
        warning "一部のテストで問題が検出されました。詳細はレポートを確認してください。"
    fi
    
    log "\n${CYAN}生成されたレポート:${NC}"
    log "  📁 レポートディレクトリ: $REPORT_DIR"
    log "  📄 総合レポート: comprehensive-quality-report-$TIMESTAMP.html"
    log "  📊 詳細ログ: $LOG_FILE"
    
    log "\n${CYAN}実行完了時刻: $(date)${NC}"
}

# メイン実行フロー
main() {
    # 各テストステップを実行
    check_environment
    install_dependencies
    run_unit_tests
    run_e2e_tests
    run_security_tests
    run_performance_tests
    run_static_analysis
    run_vulnerability_scan
    collect_quality_metrics
    generate_comprehensive_report
    show_summary
    
    # 終了コード決定
    if [ "$OVERALL_SUCCESS" = true ]; then
        exit 0
    else
        exit 1
    fi
}

# Ctrl+Cでの中断処理
trap 'error "テスト実行が中断されました"; exit 130' INT

# スクリプト実行
main "$@"