'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ReviewCard } from '@/components/board/ReviewCard';
import { convertToEmbedUrl } from '@/lib/board/utils';
import { getStudentId, isLoggedIn, redirectToLogin } from '@/lib/board/auth';

export default function WorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const workId = params.id as string;

  const [submission, setSubmission] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // レビューフォームの状態
  const [strengths, setStrengths] = useState<string[]>(['']);
  const [suggestions, setSuggestions] = useState<string[]>(['']);
  const [questions, setQuestions] = useState<string[]>(['']);
  const [overallComment, setOverallComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 作品情報を取得
  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/board/submission/${workId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.error || '作品が見つかりません');
          setIsLoading(false);
          return;
        }

        setSubmission(result.data);

        // 閲覧数を増やす
        fetch(`/api/board/submission/${workId}/view`, { method: 'POST' });
      } catch (err) {
        console.error('Error fetching submission:', err);
        setError('作品の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmission();
  }, [workId]);

  // レビュー一覧を取得
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/board/review?submissionId=${workId}`);
        const result = await response.json();

        if (response.ok && result.success) {
          setReviews(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };

    fetchReviews();
  }, [workId]);

  // 配列項目の追加
  const addItem = (
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setItems([...items, '']);
  };

  // 配列項目の更新
  const updateItem = (
    index: number,
    value: string,
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  // 配列項目の削除
  const removeItem = (
    index: number,
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // レビュー投稿
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    // ログイン中の生徒IDを取得
    const studentId = getStudentId();
    if (!studentId) {
      alert('レビューを投稿するにはログインが必要です');
      redirectToLogin();
      return;
    }

    const boardId = submission?.board_id;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/board/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: workId,
          reviewerId: studentId,
          boardId,
          strengths: strengths.filter((s) => s.trim()),
          suggestions: suggestions.filter((s) => s.trim()),
          questions: questions.filter((s) => s.trim()),
          overallComment: overallComment.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || 'レビューの投稿に失敗しました');
        setIsSubmitting(false);
        return;
      }

      // 成功したらフォームをリセットして一覧を再取得
      setStrengths(['']);
      setSuggestions(['']);
      setQuestions(['']);
      setOverallComment('');
      setShowReviewForm(false);

      // レビュー一覧を再取得
      const reviewsResponse = await fetch(`/api/board/review?submissionId=${workId}`);
      const reviewsResult = await reviewsResponse.json();
      if (reviewsResponse.ok && reviewsResult.success) {
        setReviews(reviewsResult.data || []);
      }
    } catch (err) {
      console.error('Submit review error:', err);
      alert('エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 参考になったボタン
  const handleHelpful = async (reviewId: string) => {
    try {
      await fetch('/api/board/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId }),
      });

      // レビュー一覧を再取得
      const response = await fetch(`/api/board/review?submissionId=${workId}`);
      const result = await response.json();
      if (response.ok && result.success) {
        setReviews(result.data || []);
      }
    } catch (err) {
      console.error('Helpful error:', err);
    }
  };

  // レビューへの返信
  const handleReply = async (reviewId: string, responseText: string) => {
    const studentId = getStudentId();
    if (!studentId) {
      alert('返信するにはログインが必要です');
      redirectToLogin();
      return;
    }

    try {
      const response = await fetch('/api/board/review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          submissionId: workId,
          studentId,
          responseText,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || '返信の投稿に失敗しました');
        throw new Error(result.error);
      }

      // レビュー一覧を再取得
      const reviewsResponse = await fetch(`/api/board/review?submissionId=${workId}`);
      const reviewsResult = await reviewsResponse.json();
      if (reviewsResponse.ok && reviewsResult.success) {
        setReviews(reviewsResult.data || []);
      }
    } catch (err) {
      console.error('Reply error:', err);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{error}</h2>
          <button
            onClick={() => router.push(`/board/${code}`)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            掲示板に戻る
          </button>
        </div>
      </div>
    );
  }

  const embedUrl = convertToEmbedUrl(submission.work_url);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/board/${code}`)}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 戻る
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {submission.title}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                投稿者: {submission.students?.display_name || '不明'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>👁 {submission.view_count}</span>
              <span>✍️ {reviews.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム: 作品表示 */}
          <div className="lg:col-span-2">
            {/* 説明文 */}
            {submission.description && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-2">📝 説明</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {submission.description}
                </p>
              </div>
            )}

            {/* 作品埋め込み */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">📄 作品</h3>
                <a
                  href={submission.work_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  新しいタブで開く →
                </a>
              </div>

              {embedUrl ? (
                <div className="relative w-full bg-gray-100 rounded" style={{ paddingBottom: '75%' }}>
                  <iframe
                    src={embedUrl}
                    className="absolute top-0 left-0 w-full h-full rounded border-0"
                    title={submission.title}
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded">
                  <p className="text-gray-600 mb-4">
                    プレビューを表示できません
                  </p>
                  <a
                    href={submission.work_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-block"
                  >
                    作品を開く
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 右カラム: レビュー */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* レビュー投稿ボタン */}
              {!showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg mb-4"
                >
                  ✍️ レビューを書く
                </button>
              )}

              {/* レビューフォーム */}
              {showReviewForm && (
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                  <h3 className="font-bold text-gray-900 mb-4">レビューを投稿</h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    {/* 良い点 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ✨ 良い点
                      </label>
                      {strengths.map((strength, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={strength}
                            onChange={(e) =>
                              updateItem(i, e.target.value, strengths, setStrengths)
                            }
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            placeholder="良かった点を入力"
                          />
                          {strengths.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(i, strengths, setStrengths)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addItem(strengths, setStrengths)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + 追加
                      </button>
                    </div>

                    {/* 改善提案 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        💡 改善提案
                      </label>
                      {suggestions.map((suggestion, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={suggestion}
                            onChange={(e) =>
                              updateItem(i, e.target.value, suggestions, setSuggestions)
                            }
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            placeholder="改善案を入力"
                          />
                          {suggestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(i, suggestions, setSuggestions)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addItem(suggestions, setSuggestions)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + 追加
                      </button>
                    </div>

                    {/* 質問 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ❓ 質問
                      </label>
                      {questions.map((question, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={question}
                            onChange={(e) =>
                              updateItem(i, e.target.value, questions, setQuestions)
                            }
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            placeholder="質問を入力"
                          />
                          {questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(i, questions, setQuestions)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addItem(questions, setQuestions)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + 追加
                      </button>
                    </div>

                    {/* 総合コメント */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        💬 総合コメント
                      </label>
                      <textarea
                        value={overallComment}
                        onChange={(e) => setOverallComment(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 h-24 resize-none"
                        placeholder="全体的な感想やまとめ"
                      />
                    </div>

                    {/* ボタン */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded text-sm"
                        disabled={isSubmitting}
                      >
                        キャンセル
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? '投稿中...' : '投稿'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* レビュー一覧 */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">
                  ✍️ レビュー ({reviews.length})
                </h3>
                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">まだレビューがありません</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => {
                      const studentId = getStudentId();
                      const isAuthor = submission && studentId === submission.student_id;

                      return (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          showReviewerName={false}
                          onHelpful={handleHelpful}
                          isAuthor={isAuthor}
                          onReply={handleReply}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
