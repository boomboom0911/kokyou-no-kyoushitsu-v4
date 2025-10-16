# 🗄️ 公共の掲示板 - データベース設計

---

## 📊 テーブル設計（掲示板開発中）

### 新規追加するテーブル

掲示板開発中は、v4のテーブルに一切触らず、以下の新しいテーブルを追加します。

---

## 1. bulletin_sessions（掲示板セッション）

**概要**: 掲示板のトピック（常設型セッション）

```sql
CREATE TABLE bulletin_sessions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(4) UNIQUE NOT NULL,              -- 4桁コード（例: XY99）
  title TEXT NOT NULL,                          -- 掲示板のタイトル
  description TEXT,                             -- 説明・問いかけ
  is_active BOOLEAN DEFAULT true,               -- アクティブ状態
  created_by INTEGER REFERENCES students(id),   -- 作成者（教員またはnull）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_bulletin_sessions_code ON bulletin_sessions(code);
CREATE INDEX idx_bulletin_sessions_active ON bulletin_sessions(is_active);
CREATE INDEX idx_bulletin_sessions_created_at ON bulletin_sessions(created_at DESC);

-- RLS（Row Level Security）
ALTER TABLE bulletin_sessions ENABLE ROW LEVEL SECURITY;

-- 全員が閲覧可能
CREATE POLICY "Anyone can view bulletin sessions"
  ON bulletin_sessions FOR SELECT
  USING (true);

-- 教員のみ作成可能（created_by が null または -999）
CREATE POLICY "Teachers can insert bulletin sessions"
  ON bulletin_sessions FOR INSERT
  WITH CHECK (true);

-- 作成者のみ更新・削除可能
CREATE POLICY "Creators can update bulletin sessions"
  ON bulletin_sessions FOR UPDATE
  USING (created_by = current_setting('app.current_user_id')::INTEGER);
```

---

## 2. bulletin_posts（掲示板投稿）

**概要**: 掲示板への生徒の投稿

```sql
CREATE TABLE bulletin_posts (
  id SERIAL PRIMARY KEY,
  bulletin_session_id INTEGER NOT NULL REFERENCES bulletin_sessions(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,  -- 投稿者
  content TEXT NOT NULL,                                         -- 投稿内容
  is_anonymous BOOLEAN DEFAULT false,                            -- 匿名投稿フラグ（オプション）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_bulletin_posts_session ON bulletin_posts(bulletin_session_id);
CREATE INDEX idx_bulletin_posts_student ON bulletin_posts(student_id);
CREATE INDEX idx_bulletin_posts_created_at ON bulletin_posts(created_at DESC);

-- RLS
ALTER TABLE bulletin_posts ENABLE ROW LEVEL SECURITY;

-- 全員が閲覧可能
CREATE POLICY "Anyone can view bulletin posts"
  ON bulletin_posts FOR SELECT
  USING (true);

-- ログインユーザーのみ投稿可能
CREATE POLICY "Authenticated users can insert posts"
  ON bulletin_posts FOR INSERT
  WITH CHECK (true);

-- 投稿者のみ編集・削除可能
CREATE POLICY "Authors can update their posts"
  ON bulletin_posts FOR UPDATE
  USING (student_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY "Authors can delete their posts"
  ON bulletin_posts FOR DELETE
  USING (student_id = current_setting('app.current_user_id')::INTEGER);
```

---

## 3. bulletin_comments（掲示板コメント）

**概要**: 投稿へのコメント（既存のinteractionsテーブルの掲示板版）

