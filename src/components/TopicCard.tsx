'use client';

import { useState, useEffect } from 'react';
import { TopicPost, Student } from '@/types';
import ReactionBar from './ReactionBar';

interface Comment {
  id: number;
  student_id: number;
  comment_text: string;
  created_at: string;
  student?: {
    display_name: string;
  };
}

interface TopicCardProps {
  post: TopicPost;
  author: Student;
  currentStudentId: number;
  seatNumber: number;
  onReactionChange?: () => void;
  autoShowComments?: boolean; // コメントを最初から表示するか
}

export default function TopicCard({
  post,
  author,
  currentStudentId,
  seatNumber,
  onReactionChange,
  autoShowComments = false,
}: TopicCardProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(autoShowComments);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  // コンポーネントマウント時にコメント件数を取得
  useEffect(() => {
    fetchComments();
  }, []);

  // コメントセクション開閉時にも取得
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `/api/interactions?targetType=topic&targetId=${post.id}`
      );
      const data = await response.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || loading) {
      return;
    }

    // 認証チェック: currentStudentIdが有効な値かを確認
    if (currentStudentId === 0 || currentStudentId === null || currentStudentId === undefined) {
      alert('コメントを投稿するにはログインが必要です');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType: 'topic',
          targetId: post.id,
          studentId: currentStudentId,
          commentText: newComment.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewComment('');
        fetchComments();
        onReactionChange?.(); // リアクション変更コールバックを実行
      } else {
        alert(`コメント送信失敗: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('コメント送信中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-700">
              {seatNumber}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-800">{author.display_name}</div>
            <div className="text-xs text-gray-500">
              {new Date(post.created_at).toLocaleString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 投稿内容 */}
      <div className="text-gray-700 whitespace-pre-wrap break-words">
        {post.content}
      </div>

      {/* リアクションバー */}
      <div className="pt-2 border-t border-gray-100">
        <ReactionBar
          targetType="topic"
          targetId={post.id}
          studentId={currentStudentId}
          onReactionChange={onReactionChange}
        />
      </div>

      {/* コメントセクション */}
      <div className="pt-2 border-t border-gray-100">
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showComments ? '💬 コメントを閉じる' : `💬 コメント ${comments.length > 0 ? `(${comments.length})` : ''}`}
        </button>

        {showComments && (
          <div className="mt-3 space-y-3">
            {/* コメント一覧 */}
            {comments.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {comment.student_id === null || comment.student_id === 0 || comment.student_id === -1 || comment.student_id === -999
                          ? '👨‍🏫 教科担当者'
                          : comment.student?.display_name || '匿名'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mb-2">{comment.comment_text}</p>

                    {/* コメントへのリアクションバー */}
                    <div className="pt-2 border-t border-gray-200">
                      <ReactionBar
                        targetType="comment"
                        targetId={comment.id}
                        studentId={currentStudentId}
                        onReactionChange={fetchComments}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                まだコメントがありません
              </div>
            )}

            {/* コメント入力 */}
            {currentStudentId && currentStudentId !== 0 ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                  placeholder="コメントを入力..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-400"
                  disabled={loading}
                />
                <button
                  onClick={handlePostComment}
                  disabled={loading || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {loading ? '送信中...' : '送信'}
                </button>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                💡 コメントを投稿するには、生徒または教員としてログインしてください
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
