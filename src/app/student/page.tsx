'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';

export default function StudentLoginPage() {
  const router = useRouter();
  const [studentEmail, setStudentEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!studentEmail) {
        setError('メールアドレスを入力してください');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'ログインに失敗しました');
        setLoading(false);
        return;
      }

      storage.save('student', data.data.student);
      router.push('/student/menu');
    } catch (err) {
      console.error('Login error:', err);
      setError('認証中にエラーが発生しました');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🏛️ 公共のキョウシツ
          </h1>
          <p className="text-gray-600">生徒ログイン</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* メールアドレス入力 */}
          <div>
            <label
              htmlFor="studentEmail"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              メールアドレス
            </label>
            <input
              id="studentEmail"
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="例: 24001@nansho.ed.jp"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              学校のGoogleアカウントのメールアドレス
            </p>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-3 px-6 rounded-lg transition-colors duration-200 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white"
          >
            {loading ? '認証中...' : 'ログイン'}
          </button>
        </form>

        {/* 追加情報 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            ※ 事前に教員が登録したメールアドレスのみログイン可能です
          </p>
        </div>
      </div>
    </div>
  );
}
