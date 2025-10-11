# 📋 公共のキョウシツ v4 追加機能仕様書

**作成日**: 2025年10月5日
**対象バージョン**: v4.0

---

## 🎯 追加機能概要

v4では以下の4つの機能を新規追加します：

1. **漢字リアクション機能**（驚・納・疑）
2. **生徒用メニュー画面**
3. **教員用視点切り替え**
4. **個人的な学習メモ機能**（ポートフォリオ連携）

---

## 1. 漢字リアクション機能

### 📝 概要
- **目的**: SNS的な「いいね」文化を避け、理性的・教育的な反応を促す
- **使用者**: 生徒
- **関連機能**: トピック投稿、座席表示

### 🎨 リアクション定義

```typescript
// lib/reactions.ts
export const REACTIONS = {
  surprise: {
    id: 'surprise',
    kanji: '驚',
    label: 'わお！新しい発見',
    tooltip: '驚いた、新しい視点を得た',
    color: '#EF4444',      // 赤
    emoji: '😮'             // アクセシビリティ用
  },
  understand: {
    id: 'understand',
    kanji: '納',
    label: 'ふむふむ、納得',
    tooltip: '納得した、理解できた',
    color: '#10B981',      // 緑
    emoji: '🤔'
  },
  question: {
    id: 'question',
    kanji: '疑',
    label: 'はて？疑問がある',
    tooltip: '疑問がある、もっと知りたい',
    color: '#F59E0B',      // 橙
    emoji: '❓'
  }
} as const

export type ReactionType = keyof typeof REACTIONS
```

### 🗄️ データベーススキーマ

```sql
-- 既存のreactionsテーブルを拡張
ALTER TABLE reactions
  ADD COLUMN reaction_type VARCHAR(20) CHECK (reaction_type IN ('surprise', 'understand', 'question'));

-- リアクション統計ビュー
CREATE VIEW reaction_stats AS
SELECT
  target_id,
  target_type,
  reaction_type,
  COUNT(*) as count
FROM reactions
WHERE type = 'reaction'  -- 'like'や'comment'と区別
GROUP BY target_id, target_type, reaction_type;
```

### 🎨 UI実装

```tsx
// components/ReactionBar.tsx
interface ReactionBarProps {
  targetType: 'topic' | 'comment'
  targetId: number
  currentStudentId: number
}

export function ReactionBar({ targetType, targetId, currentStudentId }: ReactionBarProps) {
  const [myReactions, setMyReactions] = useState<Set<ReactionType>>(new Set())
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
    surprise: 0,
    understand: 0,
    question: 0
  })

  const toggleReaction = async (type: ReactionType) => {
    if (myReactions.has(type)) {
      // リアクション取り消し
      await fetch('/api/reactions', {
        method: 'DELETE',
        body: JSON.stringify({ targetType, targetId, reactionType: type })
      })
      setMyReactions(prev => {
        const next = new Set(prev)
        next.delete(type)
        return next
      })
    } else {
      // リアクション追加
      await fetch('/api/reactions', {
        method: 'POST',
        body: JSON.stringify({
          targetType,
          targetId,
          reactionType: type,
          studentId: currentStudentId
        })
      })
      setMyReactions(prev => new Set(prev).add(type))
    }
  }

  return (
    <div className="flex gap-2 mt-2">
      {Object.entries(REACTIONS).map(([key, reaction]) => {
        const type = key as ReactionType
        const isActive = myReactions.has(type)

        return (
          <button
            key={type}
            onClick={() => toggleReaction(type)}
            className={`
              group relative px-3 py-1 rounded-full transition-all
              ${isActive
                ? 'bg-opacity-20 ring-2'
                : 'bg-gray-100 hover:bg-opacity-10'
              }
            `}
            style={{
              backgroundColor: isActive ? reaction.color : undefined,
              borderColor: isActive ? reaction.color : undefined
            }}
          >
            <span
              className="text-lg font-bold mr-1"
              style={{ color: reaction.color }}
            >
              {reaction.kanji}
            </span>
            <span className="text-sm text-gray-600">
              {reactionCounts[type]}
            </span>

            {/* ツールチップ */}
            <span className="
              absolute bottom-full left-1/2 -translate-x-1/2 mb-2
              px-2 py-1 bg-gray-800 text-white text-xs rounded
              opacity-0 group-hover:opacity-100 transition-opacity
              whitespace-nowrap pointer-events-none
            ">
              {reaction.tooltip}
            </span>
          </button>
        )
      })}
    </div>
  )
}
```