```sql
CREATE TABLE bulletin_comments (
  id SERIAL PRIMARY KEY,
  bulletin_post_id INTEGER NOT NULL REFERENCES bulletin_posts(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,  -- コメント者
  content TEXT NOT NULL,                                         -- コメント内容
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_bulletin_comments_post ON bulletin_comments(bulletin_post_id);
CREATE INDEX idx_bulletin_comments_student ON bulletin_comments(student_id);
CREATE INDEX idx_bulletin_comments_created_at ON bulletin_comments(created_at DESC);

-- RLS
ALTER TABLE bulletin_comments ENABLE ROW LEVEL SECURITY;

-- 全員が閲覧可能
CREATE POLICY "Anyone can view bulletin comments"
  ON bulletin_comments FOR SELECT
  USING (true);

-- ログインユーザーのみコメント可能
CREATE POLICY "Authenticated users can insert comments"
  ON bulletin_comments FOR INSERT
  WITH CHECK (true);

-- コメント者のみ削除可能
CREATE POLICY "Authors can delete their comments"
  ON bulletin_comments FOR DELETE
  USING (student_id = current_setting('app.current_user_id')::INTEGER);
```

---

## 4. bulletin_reactions（掲示板リアクション）

**概要**: 投稿へのリアクション（驚・納・疑）

```sql
CREATE TABLE bulletin_reactions (
  id SERIAL PRIMARY KEY,
  bulletin_post_id INTEGER NOT NULL REFERENCES bulletin_posts(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reaction_type VARCHAR(10) NOT NULL CHECK (reaction_type IN ('surprise', 'convince', 'doubt')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bulletin_post_id, student_id, reaction_type)  -- 同じ投稿に同じリアクションは1回のみ
);

-- インデックス
CREATE INDEX idx_bulletin_reactions_post ON bulletin_reactions(bulletin_post_id);
CREATE INDEX idx_bulletin_reactions_student ON bulletin_reactions(student_id);

-- RLS
ALTER TABLE bulletin_reactions ENABLE ROW LEVEL SECURITY;

-- 全員が閲覧可能
CREATE POLICY "Anyone can view bulletin reactions"
  ON bulletin_reactions FOR SELECT
  USING (true);

-- ログインユーザーのみリアクション可能
CREATE POLICY "Authenticated users can insert reactions"
  ON bulletin_reactions FOR INSERT
  WITH CHECK (true);

-- 自分のリアクションのみ削除可能
CREATE POLICY "Users can delete their reactions"
  ON bulletin_reactions FOR DELETE
  USING (student_id = current_setting('app.current_user_id')::INTEGER);
```

---

## 📚 共有テーブル（v4と共通）

以下のテーブルはv4と共有します（新規作成不要）：

### students（生徒マスタ）
- v4で既に存在
- 掲示板でも同じ生徒データを使用
- `student_id` で投稿者を識別

---

## 🔄 v5統合時のマイグレーション

v5開発時に、掲示板用テーブルを既存テーブルに統合します。

### Step 1: 既存テーブルにカラム追加

```sql
-- lesson_sessionsを拡張
ALTER TABLE lesson_sessions
  ADD COLUMN session_type VARCHAR(20) DEFAULT 'classroom',
  ADD COLUMN is_permanent BOOLEAN DEFAULT false,
  ADD COLUMN created_by INTEGER REFERENCES students(id);

-- 既存データを更新
UPDATE lesson_sessions SET session_type = 'classroom' WHERE session_type IS NULL;
```

---

### Step 2: 掲示板データを統合テーブルに移行

```sql
-- bulletin_sessions → lesson_sessions
INSERT INTO lesson_sessions (
  code,
  topic_title,
  topic_content,
  session_type,
  is_permanent,
  created_by,
  class_id,
  period,
  created_at
)
SELECT
  code,
  title,
  description,
  'bulletin',
  true,
  created_by,
  NULL,  -- class_id は null（全校対象）
  NULL,  -- period は null（時限なし）
  created_at
FROM bulletin_sessions;
```

