'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { validateGoogleUrl, detectWorkType } from '@/lib/board/utils';
import { getStudentId, isLoggedIn, redirectToLogin } from '@/lib/board/auth';
import { Board } from '@/types/board';

export default function SubmitPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workUrl, setWorkUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [urlError, setUrlError] = useState('');

  // ログインチェックと掲示板情報を取得
  useEffect(() => {
    // ログインチェック
    if (!isLoggedIn()) {
      alert('作品を投稿するにはログインが必要です');
      redirectToLogin();
      return;
    }

    const fetchBoard = async () => {
      try {
        const response = await fetch(`/api/board?code=${code}`);
        const result = await response.json();

        if (response.ok && result.success) {
          setBoard(result.data);
        } else {
          router.push('/board');
        }
      } catch (err) {
        console.error('Error fetching board:', err);
        router.push('/board');
      }
    };

    fetchBoard();
  }, [code, router]);

  // URL検証
  const handleUrlBlur = () => {
    if (!workUrl) {
      setUrlError('');
      return;
    }

    const validation = validateGoogleUrl(workUrl);
    if (!validation.valid) {
      setUrlError(validation.error || '無効なURLです');
    } else {
      setUrlError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    if (!workUrl.trim()) {
      setError('作品URLを入力してください');
      return;
    }

    const urlValidation = validateGoogleUrl(workUrl);
    if (!urlValidation.valid) {
      setError(urlValidation.error || '無効なURLです');
      return;
    }

    // ログイン中の生徒IDを取得
    const studentId = getStudentId();
    if (!studentId) {
      alert('ログイン情報が見つかりません');
      redirectToLogin();
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/board/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: board?.id,
          studentId,
          title: title.trim(),
          description: description.trim(),
          workUrl: workUrl.trim(),
          workType: detectWorkType(workUrl),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || '作品の投稿に失敗しました');
        setIsLoading(false);
        return;
      }

      // 成功したら掲示板に戻る
      router.push(`/board/${code}`);
    } catch (err) {
      console.error('Submit error:', err);
      setError('エラーが発生しました');
      setIsLoading(false);
    }
  };

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 戻る
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                作品を投稿
              </h1>
              <p className="text-sm text-gray-600">{board.title}</p>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit}>
            {/* タイトル */}
            <div className="mb-6">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="例: 民主主義の課題と未来"
                maxLength={200}
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                {title.length}/200文字
              </p>
            </div>

            {/* 説明文 */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                説明文
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 h-32 resize-none"
                placeholder="作品の概要や工夫した点を簡単に説明してください"
                disabled={isLoading}
              />
            </div>

            {/* 作品URL */}
            <div className="mb-6">
              <label
                htmlFor="workUrl"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                作品URL（Google ドキュメント/サイト）<span className="text-red-500">*</span>
              </label>
              <input
                id="workUrl"
                type="url"
                value={workUrl}
                onChange={(e) => {
                  setWorkUrl(e.target.value);
                  setUrlError('');
                }}
                onBlur={handleUrlBlur}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                  urlError ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="https://docs.google.com/document/..."
                disabled={isLoading}
              />
              {urlError && (
                <p className="mt-1 text-sm text-red-600">{urlError}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                💡 ヒント: Google ドキュメント/サイトで「共有」→「リンクを知っている全員」に設定してURLをコピーしてください
              </p>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* ボタン */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg"
                disabled={isLoading}
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isLoading || !title.trim() || !workUrl.trim() || !!urlError}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg"
              >
                {isLoading ? '投稿中...' : '投稿する'}
              </button>
            </div>
          </form>
        </div>

        {/* 注意事項 */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">⚠️ 注意事項</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• 作品URLは必ず「リンクを知っている全員」に共有設定してください</li>
            <li>• 投稿後も編集可能です（レビューを受けた後は慎重に編集してください）</li>
            <li>• 不適切な内容は削除される場合があります</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
