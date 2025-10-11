-- ============================================================
-- 公共のキョウシツ v4 - Supabase Database Schema
-- ============================================================

-- 1. classes (クラスマスタ)
CREATE TABLE IF NOT EXISTS classes (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  grade INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. students (生徒マスタ)
CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  google_email VARCHAR(255) UNIQUE NOT NULL,
  class_id BIGINT REFERENCES classes(id),
  student_number VARCHAR(20) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT students_email_format CHECK (google_email LIKE '%@%')
);

CREATE INDEX IF NOT EXISTS idx_students_email ON students(google_email);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);

-- 3. lesson_sessions (授業セッション)
CREATE TABLE IF NOT EXISTS lesson_sessions (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(4) UNIQUE NOT NULL,
  class_id BIGINT REFERENCES classes(id),

  -- 授業情報
  topic_title VARCHAR(200) NOT NULL,
  topic_content TEXT,
  date DATE NOT NULL,
  period INTEGER NOT NULL,

  -- 状態管理
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT lesson_sessions_code_format CHECK (code ~ '^[A-Z0-9]{4}$'),
  CONSTRAINT lesson_sessions_period_range CHECK (period >= 1 AND period <= 7)
);

CREATE INDEX IF NOT EXISTS idx_lesson_sessions_code ON lesson_sessions(code);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_active ON lesson_sessions(is_active, started_at DESC);

-- 4. seat_assignments (座席割り当て)
CREATE TABLE IF NOT EXISTS seat_assignments (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES lesson_sessions(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,

  -- 座席番号で統一（1-42）
  seat_number INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 制約
  CONSTRAINT seat_number_range CHECK (seat_number >= 1 AND seat_number <= 42),
  UNIQUE(session_id, seat_number),    -- 同じ座席に複数人は座れない
  UNIQUE(session_id, student_id)       -- 同じ生徒は1つの座席のみ
);

CREATE INDEX IF NOT EXISTS idx_seat_assignments_session ON seat_assignments(session_id);
CREATE INDEX IF NOT EXISTS idx_seat_assignments_student_created
  ON seat_assignments(student_id, created_at DESC);

-- 5. topic_posts (トピック投稿)
CREATE TABLE IF NOT EXISTS topic_posts (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES lesson_sessions(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  seat_assignment_id BIGINT REFERENCES seat_assignments(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT topic_posts_content_not_empty CHECK (length(content) > 0)
);

CREATE INDEX IF NOT EXISTS idx_topic_posts_session ON topic_posts(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topic_posts_student ON topic_posts(student_id, created_at DESC);

-- 6. chat_messages (チャット)
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES lesson_sessions(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE SET NULL,

  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chat_messages_message_not_empty CHECK (length(message) > 0)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);

-- 7. reactions (リアクション)
CREATE TABLE IF NOT EXISTS reactions (
  id BIGSERIAL PRIMARY KEY,

  -- リアクション対象
  target_type VARCHAR(20) NOT NULL,  -- 'topic' | 'comment'
  target_id BIGINT NOT NULL,

  -- リアクションした生徒
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,

  -- リアクション種別（驚・納・疑）
  reaction_type VARCHAR(20) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT reactions_type_check
    CHECK (target_type IN ('topic', 'comment')),
  CONSTRAINT reactions_reaction_type_check
    CHECK (reaction_type IN ('surprise', 'understand', 'question')),

  -- 同じ人が同じ対象に同じリアクションは1回のみ
  UNIQUE(target_type, target_id, student_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reactions_student ON reactions(student_id, created_at DESC);

-- 8. interactions (コメント)
CREATE TABLE IF NOT EXISTS interactions (
  id BIGSERIAL PRIMARY KEY,

  -- コメント対象
  target_type VARCHAR(20) NOT NULL,  -- 'topic'
  target_id BIGINT NOT NULL,

  -- コメントした生徒
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,

  -- コメント内容
  type VARCHAR(20) DEFAULT 'comment',
  comment_text TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT interactions_type_check
    CHECK (target_type IN ('topic', 'comment')),
  CONSTRAINT interactions_comment_not_empty
    CHECK (length(comment_text) > 0)
);

CREATE INDEX IF NOT EXISTS idx_interactions_target ON interactions(target_type, target_id, created_at);
CREATE INDEX IF NOT EXISTS idx_interactions_student ON interactions(student_id, created_at DESC);

-- 9. learning_memos (学習メモ)
CREATE TABLE IF NOT EXISTS learning_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,

  -- セッションとの関連（削除されても残す）
  session_id BIGINT REFERENCES lesson_sessions(id) ON DELETE SET NULL,

  -- メモ内容
  content TEXT NOT NULL,

  -- タグ機能
  tags TEXT[],

  -- お気に入り
  is_favorite BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT learning_memos_content_not_empty CHECK (length(content) > 0)
);

CREATE INDEX IF NOT EXISTS idx_learning_memos_student ON learning_memos(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_memos_session ON learning_memos(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_memos_tags ON learning_memos USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_learning_memos_favorite ON learning_memos(student_id, is_favorite, created_at DESC);

-- 10. export_history (エクスポート履歴) - オプション
CREATE TABLE IF NOT EXISTS export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id BIGINT REFERENCES students(id),

  export_type VARCHAR(50) NOT NULL,  -- 'portfolio' | 'all_discussions' | 'session'
  file_format VARCHAR(20) NOT NULL,  -- 'csv' | 'json' | 'miro'

  exported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_export_history_student ON export_history(student_id, exported_at DESC);

-- ============================================================
-- テスト用データ
-- ============================================================

-- テスト用クラス
INSERT INTO classes (name, grade) VALUES
  ('3年A組', 3),
  ('3年B組', 3)
ON CONFLICT DO NOTHING;

-- テスト用生徒（実際の使用時は認証時に自動作成されます）
-- INSERT INTO students (google_email, student_number, display_name, class_id) VALUES
--   ('student1@example.com', '24001', 'テスト生徒1', 1),
--   ('student2@example.com', '24002', 'テスト生徒2', 1)
-- ON CONFLICT (google_email) DO NOTHING;
