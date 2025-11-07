-- ============================================================
-- 通知テーブル作成スクリプト
-- ============================================================
-- 作成日: 2025-11-07
-- 説明: 教室とピアレビューの統合通知システム
-- ============================================================

-- テーブル作成
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('board_review_received', 'board_reply_received', 'topic_comment_added')),
  source_type TEXT NOT NULL CHECK (source_type IN ('board', 'classroom')),
  source_id TEXT,
  related_id TEXT,
  title TEXT NOT NULL,
  message TEXT,
  link_url TEXT NOT NULL,
  actor_id INTEGER,
  actor_name TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- インデックス作成（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(student_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- コメント追加
COMMENT ON TABLE notifications IS '統合通知システム（教室＋掲示板）';
COMMENT ON COLUMN notifications.id IS '通知ID（UUID）';
COMMENT ON COLUMN notifications.student_id IS '通知先の生徒ID';
COMMENT ON COLUMN notifications.type IS '通知タイプ（board_review_received | board_reply_received | topic_comment_added）';
COMMENT ON COLUMN notifications.source_type IS '通知元（board | classroom）';
COMMENT ON COLUMN notifications.source_id IS '通知元のID（セッションコード or 掲示板コード）';
COMMENT ON COLUMN notifications.related_id IS '関連ID（トピックID or レビューID）';
COMMENT ON COLUMN notifications.title IS '通知タイトル';
COMMENT ON COLUMN notifications.message IS '通知メッセージ（詳細）';
COMMENT ON COLUMN notifications.link_url IS '通知クリック時のリンク先URL';
COMMENT ON COLUMN notifications.actor_id IS 'アクション実行者の生徒ID';
COMMENT ON COLUMN notifications.actor_name IS 'アクション実行者の名前';
COMMENT ON COLUMN notifications.is_read IS '既読フラグ';
COMMENT ON COLUMN notifications.read_at IS '既読日時';
COMMENT ON COLUMN notifications.created_at IS '作成日時';
