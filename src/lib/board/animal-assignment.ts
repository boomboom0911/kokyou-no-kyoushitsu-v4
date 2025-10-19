// ============================================================
// 動物アイコン割り当てシステム
// ============================================================

import {
  AnimalType,
  ANIMALS,
  ANIMAL_TYPES,
  LEVEL_DECORATIONS,
  LEVEL_THRESHOLDS,
} from '@/types/board';

/**
 * 決定的な動物アイコン割り当て
 * 同じ student_id + board_id の組み合わせは常に同じ動物になる
 *
 * @param studentId - 生徒ID
 * @param boardId - 掲示板ID
 * @returns 割り当てられた動物タイプ
 */
export function assignAnimal(studentId: number | string, boardId: string): AnimalType {
  // シンプルなハッシュ関数
  const combined = `${studentId}-${boardId}`;
  let hash = 0;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }

  // 絶対値を取って配列のインデックスに変換
  const index = Math.abs(hash) % ANIMAL_TYPES.length;
  return ANIMAL_TYPES[index];
}

/**
 * レビュー数からレベルを計算
 *
 * @param reviewCount - レビュー実施数
 * @returns レベル (0-5)
 */
export function calculateLevel(reviewCount: number): number {
  if (reviewCount >= 20) return 5;
  if (reviewCount >= 10) return 4;
  if (reviewCount >= 5) return 3;
  if (reviewCount >= 3) return 2;
  if (reviewCount >= 1) return 1;
  return 0;
}

/**
 * レベルに応じた装飾を取得
 *
 * @param level - レベル (0-5)
 * @returns 装飾絵文字
 */
export function getLevelDecoration(level: number): string {
  if (level < 0 || level > 5) {
    return LEVEL_DECORATIONS[0];
  }
  return LEVEL_DECORATIONS[level];
}

/**
 * レベル情報を取得
 *
 * @param reviewCount - レビュー実施数
 * @returns レベル情報
 */
export function getLevelInfo(reviewCount: number) {
  const level = calculateLevel(reviewCount);
  const threshold = LEVEL_THRESHOLDS[level as keyof typeof LEVEL_THRESHOLDS];

  // 次のレベルまでの残り
  const nextThreshold = level < 5
    ? LEVEL_THRESHOLDS[(level + 1) as keyof typeof LEVEL_THRESHOLDS]
    : null;

  return {
    level,
    decoration: threshold.decoration,
    name: threshold.name,
    nextLevel: nextThreshold ? {
      level: level + 1,
      name: nextThreshold.name,
      remaining: nextThreshold.min - reviewCount,
    } : null,
  };
}

/**
 * 表示用のアイコン文字列を生成
 *
 * @param animal - 動物タイプ
 * @param level - レベル
 * @returns アイコン文字列（例: "🦊 🌳"）
 */
export function getReviewerIcon(animal: AnimalType, level: number): string {
  const animalInfo = ANIMALS[animal];
  const decoration = getLevelDecoration(level);
  return `${animalInfo.emoji} ${decoration}`;
}

/**
 * 表示用の完全なレビュアー情報を生成
 *
 * @param animal - 動物タイプ
 * @param level - レベル
 * @param reviewCount - レビュー実施数
 * @returns レビュアー表示情報
 */
export function getReviewerDisplayInfo(animal: AnimalType, level: number, reviewCount: number) {
  const animalInfo = ANIMALS[animal];
  const levelInfo = getLevelInfo(reviewCount);

  return {
    icon: getReviewerIcon(animal, level),
    animal: animalInfo.name,
    animalEmoji: animalInfo.emoji,
    level,
    levelName: levelInfo.name,
    decoration: levelInfo.decoration,
    reviewCount,
    color: animalInfo.color,
    nextLevel: levelInfo.nextLevel,
  };
}

/**
 * レビュアーのニックネームを生成
 *
 * @param animal - 動物タイプ
 * @param level - レベル
 * @returns ニックネーム（例: "キツネ Lv.3"）
 */
export function getReviewerNickname(animal: AnimalType, level: number): string {
  const animalInfo = ANIMALS[animal];
  return `${animalInfo.name} Lv.${level}`;
}
