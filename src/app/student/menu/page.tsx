'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Student } from '@/types';
import Link from 'next/link';

export default function StudentMenuPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  const [currentSession, setCurrentSession] = useState<{ code: string; title: string } | null>(null);

  useEffect(() => {
    // 認証情報確認
    const storedStudent = storage.load<Student>('student');

    if (!storedStudent) {
      router.push('/student');
      return;
    }

    setStudent(storedStudent);

    // 現在のセッション情報を確認
    const storedSession = storage.load('session');
    if (storedSession) {
      setCurrentSession({
        code: storedSession.code,
        title: storedSession.topic_title,
      });
    }
  }, [router]);

  const handleLogout = () => {
    storage.clear();
    router.push('/student');
  };

  const handleJoinSession = async () => {
    if (!sessionCode || !student) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionCode: sessionCode.toUpperCase(),
          studentEmail: student.google_email,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || '認証に失敗しました');
        setLoading(false);
        return;
      }

      storage.save('session', data.data.session);
      router.push(`/classroom/${sessionCode.toUpperCase()}`);
    } catch (err) {
      console.error('Join session error:', err);
      setError('認証中にエラーが発生しました');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                🏛️ 生徒メニュー
              </h1>
              <p className="text-gray-600 mt-1">
                {student?.display_name}さん、こんにちは
              </p>
            </div>
            <div className="flex items-center gap-3">
              {currentSession && (
                <button
                  onClick={() => router.push(`/classroom/${currentSession.code}`)}
                  className="text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-lg transition-colors"
                >
                  📚 現在の教室に戻る
                </button>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>

        {/* メニューカード */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* 新規セッション参加 */}
          <div
            onClick={() => setShowJoinModal(true)}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-4xl mb-4">🚪</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              授業に参加
            </h2>
            <p className="text-gray-600 mb-4">
              セッションコードを入力して新しい授業に参加します
            </p>
          </div>

          {/* ポートフォリオ */}
          <Link href="/student/portfolio">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500">
              <div className="text-4xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                マイポートフォリオ
              </h2>
              <p className="text-gray-600 mb-4">
                学習メモや投稿履歴を確認・エクスポートできます
              </p>
            </div>
          </Link>

          {/* みんなの議論 */}
          <Link href="/all-classes">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-500">
              <div className="text-4xl mb-4">🏛️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                みんなの議論
              </h2>
              <p className="text-gray-600 mb-4">
                全クラス・全授業のトピックを閲覧できます
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* セッション参加モーダル */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              授業に参加
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="sessionCode"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  セッションコード
                </label>
                <input
                  id="sessionCode"
                  type="text"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  placeholder="例: AB12"
                  maxLength={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono uppercase text-gray-900 placeholder:text-gray-400"
                  disabled={loading}
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-500">
                  教科担当者から共有された4桁のコードを入力
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setSessionCode('');
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleJoinSession}
                  disabled={loading || !sessionCode}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {loading ? '参加中...' : '参加する'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
