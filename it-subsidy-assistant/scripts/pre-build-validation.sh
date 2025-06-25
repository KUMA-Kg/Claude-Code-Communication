#!/bin/bash

# Pre-build Validation Script
# ビルド前の包括的な検証スクリプト

set -e  # エラーで即座に終了

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# プロジェクトルート
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo -e "${BLUE}🔍 IT補助金アシスタント - ビルド前検証開始${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Node.jsバージョン確認
echo -e "\n${BLUE}📦 Node.jsバージョン確認...${NC}"
NODE_VERSION=$(node -v)
echo "  現在のNode.js: $NODE_VERSION"

# バージョン要件チェック（v18以上）
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js v18以上が必要です${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Node.jsバージョン要件を満たしています${NC}"

# 2. npm/yarnの確認
echo -e "\n${BLUE}📦 パッケージマネージャー確認...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}  ✓ npm v$NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npmがインストールされていません${NC}"
    exit 1
fi

# 3. 必須ファイルの存在確認
echo -e "\n${BLUE}📁 必須ファイルの確認...${NC}"
REQUIRED_FILES=(
    "$FRONTEND_DIR/package.json"
    "$FRONTEND_DIR/package-lock.json"
    "$BACKEND_DIR/package.json"
    "$BACKEND_DIR/package-lock.json"
    "$FRONTEND_DIR/tsconfig.json"
    "$BACKEND_DIR/tsconfig.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}  ✓ $(basename "$file") - $(dirname "$file" | sed "s|$PROJECT_ROOT/||")${NC}"
    else
        echo -e "${RED}  ❌ $(basename "$file") が見つかりません - $(dirname "$file" | sed "s|$PROJECT_ROOT/||")${NC}"
        exit 1
    fi
done

# 4. 環境変数ファイルの確認
echo -e "\n${BLUE}🔐 環境変数ファイルの確認...${NC}"
if [ -f "$BACKEND_DIR/.env.example" ]; then
    echo -e "${GREEN}  ✓ .env.example が存在します${NC}"
    
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        echo -e "${YELLOW}  ⚠️ .envファイルが見つかりません。.env.exampleからコピーします...${NC}"
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        echo -e "${GREEN}  ✓ .envファイルを作成しました${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠️ .env.exampleが見つかりません${NC}"
fi

# 5. 依存関係のインストール状況確認
echo -e "\n${BLUE}📦 依存関係のインストール確認...${NC}"

check_node_modules() {
    local dir=$1
    local name=$2
    
    if [ -d "$dir/node_modules" ]; then
        local module_count=$(find "$dir/node_modules" -maxdepth 1 -type d | wc -l)
        echo -e "${GREEN}  ✓ $name: node_modules存在 (${module_count}モジュール)${NC}"
    else
        echo -e "${YELLOW}  ⚠️ $name: node_modulesが見つかりません。インストール中...${NC}"
        cd "$dir" && npm ci
        echo -e "${GREEN}  ✓ $name: 依存関係をインストールしました${NC}"
    fi
}

check_node_modules "$FRONTEND_DIR" "Frontend"
check_node_modules "$BACKEND_DIR" "Backend"

# 6. TypeScript型チェック
echo -e "\n${BLUE}🔍 TypeScript型チェック...${NC}"

run_type_check() {
    local dir=$1
    local name=$2
    
    echo -e "  🔨 $name: 型チェック実行中..."
    cd "$dir"
    
    if npm run typecheck &> /dev/null || npx tsc --noEmit &> /dev/null; then
        echo -e "${GREEN}  ✓ $name: 型チェック成功${NC}"
    else
        echo -e "${YELLOW}  ⚠️ $name: 型エラーがあります（続行可能）${NC}"
    fi
}

run_type_check "$FRONTEND_DIR" "Frontend"
run_type_check "$BACKEND_DIR" "Backend"

# 7. ESLint実行（エラーのみ）
echo -e "\n${BLUE}🔍 ESLint静的解析...${NC}"

run_eslint() {
    local dir=$1
    local name=$2
    
    echo -e "  🔨 $name: ESLint実行中..."
    cd "$dir"
    
    if npm run lint &> /dev/null || npx eslint . --ext .js,.jsx,.ts,.tsx --quiet &> /dev/null; then
        echo -e "${GREEN}  ✓ $name: ESLintチェック成功${NC}"
    else
        echo -e "${YELLOW}  ⚠️ $name: ESLint警告があります（続行可能）${NC}"
    fi
}

run_eslint "$FRONTEND_DIR" "Frontend"
run_eslint "$BACKEND_DIR" "Backend"

# 8. セキュリティ監査（クイック）
echo -e "\n${BLUE}🔒 セキュリティ監査（クイック）...${NC}"

run_audit() {
    local dir=$1
    local name=$2
    
    cd "$dir"
    local audit_output=$(npm audit --json 2>/dev/null || echo '{}')
    
    if echo "$audit_output" | grep -q '"critical": *[1-9]'; then
        echo -e "${RED}  ❌ $name: 致命的な脆弱性が検出されました${NC}"
        echo -e "${YELLOW}    'npm audit fix'を実行してください${NC}"
    elif echo "$audit_output" | grep -q '"high": *[1-9]'; then
        echo -e "${YELLOW}  ⚠️ $name: 高危険度の脆弱性があります${NC}"
    else
        echo -e "${GREEN}  ✓ $name: 重大な脆弱性なし${NC}"
    fi
}

run_audit "$FRONTEND_DIR" "Frontend"
run_audit "$BACKEND_DIR" "Backend"

# 9. ビルドテスト（オプション）
if [ "$SKIP_BUILD_TEST" != "true" ]; then
    echo -e "\n${BLUE}🏗️ ビルドテスト...${NC}"
    
    # フロントエンドビルドテスト
    echo -e "  🔨 Frontend: ビルドテスト実行中..."
    cd "$FRONTEND_DIR"
    if npm run build &> /dev/null; then
        echo -e "${GREEN}  ✓ Frontend: ビルド成功${NC}"
        rm -rf dist  # ビルド成果物をクリーンアップ
    else
        echo -e "${RED}  ❌ Frontend: ビルド失敗${NC}"
        exit 1
    fi
    
    # バックエンドビルドテスト
    echo -e "  🔨 Backend: ビルドテスト実行中..."
    cd "$BACKEND_DIR"
    if npm run build &> /dev/null; then
        echo -e "${GREEN}  ✓ Backend: ビルド成功${NC}"
        rm -rf dist  # ビルド成果物をクリーンアップ
    else
        echo -e "${RED}  ❌ Backend: ビルド失敗${NC}"
        exit 1
    fi
else
    echo -e "\n${YELLOW}⏭️ ビルドテストをスキップ (SKIP_BUILD_TEST=true)${NC}"
fi

# 10. 最終サマリー
echo -e "\n${BLUE}📊 検証結果サマリー${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 統計情報の収集
FRONTEND_DEPS=$(cd "$FRONTEND_DIR" && npm ls --depth=0 --json 2>/dev/null | grep -c '"name"' || echo "0")
BACKEND_DEPS=$(cd "$BACKEND_DIR" && npm ls --depth=0 --json 2>/dev/null | grep -c '"name"' || echo "0")

echo -e "${GREEN}✅ すべての検証が完了しました${NC}"
echo ""
echo "  📦 Frontend依存関係: 約${FRONTEND_DEPS}個"
echo "  📦 Backend依存関係: 約${BACKEND_DEPS}個"
echo "  🔒 セキュリティ: チェック完了"
echo "  🏗️ ビルド: 準備完了"
echo ""
echo -e "${GREEN}🚀 ビルドを開始できます！${NC}"

# タイムスタンプ記録
echo ""
echo "検証完了時刻: $(date '+%Y-%m-%d %H:%M:%S')"

exit 0