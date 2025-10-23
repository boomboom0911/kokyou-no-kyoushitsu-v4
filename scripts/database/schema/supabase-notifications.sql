-- ============================================
-- 統合通知システム
-- ============================================
-- 掲示板と教室の両方の通知を管理するテーブル

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,

  -- 通知タイプ
  type VARCHAR(50) NOT NULL,
  -- 'board_review_received' : 自分の作品にレビューが投稿された
  -- 'board_reply_received' : 自分のレビューに返信があった
  -- 'topic_comment_added' : 自分が投稿/コメントしたトピックに新しいコメント

  -- ソース情報
  source_type VARCHAR(20) NOT NULL, -- 'board' or 'classroom'
  source_id TEXT, -- board_code or session_code

  -- 関連情報（リンク先の特定に使用）
  related_id TEXT, -- submission_id, review_id, topic_id, comment_id など

  -- 通知内容
  title TEXT NOT NULL,
  message TEXT,
  link_url TEXT NOT NULL, -- クリック時の遷移先URL

  -- アクター情報（誰が行った行動か）
  actor_id BIGINT REFERENCES students(id) ON DELETE SET NULL,
  actor_name TEXT,

  -- 状態
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 制約
  CONSTRAINT notifications_type_check
    CHECK (type IN ('board_review_received', 'board_reply_received', 'topic_comment_added')),
  CONSTRAINT notifications_source_type_check
    CHECK (source_type IN ('board', 'classroom'))
);

-- インデックス
CREATE INDEX idx_notifications_student ON notifications(student_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(student_id, is_read, created_at DESC)
  WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type, created_at DESC);

-- コメント
COMMENT ON TABLE notifications IS '掲示板と教室の統合通知システム';
COMMENT ON COLUMN notifications.type IS '通知タイプ（レビュー受信、返信受信、コメント追加など）';
COMMENT ON COLUMN notifications.source_type IS '通知元（board=掲示板, classroom=教室）';
COMMENT ON COLUMN notifications.actor_id IS '通知を発生させた生徒のID';
