'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';

export default function StudentLoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<'session' | 'simple'>('session');
  const [sessionCode, setSessionCode] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginMode === 'session') {
        // セッション参加モード
        if (!sessionCode || !studentEmail) {
          setError('セッションコードとメールアドレスを入力してください');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionCode: sessionCode.toUpperCase(),
            studentEmail,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || '認証に失敗しました');
          setLoading(false);
          return;
        }

        storage.save('student', data.data.student);
        storage.save('session', data.data.session);
        router.push(`/classroom/${sessionCode.toUpperCase()}`);
      } else {
        // 簡易ログインモード（ポートフォリオアクセス用）
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
      }
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

        {/* ログインモード切り替え */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setLoginMode('session');
              setError('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              loginMode === 'session'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            授業に参加
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('simple');
              setError('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              loginMode === 'simple'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ポートフォリオ
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* セッションコード入力（授業参加モードのみ） */}
          {loginMode === 'session' && (
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
              />
              <p className="mt-1 text-xs text-gray-500">
                先生から共有された4桁のコードを入力
              </p>
            </div>
          )}

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
              {loginMode === 'session'
                ? '学校のGoogleアカウントのメールアドレス'
                : '登録済みのメールアドレスを入力'}
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
            className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ${
              loginMode === 'session'
                ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white'
                : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white'
            }`}
          >
            {loading
              ? '認証中...'
              : loginMode === 'session'
              ? '教室に入る'
              : 'ログイン'}
          </button>
        </form>

        {/* 追加情報 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {loginMode === 'session'
              ? '初めて使う場合は、自動的にアカウントが作成されます'
              : 'ポートフォリオや過去の授業を確認できます'}
          </p>
        </div>
      </div>
    </div>
  );
}
