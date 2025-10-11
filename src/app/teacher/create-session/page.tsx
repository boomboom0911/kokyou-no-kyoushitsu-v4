'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';

interface Class {
  id: number;
  name: string;
  grade: number | null;
}

export default function CreateSessionPage() {
  const router = useRouter();
  const [topicTitle, setTopicTitle] = useState('');
  const [topicContent, setTopicContent] = useState('');
  const [period, setPeriod] = useState(1);
  const [classId, setClassId] = useState<number | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 教師認証確認
    const teacherAuth = storage.load('teacher_auth');
    if (!teacherAuth?.authenticated) {
      router.push('/teacher');
      return;
    }

    // クラス一覧を取得
    fetchClasses();
  }, [router]);

  const fetchClasses = async () => {
    try {
      // 生徒データに紐づいたクラスのみを取得
      const response = await fetch('/api/classes/active');
      const data = await response.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!topicTitle.trim()) {
        setError('授業タイトルを入力してください');
        setLoading(false);
        return;
      }

      // セッション作成API呼び出し
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicTitle: topicTitle.trim(),
          topicContent: topicContent.trim() || null,
          classId: classId,
          period,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // セッション情報を保存
        storage.save('teacher_session', data.data);

        // ダッシュボードへリダイレクト
        router.push(`/teacher/dashboard/${data.data.code}`);
      } else {
        setError(data.error || 'セッションの作成に失敗しました');
      }
    } catch (err) {
      console.error('Create session error:', err);
      setError('セッション作成中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    storage.remove('teacher_auth');
    router.push('/teacher');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                📝 新規セッション作成
              </h1>
              <p className="text-gray-600 mt-1">授業セッションを作成します</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/all-classes')}
                className="text-sm text-purple-600 hover:text-purple-800 px-4 py-2 rounded-lg hover:bg-purple-50"
              >
                🏛️ みんなの議論
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>

        {/* フォーム */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 授業タイトル */}
            <div>
              <label
                htmlFor="topicTitle"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                授業タイトル <span className="text-red-500">*</span>
              </label>
              <input
                id="topicTitle"
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="例: 若者と政治参加"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                disabled={loading}
              />
            </div>

            {/* 授業内容・問い */}
            <div>
              <label
                htmlFor="topicContent"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                授業内容・問い（オプション）
              </label>
              <textarea
                id="topicContent"
                value={topicContent}
                onChange={(e) => setTopicContent(e.target.value)}
                placeholder="例: なぜ若者の投票率は低いのか？どうすれば政治参加を促進できるか？"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                disabled={loading}
              />
            </div>

            {/* クラス選択 */}
            <div>
              <label
                htmlFor="class"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                クラス（オプション）
              </label>
              <select
                id="class"
                value={classId || ''}
                onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                disabled={loading}
              >
                <option value="">クラスを選択しない</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                クラスを選択すると、欠席者を確認できます
              </p>
            </div>

            {/* 時限 */}
            <div>
              <label
                htmlFor="period"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                時限 <span className="text-red-500">*</span>
              </label>
              <select
                id="period"
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                disabled={loading}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                  <option key={p} value={p}>
                    {p}時限
                  </option>
                ))}
              </select>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* 作成ボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {loading ? 'セッション作成中...' : 'セッションを作成'}
            </button>
          </form>

          {/* 説明 */}
          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">💡 使い方</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• セッションを作成すると、4桁のコードが自動生成されます</li>
              <li>• 生徒にコードを共有して、授業に参加してもらいます</li>
              <li>• ダッシュボードでリアルタイムに生徒の投稿を確認できます</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
