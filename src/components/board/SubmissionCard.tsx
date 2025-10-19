'use client';

import Link from 'next/link';
import { formatRelativeTime, getBadgeInfo } from '@/lib/board/utils';

interface SubmissionCardProps {
  submission: {
    id: string;
    title: string;
    description: string | null;
    student_name: string;
    view_count: number;
    review_count_actual: number;
    created_at: string;
    is_featured: boolean;
  };
  boardCode: string;
}

export function SubmissionCard({ submission, boardCode }: SubmissionCardProps) {
  // バッジの判定
  const badges: ('hot' | 'new' | 'featured' | 'reviewed')[] = [];

  if (submission.is_featured) badges.push('featured');
  if (submission.review_count_actual >= 5) badges.push('hot');

  const createdAt = new Date(submission.created_at);
  const now = new Date();
  const diffHours = (now.getTime() - createdAt.getTime()) / 1000 / 60 / 60;
  if (diffHours < 24) badges.push('new');

  if (submission.review_count_actual > 0) badges.push('reviewed');

  return (
    <Link href={`/board/${boardCode}/work/${submission.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-4 cursor-pointer border border-gray-200 hover:border-blue-300">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
              {submission.title}
            </h3>
          </div>

          {/* バッジ */}
          <div className="flex gap-1 ml-2 flex-shrink-0">
            {badges.map((badge) => {
              const info = getBadgeInfo(badge);
              return (
                <span
                  key={badge}
                  className={`text-xs px-2 py-1 rounded-full ${
                    badge === 'hot'
                      ? 'bg-red-100 text-red-700'
                      : badge === 'new'
                      ? 'bg-green-100 text-green-700'
                      : badge === 'featured'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                  title={info.label}
                >
                  {info.emoji}
                </span>
              );
            })}
          </div>
        </div>

        {/* 説明文 */}
        {submission.description && (
          <p className="text-sm text-gray-700 line-clamp-3 mb-3">
            {submission.description}
          </p>
        )}

        {/* フッター */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              👁 {submission.view_count}
            </span>
            <span className="flex items-center gap-1">
              ✍️ {submission.review_count_actual}
            </span>
          </div>
          <span className="text-xs">
            {formatRelativeTime(submission.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
