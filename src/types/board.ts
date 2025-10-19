// ============================================================
// コウキョウのケイジバン - 型定義
// ============================================================

// ============================================================
// 基本型定義
// ============================================================

export type BoardStatus = 'draft' | 'active' | 'closed' | 'archived';
export type WorkType = 'google-doc' | 'google-site' | 'google-slides' | 'other';
export type SubmissionVisibility = 'public' | 'draft' | 'hidden';
export type ReviewStatus = 'draft' | 'published' | 'flagged';
export type AnimalType = 'fox' | 'bear' | 'rabbit' | 'lion' | 'frog' | 'owl' | 'penguin' | 'turtle';

// ============================================================
// 動物アイコン定義
// ============================================================

export const ANIMALS = {
  fox: { emoji: '🦊', name: 'キツネ', color: '#FF6B35' },
  bear: { emoji: '🐻', name: 'クマ', color: '#8B4513' },
  rabbit: { emoji: '🐰', name: 'ウサギ', color: '#FFB6C1' },
  lion: { emoji: '🦁', name: 'ライオン', color: '#DAA520' },
  frog: { emoji: '🐸', name: 'カエル', color: '#32CD32' },
  owl: { emoji: '🦉', name: 'フクロウ', color: '#8B7355' },
  penguin: { emoji: '🐧', name: 'ペンギン', color: '#4682B4' },
  turtle: { emoji: '🐢', name: 'カメ', color: '#2E8B57' },
} as const;

export const ANIMAL_TYPES: AnimalType[] = ['fox', 'bear', 'rabbit', 'lion', 'frog', 'owl', 'penguin', 'turtle'];

// ============================================================
// レベルシステム定義
// ============================================================

export const LEVEL_DECORATIONS = ['🥚', '🌱', '🌿', '🌳', '🌳✨', '🌳👑'] as const;

export const LEVEL_THRESHOLDS = {
  0: { min: 0, decoration: '🥚', name: '卵' },
  1: { min: 1, decoration: '🌱', name: '新芽' },
  2: { min: 3, decoration: '🌿', name: '若葉' },
  3: { min: 5, decoration: '🌳', name: '樹木' },
  4: { min: 10, decoration: '🌳✨', name: '輝く樹' },
  5: { min: 20, decoration: '🌳👑', name: '王者の樹' },
} as const;

// ============================================================
// データモデル型定義
// ============================================================

export interface Board {
  id: string;
  code: string;
  title: string;
  description: string | null;
  min_reviews_required: number;
  min_reviews_to_give: number;
  submission_deadline: string | null;
  review_deadline: string | null;
  target_students: string[] | null;
  is_public: boolean;
  status: BoardStatus;
  allow_edit_after_review: boolean;
  show_author_names: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  settings: Record<string, any> | null;
}

export interface Submission {
  id: string;
  board_id: string;
  student_id: number;
  title: string;
  description: string | null;
  work_url: string;
  work_type: WorkType;
  view_count: number;
  review_count: number;
  is_edited: boolean;
  edit_count: number;
  last_edited_at: string | null;
  visibility: SubmissionVisibility;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface PeerReview {
  id: string;
  submission_id: string;
  reviewer_id: number;
  strengths: string[];
  suggestions: string[];
  questions: string[];
  overall_comment: string | null;
  character_count: number;
  helpful_count: number;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface ReviewerProfile {
  id: string;
  student_id: number;
  board_id: string;
  animal_type: AnimalType;
  level: number;
  review_count: number;
  helpful_total: number;
  total_characters: number;
  decorations: string[];
  badges: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// 拡張型定義（JOIN結果）
// ============================================================

export interface SubmissionWithStats extends Submission {
  class_id: number | null;
  student_number: string;
  student_name: string;
  total_helpful: number;
  reviews_given_count: number;
}

export interface SubmissionWithAuthor extends Submission {
  author: {
    id: number;
    student_number: string;
    display_name: string;
    class_id: number | null;
  };
}

export interface PeerReviewWithReviewer extends PeerReview {
  reviewer: {
    id: number;
    student_number: string;
    display_name: string;
    animal_type: AnimalType;
    level: number;
  };
}

export interface ReviewerProfileWithStudent extends ReviewerProfile {
  student: {
    id: number;
    student_number: string;
    display_name: string;
    class_id: number | null;
  };
}

// ============================================================
// 表示用型定義
// ============================================================

export interface SubmissionCard {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: number;
  viewCount: number;
  reviewCount: number;
  createdAt: string;
  badges: ('hot' | 'new' | 'featured' | 'reviewed')[];
  workUrl: string;
  workType: WorkType;
}

export interface ReviewCard {
  id: string;
  reviewerIcon: string;
  reviewerName: string | null;  // null = 匿名
  strengths: string[];
  suggestions: string[];
  questions: string[];
  overallComment: string | null;
  characterCount: number;
  helpfulCount: number;
  createdAt: string;
  isHelpful: boolean;  // 自分が「参考になった」を押したか
}

// ============================================================
// フォーム型定義
// ============================================================

export interface BoardCreateForm {
  title: string;
  description: string;
  minReviewsRequired: number;
  minReviewsToGive: number;
  submissionDeadline: string | null;
  reviewDeadline: string | null;
  targetStudents: number[] | null;
}

export interface SubmissionForm {
  title: string;
  description: string;
  workUrl: string;
  workType: WorkType;
}

export interface ReviewForm {
  strengths: string[];
  suggestions: string[];
  questions: string[];
  overallComment: string;
}

// ============================================================
// API レスポンス型
// ============================================================

export interface BoardResponse {
  success: boolean;
  data?: Board;
  error?: string;
}

export interface SubmissionsResponse {
  success: boolean;
  data?: SubmissionWithStats[];
  error?: string;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ReviewsResponse {
  success: boolean;
  data?: PeerReviewWithReviewer[];
  error?: string;
}

export interface BoardStatsResponse {
  success: boolean;
  data?: {
    totalSubmissions: number;
    totalReviews: number;
    averageReviews: number;
    topReviewers: ReviewerProfileWithStudent[];
    submissionRate: number;  // 提出率（%）
  };
  error?: string;
}

// ============================================================
// ユーティリティ型
// ============================================================

export interface SubmissionFilter {
  search?: string;
  sortBy?: 'new' | 'popular' | 'needsReview' | 'featured';
  page?: number;
  perPage?: number;
}

export interface BoardSettings {
  allowComments?: boolean;
  allowAnonymousReviews?: boolean;
  requireMinLength?: number;
  showLeaderboard?: boolean;
}
