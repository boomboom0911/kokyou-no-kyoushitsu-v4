'use client';

import { useState } from 'react';
import { formatRelativeTime } from '@/lib/board/utils';
import { getReviewerIcon } from '@/lib/board/animal-assignment';
import { AnimalType } from '@/types/board';

interface ReviewCardProps {
  review: {
    id: string;
    strengths: string[];
    suggestions: string[];
    questions: string[];
    overall_comment: string | null;
    character_count: number;
    helpful_count: number;
    created_at: string;
    author_response?: string | null;
    response_created_at?: string | null;
    reviewer_profiles: Array<{
      animal_type: AnimalType;
      level: number;
    }>;
    students?: {
      display_name: string;
    };
  };
  showReviewerName?: boolean;
  onHelpful?: (reviewId: string) => void;
  isAuthor?: boolean;
  onReply?: (reviewId: string, responseText: string) => Promise<void>;
}

export function ReviewCard({ review, showReviewerName = false, onHelpful, isAuthor = false, onReply }: ReviewCardProps) {
  const profile = review.reviewer_profiles?.[0];
  const reviewerIcon = profile
    ? getReviewerIcon(profile.animal_type, profile.level)
    : '👤';

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !onReply) return;

    setIsSubmitting(true);
    try {
      await onReply(review.id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
      setShowResponse(true);
    } catch (error) {
      console.error('Reply error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{reviewerIcon}</span>
          <div>
            {showReviewerName && review.students ? (
              <p className="font-medium text-gray-900">
                {review.students.display_name}
              </p>
            ) : (
              <p className="font-medium text-gray-700">匿名レビュアー</p>
            )}
            <p className="text-xs text-gray-500">
              {formatRelativeTime(review.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {review.character_count}文字
          </span>
        </div>
      </div>

      {/* レビュー内容 */}
      <div className="space-y-3">
        {/* 良い点 */}
        {review.strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-700 mb-1 flex items-center gap-1">
              ✨ 良い点
            </h4>
            <ul className="space-y-1">
              {review.strengths.map((strength, i) => (
                <li key={i} className="text-sm text-gray-700 pl-4">
                  • {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 改善提案 */}
        {review.suggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-blue-700 mb-1 flex items-center gap-1">
              💡 改善提案
            </h4>
            <ul className="space-y-1">
              {review.suggestions.map((suggestion, i) => (
                <li key={i} className="text-sm text-gray-700 pl-4">
                  • {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 質問 */}
        {review.questions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-orange-700 mb-1 flex items-center gap-1">
              ❓ 質問
            </h4>
            <ul className="space-y-1">
              {review.questions.map((question, i) => (
                <li key={i} className="text-sm text-gray-700 pl-4">
                  • {question}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 総合コメント */}
        {review.overall_comment && (
          <div>
            <h4 className="text-sm font-medium text-purple-700 mb-1 flex items-center gap-1">
              💬 総合コメント
            </h4>
            <p className="text-sm text-gray-700 pl-4">
              {review.overall_comment}
            </p>
          </div>
        )}
      </div>

      {/* 投稿者からの返信 */}
      {review.author_response && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={() => setShowResponse(!showResponse)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 mb-2"
          >
            <span>{showResponse ? '▼' : '▶'}</span>
            <span>投稿者からの返信</span>
          </button>

          {showResponse && (
            <div className="bg-blue-50 rounded-lg p-3 ml-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✍️</span>
                <span className="text-xs text-gray-600">
                  {formatRelativeTime(review.response_created_at || '')}
                </span>
              </div>
              <p className="text-sm text-gray-800">{review.author_response}</p>
            </div>
          )}
        </div>
      )}

      {/* 返信フォーム（投稿者のみ） */}
      {isAuthor && !review.author_response && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          {!showReplyForm ? (
            <button
              onClick={() => setShowReplyForm(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              💬 返信する
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
                rows={3}
                placeholder="レビューへの返信を入力..."
                disabled={isSubmitting}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyText('');
                  }}
                  className="text-sm px-3 py-1 text-gray-600 hover:text-gray-800"
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim() || isSubmitting}
                  className="text-sm px-4 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg"
                >
                  {isSubmitting ? '送信中...' : '返信を投稿'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* フッター */}
      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={() => onHelpful?.(review.id)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          👍 参考になった ({review.helpful_count})
        </button>
      </div>
    </div>
  );
}
