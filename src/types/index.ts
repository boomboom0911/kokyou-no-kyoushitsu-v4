// ============================================================
// 座席番号型（Brand型で型安全性を確保）
// ============================================================
export type SeatNumber = number & { __brand: 'SeatNumber' };

/**
 * 座席番号を作成（1-42の範囲チェック）
 */
export function createSeatNumber(n: number): SeatNumber | null {
  if (n < 1 || n > 42) return null;
  return n as SeatNumber;
}

/**
 * 座席番号から行・列を取得
 * @returns 0-based position (row: 0-6, col: 0-5)
 */
export function getSeatPosition(seatNumber: SeatNumber): { row: number; col: number } {
  return {
    row: Math.floor((seatNumber - 1) / 6),
    col: (seatNumber - 1) % 6,
  };
}

// ============================================================
// リアクション型
// ============================================================
export type ReactionType = 'surprise' | 'understand' | 'question';

export const REACTIONS = {
  surprise: {
    id: 'surprise' as const,
    kanji: '驚',
    label: 'わお！新しい発見',
    tooltip: '驚いた、新しい視点を得た',
    color: '#EF4444',
    emoji: '😮',
  },
  understand: {
    id: 'understand' as const,
    kanji: '納',
    label: 'ふむふむ、納得',
    tooltip: '納得した、理解できた',
    color: '#10B981',
    emoji: '🤔',
  },
  question: {
    id: 'question' as const,
    kanji: '疑',
    label: 'はて?疑問がある',
    tooltip: '疑問がある、もっと知りたい',
    color: '#F59E0B',
    emoji: '❓',
  },
} as const;

// ============================================================
// データモデル型定義
// ============================================================

export interface Student {
  id: number;
  google_email: string;
  student_number: string;
  display_name: string;
  class_id: number | null;
}

export interface LessonSession {
  id: number;
  code: string;
  class_id: number | null;
  topic_title: string;
  topic_content: string | null;
  date: string;
  period: number;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
}

export interface SeatAssignment {
  id: number;
  session_id: number;
  student_id: number;
  seat_number: SeatNumber;
  created_at: string;
}

export interface TopicPost {
  id: number;
  session_id: number;
  student_id: number;
  seat_assignment_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  reaction_count?: number; // リアクション総数（オプション）
  comment_count?: number; // コメント総数（オプション）
}

export interface Reaction {
  id: number;
  target_type: 'topic' | 'comment';
  target_id: number;
  student_id: number;
  reaction_type: ReactionType;
  created_at: string;
}

export interface Interaction {
  id: number;
  target_type: 'topic' | 'comment';
  target_id: number;
  student_id: number;
  type: 'comment';
  comment_text: string;
  created_at: string;
}

export interface LearningMemo {
  id: string;
  student_id: number;
  session_id: number | null;
  content: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioEntry {
  // メモ情報
  memo_id: string;
  memo_content: string;
  memo_tags: string[];
  is_favorite: boolean;
  memo_created_at: string;

  // セッション情報
  session_id?: number;
  session_code?: string;
  topic_title?: string;
  session_date?: string;
  period?: number;
  class_name?: string;
  seat_number?: SeatNumber;

  // 自分の投稿
  my_topic_content?: string;
  topic_created_at?: string;

  // 反応したトピック
  reacted_topics?: Array<{
    topic_id: number;
    topic_content: string;
    author_name: string;
    reaction_type: ReactionType;
    reacted_at: string;
  }>;

  // コメントしたトピック
  commented_topics?: Array<{
    topic_id: number;
    topic_content: string;
    author_name: string;
    my_comment: string;
    commented_at: string;
  }>;
}

// ============================================================
// API レスポンス型
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  student: Student;
  session: LessonSession;
}

export interface SeatWithStudent {
  seat_number: number;
  seat_assignment_id?: number; // 座席割り当てID
  student: Student | null;
  topic_post: TopicPost | null;
}

export interface ReactionCounts {
  surprise: number;
  understand: number;
  question: number;
}

export interface ReactionsSummary {
  reactions: ReactionCounts;
  myReactions: ReactionType[];
}

// ============================================================
// 新ポートフォリオ型定義（セッションごとにグループ化）
// ============================================================

// 自分のトピック投稿カード
export interface MyTopicCard {
  type: 'my_topic';
  topic_id: number;
  content: string;
  created_at: string;
  seat_number?: number;
  reactions_count?: ReactionCounts;
  comments_count?: number;
}

// リアクションしたトピックカード
export interface ReactedTopicCard {
  type: 'reacted_topic';
  topic_id: number;
  content: string;
  my_reaction_type: ReactionType;
  reacted_at: string;
}

// コメントしたトピックカード
export interface CommentedTopicCard {
  type: 'commented_topic';
  topic_id: number;
  content: string;
  my_comment: string;
  commented_at: string;
}

// クイックメモカード
export interface QuickMemoCard {
  type: 'quick_memo';
  memo_id: number;
  content: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
}

// 全カードタイプのUnion型
export type PortfolioCard = MyTopicCard | ReactedTopicCard | CommentedTopicCard | QuickMemoCard;

// セッションごとのポートフォリオ
export interface SessionPortfolio {
  session_id: number;
  session_code: string;
  topic_title: string;
  session_date: string;
  period: number;
  class_name?: string;
  seat_number?: number;
  cards: PortfolioCard[];
}

// ポートフォリオ全体の構造
export interface GroupedPortfolio {
  sessions: SessionPortfolio[];
}
