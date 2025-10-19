'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Board } from '@/types/board';
import { formatDeadline } from '@/lib/board/utils';

export default function BoardManagePage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 掲示板情報を取得
        const boardResponse = await fetch(`/api/board/${boardId}`);
        const boardResult = await boardResponse.json();

        if (boardResponse.ok && boardResult.success) {
          setBoard(boardResult.data);

          // 作品一覧を取得
          const submissionsResponse = await fetch(
            `/api/board/submissions?boardId=${boardResult.data.id}`
          );
          const submissionsResult = await submissionsResponse.json();

          if (submissionsResponse.ok && submissionsResult.success) {
            setSubmissions(submissionsResult.data || []);
          }

          // 統計情報を取得
          const statsResponse = await fetch(`/api/board/${boardResult.data.id}/stats`);
          const statsResult = await statsResponse.json();

          if (statsResponse.ok && statsResult.success) {
            setStats(statsResult.data);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [boardId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">掲示板が見つかりません</p>
        </div>
      </div>
    );
  }

  const submissionDeadline = board.submission_deadline
    ? formatDeadline(board.submission_deadline)
    : null;
  const reviewDeadline = board.review_deadline
    ? formatDeadline(board.review_deadline)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {board.title}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                掲示板管理
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/teacher/boards/${boardId}/export`)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                📊 CSV出力
              </button>
              <button
                onClick={() => window.open(`/board/${board.code}`, '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                👁 プレビュー
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* コード表示 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-8 mb-6 text-white text-center">
          <p className="text-sm mb-2 opacity-90">生徒に共有するコード</p>
          <p className="text-6xl font-mono font-bold tracking-widest mb-4">
            {board.code}
          </p>
          <p className="text-sm opacity-90">
            このコードを生徒に伝えて、作品を投稿してもらいましょう
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">総投稿数</p>
            <p className="text-3xl font-bold text-gray-900">
              {submissions.length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">総レビュー数</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.totalReviews || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">平均レビュー数</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.averageReviews || '0'}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">ステータス</p>
            <p className="text-lg font-medium text-green-600">
              {board.status === 'active' ? '公開中' : '非公開'}
            </p>
          </div>
        </div>

        {/* 締切情報 */}
        {(submissionDeadline || reviewDeadline) && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h2 className="font-bold text-gray-900 mb-3">📅 締切情報</h2>
            <div className="grid grid-cols-2 gap-4">
              {submissionDeadline && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">作品提出締切</p>
                  <p
                    className={`font-medium ${
                      submissionDeadline.status === 'expired'
                        ? 'text-gray-500'
                        : submissionDeadline.status === 'danger'
                        ? 'text-red-600'
                        : submissionDeadline.status === 'warning'
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}
                  >
                    {submissionDeadline.text}
                  </p>
                </div>
              )}
              {reviewDeadline && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">レビュー締切</p>
                  <p
                    className={`font-medium ${
                      reviewDeadline.status === 'expired'
                        ? 'text-gray-500'
                        : reviewDeadline.status === 'danger'
                        ? 'text-red-600'
                        : reviewDeadline.status === 'warning'
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}
                  >
                    {reviewDeadline.text}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 作品一覧 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">📝 投稿された作品</h2>
          </div>
          <div className="overflow-x-auto">
            {submissions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                まだ作品が投稿されていません
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      タイトル
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      投稿者
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      閲覧数
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      レビュー数
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      投稿日時
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {submission.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {submission.student_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {submission.view_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {submission.review_count_actual}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(submission.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() =>
                            window.open(`/board/${board.code}/work/${submission.id}`, '_blank')
                          }
                          className="text-blue-600 hover:text-blue-800"
                        >
                          詳細
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
