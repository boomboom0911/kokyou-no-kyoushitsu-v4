'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';

export default function Home() {
  const router = useRouter();

  // 生徒用
  const [studentMode, setStudentMode] = useState<'join' | 'portfolio'>('join');
  const [sessionCode, setSessionCode] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState('');

  // 教科担当者用
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherError, setTeacherError] = useState('');

  // 生徒ログイン処理
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');
    setStudentLoading(true);

    try {
      if (studentMode === 'join') {
        // 授業に参加
        if (!sessionCode || !studentEmail) {
          setStudentError('セッションコードとメールアドレスを入力してください');
          setStudentLoading(false);
          return;
        }

        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionCode: sessionCode.toUpperCase(),
            studentEmail,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setStudentError(data.error || '認証に失敗しました');
          setStudentLoading(false);
          return;
        }

        storage.save('student', data.data.student);
        storage.save('session', data.data.session);
        router.push(`/classroom/${sessionCode.toUpperCase()}`);
      } else {
        // ポートフォリオ
        if (!studentEmail) {
          setStudentError('メールアドレスを入力してください');
          setStudentLoading(false);
          return;
        }

        const response = await fetch('/api/auth/simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentEmail }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setStudentError(data.error || 'ログインに失敗しました');
          setStudentLoading(false);
          return;
        }

        storage.save('student', data.data.student);
        router.push('/student/menu');
      }
    } catch (err) {
      console.error('Student login error:', err);
      setStudentError('認証中にエラーが発生しました');
      setStudentLoading(false);
    }
  };

  // 教科担当者ログイン処理
  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');
    setTeacherLoading(true);

    try {
      if (teacherPassword === process.env.NEXT_PUBLIC_TEACHER_PASSWORD) {
        storage.save('teacher_auth', { authenticated: true });
        router.push('/teacher/create-session'); // 直接セッション作成画面へ
      } else {
        setTeacherError('パスワードが正しくありません');
      }
    } catch (err) {
      console.error('Teacher login error:', err);
      setTeacherError('認証中にエラーが発生しました');
    } finally {
      setTeacherLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        {/* ヘッダー */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">
            🏛️ コウキョウのキョウシツ v4
          </h1>
          <p className="text-lg text-gray-600">
            教室での議論を可視化・活性化するWebアプリケーション
          </p>
        </div>

        {/* 2カラムレイアウト */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* 左カラム: 生徒用 */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">👨‍🎓</div>
              <h2 className="text-2xl font-bold text-gray-800">生徒用</h2>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-5">
              {/* モード切り替え */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setStudentMode('join')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    studentMode === 'join'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  授業に参加
                </button>
                <button
                  type="button"
                  onClick={() => setStudentMode('portfolio')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    studentMode === 'portfolio'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ポートフォリオ
                </button>
              </div>

              {/* セッションコード（授業参加時のみ） */}
              {studentMode === 'join' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    セッションコード
                  </label>
                  <input
                    type="text"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                    placeholder="例: AB12"
                    maxLength={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono uppercase text-gray-900 placeholder:text-gray-400"
                    disabled={studentLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    先生から共有された4桁のコードを入力
                  </p>
                </div>
              )}

              {/* メールアドレス */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="例: 24001@nansho.ed.jp"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  disabled={studentLoading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {studentMode === 'join'
                    ? '学校のGoogleアカウントのメールアドレス'
                    : '登録済みのメールアドレスを入力'}
                </p>
              </div>

              {/* エラーメッセージ */}
              {studentError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{studentError}</p>
                </div>
              )}

              {/* ログインボタン */}
              <button
                type="submit"
                disabled={studentLoading}
                className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
                  studentMode === 'join'
                    ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white'
                    : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white'
                }`}
              >
                {studentLoading
                  ? '認証中...'
                  : studentMode === 'join'
                  ? '教室に入る'
                  : 'ログイン'}
              </button>
            </form>

            {/* 注意事項 */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                {studentMode === 'join'
                  ? '初めて使う場合は、自動的にアカウントが作成されます'
                  : 'ポートフォリオや過去の授業を確認できます'}
              </p>
            </div>
          </div>

          {/* 右カラム: 教科担当者用 */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">👨‍🏫</div>
              <h2 className="text-2xl font-bold text-gray-800">教科担当者用</h2>
            </div>

            <form onSubmit={handleTeacherSubmit} className="space-y-5">
              {/* パスワード */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード
                </label>
                <input
                  type="password"
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  disabled={teacherLoading}
                />
              </div>

              {/* エラーメッセージ */}
              {teacherError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{teacherError}</p>
                </div>
              )}

              {/* ログインボタン */}
              <button
                type="submit"
                disabled={teacherLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {teacherLoading ? '認証中...' : 'ログイン'}
              </button>
            </form>

            {/* 教科担当者機能説明 */}
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                📋 教科担当者機能
              </h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• セッション作成と管理</li>
                <li>• 授業進行状況のリアルタイム確認</li>
                <li>• 生徒視点/教科担当者視点の切り替え</li>
                <li>• 統計情報の表示</li>
              </ul>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>v4.0.0 - Next.js 15 + TypeScript + Supabase</p>
        </div>
      </div>
    </main>
  );
}