```sql
-- bulletin_posts → topic_posts
-- （seat_assignment_idをnullableに変更する必要あり → V5_BACKLOGに記載）
ALTER TABLE topic_posts ALTER COLUMN seat_assignment_id DROP NOT NULL;

INSERT INTO topic_posts (
  session_id,
  seat_assignment_id,  -- NULL（座席なし）
  student_id,
  content,
  created_at
)
SELECT
  ls.id,             -- 統合後のsession_id
  NULL,
  bp.student_id,
  bp.content,
  bp.created_at
FROM bulletin_posts bp
JOIN bulletin_sessions bs ON bp.bulletin_session_id = bs.id
JOIN lesson_sessions ls ON ls.code = bs.code AND ls.session_type = 'bulletin';
```

```sql
-- bulletin_comments → interactions
INSERT INTO interactions (
  target_type,
  target_id,
  student_id,
  content,
  created_at
)
SELECT
  'topic_post',
  tp.id,          -- 統合後のtopic_post_id
  bc.student_id,
  bc.content,
  bc.created_at
FROM bulletin_comments bc
JOIN bulletin_posts bp ON bc.bulletin_post_id = bp.id
JOIN topic_posts tp ON tp.student_id = bp.student_id AND tp.content = bp.content;
```

```sql
-- bulletin_reactions → reactions
INSERT INTO reactions (
  target_type,
  target_id,
  student_id,
  reaction_type,
  created_at
)
SELECT
  'topic_post',
  tp.id,
  br.student_id,
  br.reaction_type,
  br.created_at
FROM bulletin_reactions br
JOIN bulletin_posts bp ON br.bulletin_post_id = bp.id
JOIN topic_posts tp ON tp.student_id = bp.student_id AND tp.content = bp.content;
```

---

### Step 3: 古いテーブルを削除

```sql
-- バックアップを取った後に実行
DROP TABLE bulletin_reactions;
DROP TABLE bulletin_comments;
DROP TABLE bulletin_posts;
DROP TABLE bulletin_sessions;
```

---

## 📊 統合後のテーブル構造（v5）

### lesson_sessions（拡張版）

```sql
-- 教室セッションと掲示板セッションの両方を格納
lesson_sessions (
  id,
  code,
  topic_title,
  topic_content,
  session_type,      -- 'classroom' | 'bulletin'
  is_permanent,      -- false（教室） | true（掲示板）
  class_id,          -- NOT NULL（教室） | NULL（掲示板）
  period,            -- NOT NULL（教室） | NULL（掲示板）
  created_by,        -- 作成者
  created_at
)
```

### topic_posts（拡張版）

```sql
-- 教室の投稿と掲示板の投稿の両方を格納
topic_posts (
  id,
  session_id,
  seat_assignment_id,  -- NOT NULL（教室） | NULL（掲示板）
  student_id,
  content,
  created_at
)
```

---

## 🔍 データの識別方法（v5）

### 教室モードのデータ
```sql
SELECT * FROM lesson_sessions WHERE session_type = 'classroom';
SELECT * FROM topic_posts WHERE seat_assignment_id IS NOT NULL;
```

### 掲示板モードのデータ
```sql
SELECT * FROM lesson_sessions WHERE session_type = 'bulletin';
SELECT * FROM topic_posts WHERE seat_assignment_id IS NULL;
```

---

## ⚠️ v5で必要な変更（V5_BACKLOGに記録）

1. **topic_posts.seat_assignment_id をnullableに**
   ```sql
   ALTER TABLE topic_posts ALTER COLUMN seat_assignment_id DROP NOT NULL;
   ```

2. **lesson_sessions.class_id をnullableに**
   - 既にnullable（オプション）なので変更不要

3. **lesson_sessions.period をnullableに**
   - 既にnullable（オプション）なので変更不要

---

## 📝 まとめ

### 掲示板開発中
- 新しいテーブル（bulletin_*）を追加
- v4のテーブルには一切触らない
- studentsテーブルのみ共有

### v5統合時
- 既存テーブルにカラム追加
- データをマイグレーション
- 古いテーブルを削除

### v5運用後
- lesson_sessionsに教室と掲示板の両方が格納される
- session_typeで識別

---

**作成日**: 2025-10-16
**最終更新**: 2025-10-16
