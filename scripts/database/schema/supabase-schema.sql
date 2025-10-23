-- ============================================
-- コウキョウのキョウシツ v4 - データベーススキーマ
-- ============================================

-- 1. classes (クラスマスタ)
CREATE TABLE classes (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  grade INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. students (生徒マスタ)
CREATE TABLE students (
  id BIGSERIAL PRIMARY KEY,
  google_email VARCHAR(255) UNIQUE NOT NULL,
  class_id BIGINT REFERENCES classes(id),
  student_number VARCHAR(20) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT students_email_format CHECK (google_email LIKE '%@%')
);

CREATE INDEX idx_students_email ON students(google_email);
CREATE INDEX idx_students_class ON students(class_id);

-- 3. lesson_sessions (授業セッション)
CREATE TABLE lesson_sessions (
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

CREATE INDEX idx_lesson_sessions_code ON lesson_sessions(code);
CREATE INDEX idx_lesson_sessions_active ON lesson_sessions(is_active, started_at DESC);

-- 4. seat_assignments (座席割り当て)
CREATE TABLE seat_assignments (
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

CREATE INDEX idx_seat_assignments_session ON seat_assignments(session_id);
CREATE INDEX idx_seat_assignments_student_created
  ON seat_assignments(student_id, created_at DESC);

-- 5. topic_posts (トピック投稿)
CREATE TABLE topic_posts (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES lesson_sessions(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  seat_assignment_id BIGINT REFERENCES seat_assignments(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT topic_posts_content_not_empty CHECK (length(content) > 0)
);

CREATE INDEX idx_topic_posts_session ON topic_posts(session_id, created_at DESC);
CREATE INDEX idx_topic_posts_student ON topic_posts(student_id, created_at DESC);

-- 6. chat_messages (チャット)
CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES lesson_sessions(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE SET NULL,

  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chat_messages_message_not_empty CHECK (length(message) > 0)
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at);

-- 7. reactions (リアクション) - 漢字リアクション
CREATE TABLE reactions (
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

CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX idx_reactions_student ON reactions(student_id, created_at DESC);

-- 8. interactions (コメント)
CREATE TABLE interactions (
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

CREATE INDEX idx_interactions_target ON interactions(target_type, target_id, created_at);
CREATE INDEX idx_interactions_student ON interactions(student_id, created_at DESC);

-- 9. learning_memos (学習メモ) - ポートフォリオ機能
CREATE TABLE learning_memos (
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

CREATE INDEX idx_learning_memos_student ON learning_memos(student_id, created_at DESC);
CREATE INDEX idx_learning_memos_session ON learning_memos(session_id);
CREATE INDEX idx_learning_memos_tags ON learning_memos USING GIN(tags);
CREATE INDEX idx_learning_memos_favorite ON learning_memos(student_id, is_favorite, created_at DESC);

-- ============================================
-- ビュー定義
-- ============================================

-- student_recent_sessions (最近の授業)
CREATE VIEW student_recent_sessions AS
SELECT
  sa.student_id,
  ls.id as session_id,
  ls.code,
  ls.topic_title,
  ls.date,
  ls.period,
  ls.is_active,
  c.name as class_name,
  sa.created_at as joined_at,
  sa.seat_number,

  -- 自分の投稿状況
  EXISTS(
    SELECT 1 FROM topic_posts tp
    WHERE tp.session_id = ls.id
      AND tp.student_id = sa.student_id
  ) as has_posted_topic,

  -- メモ数
  (
    SELECT COUNT(*) FROM learning_memos lm
    WHERE lm.session_id = ls.id
      AND lm.student_id = sa.student_id
  ) as memo_count

FROM seat_assignments sa
JOIN lesson_sessions ls ON sa.session_id = ls.id
JOIN classes c ON ls.class_id = c.id
ORDER BY sa.created_at DESC;

-- student_learning_portfolio (ポートフォリオ)
CREATE VIEW student_learning_portfolio AS
SELECT
  lm.id as memo_id,
  lm.student_id,
  lm.content as memo_content,
  lm.tags as memo_tags,
  lm.is_favorite,
  lm.created_at as memo_created_at,
  lm.updated_at as memo_updated_at,

  -- セッション情報
  ls.id as session_id,
  ls.code as session_code,
  ls.topic_title,
  ls.date as session_date,
  ls.period,
  c.name as class_name,

  -- 座席番号
  sa.seat_number,

  -- 自分のトピック投稿
  tp.id as topic_id,
  tp.content as my_topic_content,
  tp.created_at as topic_created_at

FROM learning_memos lm
LEFT JOIN lesson_sessions ls ON lm.session_id = ls.id
LEFT JOIN classes c ON ls.class_id = c.id
LEFT JOIN seat_assignments sa
  ON sa.session_id = lm.session_id
  AND sa.student_id = lm.student_id
LEFT JOIN topic_posts tp
  ON tp.session_id = lm.session_id
  AND tp.student_id = lm.student_id

ORDER BY lm.created_at DESC;

-- ============================================
-- 完了
-- ============================================
