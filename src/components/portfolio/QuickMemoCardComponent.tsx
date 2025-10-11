'use client';

import { QuickMemoCard } from '@/types';

interface Props {
  card: QuickMemoCard;
}

export default function QuickMemoCardComponent({ card }: Props) {
  return (
    <div className="bg-white border-2 border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* カードタイプ表示 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <span className="text-sm font-semibold text-yellow-700">学習メモ</span>
        </div>
        {card.is_favorite && <span className="text-xl">⭐</span>}
      </div>

      {/* メモ内容 */}
      <div className="bg-yellow-50 rounded-lg p-3 mb-3">
        <p className="text-gray-800 whitespace-pre-wrap">{card.content}</p>
      </div>

      {/* タグ */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {card.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 作成日時 */}
      <div className="text-xs text-gray-400 text-right">
        {new Date(card.created_at).toLocaleString('ja-JP')}
      </div>
    </div>
  );
}
