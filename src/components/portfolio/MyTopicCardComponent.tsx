'use client';

import { MyTopicCard, REACTIONS } from '@/types';
import { useState } from 'react';

interface Props {
  card: MyTopicCard;
}

export default function MyTopicCardComponent({ card }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  const totalReactions =
    (card.reactions_count?.surprise || 0) +
    (card.reactions_count?.understand || 0) +
    (card.reactions_count?.question || 0);

  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* カードタイプ表示 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <span className="text-sm font-semibold text-blue-700">あなたの投稿</span>
          {card.seat_number && (
            <span className="text-xs text-gray-500">座席 {card.seat_number}</span>
          )}
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showDetails ? '▲ 閉じる' : '▼ 詳細を見る'}
        </button>
      </div>

      {/* 投稿内容 */}
      <div className="bg-blue-50 rounded-lg p-3 mb-3">
        <p className="text-gray-800 whitespace-pre-wrap">{card.content}</p>
      </div>

      {/* 統計情報 */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <span>💬</span>
          <span>{totalReactions} リアクション</span>
        </div>
        <div className="flex items-center gap-1">
          <span>✏️</span>
          <span>{card.comments_count || 0} コメント</span>
        </div>
      </div>

      {/* 詳細表示 */}
      {showDetails && card.reactions_count && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-2">
            リアクションの内訳
          </div>
          <div className="flex gap-3">
            {Object.entries(REACTIONS).map(([key, reaction]) => {
              const count = card.reactions_count?.[key as keyof typeof REACTIONS] || 0;
              if (count === 0) return null;
              return (
                <div
                  key={key}
                  className="flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded"
                >
                  <span>{reaction.emoji}</span>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 投稿日時 */}
      <div className="mt-2 text-xs text-gray-400 text-right">
        {new Date(card.created_at).toLocaleString('ja-JP')}
      </div>
    </div>
  );
}
