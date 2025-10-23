-- ============================================
-- レビュー返信機能追加マイグレーション
-- ============================================
-- peer_reviews テーブルに投稿者からの返信フィールドを追加

ALTER TABLE peer_reviews
ADD COLUMN author_response TEXT,
ADD COLUMN response_created_at TIMESTAMPTZ;

-- インデックス追加（返信があるレビューを効率的に検索）
CREATE INDEX idx_reviews_with_response ON peer_reviews(submission_id)
WHERE author_response IS NOT NULL;

-- コメント追加
COMMENT ON COLUMN peer_reviews.author_response IS '作品投稿者からの返信コメント';
COMMENT ON COLUMN peer_reviews.response_created_at IS '返信投稿日時';
