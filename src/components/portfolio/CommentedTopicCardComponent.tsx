'use client';

import { CommentedTopicCard } from '@/types';

interface Props {
  card: CommentedTopicCard;
}

export default function CommentedTopicCardComponent({ card }: Props) {
  return (
    <div className="bg-white border-2 border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* カードタイプ表示 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">✏️</span>
        <span className="text-sm font-semibold text-purple-700">
          コメントした投稿
        </span>
      </div>

      {/* 元の投稿内容（著者名なし） */}
      <div className="bg-purple-50 rounded-lg p-3 mb-3">
        <p className="text-gray-800 whitespace-pre-wrap">{card.content}</p>
      </div>

      {/* 自分のコメント */}
      <div className="border-l-4 border-purple-400 pl-3 mb-2">
        <div className="text-xs text-purple-700 font-medium mb-1">
          あなたのコメント
        </div>
        <p className="text-sm text-gray-700">{card.my_comment}</p>
      </div>

      {/* コメント日時 */}
      <div className="text-xs text-gray-400 text-right">
        {new Date(card.commented_at).toLocaleString('ja-JP')} にコメント
      </div>
    </div>
  );
}
