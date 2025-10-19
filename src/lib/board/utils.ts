// ============================================================
// 掲示板ユーティリティ関数
// ============================================================

import { WorkType } from '@/types/board';

/**
 * 4桁の掲示板コードを生成
 * @returns 4桁のランダムコード（A-Z, 0-9）
 */
export function generateBoardCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Google URLの種類を判定
 * @param url - チェックするURL
 * @returns WorkType
 */
export function detectWorkType(url: string): WorkType {
  try {
    const urlObj = new URL(url);

    if (urlObj.hostname === 'docs.google.com') {
      if (urlObj.pathname.includes('/document/')) return 'google-doc';
      if (urlObj.pathname.includes('/presentation/')) return 'google-slides';
    }

    if (urlObj.hostname === 'sites.google.com') {
      return 'google-site';
    }

    return 'other';
  } catch {
    return 'other';
  }
}

/**
 * Google URLの検証
 * @param url - 検証するURL
 * @returns バリデーション結果
 */
export function validateGoogleUrl(url: string): { valid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);

    const validHosts = [
      'docs.google.com',
      'sites.google.com',
      'drive.google.com',
    ];

    if (!validHosts.includes(urlObj.hostname)) {
      return {
        valid: false,
        error: 'Google ドキュメント、サイト、ドライブのURLのみ対応しています',
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: '有効なURLを入力してください',
    };
  }
}

/**
 * Google URLを埋め込み用URLに変換
 * @param url - 元のURL
 * @param allowEdit - 編集許可（デフォルト: false）
 * @returns 埋め込み用URL
 */
export function convertToEmbedUrl(url: string, allowEdit = false): string | null {
  try {
    const urlObj = new URL(url);

    // Google Docs
    if (urlObj.hostname === 'docs.google.com' && urlObj.pathname.includes('/document/')) {
      const embedPath = urlObj.pathname.replace('/edit', '/preview');
      return `${urlObj.origin}${embedPath}?embedded=true`;
    }

    // Google Slides
    if (urlObj.hostname === 'docs.google.com' && urlObj.pathname.includes('/presentation/')) {
      const embedPath = urlObj.pathname.replace('/edit', '/embed');
      return `${urlObj.origin}${embedPath}?start=false&loop=false&delayms=3000`;
    }

    // Google Sites
    if (urlObj.hostname === 'sites.google.com') {
      return url; // サイトはそのまま埋め込み可能
    }

    // Google Drive
    if (urlObj.hostname === 'drive.google.com') {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 相対時刻表示（例: "3分前", "2時間前"）
 * @param dateString - ISO形式の日時文字列
 * @returns 相対時刻文字列
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;

  // 7日以上前は日付表示
  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * 締切までの残り時間を表示
 * @param deadlineString - ISO形式の締切日時
 * @returns 残り時間文字列
 */
export function formatDeadline(deadlineString: string): {
  text: string;
  status: 'safe' | 'warning' | 'danger' | 'expired';
} {
  const deadline = new Date(deadlineString);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs < 0) {
    return { text: '締切済み', status: 'expired' };
  }

  const diffMin = Math.floor(diffMs / 1000 / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 3) {
    return { text: `残り${diffDay}日`, status: 'safe' };
  }

  if (diffDay > 0) {
    return { text: `残り${diffDay}日`, status: 'warning' };
  }

  if (diffHour > 0) {
    return { text: `残り${diffHour}時間`, status: 'danger' };
  }

  return { text: `残り${diffMin}分`, status: 'danger' };
}

/**
 * 文字数カウント（改行も含む）
 * @param text - カウントするテキスト
 * @returns 文字数
 */
export function countCharacters(text: string): number {
  return text.length;
}

/**
 * 配列要素の文字数合計
 * @param items - 文字列配列
 * @returns 合計文字数
 */
export function countTotalCharacters(items: string[]): number {
  return items.reduce((sum, item) => sum + item.length, 0);
}

/**
 * レビュー内容の総文字数を計算
 * @param strengths - 良い点の配列
 * @param suggestions - 改善提案の配列
 * @param questions - 質問の配列
 * @param overallComment - 総合コメント
 * @returns 合計文字数
 */
export function calculateReviewCharacterCount(
  strengths: string[],
  suggestions: string[],
  questions: string[],
  overallComment: string
): number {
  return (
    countTotalCharacters(strengths) +
    countTotalCharacters(suggestions) +
    countTotalCharacters(questions) +
    countCharacters(overallComment || '')
  );
}

/**
 * 作品のバッジを判定
 * @param submission - 作品情報
 * @returns バッジ配列
 */
export function getSubmissionBadges(submission: {
  is_featured: boolean;
  review_count: number;
  created_at: string;
  view_count: number;
}): ('hot' | 'new' | 'featured' | 'reviewed')[] {
  const badges: ('hot' | 'new' | 'featured' | 'reviewed')[] = [];

  // おすすめ
  if (submission.is_featured) {
    badges.push('featured');
  }

  // アツい（レビュー数が多い）
  if (submission.review_count >= 5) {
    badges.push('hot');
  }

  // 新着（24時間以内）
  const createdAt = new Date(submission.created_at);
  const now = new Date();
  const diffHours = (now.getTime() - createdAt.getTime()) / 1000 / 60 / 60;
  if (diffHours < 24) {
    badges.push('new');
  }

  // レビュー済み
  if (submission.review_count > 0) {
    badges.push('reviewed');
  }

  return badges;
}

/**
 * バッジの表示情報を取得
 * @param badge - バッジタイプ
 * @returns 表示情報
 */
export function getBadgeInfo(badge: 'hot' | 'new' | 'featured' | 'reviewed') {
  const badgeMap = {
    hot: { emoji: '🔥', label: 'アツい', color: 'red' },
    new: { emoji: '🌱', label: '新着', color: 'green' },
    featured: { emoji: '⭐', label: 'おすすめ', color: 'yellow' },
    reviewed: { emoji: '✍️', label: 'レビュー済', color: 'blue' },
  };

  return badgeMap[badge];
}
