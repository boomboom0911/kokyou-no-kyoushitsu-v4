'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SubmissionCard } from '@/components/board/SubmissionCard';
import { Board } from '@/types/board';

export default function BoardMainPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'new' | 'popular' | 'needsReview'>('new');

  // 掲示板情報を取得
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await fetch(`/api/board?code=${code}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.error || '掲示板が見つかりません');
          setIsLoading(false);
          return;
        }

        setBoard(result.data);
      } catch (err) {
        console.error('Error fetching board:', err);
        setError('掲示板の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoard();
  }, [code]);

  // 作品一覧を取得
  useEffect(() => {
    if (!board) return;

    const fetchSubmissions = async () => {
      try {
        const response = await fetch(
          `/api/board/submissions?boardId=${board.id}&sortBy=${sortBy}`
        );
        const result = await response.json();

        if (response.ok && result.success) {
          setSubmissions(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching submissions:', err);
      }
    };

    fetchSubmissions();
  }, [board, sortBy]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || '掲示板が見つかりません'}
          </h2>
          <button
            onClick={() => router.push('/board')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            コード入力画面に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {board.title}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                コード: <span className="font-mono font-bold">{code}</span>
              </p>
            </div>
            <button
              onClick={() => router.push(`/board/${code}/submit`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              📝 作品を投稿
            </button>
          </div>

          {/* 説明文 */}
          {board.description && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">{board.description}</p>
            </div>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* フィルター・ソート */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm text-gray-600">並び替え:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('new')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                sortBy === 'new'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              🌱 新着順
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                sortBy === 'popular'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              🔥 人気順
            </button>
            <button
              onClick={() => setSortBy('needsReview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                sortBy === 'needsReview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              👀 レビュー待ち
            </button>
          </div>
        </div>

        {/* おすすめセクション */}
        {submissions.some((s) => s.is_featured) && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              ⭐ おすすめ作品
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissions
                .filter((s) => s.is_featured)
                .map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    boardCode={code}
                  />
                ))}
            </div>
          </div>
        )}

        {/* 作品一覧 */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            すべての作品 ({submissions.length}件)
          </h2>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-600 mb-4">
              まだ作品が投稿されていません
            </p>
            <button
              onClick={() => router.push(`/board/${code}/submit`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              最初の作品を投稿する
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions
              .filter((s) => !s.is_featured)
              .map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  boardCode={code}
                />
              ))}
          </div>
        )}
      </main>
    </div>
  );
}
