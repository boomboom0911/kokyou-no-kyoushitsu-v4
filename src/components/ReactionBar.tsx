'use client';

import { useState, useEffect } from 'react';
import { REACTIONS, ReactionType, ReactionsSummary } from '@/types';

interface ReactionBarProps {
  targetType: 'topic' | 'comment';
  targetId: number;
  studentId: number;
  onReactionChange?: () => void;
}

export default function ReactionBar({
  targetType,
  targetId,
  studentId,
  onReactionChange,
}: ReactionBarProps) {
  const [reactions, setReactions] = useState<ReactionsSummary>({
    reactions: { surprise: 0, understand: 0, question: 0 },
    myReactions: [],
  });
  const [loading, setLoading] = useState(false);

  // リアクション情報を取得
  const fetchReactions = async () => {
    try {
      const response = await fetch(
        `/api/reactions?targetType=${targetType}&targetId=${targetId}&studentId=${studentId}`
      );
      const data = await response.json();

      if (data.success) {
        setReactions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch reactions:', error);
    }
  };

  useEffect(() => {
    fetchReactions();
  }, [targetType, targetId, studentId]);

  // リアクションを追加/削除
  const toggleReaction = async (reactionType: ReactionType) => {
    if (loading) return;

    setLoading(true);

    try {
      const isMyReaction = reactions.myReactions.includes(reactionType);

      if (isMyReaction) {
        // 削除
        const response = await fetch('/api/reactions', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetType,
            targetId,
            studentId,
            reactionType,
          }),
        });

        if (response.ok) {
          await fetchReactions();
          onReactionChange?.();
        }
      } else {
        // 追加
        const response = await fetch('/api/reactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetType,
            targetId,
            studentId,
            reactionType,
          }),
        });

        if (response.ok) {
          await fetchReactions();
          onReactionChange?.();
        }
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {Object.values(REACTIONS).map((reaction) => {
        const count = reactions.reactions[reaction.id];
        const isActive = reactions.myReactions.includes(reaction.id);

        return (
          <button
            key={reaction.id}
            onClick={() => toggleReaction(reaction.id)}
            disabled={loading}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all
              ${
                isActive
                  ? `border-[${reaction.color}] bg-opacity-10`
                  : 'border-gray-200 hover:border-gray-300'
              }
              ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
            `}
            style={{
              borderColor: isActive ? reaction.color : undefined,
              backgroundColor: isActive ? `${reaction.color}15` : undefined,
            }}
            title={reaction.tooltip}
          >
            <span
              className="text-xl font-bold"
              style={{ color: isActive ? reaction.color : '#666' }}
            >
              {reaction.kanji}
            </span>
            {count > 0 && (
              <span
                className="text-sm font-semibold min-w-[1.25rem] text-center"
                style={{ color: isActive ? reaction.color : '#666' }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
