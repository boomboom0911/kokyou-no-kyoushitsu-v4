import { SeatNumber, createSeatNumber } from '@/types';

/**
 * 座席番号のバリデーション
 */
export function isValidSeatNumber(n: number): boolean {
  return n >= 1 && n <= 42;
}

/**
 * 行・列から座席番号を計算
 * @param row 0-based row index (0-6)
 * @param col 0-based column index (0-5)
 */
export function calculateSeatNumber(row: number, col: number): SeatNumber | null {
  if (row < 0 || row > 6 || col < 0 || col > 5) {
    return null;
  }
  return createSeatNumber(row * 6 + col + 1);
}

/**
 * 座席マップ用のグリッド位置を取得
 */
export function getSeatGridPosition(seatNumber: SeatNumber): {
  gridRow: number;
  gridColumn: number;
} {
  const row = Math.floor((seatNumber - 1) / 6);
  const col = (seatNumber - 1) % 6;

  return {
    gridRow: row + 1, // CSS Grid is 1-based
    gridColumn: col + 1,
  };
}

/**
 * 全座席番号の配列を生成 (1-42)
 */
export function getAllSeatNumbers(): SeatNumber[] {
  return Array.from({ length: 42 }, (_, i) => createSeatNumber(i + 1)!);
}

/**
 * 座席が利用可能かチェック
 */
export function isSeatAvailable(
  seatNumber: SeatNumber,
  occupiedSeats: Set<number>
): boolean {
  return !occupiedSeats.has(seatNumber);
}
