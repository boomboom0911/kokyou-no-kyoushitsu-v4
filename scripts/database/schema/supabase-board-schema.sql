-- ============================================
-- コウキョウのケイジバン v4.5 - データベーススキーマ
-- ============================================
-- このスキーマは既存の v4 プロジェクトに追加するものです
-- 実行前に supabase-schema.sql が適用されていることを確認してください

-- ============================================
-- 1. boards (掲示板マスタ)
-- ============================================
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,

  -- レビュー要件
  min_reviews_required INTEGER DEFAULT 0,
  min_reviews_to_give INTEGER DEFAULT 0,

  -- 締切
  submission_deadline TIMESTAMPTZ,
  review_deadline TIMESTAMPTZ,

  -- 対象生徒 (JSONB配列: ["student_id_1", "student_id_2"] or null = 全員)
  target_students JSONB,

  -- 公開設定
  is_public BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active',

  -- 追加設定
  allow_edit_after_review BOOLEAN DEFAULT true,
  show_author_names BOOLEAN DEFAULT true,

  -- 管理情報
  created_by BIGINT,  -- teachers テーブルがない場合は NULL許容
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB,

  -- 制約
  CONSTRAINT boards_code_format CHECK (code ~ '^[A-Z0-9]{6}$'),
  CONSTRAINT boards_status_check CHECK (status IN ('draft', 'active', 'closed', 'archived'))
);

CREATE INDEX idx_boards_code ON boards(code);
CREATE INDEX idx_boards_status ON boards(status, created_at DESC);
CREATE INDEX idx_boards_created_by ON boards(created_by);

-- ============================================
-- 2. submissions (作品投稿)
-- ============================================
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,

  title VARCHAR(200) NOT NULL,
  description TEXT,
  work_url TEXT NOT NULL,
  work_type VARCHAR(20) DEFAULT 'google-doc',

  -- 統計
  view_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,

  -- 編集履歴
  is_edited BOOLEAN DEFAULT false,
  edit_count INTEGER DEFAULT 0,
  last_edited_at TIMESTAMPTZ,

  -- 状態管理
  visibility VARCHAR(20) DEFAULT 'public',
  is_featured BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 制約
  CONSTRAINT submissions_work_type_check
    CHECK (work_type IN ('google-doc', 'google-site', 'google-slides', 'other')),
  CONSTRAINT submissions_visibility_check
    CHECK (visibility IN ('public', 'draft', 'hidden')),
  CONSTRAINT unique_student_board UNIQUE(student_id, board_id)
);

CREATE INDEX idx_submissions_board ON submissions(board_id, created_at DESC);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_featured ON submissions(board_id, is_featured, created_at DESC);

-- ============================================
-- 3. peer_reviews (ピアレビュー)
-- ============================================
CREATE TABLE peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id BIGINT REFERENCES students(id) ON DELETE CASCADE,

  -- レビュー内容（構造化）
  strengths TEXT[],
  suggestions TEXT[],
  questions TEXT[],
  overall_comment TEXT,

  -- メタデータ
  character_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,

  -- 状態管理
  status VARCHAR(20) DEFAULT 'published',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 制約
  CONSTRAINT peer_reviews_status_check
    CHECK (status IN ('draft', 'published', 'flagged')),
  CONSTRAINT unique_reviewer_submission UNIQUE(reviewer_id, submission_id)
);

CREATE INDEX idx_reviews_submission ON peer_reviews(submission_id, created_at DESC);
CREATE INDEX idx_reviews_reviewer ON peer_reviews(reviewer_id);
CREATE INDEX idx_reviews_helpful ON peer_reviews(submission_id, helpful_count DESC);

-- ============================================
-- 4. reviewer_profiles (レビュアープロフィール)
-- ============================================
CREATE TABLE reviewer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,

  animal_type VARCHAR(20) NOT NULL,
  level INTEGER DEFAULT 0,

  -- 統計（キャッシュ）
  review_count INTEGER DEFAULT 0,
  helpful_total INTEGER DEFAULT 0,
  total_characters INTEGER DEFAULT 0,

  -- 実績
  decorations TEXT[],
  badges JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 制約
  CONSTRAINT reviewer_profiles_animal_check
    CHECK (animal_type IN ('fox', 'bear', 'rabbit', 'lion', 'frog', 'owl', 'penguin', 'turtle')),
  UNIQUE(student_id, board_id)
);

CREATE INDEX idx_profiles_student_board ON reviewer_profiles(student_id, board_id);
CREATE INDEX idx_profiles_board_level ON reviewer_profiles(board_id, level DESC, review_count DESC);

-- ============================================
-- ビュー定義
-- ============================================

-- 作品一覧ビュー（統計情報付き）
CREATE VIEW submission_with_stats AS
SELECT
  s.id,
  s.board_id,
  s.student_id,
  s.title,
  s.description,
  s.work_url,
  s.work_type,
  s.view_count,
  s.is_edited,
  s.edit_count,
  s.last_edited_at,
  s.visibility,
  s.is_featured,
  s.created_at,
  s.updated_at,
  st.class_id,
  st.student_number,
  st.display_name as student_name,
  COUNT(DISTINCT pr.id)::INTEGER as review_count_actual,
  COALESCE(SUM(pr.helpful_count), 0)::INTEGER as total_helpful,

  -- レビュー実施数も集計
  (SELECT COUNT(*)::INTEGER
   FROM peer_reviews pr2
   WHERE pr2.reviewer_id = s.student_id
   AND EXISTS (
     SELECT 1 FROM submissions s2
     WHERE s2.id = pr2.submission_id
     AND s2.board_id = s.board_id
   )
  ) as reviews_given_count

