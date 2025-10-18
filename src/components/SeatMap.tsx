'use client';

import { useState } from 'react';
import { createSeatNumber, getSeatPosition } from '@/types';
import { SeatWithStudent } from '@/types';
import TopicCard from './TopicCard';

interface SeatMapProps {
  seats: SeatWithStudent[];
  onSeatSelect?: (seatNumber: number) => void;
  selectedSeat?: number | null;
  currentStudentSeat?: number | null;
  currentStudentId?: number; // コメント・リアクション機能のために追加
  viewMode?: 'teacher' | 'student'; // 教科担当者視点 or 生徒視点（180度回転）
  onReactionChange?: () => void; // リアクション・コメント変更時のコールバック
}

export default function SeatMap({
  seats,
  onSeatSelect,
  selectedSeat,
  currentStudentSeat,
  currentStudentId = 0,
  viewMode = 'teacher',
  onReactionChange,
}: SeatMapProps) {
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  // 座席番号をマップに変換
  const seatMap = new Map(seats.map((s) => [s.seat_number, s]));

  // 座席番号を180度回転（7行×6列の場合: 43 - seat_number）
  const rotateSeatNumber = (seatNumber: number): number => {
    if (viewMode === 'student') {
      return 43 - seatNumber; // 1→42, 2→41, ..., 42→1
    }
    return seatNumber;
  };

  // 座席がクリック可能か判定
  const isSeatClickable = (seatNumber: number) => {
    return onSeatSelect && !seatMap.has(seatNumber) && !currentStudentSeat;
  };

  const renderSeat = (seatNumber: number) => {
    const seat = seatMap.get(seatNumber);
    const isOccupied = !!seat;
    const isSelected = selectedSeat === seatNumber;
    const isCurrentStudent = currentStudentSeat === seatNumber;
    const clickable = isSeatClickable(seatNumber);
    const hasPost = seat?.topic_post;

    return (
      <button
        key={seatNumber}
        onClick={() => {
          if (hasPost) {
            setHoveredSeat(seatNumber);
          } else if (clickable) {
            onSeatSelect?.(seatNumber);
          }
        }}
        disabled={!clickable && !hasPost}
        className={`
          relative aspect-[2/1] rounded-lg border-2 transition-all duration-200
          ${
            isCurrentStudent
              ? 'border-blue-500 bg-blue-50'
              : isOccupied && hasPost
              ? 'border-green-300 bg-green-50 cursor-pointer hover:border-green-500'
              : isOccupied
              ? 'border-gray-300 bg-gray-100 cursor-default'
              : isSelected
              ? 'border-blue-500 bg-blue-100'
              : clickable
              ? 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
              : 'border-gray-200 bg-white cursor-default'
          }
        `}
      >
        {/* 座席番号 */}
        <div className="absolute top-0.5 left-0.5 text-[10px] text-gray-400">
          {seatNumber}
        </div>

        {/* 生徒情報 */}
        {seat && (
          <div className="flex flex-col items-center justify-center h-full px-1">
            <div className="text-[11px] font-medium text-gray-700 text-center break-words leading-tight">
              {seat.student?.display_name}
            </div>
            {seat.topic_post && (
              <div className="mt-0.5 flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" title="投稿済み" />
                {/* リアクション数バッジ */}
                {seat.topic_post.reaction_count !== undefined && seat.topic_post.reaction_count > 0 && (
                  <span className="text-[9px] bg-orange-100 text-orange-700 px-1 rounded" title="リアクション数">
                    👍{seat.topic_post.reaction_count}
                  </span>
                )}
                {/* コメント数バッジ */}
                {seat.topic_post.comment_count !== undefined && seat.topic_post.comment_count > 0 && (
                  <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded" title="コメント数">
                    💬{seat.topic_post.comment_count}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* 選択中マーク */}
        {isSelected && !isOccupied && (
          <div className="flex items-center justify-center h-full">
            <span className="text-2xl">✓</span>
          </div>
        )}

        {/* 現在の生徒マーク */}
        {isCurrentStudent && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full" />
        )}
      </button>
    );
  };

  return (
    <div className="w-full">
      {/* 生徒視点: 教卓が上 */}
      {viewMode === 'student' && (
        <div className="mb-1.5 flex items-center justify-between">
          <div className="bg-gray-700 text-white px-4 py-1.5 rounded text-xs font-semibold">
            教卓
          </div>

          {/* 凡例 */}
          <div className="flex gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-green-300 bg-green-50 rounded" />
              <span>投稿済み</span>
            </div>
            {currentStudentSeat && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-blue-500 bg-blue-50 rounded" />
                <span>あなた</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 座席グリッド (7行 x 6列) */}
      <div className="grid grid-cols-6 gap-1 w-full">
        {Array.from({ length: 42 }, (_, i) => {
          const displayIndex = viewMode === 'student' ? i + 1 : 42 - i;
          return renderSeat(displayIndex);
        })}
      </div>

      {/* 教科担当者視点: 教卓が下 */}
      {viewMode === 'teacher' && (
        <div className="mt-1.5 flex items-center justify-between">
          <div className="bg-gray-700 text-white px-4 py-1.5 rounded text-xs font-semibold">
            教卓
          </div>

          {/* 凡例 */}
          <div className="flex gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-green-300 bg-green-50 rounded" />
              <span>投稿済み</span>
            </div>
            {currentStudentSeat && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-blue-500 bg-blue-50 rounded" />
                <span>あなた</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* トピック詳細モーダル（TopicCardコンポーネントを使用） */}
      {hoveredSeat && seatMap.get(hoveredSeat)?.topic_post && seatMap.get(hoveredSeat)?.student && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setHoveredSeat(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* ヘッダー */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">座席 {hoveredSeat}番</span>
                </div>
                <button
                  onClick={() => setHoveredSeat(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* TopicCardコンポーネントを使用 */}
              <TopicCard
                post={seatMap.get(hoveredSeat)!.topic_post!}
                author={seatMap.get(hoveredSeat)!.student!}
                currentStudentId={currentStudentId}
                seatNumber={hoveredSeat}
                autoShowComments={true}
                onReactionChange={onReactionChange}
              />

              {/* 閉じるボタン */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setHoveredSeat(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
