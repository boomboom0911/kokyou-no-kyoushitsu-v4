'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateBoardPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minReviewsRequired, setMinReviewsRequired] = useState(3);
  const [minReviewsToGive, setMinReviewsToGive] = useState(3);
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [reviewDeadline, setReviewDeadline] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/board/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          minReviewsRequired,
          minReviewsToGive,
          submissionDeadline: submissionDeadline || null,
          reviewDeadline: reviewDeadline || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || '掲示板の作成に失敗しました');
        setIsLoading(false);
        return;
      }

      // 成功したら管理画面へ
      router.push(`/teacher/boards/${result.data.id}`);
    } catch (err) {
      console.error('Create board error:', err);
      setError('エラーが発生しました');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 戻る
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              掲示板を作成
            </h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
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
                placeholder="例: 2学期評価課題"
                maxLength={200}
                disabled={isLoading}
              />
            </div>

            {/* 説明文 */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                説明文・課題内容
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 h-32 resize-none"
                placeholder="生徒への指示や課題の詳細を入力してください"
                disabled={isLoading}
              />
            </div>

            {/* レビュー要件 */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="minReviewsRequired"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  必要なレビュー受取数
                </label>
                <input
                  id="minReviewsRequired"
                  type="number"
                  min="0"
                  max="10"
                  value={minReviewsRequired}
                  onChange={(e) => setMinReviewsRequired(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  作品が受け取るべきレビュー数
                </p>
              </div>

              <div>
                <label
                  htmlFor="minReviewsToGive"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  必要なレビュー実施数
                </label>
                <input
                  id="minReviewsToGive"
                  type="number"
                  min="0"
                  max="10"
                  value={minReviewsToGive}
                  onChange={(e) => setMinReviewsToGive(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  生徒が実施すべきレビュー数
                </p>
              </div>
            </div>

            {/* 締切 */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="submissionDeadline"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  作品提出締切
                </label>
                <input
                  id="submissionDeadline"
                  type="datetime-local"
                  value={submissionDeadline}
                  onChange={(e) => setSubmissionDeadline(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="reviewDeadline"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  レビュー締切
                </label>
                <input
                  id="reviewDeadline"
                  type="datetime-local"
                  value={reviewDeadline}
                  onChange={(e) => setReviewDeadline(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  disabled={isLoading}
                />
              </div>
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
                disabled={isLoading || !title.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg"
              >
                {isLoading ? '作成中...' : '掲示板を作成'}
              </button>
            </div>
          </form>
        </div>

        {/* 注意事項 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">💡 ヒント</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 作成後に4桁のコードが発行されます</li>
            <li>• コードを生徒に共有して参加してもらいましょう</li>
            <li>• 締切は後から変更可能です</li>
            <li>• レビュー数の設定は相互評価を促進します</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