FROM submissions s
LEFT JOIN peer_reviews pr ON pr.submission_id = s.id
LEFT JOIN students st ON st.id = s.student_id
GROUP BY s.id, st.class_id, st.student_number, st.display_name;

-- ============================================
-- トリガー関数
-- ============================================

-- レビュー数の自動更新
CREATE OR REPLACE FUNCTION update_review_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- submission の review_count を更新
  UPDATE submissions
  SET review_count = review_count + 1
  WHERE id = NEW.submission_id;

  -- reviewer_profile を更新（存在しなければ作成）
  INSERT INTO reviewer_profiles (student_id, board_id, animal_type, review_count, total_characters)
  SELECT
    NEW.reviewer_id,
    s.board_id,
    'fox',  -- 仮の値（アプリケーション側で上書き）
    1,
    NEW.character_count
  FROM submissions s WHERE s.id = NEW.submission_id
  ON CONFLICT (student_id, board_id)
  DO UPDATE SET
    review_count = reviewer_profiles.review_count + 1,
    total_characters = reviewer_profiles.total_characters + NEW.character_count,
    level = CASE
      WHEN reviewer_profiles.review_count + 1 >= 20 THEN 5
      WHEN reviewer_profiles.review_count + 1 >= 10 THEN 4
      WHEN reviewer_profiles.review_count + 1 >= 5 THEN 3
      WHEN reviewer_profiles.review_count + 1 >= 3 THEN 2
      WHEN reviewer_profiles.review_count + 1 >= 1 THEN 1
      ELSE 0
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_counts
AFTER INSERT ON peer_reviews
FOR EACH ROW
EXECUTE FUNCTION update_review_counts();

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_boards_updated_at
BEFORE UPDATE ON boards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_submissions_updated_at
BEFORE UPDATE ON submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_peer_reviews_updated_at
BEFORE UPDATE ON peer_reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_reviewer_profiles_updated_at
BEFORE UPDATE ON reviewer_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Row Level Security (RLS) ポリシー
-- ============================================

-- boards テーブル
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- 公開中の掲示板は誰でも閲覧可能
CREATE POLICY "Public boards are viewable by everyone" ON boards
  FOR SELECT USING (
    is_public = true
    AND status = 'active'
  );

-- 掲示板の作成・編集・削除は全員許可（簡易実装）
CREATE POLICY "Anyone can create boards" ON boards
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update boards" ON boards
  FOR UPDATE USING (true);

-- submissions テーブル
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 公開中の掲示板の作品は閲覧可能
CREATE POLICY "View submissions in active boards" ON submissions
  FOR SELECT USING (
    board_id IN (
      SELECT id FROM boards WHERE is_public = true AND status = 'active'
    )
    AND visibility = 'public'
  );

-- 作品の投稿・編集（全員許可）
CREATE POLICY "Anyone can submit work" ON submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update submissions" ON submissions
  FOR UPDATE USING (true);

-- peer_reviews テーブル
ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;

-- レビューは誰でも閲覧可能（同じ掲示板内）
CREATE POLICY "View reviews in active boards" ON peer_reviews
  FOR SELECT USING (
    submission_id IN (
      SELECT id FROM submissions WHERE board_id IN (
        SELECT id FROM boards WHERE is_public = true
      )
    )
    AND status = 'published'
  );

-- レビューの投稿（全員許可、自分の作品には不可はアプリ側で制御）
CREATE POLICY "Anyone can submit reviews" ON peer_reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update reviews" ON peer_reviews
  FOR UPDATE USING (true);

-- reviewer_profiles テーブル
ALTER TABLE reviewer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View all profiles in board" ON reviewer_profiles
  FOR SELECT USING (true);

CREATE POLICY "Auto-create own profile" ON reviewer_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Update own profile" ON reviewer_profiles
  FOR UPDATE USING (true);

-- ============================================
-- サンプルデータ（テスト用）
-- ============================================

-- テスト用掲示板の作成例（コメントアウト）
/*
INSERT INTO boards (code, title, description, min_reviews_required, min_reviews_to_give, status) VALUES
('AB12', '2学期評価課題', '民主主義に関する作品を提出してください', 3, 3, 'active');
*/

-- ============================================
-- 完了
-- ============================================

-- 実装確認用クエリ
/*
-- 掲示板一覧
SELECT * FROM boards ORDER BY created_at DESC;

-- 作品一覧（統計付き）
SELECT * FROM submission_with_stats WHERE board_id = 'your-board-id' ORDER BY created_at DESC;

-- レビュアーランキング
SELECT
  rp.*,
  s.display_name,
  s.student_number
FROM reviewer_profiles rp
JOIN students s ON s.id = rp.student_id
WHERE rp.board_id = 'your-board-id'
ORDER BY rp.level DESC, rp.review_count DESC
LIMIT 10;
*/
