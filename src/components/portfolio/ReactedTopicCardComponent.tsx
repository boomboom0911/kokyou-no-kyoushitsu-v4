'use client';

import { ReactedTopicCard, REACTIONS } from '@/types';

interface Props {
  card: ReactedTopicCard;
}

export default function ReactedTopicCardComponent({ card }: Props) {
  const reaction = REACTIONS[card.my_reaction_type];

  return (
    <div className="bg-white border-2 border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* カードタイプ表示 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{reaction.emoji}</span>
          <span className="text-sm font-semibold text-green-700">
            リアクションした投稿
          </span>
        </div>
        <div
          className="text-xs px-2 py-1 rounded-full"
          style={{
            backgroundColor: `${reaction.color}20`,
            color: reaction.color,
          }}
        >
          {reaction.label}
        </div>
      </div>

      {/* 投稿内容（著者名なし） */}
      <div className="bg-green-50 rounded-lg p-3 mb-2">
        <p className="text-gray-800 whitespace-pre-wrap">{card.content}</p>
      </div>

      {/* リアクション日時 */}
      <div className="text-xs text-gray-400 text-right">
        {new Date(card.reacted_at).toLocaleString('ja-JP')} にリアクション
      </div>
    </div>
  );
}