### 📊 API仕様

```typescript
// POST /api/reactions
{
  targetType: 'topic' | 'comment',
  targetId: number,
  reactionType: 'surprise' | 'understand' | 'question',
  studentId: number
}

// DELETE /api/reactions
{
  targetType: 'topic' | 'comment',
  targetId: number,
  reactionType: 'surprise' | 'understand' | 'question'
}

// GET /api/reactions?targetType=topic&targetId=123
Response: {
  reactions: {
    surprise: 5,
    understand: 12,
    question: 3
  },
  myReactions: ['understand']
}
```

---

## 2. 生徒用メニュー画面

### 📝 概要
- **目的**: 生徒が授業参加、振り返り、他クラス閲覧を選択できる
- **使用者**: 生徒
- **ルーティング**: `/student`（ログイン後のランディングページ）

### 🎨 画面構成

```
┌──────────────────────────────────────────────────┐
│                                                  │
│         🏛️ 公共のキョウシツ v4                    │
│                                                  │
│            ようこそ、青山 朝太郎さん               │
│                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │            │ │            │ │            │  │
│  │    📚      │ │    📝      │ │    🌐      │  │
│  │            │ │            │ │            │  │
│  │  今日の授業 │ │  私の学び   │ │ みんなの議論│  │
│  │            │ │            │ │            │  │
│  │ [コード入力] │ │[ポートフォリオ]│ │[全体を見る]│  │
│  │            │ │            │ │            │  │
│  └────────────┘ └────────────┘ └────────────┘  │
│                                                  │
│  📅 最近の授業                                    │
│  ┌────────────────────────────────────────────┐ │
│  │ 12/20  若者と政治  (3時限)     [開く]       │ │
│  │ 12/18  環境問題   (2時限)     [開く]       │ │
│  │ 12/15  民主主義   (1時限)     [開く]       │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 🎨 UI実装

```tsx
// app/student/page.tsx
export default function StudentMenu() {
  const { student } = useAuth() // 認証済み生徒情報
  const [recentSessions, setRecentSessions] = useState([])

  useEffect(() => {
    // 最近参加したセッション取得
    fetch(`/api/students/${student.id}/sessions?limit=5`)
      .then(r => r.json())
      .then(data => setRecentSessions(data.sessions))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* ヘッダー */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          🏛️ 公共のキョウシツ v4
        </h1>
        <p className="text-xl text-gray-600">
          ようこそ、{student.display_name}さん
        </p>
      </div>

      {/* メインメニュー */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* 今日の授業 */}
        <Link href="/session/join" className="menu-card group">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
            <div className="text-6xl mb-4 text-center group-hover:scale-110 transition-transform">
              📚
            </div>
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
              今日の授業
            </h2>
            <p className="text-gray-600 text-center">
              セッションコードを入力して授業に参加
            </p>
          </div>
        </Link>

        {/* 私の学び */}
        <Link href="/student/portfolio" className="menu-card group">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
            <div className="text-6xl mb-4 text-center group-hover:scale-110 transition-transform">
              📝
            </div>
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
              私の学び
            </h2>
            <p className="text-gray-600 text-center">
              これまでの投稿とメモを振り返る
            </p>
          </div>
        </Link>

        {/* みんなの議論 */}
        <Link href="/all-classes" className="menu-card group">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
            <div className="text-6xl mb-4 text-center group-hover:scale-110 transition-transform">
              🌐
            </div>
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
              みんなの議論
            </h2>
            <p className="text-gray-600 text-center">
              全クラスの投稿を閲覧
            </p>
          </div>
        </Link>
      </div>

      {/* 最近の授業 */}
      <div className="max-w-5xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          📅 最近の授業
        </h3>
        <div className="bg-white rounded-xl shadow-lg p-6">
          {recentSessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              まだ参加した授業がありません
            </p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session: any) => (
                <Link
                  key={session.id}
                  href={`/classroom/${session.code}`}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500 w-20">
                      {new Date(session.date).toLocaleDateString('ja-JP', {
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">
                        {session.topic_title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.period}時限 - {session.class_name}
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    開く
                  </button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 🗄️ データベース

```sql
-- 生徒の参加履歴を取得するビュー
CREATE VIEW student_session_history AS
SELECT
  s.student_id,
  ls.id as session_id,
  ls.code,
  ls.topic_title,
  ls.period,
  ls.date,
  c.name as class_name,
  sa.created_at as joined_at
FROM seat_assignments sa
JOIN lesson_sessions ls ON sa.session_id = ls.id
JOIN students s ON sa.student_id = s.id
JOIN classes c ON ls.class_id = c.id
ORDER BY sa.created_at DESC;
```

---

## 3. 教員用視点切り替え機能

### 📝 概要
- **目的**: 黒板/プロジェクター投影時に、生徒から見た配置に切り替える
- **使用者**: 教師
- **関連機能**: 教師ダッシュボード、座席表表示

### 🎨 UI実装

```tsx
// components/TeacherViewToggle.tsx
export function TeacherViewToggle() {
  const [viewMode, setViewMode] = useState<'teacher' | 'projection'>('teacher')

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={viewMode === 'projection'}
          onChange={(e) => setViewMode(e.target.checked ? 'projection' : 'teacher')}
          className="w-5 h-5"
        />
        <span className="font-medium">
          {viewMode === 'teacher' ? '👨‍🏫 教員視点' : '📽️ 投影モード（生徒視点）'}
        </span>
      </label>

      {viewMode === 'projection' && (
        <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
          <span>⚠️</span>
          <span className="font-bold">黒板投影モード（左右反転）</span>
        </div>
      )}
    </div>
  )
}

// components/SeatMap.tsx
interface SeatMapProps {
  viewMode: 'teacher' | 'projection'
  seats: Seat[]
}

export function SeatMap({ viewMode, seats }: SeatMapProps) {
  return (
    <div className="relative">
      {/* 黒板 */}
      <div className="bg-gray-800 text-white text-center py-3 rounded-lg mb-6">
        黒板
      </div>

      {/* 座席グリッド */}
      <div
        className={`
          grid grid-cols-6 gap-4
          ${viewMode === 'projection' ? 'scale-x-[-1]' : ''}
          transition-transform duration-500
        `}
      >
        {seats.map((seat) => (
          <div
            key={seat.number}
            className={`
              seat-card
              ${viewMode === 'projection' ? 'scale-x-[-1]' : ''}
            `}
          >
            {/* 座席内容（反転させない） */}
            <div className="seat-number">{seat.number}</div>
            <div className="student-name">{seat.studentName}</div>
            <div className="topic-title">{seat.topicTitle}</div>
          </div>
        ))}
      </div>

      {/* 投影モード時の説明 */}
      {viewMode === 'projection' && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-blue-800">
            💡 このモードは黒板/プロジェクター投影用です。<br/>
            生徒から見て正しい位置に表示されます。
          </p>
        </div>
      )}
    </div>
  )
}
```

### 🎨 CSS実装

```css
/* components/SeatMap.css */

/* 投影モード時の全体反転 */
.seat-grid.projection-mode {
  transform: scaleX(-1);
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 座席カード内のテキストは反転を打ち消す */
.seat-grid.projection-mode .seat-card {
  transform: scaleX(-1);
}

/* アニメーション */
@keyframes flip-in {
  from {
    transform: scaleX(1) rotateY(0deg);
  }
  to {
    transform: scaleX(-1) rotateY(180deg);
  }
}

.projection-mode {
  animation: flip-in 0.5s ease-out;
}
```

---

## 4. 個人的な学習メモ機能

### 📝 概要
- **目的**: 授業中の気づきを記録し、後でポートフォリオで振り返る
- **使用者**: 生徒
- **関連機能**: 座席画面、ポートフォリオ画面
- **重要**: セッション単位ではなく、**生徒個人の学習記録として永続保存**

### 🗄️ データベーススキーマ

```sql
-- 学習メモテーブル（セッション横断で管理）
CREATE TABLE learning_memos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  session_id BIGINT REFERENCES lesson_sessions(id) ON DELETE SET NULL,

  -- メモ内容
  content TEXT NOT NULL,

  -- メタデータ（振り返り用）
  tags TEXT[],                    -- ['驚き', '疑問', '発見'] など
  is_favorite BOOLEAN DEFAULT false,  -- お気に入り

  -- タイムスタンプ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- インデックス
  CONSTRAINT learning_memos_content_not_empty CHECK (length(content) > 0)
);

-- インデックス
CREATE INDEX idx_learning_memos_student ON learning_memos(student_id);
CREATE INDEX idx_learning_memos_session ON learning_memos(session_id);
CREATE INDEX idx_learning_memos_created ON learning_memos(created_at DESC);
CREATE INDEX idx_learning_memos_tags ON learning_memos USING GIN(tags);

-- ポートフォリオビュー（生徒ごとの学習履歴）
CREATE VIEW student_learning_portfolio AS
SELECT
  lm.id,
  lm.student_id,
  lm.content,
  lm.tags,
  lm.is_favorite,
  lm.created_at,
  lm.updated_at,
  -- セッション情報（削除されていても表示できるように）
  ls.topic_title,
  ls.date as session_date,
  ls.period,
  c.name as class_name,
  -- 自分のトピック投稿
  tp.content as my_topic
FROM learning_memos lm
LEFT JOIN lesson_sessions ls ON lm.session_id = ls.id
LEFT JOIN classes c ON ls.class_id = c.id
LEFT JOIN topic_posts tp ON lm.session_id = tp.session_id AND lm.student_id = tp.student_id
ORDER BY lm.created_at DESC;
```

### 🎨 UI実装

#### 授業中のメモ作成

```tsx
// components/QuickMemo.tsx
export function QuickMemo({ sessionId, studentId }: { sessionId: number, studentId: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const saveMemo = async () => {
    await fetch('/api/learning-memos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        sessionId,
        content,
        tags
      })
    })

    setIsOpen(false)
    setContent('')
    setTags([])

    // 保存成功通知
    toast.success('💾 メモを保存しました')
  }

  return (
    <>
      {/* 浮遊ボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          fixed bottom-6 right-6 z-50
          w-16 h-16 bg-yellow-400 rounded-full shadow-lg
          hover:bg-yellow-500 hover:scale-110
          transition-all duration-200
          flex items-center justify-center
        "
        title="学習メモを書く"
      >
        <span className="text-3xl">📝</span>
      </button>

      {/* メモモーダル */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="bg-yellow-50 rounded-xl p-6 w-full max-w-md">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            📝 学習メモ
          </h3>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="
              w-full h-40 p-3
              bg-white border-2 border-yellow-300 rounded-lg
              focus:outline-none focus:border-yellow-500
              font-mono text-gray-800
            "
            placeholder="授業の気づき、疑問、発見などを自由にメモ...

例：
・なぜ若者は投票に行かないのか？
・SNSの影響力について調べたい
・佐藤さんの意見が参考になった"
          />

          {/* タグ選択 */}
          <div className="mt-3 mb-4">
            <p className="text-sm text-gray-600 mb-2">タグを選択（任意）</p>
            <div className="flex flex-wrap gap-2">
              {['驚き', '疑問', '発見', 'アイデア', '調べたい'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setTags(prev =>
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    )
                  }}
                  className={`
                    px-3 py-1 rounded-full text-sm
                    ${tags.includes(tag)
                      ? 'bg-yellow-400 text-gray-800 font-bold'
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveMemo}
              disabled={!content.trim()}
              className="
                flex-1 px-4 py-2
                bg-blue-500 text-white rounded-lg
                hover:bg-blue-600 disabled:bg-gray-300
                font-medium
              "
            >
              💾 保存
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="
                px-4 py-2
                bg-gray-300 text-gray-700 rounded-lg
                hover:bg-gray-400
              "
            >
              閉じる
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            💡 このメモは後で「私の学び」から振り返ることができます
          </p>
        </div>
      </Modal>
    </>
  )
}
```

#### ポートフォリオ画面

```tsx
// app/student/portfolio/page.tsx
export default function StudentPortfolio() {
  const { student } = useAuth()
  const [memos, setMemos] = useState([])
  const [filter, setFilter] = useState<'all' | 'favorite' | string>('all')

  useEffect(() => {
    fetch(`/api/students/${student.id}/portfolio`)
      .then(r => r.json())
      .then(data => setMemos(data.memos))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📝 私の学び
          </h1>
          <p className="text-gray-600">
            これまでの授業で学んだこと、気づいたことを振り返りましょう
          </p>
        </div>

        {/* フィルター */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' ? 'bg-blue-500 text-white' : 'bg-white'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setFilter('favorite')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'favorite' ? 'bg-yellow-400 text-gray-800' : 'bg-white'
            }`}
          >
            ⭐ お気に入り
          </button>
          <button
            onClick={() => setFilter('驚き')}
            className={`px-4 py-2 rounded-lg ${
              filter === '驚き' ? 'bg-red-100 text-red-800' : 'bg-white'
            }`}
          >
            驚 驚き
          </button>
          <button
            onClick={() => setFilter('疑問')}
            className={`px-4 py-2 rounded-lg ${
              filter === '疑問' ? 'bg-orange-100 text-orange-800' : 'bg-white'
            }`}
          >
            疑 疑問
          </button>
        </div>

        {/* メモ一覧 */}
        <div className="space-y-4">
          {memos
            .filter((memo: any) => {
              if (filter === 'all') return true
              if (filter === 'favorite') return memo.is_favorite
              return memo.tags?.includes(filter)
            })
            .map((memo: any) => (
              <MemoCard key={memo.id} memo={memo} />
            ))}
        </div>
      </div>
    </div>
  )
}

function MemoCard({ memo }: { memo: any }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-sm text-gray-500">
            {new Date(memo.created_at).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          {memo.topic_title && (
            <div className="font-bold text-gray-800">
              📚 {memo.topic_title}
            </div>
          )}
        </div>
        <button className="text-2xl">
          {memo.is_favorite ? '⭐' : '☆'}
        </button>
      </div>

      {/* メモ内容 */}
      <p className="text-gray-700 whitespace-pre-wrap mb-3">
        {memo.content}
      </p>

      {/* タグ */}
      {memo.tags && memo.tags.length > 0 && (
        <div className="flex gap-2">
          {memo.tags.map((tag: string) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 自分のトピック投稿 */}
      {memo.my_topic && (
        <details className="mt-3 p-3 bg-blue-50 rounded">
          <summary className="cursor-pointer text-sm text-blue-700 font-medium">
            このときの私の投稿を見る
          </summary>
          <p className="mt-2 text-gray-700 text-sm">
            {memo.my_topic}
          </p>
        </details>
      )}
    </div>
  )
}
```

### 📊 API仕様

```typescript
// POST /api/learning-memos
{
  studentId: number,
  sessionId: number | null,  // nullの場合は授業外のメモ
  content: string,
  tags?: string[]
}

// GET /api/students/{studentId}/portfolio
Response: {
  memos: Array<{
    id: string,
    content: string,
    tags: string[],
    is_favorite: boolean,
    created_at: string,
    topic_title?: string,    // セッション情報
    session_date?: string,
    my_topic?: string       // 自分の投稿
  }>
}

// PATCH /api/learning-memos/{memoId}
{
  is_favorite?: boolean,
  tags?: string[]
}
```

---

## 🎨 デザインシステム

### カラーパレット追加

```css
/* tailwind.config.js に追加 */
module.exports = {
  theme: {
    extend: {
      colors: {
        // 漢字リアクション
        reaction: {
          surprise: '#EF4444',    // 赤 (驚)
          understand: '#10B981',  // 緑 (納)
          question: '#F59E0B',    // 橙 (疑)
        },
        // メモ機能
        memo: {
          yellow: '#FEF3C7',      // 付箋色
          border: '#FCD34D',      // 付箋枠
        },
      },
    },
  },
}
```

### アニメーション

```css
/* globals.css */

/* リアクションボタンのホバー */
@keyframes reaction-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.reaction-btn:hover {
  animation: reaction-bounce 0.3s ease-in-out;
}

/* 視点切り替えのフリップ */
@keyframes view-flip {
  0% { transform: scaleX(1); }
  100% { transform: scaleX(-1); }
}

.projection-mode {
  animation: view-flip 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* メモボタンの浮遊 */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.quick-memo-button {
  animation: float 3s ease-in-out infinite;
}
```

---

## 📦 実装順序（推奨）

### Phase 1: 基盤整備
1. データベーススキーマ作成
2. 認証システム
3. 座席選択機能（座席番号ベース）

### Phase 2: コア機能
4. **生徒用メニュー画面**（最重要）
5. トピック投稿
6. **漢字リアクション機能**

### Phase 3: 拡張機能
7. **個人学習メモ機能**
8. **ポートフォリオ画面**
9. チャット機能

### Phase 4: 教師機能
10. 教師ダッシュボード
11. **教員用視点切り替え**
12. 統計・分析機能

---

## ⚠️ 実装上の重要な注意点

### 1. 漢字リアクション
- ❌ 「いいね」「ハート」などの感情的な言葉は使わない
- ✅ 「驚・納・疑」という理性的な漢字を使用
- ✅ ツールチップで意味を明確に伝える
- ✅ アクセシビリティのため絵文字も併記

### 2. 学習メモ
- ❌ セッション削除と同時にメモを削除しない
- ✅ `ON DELETE SET NULL` でセッション削除後もメモは保持
- ✅ ポートフォリオで長期的な学習履歴として活用
- ✅ タグ機能で振り返りやすくする

### 3. 視点切り替え
- ❌ テキストまで反転させない（読めなくなる）
- ✅ 座席配置のみ反転
- ✅ 切り替え時にアニメーションで視覚的フィードバック
- ✅ 現在のモードを明確に表示

### 4. 生徒メニュー
- ✅ 直感的な3択構造
- ✅ 最近の授業へのクイックアクセス
- ✅ アイコンを大きく、わかりやすく

---

## 🔗 関連ドキュメント

- `LESSONS_LEARNED.md` - v3からの教訓
- `DEVELOPMENT_LOG.md` - 開発履歴
- `DATABASE_SCHEMA.md` - データベース設計（作成予定）
- `API_SPECIFICATION.md` - API仕様書（作成予定）

---

**作成者**: Claude Code & User
**最終更新**: 2025年10月5日

**次のステップ**: v4プロジェクト設計書の作成
