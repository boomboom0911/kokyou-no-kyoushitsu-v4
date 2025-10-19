'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 掲示板コード入力画面
 * /board
 */
export default function BoardIndexPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 入力チェック
    if (!code || code.trim().length !== 6) {
      setError('6桁のコードを入力してください');
      return;
    }

    setIsLoading(true);

    try {
      // 掲示板が存在するか確認
      const response = await fetch(`/api/board?code=${code.toUpperCase()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || '掲示板が見つかりません');
        setIsLoading(false);
        return;
      }

      // 掲示板画面へ遷移
      router.push(`/board/${code.toUpperCase()}`);
    } catch (err) {
      console.error('Error:', err);
      setError('エラーが発生しました');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📋 コウキョウのケイジバン
          </h1>
          <p className="text-gray-600">
            作品を共有してピアレビューしよう
          </p>
        </div>

        {/* メインカード */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            {/* コード入力 */}
            <div className="mb-6">
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                掲示板コード（6桁）
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                maxLength={6}
                placeholder="ABC123"
                className="w-full px-4 py-3 text-2xl font-mono text-center uppercase border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {isLoading ? '確認中...' : '掲示板へ'}
            </button>
          </form>

          {/* ヒント */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              💡 先生から共有された6桁のコードを入力してください
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            ← トップページに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
