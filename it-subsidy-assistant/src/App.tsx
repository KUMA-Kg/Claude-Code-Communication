import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { FileText, Target, Building, Menu, FileSpreadsheet, Workflow } from 'lucide-react';
import QuestionnaireDemo from './components/QuestionnaireDemo';
import SubsidyApplicationGuide from './components/SubsidyApplicationGuide';
import ExcelProcessor from './components/ExcelProcessor';
import SubsidyFlowManager from './components/SubsidyFlowManager';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* ナビゲーションバー */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-3">
                  <Building className="h-8 w-8 text-blue-600" />
                  <span className="text-xl font-bold text-gray-900">IT補助金アシストツール</span>
                </Link>
              </div>
              
              {/* デスクトップメニュー */}
              <div className="hidden md:flex items-center space-x-8">
                <Link 
                  to="/flow" 
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <Workflow className="h-5 w-5" />
                  <span>申請フロー</span>
                </Link>
                <Link 
                  to="/questionnaire" 
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <FileText className="h-5 w-5" />
                  <span>詳細質問票</span>
                </Link>
                <Link 
                  to="/excel" 
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <FileSpreadsheet className="h-5 w-5" />
                  <span>エクセル処理</span>
                </Link>
                <Link 
                  to="/guide" 
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <Target className="h-5 w-5" />
                  <span>申請ガイド</span>
                </Link>
              </div>

              {/* モバイルメニューボタン */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-700 hover:text-blue-600"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* モバイルメニュー */}
          {isMenuOpen && (
            <div className="md:hidden bg-white border-t">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link 
                  to="/questionnaire" 
                  className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FileText className="h-5 w-5" />
                  <span>詳細質問票</span>
                </Link>
                <Link 
                  to="/excel" 
                  className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FileSpreadsheet className="h-5 w-5" />
                  <span>エクセル処理</span>
                </Link>
                <Link 
                  to="/guide" 
                  className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Target className="h-5 w-5" />
                  <span>申請ガイド</span>
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* メインコンテンツ */}
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/flow" element={<SubsidyFlowManager />} />
            <Route path="/questionnaire" element={<QuestionnaireDemo />} />
            <Route path="/excel" element={<ExcelProcessor />} />
            <Route path="/guide" element={<SubsidyApplicationGuide />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// ホームページコンポーネント
const HomePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ヒーローセクション */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          IT補助金アシスト<br />
          <span className="text-blue-600">ツール</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          最小の入力工数で最大の成果を。<br />
          3つの補助金（IT導入、ものづくり、持続化）の申請書類を簡単作成。
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link 
            to="/flow"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Workflow className="h-5 w-5 mr-2" />
            申請フローを開始
          </Link>
          <Link 
            to="/questionnaire"
            className="inline-flex items-center px-8 py-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FileText className="h-5 w-5 mr-2" />
            詳細質問票
          </Link>
          <Link 
            to="/excel"
            className="inline-flex items-center px-8 py-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            エクセル処理
          </Link>
          <Link 
            to="/guide"
            className="inline-flex items-center px-8 py-4 bg-white text-gray-700 font-medium rounded-lg border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-colors"
          >
            <Target className="h-5 w-5 mr-2" />
            申請ガイド
          </Link>
        </div>
      </div>

      {/* 特徴セクション */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">スマート質問システム</h3>
          <p className="text-gray-600">
            一度の入力で複数の補助金に対応。データ再利用により最大89%の入力工数削減を実現。
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Target className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">自動枠判定</h3>
          <p className="text-gray-600">
            事業内容から最適な申請枠を自動判定。必要書類や手続きを明確にガイド。
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Building className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">書類自動生成</h3>
          <p className="text-gray-600">
            回答完了後、正式な申請書類を自動生成。実施内容説明書、事業計画書等に対応。
          </p>
        </div>
      </div>

      {/* 対応補助金 */}
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">対応補助金</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-4xl mb-4">💻</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">IT導入補助金2025</h3>
            <p className="text-gray-600 text-sm mb-4">ITツール導入による業務効率化支援</p>
            <div className="text-sm text-gray-500">
              通常枠・電子化枠・セキュリティ枠・インボイス枠・複数社枠
            </div>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="text-4xl mb-4">🏭</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">ものづくり補助金</h3>
            <p className="text-gray-600 text-sm mb-4">革新的な製品・サービス開発支援</p>
            <div className="text-sm text-gray-500">
              通常枠・回復型賃上げ枠・デジタル枠・グリーン枠・グローバル枠
            </div>
          </div>

          <div className="text-center p-6 bg-yellow-50 rounded-lg">
            <div className="text-4xl mb-4">🏪</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">小規模事業者持続化補助金</h3>
            <p className="text-gray-600 text-sm mb-4">販路開拓・マーケティング支援</p>
            <div className="text-sm text-gray-500">
              通常枠・賃金引上げ枠・卒業枠・後継者支援枠・創業枠
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;