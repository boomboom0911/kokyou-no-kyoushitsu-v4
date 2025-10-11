'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Student, PortfolioEntry } from '@/types';

export default function PortfolioPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ tag?: string; favorite?: boolean }>({});

  useEffect(() => {
    // 認証情報確認
    const storedStudent = storage.load<Student>('student');

    if (!storedStudent) {
      router.push('/student');
      return;
    }

    setStudent(storedStudent);
    fetchPortfolio(storedStudent.id);
  }, [router, filter]);

  const fetchPortfolio = async (studentId: number) => {
    try {
      const params = new URLSearchParams();
      if (filter.tag) params.append('tag', filter.tag);
      if (filter.favorite) params.append('favorite', 'true');

      const response = await fetch(
        `/api/students/${studentId}/portfolio?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        setPortfolio(data.data.memos);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!student) return;

    // CSVダウンロード
    window.open(
      `/api/export/portfolio?studentId=${student.id}&format=csv`,
      '_blank'
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ヘッダー */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                📚 マイポートフォリオ
              </h1>
              <p className="text-sm text-gray-600">
                {student?.display_name}さんの学習記録
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                📥 CSVエクスポート
              </button>
              <button
                onClick={() => router.push('/student/menu')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← メニューに戻る
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* フィルター */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filter.favorite || false}
                onChange={(e) =>
                  setFilter({ ...filter, favorite: e.target.checked || undefined })
                }
                className="rounded"
              />
              <span className="text-sm text-gray-700">お気に入りのみ</span>
            </label>
          </div>
        </div>
      </div>

      {/* ポートフォリオ一覧 */}
      <div className="max-w-4xl mx-auto space-y-4">
        {portfolio.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            まだ学習メモがありません
          </div>
        ) : (
          portfolio.map((entry) => (
            <div
              key={entry.memo_id}
              className="bg-white rounded-lg shadow p-6 space-y-4"
            >
              {/* メモヘッダー */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {entry.session_id ? (
                    <div className="mb-2">
                      <div className="font-semibold text-gray-800">
                        {entry.topic_title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {entry.session_date} | {entry.period}時限 | {entry.class_name}
                        {entry.seat_number && ` | 座席 ${entry.seat_number}`}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 mb-2">授業外のメモ</div>
                  )}
                </div>
                {entry.is_favorite && (
                  <div className="text-2xl">⭐</div>
                )}
              </div>

              {/* メモ内容 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {entry.memo_content}
                </p>
              </div>

              {/* タグ */}
              {entry.memo_tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.memo_tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 自分の投稿 */}
              {entry.my_topic_content && (
                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    📝 あなたの投稿
                  </div>
                  <p className="text-sm text-gray-600">
                    {entry.my_topic_content}
                  </p>
                </div>
              )}

              {/* 活動サマリー */}
              {(entry.reacted_topics && entry.reacted_topics.length > 0) ||
              (entry.commented_topics && entry.commented_topics.length > 0) ? (
                <div className="border-t pt-4">
                  <div className="flex gap-4 text-sm text-gray-600">
                    {entry.reacted_topics && entry.reacted_topics.length > 0 && (
                      <span>💬 リアクション: {entry.reacted_topics.length}件</span>
                    )}
                    {entry.commented_topics && entry.commented_topics.length > 0 && (
                      <span>✏️ コメント: {entry.commented_topics.length}件</span>
                    )}
                  </div>
                </div>
              ) : null}

              {/* 作成日時 */}
              <div className="text-xs text-gray-400 text-right">
                {new Date(entry.memo_created_at).toLocaleString('ja-JP')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
