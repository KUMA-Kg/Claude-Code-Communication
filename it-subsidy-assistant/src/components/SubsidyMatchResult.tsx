import React from 'react';
import { Target, CheckCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react';

interface SubsidyMatch {
  subsidyType: string;
  subsidyName: string;
  score: number;
  matchLevel: 'high' | 'medium' | 'low';
  description: string;
  icon: string;
}

interface AkinatorAnswer {
  questionId: string;
  selectedValue: string;
}

interface SubsidyMatchResultProps {
  matches: SubsidyMatch[];
  answers: AkinatorAnswer[];
  onSelectSubsidy: (subsidyType: string) => void;
  onRetake: () => void;
}

const SubsidyMatchResult: React.FC<SubsidyMatchResultProps> = ({
  matches,
  answers,
  onSelectSubsidy,
  onRetake
}) => {
  const getMatchIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'medium':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'low':
        return <Info className="h-6 w-6 text-gray-600" />;
      default:
        return <Info className="h-6 w-6 text-gray-600" />;
    }
  };

  const getMatchColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'border-green-500 bg-green-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-gray-300 bg-gray-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getMatchText = (level: string) => {
    switch (level) {
      case 'high':
        return '高適合';
      case 'medium':
        return '中適合';
      case 'low':
        return '低適合';
      default:
        return '適合度不明';
    }
  };

  const topMatch = matches[0];
  const hasHighMatch = matches.some(match => match.matchLevel === 'high');

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Target className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">判定結果</h1>
        </div>
        <p className="text-xl text-gray-600">
          あなたの事業に最適な補助金をお見つけしました
        </p>
      </div>

      {/* 結果サマリー */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">最適な補助金</h2>
            <div className="flex items-center space-x-3">
              <span className="text-4xl">{topMatch.icon}</span>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{topMatch.subsidyName}</h3>
                <p className="text-gray-600">{topMatch.description}</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-1">
              {topMatch.score}点
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              topMatch.matchLevel === 'high' ? 'bg-green-100 text-green-800' :
              topMatch.matchLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {getMatchText(topMatch.matchLevel)}
            </div>
          </div>
        </div>
      </div>

      {/* 全体結果 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {matches.map((match, index) => (
          <div
            key={match.subsidyType}
            className={`border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg cursor-pointer ${getMatchColor(match.matchLevel)}`}
            onClick={() => onSelectSubsidy(match.subsidyType)}
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-3xl">{match.icon}</span>
              <div className="flex items-center space-x-2">
                {getMatchIcon(match.matchLevel)}
                <span className="text-2xl font-bold">{match.score}</span>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {match.subsidyName}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {match.description}
            </p>
            
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                match.matchLevel === 'high' ? 'bg-green-100 text-green-800' :
                match.matchLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {getMatchText(match.matchLevel)}
              </span>
              
              {index === 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                  おすすめ
                </span>
              )}
            </div>

            <button className="w-full mt-4 flex items-center justify-center space-x-2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors">
              <span>詳細を確認</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* 判定根拠 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">判定の根拠</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">あなたの回答</h4>
            <div className="space-y-2">
              {answers.map((answer, index) => (
                <div key={answer.questionId} className="text-sm text-gray-600">
                  <span className="font-medium">Q{index + 1}:</span> {answer.selectedValue}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">適合度の詳細</h4>
            <div className="space-y-2">
              {matches.map((match) => (
                <div key={match.subsidyType} className="flex justify-between text-sm">
                  <span className="text-gray-600">{match.subsidyName}</span>
                  <span className="font-medium">{match.score}点</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* アクション */}
      <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
        {hasHighMatch ? (
          <button
            onClick={() => onSelectSubsidy(topMatch.subsidyType)}
            className="flex items-center justify-center space-x-2 px-8 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>{topMatch.subsidyName}で申請を進める</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              明確な適合補助金が見つかりませんでした。<br />
              条件を見直すか、詳細相談をおすすめします。
            </p>
            <button
              onClick={() => onSelectSubsidy(topMatch.subsidyType)}
              className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              それでも{topMatch.subsidyName}で進める
            </button>
          </div>
        )}
        
        <button
          onClick={onRetake}
          className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-colors"
        >
          質問をやり直す
        </button>
      </div>

      {/* 注意事項 */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">ご注意</p>
            <p>この判定は目安です。実際の申請には詳細な要件確認が必要です。正式な申請前に、各補助金の公募要領をご確認ください。</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubsidyMatchResult;