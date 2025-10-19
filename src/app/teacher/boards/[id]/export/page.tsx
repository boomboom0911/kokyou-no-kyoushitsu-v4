'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

  const [board, setBoard] = useState<any>(null);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await fetch(`/api/board/${boardId}`);
        const result = await response.json();

        if (response.ok && result.success) {
          setBoard(result.data);
        }
      } catch (err) {
        console.error('Error fetching board:', err);
      }
    };

    fetchBoard();
  }, [boardId]);

  const handleExport = (type: 'submissions' | 'reviews') => {
    window.open(`/api/board/${boardId}/export?type=${type}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 戻る
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                データ出力
              </h1>
              {board && (
                <p className="text-sm text-gray-600 mt-1">
                  {board.title}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {/* 提出一覧CSV */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  📊 提出一覧
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  生徒ごとの作品投稿状況とレビュー実績を出力します
                </p>
                <ul className="text-sm text-gray-700 space-y-1 mb-4">
                  <li>• クラス、出席番号、氏名</li>
                  <li>• 作品タイトル、説明、URL</li>
                  <li>• 閲覧数、受取レビュー数、実施レビュー数</li>
                  <li>• 投稿日時</li>
                </ul>
              </div>
              <button
                onClick={() => handleExport('submissions')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium whitespace-nowrap"
              >
                ダウンロード
              </button>
            </div>
          </div>

          {/* レビュー詳細CSV */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  💬 レビュー詳細
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  全てのレビュー内容を詳細に出力します
                </p>
                <ul className="text-sm text-gray-700 space-y-1 mb-4">
                  <li>• 作品タイトル、投稿者</li>
                  <li>• レビュアー</li>
                  <li>• 良い点、改善提案、質問、総合コメント</li>
                  <li>• 文字数、参考になった数</li>
                  <li>• 投稿日時</li>
                </ul>
              </div>
              <button
                onClick={() => handleExport('reviews')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium whitespace-nowrap"
              >
                ダウンロード
              </button>
            </div>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">💡 ヒント</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• CSVファイルはExcelやGoogleスプレッドシートで開けます</li>
            <li>• 文字化けする場合は、UTF-8で開いてください</li>
            <li>• 成績評価や振り返りに活用できます</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
