# 🏛️ 公共のキョウシツ v4 - 完全設計書

**作成日**: 2025年10月7日
**プロジェクト名**: kokyou-no-kyoushitsu-v4
**技術スタック**: Next.js 15 + TypeScript + Supabase + TailwindCSS

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [データベース設計](#データベース設計)
3. [API仕様](#api仕様)
4. [ディレクトリ構造](#ディレクトリ構造)
5. [実装フェーズ](#実装フェーズ)
6. [型定義](#型定義)
7. [環境設定](#環境設定)

---

## プロジェクト概要

### アプリケーションの目的
教室での議論を可視化・活性化するWebアプリケーション。生徒が座席上に意見を投稿し、クラス全体で議論を深める。

### v4の主な改善点
1. **座席管理の簡素化**: 座席番号（1〜42）で統一
2. **学習記録の強化**: ポートフォリオ機能
3. **漢字リアクション**: 理性的な反応を促す（驚・納・疑）
4. **データエクスポート**: CSV形式での学習記録保存

---

## データベース設計

### 全体ER図

```
students (生徒)
  ├── seat_assignments (座席割り当て)
  ├── topic_posts (トピック投稿)
  ├── chat_messages (チャット)
  ├── reactions (リアクション)
  ├── interactions (コメント)
  └── learning_memos (学習メモ)

lesson_sessions (授業セッション)
  ├── seat_assignments
  ├── topic_posts
  ├── chat_messages
  └── learning_memos

classes (クラス)
  └── lesson_sessions
```

### テーブル定義

#### 1. students (生徒マスタ)
```sql
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
```

#### 2. classes (クラスマスタ)
```sql
CREATE TABLE classes (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  grade INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. lesson_sessions (授業セッション)
```sql
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
```

#### 4. seat_assignments (座席割り当て) ⭐ v4の重要な変更点
```sql
CREATE TABLE seat_assignments (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES lesson_sessions(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,

  -- 🆕 座席番号で統一（1-42）
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
```

#### 5. topic_posts (トピック投稿)
```sql
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
```

#### 6. chat_messages (チャット)
```sql
CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES lesson_sessions(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE SET NULL,

  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chat_messages_message_not_empty CHECK (length(message) > 0)
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at);
```

#### 7. reactions (リアクション) 🆕 漢字リアクション
```sql
CREATE TABLE reactions (
  id BIGSERIAL PRIMARY KEY,

  -- リアクション対象
  target_type VARCHAR(20) NOT NULL,  -- 'topic' | 'comment'
  target_id BIGINT NOT NULL,

  -- リアクションした生徒
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,

  -- 🆕 リアクション種別（驚・納・疑）
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
```

#### 8. interactions (コメント)
```sql
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
```

#### 9. learning_memos (学習メモ) 🆕 ポートフォリオ機能
```sql
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
```

#### 10. export_history (エクスポート履歴) - オプション
```sql
CREATE TABLE export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id BIGINT REFERENCES students(id),

  export_type VARCHAR(50) NOT NULL,  -- 'portfolio' | 'all_discussions' | 'session'
  file_format VARCHAR(20) NOT NULL,  -- 'csv' | 'json' | 'miro'

  exported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_export_history_student ON export_history(student_id, exported_at DESC);
```

### ビュー定義

#### student_recent_sessions (最近の授業)
```sql
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
```

#### student_learning_portfolio (ポートフォリオ)
```sql
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
```

---

## API仕様

### 認証 API

#### POST /api/auth
```typescript
// リクエスト
{
  sessionCode: string,  // 4桁
  studentEmail: string  // Google Email
}

// レスポンス
{
  success: true,
  data: {
    student: {
      id: number,
      display_name: string,
      google_email: string,
      student_number: string
    },
    session: {
      id: number,
      code: string,
      topic_title: string,
      is_active: boolean
    }
  }
}
```

### セッション管理 API

#### GET /api/sessions?code={sessionCode}
```typescript
// レスポンス
{
  success: true,
  data: {
    id: number,
    code: string,
    topic_title: string,
    topic_content: string,
    date: string,
    period: number,
    is_active: boolean,
    class_name: string
  }
}
```

#### POST /api/sessions (教師用)
```typescript
// リクエスト
{
  topicTitle: string,
  topicContent: string,
  classId: number,
  period: number
}

// レスポンス
{
  success: true,
  data: {
    id: number,
    code: string,  // 自動生成された4桁コード
    topic_title: string,
    // ...
  }
}
```

### 座席選択 API

#### POST /api/seats/select
```typescript
// リクエスト
{
  sessionId: number,
  seatNumber: number,    // 1-42
  studentEmail: string
}

// レスポンス
{
  success: true,
  data: {
    id: number,
    seat_number: number,
    student: {
      id: number,
      display_name: string,
      google_email: string
    }
  },
  message: "座席 5 を選択しました"
}
```

#### GET /api/seats?sessionId={sessionId}
```typescript
// レスポンス
{
  success: true,
  data: [
    {
      seat_number: 5,
      student: {
        id: 123,
        display_name: "青山 朝太郎",
        google_email: "24001@nansho.ed.jp"
      },
      topic_post: {
        id: 456,
        content: "若者の政治参加について...",
        created_at: "2025-10-07T10:00:00Z"
      }
    },
    // ...
  ]
}
```

### トピック投稿 API

#### POST /api/topics/submit
```typescript
// リクエスト
{
  sessionId: number,
  seatAssignmentId: number,
  content: string
}

// レスポンス
{
  success: true,
  data: {
    id: number,
    content: string,
    created_at: string
  }
}
```

### リアクション API

#### POST /api/reactions
```typescript
// リクエスト
{
  targetType: 'topic' | 'comment',
  targetId: number,
  reactionType: 'surprise' | 'understand' | 'question',
  studentId: number
}

// レスポンス
{
  success: true,
  data: {
    id: number,
    reaction_type: string,
    created_at: string
  }
}
```

#### GET /api/reactions?targetType={type}&targetId={id}
```typescript
// レスポンス
{
  success: true,
  data: {
    reactions: {
      surprise: 5,
      understand: 12,
      question: 3
    },
    myReactions: ['understand']  // ログイン中の生徒のリアクション
  }
}
```

#### DELETE /api/reactions
```typescript
// リクエスト
{
  targetType: 'topic' | 'comment',
  targetId: number,
  reactionType: 'surprise' | 'understand' | 'question'
}

// レスポンス
{
  success: true,
  message: "リアクションを取り消しました"
}
```

### コメント API

#### POST /api/interactions
```typescript
// リクエスト
{
  targetType: 'topic',
  targetId: number,
  studentId: number,
  commentText: string
}

// レスポンス
{
  success: true,
  data: {
    id: number,
    comment_text: string,
    created_at: string
  }
}
```

### チャット API

#### POST /api/chat
```typescript
// リクエスト
{
  sessionId: number,
  studentEmail: string,
  message: string
}

// レスポンス
{
  success: true,
  data: {
    id: number,
    message: string,
    created_at: string
  }
}
```

#### GET /api/chat?sessionId={sessionId}
```typescript
// レスポンス
{
  success: true,
  data: [
    {
      id: number,
      sender_name: string,
      message: string,
      created_at: string
    },
    // ...
  ]
}
```

### 学習メモ API

#### POST /api/learning-memos
```typescript
// リクエスト
{
  studentId: number,
  sessionId: number | null,  // nullの場合は授業外のメモ
  content: string,
  tags?: string[]
}

// レスポンス
{
  success: true,
  data: {
    id: string,
    content: string,
    tags: string[],
    created_at: string
  }
}
```

#### PATCH /api/learning-memos/{memoId}
```typescript
// リクエスト
{
  is_favorite?: boolean,
  tags?: string[],
  content?: string
}

// レスポンス
{
  success: true,
  data: {
    id: string,
    is_favorite: boolean,
    tags: string[],
    updated_at: string
  }
}
```

### ポートフォリオ API

#### GET /api/students/{studentId}/portfolio
```typescript
// クエリパラメータ
?tag=疑問&favorite=true

// レスポンス
{
  success: true,
  data: {
    memos: [
      {
        memo_id: string,
        memo_content: string,
        memo_tags: string[],
        is_favorite: boolean,
        memo_created_at: string,

        // セッション情報
        session_id: number,
        session_code: string,
        topic_title: string,
        session_date: string,
        period: number,
        class_name: string,
        seat_number: number,

        // 自分の投稿
        my_topic_content: string,
        topic_created_at: string,

        // 🆕 反応したトピック
        reacted_topics: [
          {
            topic_id: number,
            topic_content: string,
            author_name: string,
            reaction_type: 'surprise' | 'understand' | 'question',
            reacted_at: string
          }
        ],

        // 🆕 コメントしたトピック
        commented_topics: [
          {
            topic_id: number,
            topic_content: string,
            author_name: string,
            my_comment: string,
            commented_at: string
          }
        ]
      }
    ]
  }
}
```

### エクスポート API

#### GET /api/export/portfolio?studentId={id}&format=csv
```typescript
// レスポンス: CSV ファイル
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="portfolio_{studentId}.csv"

日付,授業タイトル,時限,クラス,メモ内容,タグ,自分の投稿,反応したトピック数,コメント数
2025-10-05,若者と政治,3,3年A組,"なぜ若者は投票に...",疑問;発見,"若者の政治参加...",5,3
```

#### GET /api/export/all-discussions?classId={id}&format=csv
```typescript
// レスポンス: CSV ファイル
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="all_discussions_{classId}.csv"

日付,授業タイトル,投稿者,座席番号,トピック内容,驚の数,納の数,疑の数,コメント数
2025-10-05,若者と政治,青山 朝太郎,5,"若者の政治参加...",12,8,3,5
```

---

## ディレクトリ構造

```
kokyou-no-kyoushitsu-v4/
├── .env.local                    # 環境変数
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
│
├── README.md
├── LESSONS_LEARNED.md            # v3からの教訓
├── V4_ADDITIONAL_FEATURES.md     # 追加機能仕様
├── V4_DESIGN_DOCUMENT.md         # このファイル
│
├── public/
│   └── favicon.ico
│
└── src/
    ├── app/                      # Next.js 15 App Router
    │   ├── layout.tsx
    │   ├── page.tsx              # ランディングページ
    │   │
    │   ├── api/                  # API Routes
    │   │   ├── auth/
    │   │   │   └── route.ts
    │   │   ├── sessions/
    │   │   │   └── route.ts
    │   │   ├── seats/
    │   │   │   ├── select/
    │   │   │   │   └── route.ts
    │   │   │   └── route.ts
    │   │   ├── topics/
    │   │   │   └── submit/
    │   │   │       └── route.ts
    │   │   ├── reactions/
    │   │   │   └── route.ts
    │   │   ├── interactions/
    │   │   │   └── route.ts
    │   │   ├── chat/
    │   │   │   └── route.ts
    │   │   ├── learning-memos/
    │   │   │   ├── route.ts
    │   │   │   └── [memoId]/
    │   │   │       └── route.ts
    │   │   ├── students/
    │   │   │   └── [studentId]/
    │   │   │       └── portfolio/
    │   │   │           └── route.ts
    │   │   └── export/
    │   │       ├── portfolio/
    │   │       │   └── route.ts
    │   │       └── all-discussions/
    │   │           └── route.ts
    │   │
    │   ├── student/              # 生徒用画面
    │   │   ├── page.tsx          # メニュー画面
    │   │   └── portfolio/
    │   │       └── page.tsx      # ポートフォリオ
    │   │
    │   ├── classroom/            # 教室画面（生徒）
    │   │   └── [sessionCode]/
    │   │       └── page.tsx
    │   │
    │   ├── teacher/              # 教師用画面
    │   │   ├── page.tsx          # ログイン
    │   │   └── dashboard/
    │   │       └── [sessionCode]/
    │   │           └── page.tsx
    │   │
    │   └── all-classes/          # みんなの議論
    │       └── page.tsx
    │
    ├── components/               # 再利用可能コンポーネント
    │   ├── ReactionBar.tsx       # 漢字リアクション
    │   ├── QuickMemo.tsx         # 学習メモ（浮遊ボタン）
    │   ├── SeatMap.tsx           # 座席表
    │   ├── PortfolioCard.tsx     # ポートフォリオカード
    │   ├── ExportButton.tsx      # CSVエクスポート
    │   ├── TeacherViewToggle.tsx # 視点切り替え
    │   └── ...
    │
    ├── lib/                      # ユーティリティ
    │   ├── supabase.ts           # Supabase クライアント
    │   ├── database.types.ts     # DB型定義（自動生成）
    │   ├── reactions.ts          # リアクション定義
    │   ├── storage.ts            # LocalStorage管理
    │   ├── seat-utils.ts         # 座席番号ユーティリティ
    │   └── csv-export.ts         # CSVエクスポート
    │
    ├── hooks/                    # カスタムフック
    │   ├── useAuth.ts
    │   ├── useSession.ts
    │   ├── useRealtimeSubscription.ts
    │   └── ...
    │
    └── types/                    # 型定義
        ├── index.ts
        ├── student.ts
        ├── session.ts
        ├── portfolio.ts
        └── ...
```

---

## 型定義

### lib/types/index.ts
```typescript
// 座席番号型（Brand型で型安全性を確保）
export type SeatNumber = number & { __brand: 'SeatNumber' }

export function createSeatNumber(n: number): SeatNumber | null {
  if (n < 1 || n > 42) return null
  return n as SeatNumber
}

export function getSeatPosition(seatNumber: SeatNumber): { row: number; col: number } {
  // 0-based for display (row: 0-6, col: 0-5)
  return {
    row: Math.floor((seatNumber - 1) / 6),
    col: (seatNumber - 1) % 6
  }
}

// リアクション型
export type ReactionType = 'surprise' | 'understand' | 'question'

export const REACTIONS = {
  surprise: {
    id: 'surprise' as const,
    kanji: '驚',
    label: 'わお！新しい発見',
    tooltip: '驚いた、新しい視点を得た',
    color: '#EF4444',
    emoji: '😮'
  },
  understand: {
    id: 'understand' as const,
    kanji: '納',
    label: 'ふむふむ、納得',
    tooltip: '納得した、理解できた',
    color: '#10B981',
    emoji: '🤔'
  },
  question: {
    id: 'question' as const,
    kanji: '疑',
    label: 'はて？疑問がある',
    tooltip: '疑問がある、もっと知りたい',
    color: '#F59E0B',
    emoji: '❓'
  }
} as const

// 生徒
export interface Student {
  id: number
  google_email: string
  student_number: string
  display_name: string
  class_id: number
}

// セッション
export interface LessonSession {
  id: number
  code: string
  class_id: number
  topic_title: string
  topic_content: string
  date: string
  period: number
  is_active: boolean
  started_at: string
  ended_at: string | null
}

// 座席割り当て
export interface SeatAssignment {
  id: number
  session_id: number
  student_id: number
  seat_number: SeatNumber
  created_at: string
}

// トピック投稿
export interface TopicPost {
  id: number
  session_id: number
  student_id: number
  seat_assignment_id: number
  content: string
  created_at: string
  updated_at: string
}

// リアクション
export interface Reaction {
  id: number
  target_type: 'topic' | 'comment'
  target_id: number
  student_id: number
  reaction_type: ReactionType
  created_at: string
}

// コメント
export interface Interaction {
  id: number
  target_type: 'topic' | 'comment'
  target_id: number
  student_id: number
  type: 'comment'
  comment_text: string
  created_at: string
}

// 学習メモ
export interface LearningMemo {
  id: string
  student_id: number
  session_id: number | null
  content: string
  tags: string[]
  is_favorite: boolean
  created_at: string
  updated_at: string
}

// ポートフォリオエントリ
export interface PortfolioEntry {
  // メモ情報
  memo_id: string
  memo_content: string
  memo_tags: string[]
  is_favorite: boolean
  memo_created_at: string

  // セッション情報
  session_id?: number
  session_code?: string
  topic_title?: string
  session_date?: string
  period?: number
  class_name?: string
  seat_number?: SeatNumber

  // 自分の投稿
  my_topic_content?: string
  topic_created_at?: string

  // 反応したトピック
  reacted_topics?: Array<{
    topic_id: number
    topic_content: string
    author_name: string
    reaction_type: ReactionType
    reacted_at: string
  }>

  // コメントしたトピック
  commented_topics?: Array<{
    topic_id: number
    topic_content: string
    author_name: string
    my_comment: string
    commented_at: string
  }>
}
```

### lib/storage.ts (LocalStorage管理)
```typescript
const STORAGE_VERSION = 1

export const storage = {
  save: (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify({
      version: STORAGE_VERSION,
      data
    }))
  },

  load: (key: string) => {
    const item = localStorage.getItem(key)
    if (!item) return null

    try {
      const parsed = JSON.parse(item)
      if (parsed.version !== STORAGE_VERSION) {
        localStorage.removeItem(key)
        return null
      }
      return parsed.data
    } catch {
      localStorage.removeItem(key)
      return null
    }
  },

  remove: (key: string) => {
    localStorage.removeItem(key)
  },

  clear: () => {
    localStorage.clear()
  }
}

// 開発環境での自動クリア
if (process.env.NODE_ENV === 'development') {
  const APP_VERSION = '4.0'
  if (localStorage.getItem('appVersion') !== APP_VERSION) {
    localStorage.clear()
    localStorage.setItem('appVersion', APP_VERSION)
    console.log('🗑️ LocalStorage cleared for new version:', APP_VERSION)
  }
}
```

---

## 実装フェーズ

### Phase 1: プロジェクトセットアップ（1日目）
- [ ] Next.js 15プロジェクト作成
- [ ] Supabase接続設定
- [ ] TailwindCSS設定
- [ ] 型定義ファイル作成
- [ ] データベーススキーマ作成

### Phase 2: コア機能（2-3日目）
- [ ] 認証API実装
- [ ] セッション管理API実装
- [ ] **座席選択機能実装**（座席番号ベース）
- [ ] トピック投稿API実装
- [ ] 生徒画面（座席選択まで）

### Phase 3: 拡張機能（4-5日目）
- [ ] **漢字リアクション機能実装**
- [ ] コメント機能実装
- [ ] チャット機能実装
- [ ] **学習メモ機能実装**

### Phase 4: ポートフォリオ（6日目）
- [ ] **生徒用メニュー画面**
- [ ] **ポートフォリオ画面**
- [ ] **CSVエクスポート機能**

### Phase 5: 教師機能（7-8日目）
- [ ] 教師ダッシュボード
- [ ] **視点切り替え機能**
- [ ] リアルタイム更新

### Phase 6: テスト・デバッグ（9-10日目）
- [ ] E2Eテスト
- [ ] バグ修正
- [ ] パフォーマンス最適化
- [ ] ドキュメント整備

---

## 環境設定

### .env.local
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xaajfdlatxqocuklqqfo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# App
NEXT_PUBLIC_APP_VERSION=4.0
NODE_ENV=development
```

### package.json (主要な依存関係)
```json
{
  "dependencies": {
    "next": "^15.5.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "csv-stringify": "^6.4.5"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.45",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

---

## セキュリティとプライバシー

### Row Level Security (RLS)

```sql
-- students テーブル
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own data"
  ON students FOR SELECT
  USING (auth.uid()::text = google_email);

-- learning_memos テーブル
ALTER TABLE learning_memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own memos"
  ON learning_memos FOR SELECT
  USING (student_id = (SELECT id FROM students WHERE google_email = auth.uid()::text));

CREATE POLICY "Students can insert their own memos"
  ON learning_memos FOR INSERT
  WITH CHECK (student_id = (SELECT id FROM students WHERE google_email = auth.uid()::text));
```

---

## テスト計画

### E2Eテストシナリオ

#### シナリオ1: 座席選択からトピック投稿まで
1. 生徒ログイン（24001@nansho.ed.jp）
2. セッションコード入力（例: AB12）
3. 座席選択（座席番号5）
4. トピック投稿
5. 投稿が座席表に表示されることを確認

#### シナリオ2: リアクション機能
1. 他の生徒の投稿を閲覧
2. 漢字リアクション（驚・納・疑）をクリック
3. リアクション数が増えることを確認
4. もう一度クリックしてリアクション取り消し

#### シナリオ3: 学習メモとポートフォリオ
1. 授業中に学習メモを作成
2. タグを追加
3. メモを保存
4. ポートフォリオ画面で確認
5. CSVエクスポート

---

## まとめ

このv4設計書に基づいて実装を進めることで、v3で発生した問題を回避し、以下を実現します：

✅ **座席管理の簡素化** - 座席番号（1〜42）で統一
✅ **学習記録の強化** - ポートフォリオとエクスポート機能
✅ **理性的な反応** - 漢字リアクション（驚・納・疑）
✅ **クリーンなコードベース** - 型安全性とメンテナンス性
✅ **完全な独立** - v3と混在しない

---

**作成者**: Claude Code & User
**次のステップ**: Phase 1のプロジェクトセットアップから開始
