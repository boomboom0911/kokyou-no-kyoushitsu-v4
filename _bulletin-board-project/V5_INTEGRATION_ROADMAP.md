# 🗺️ v5統合ロードマップ

v4（教室）と掲示板をv5で統合するための詳細な手順書

---

## 📊 現状とゴール

### 現状（掲示板開発中）

```
【v4】kokyou-no-kyoushitsu-v4
├── GitHub: kokyou-no-kyoushitsu-v4
├── Vercel: kokyou-no-kyoushitsu-v4.vercel.app
└── Supabase: 既存プロジェクト
    ├── lesson_sessions（教室用）
    ├── students（共通）
    ├── topic_posts（教室用）
    └── ... その他v4用テーブル

【掲示板】kokyou-keijiban-v1（新規）
├── GitHub: kokyou-keijiban-v1
├── Vercel: kokyou-keijiban-v1.vercel.app
└── Supabase: 既存プロジェクト（v4と共有）
    ├── bulletin_sessions（掲示板用）
    ├── bulletin_posts（掲示板用）
    ├── bulletin_comments（掲示板用）
    └── bulletin_reactions（掲示板用）
```

---

### ゴール（v5統合後）

```
【v5】kokyou-no-kyoushitsu-v5
├── GitHub: kokyou-no-kyoushitsu-v5
├── Vercel: kokyou-no-kyoushitsu-v5.vercel.app
└── Supabase: 既存プロジェクト（マイグレーション済み）
    ├── lesson_sessions（拡張版：教室+掲示板）
    ├── students（共通）
    ├── topic_posts（拡張版：教室+掲示板）
    ├── interactions（拡張版：教室+掲示板）
    └── reactions（拡張版：教室+掲示板）
```

---

## 🚀 統合フェーズ

### Phase 0: 準備（v5開発開始前）

#### 0-1. v4と掲示板の運用実績を確認
- [ ] v4の授業記録データを確認
- [ ] 掲示板の投稿データを確認
- [ ] ユーザーフィードバックを整理
- [ ] v5で必要な機能をリストアップ

#### 0-2. データのバックアップ
```sql
-- Supabaseダッシュボードで手動バックアップ
-- または pg_dump でエクスポート
pg_dump -h xxxxx.supabase.co -U postgres -d postgres > backup_before_v5.sql
```

#### 0-3. v5設計ドキュメント作成
- [ ] 統合後のデータベーススキーマ設計
- [ ] UI/UX設計（モード切り替え）
- [ ] API設計
- [ ] 認証システムの統合

---

### Phase 1: v5リポジトリ作成

#### 1-1. 新規リポジトリ作成
```bash
cd /Users/boomboom0911/Developer/
git clone https://github.com/boomboom0911/kokyou-no-kyoushitsu-v4.git kokyou-no-kyoushitsu-v5

cd kokyou-no-kyoushitsu-v5
git remote remove origin
git remote add origin https://github.com/boomboom0911/kokyou-no-kyoushitsu-v5.git
```

#### 1-2. 不要なファイルを削除
```bash
# v4の開発記録など、v5では不要なファイルを削除
rm DEVELOPMENT_LOG_*.md
rm -rf _bulletin-board-project  # 統合後は不要

# v5用の新しいREADMEを作成
```

---

### Phase 2: データベースマイグレーション

#### 2-1. マイグレーションSQLファイルの作成

**`migrations/001_v5_schema.sql`**
```sql
-- ========================================
-- v5統合マイグレーション
-- ========================================

BEGIN;

-- ----------------------------------------
-- Step 1: 既存テーブルにカラム追加
-- ----------------------------------------

-- lesson_sessions を拡張
ALTER TABLE lesson_sessions
  ADD COLUMN IF NOT EXISTS session_type VARCHAR(20) DEFAULT 'classroom',
  ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES students(id);

-- 既存データを更新
UPDATE lesson_sessions SET session_type = 'classroom' WHERE session_type IS NULL;
UPDATE lesson_sessions SET is_permanent = false WHERE is_permanent IS NULL;

-- topic_posts を拡張（seat_assignment_id を nullable に）
ALTER TABLE topic_posts ALTER COLUMN seat_assignment_id DROP NOT NULL;

-- ----------------------------------------
-- Step 2: 掲示板データを統合
-- ----------------------------------------

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
  NULL,
  NULL,
  created_at
FROM bulletin_sessions;

-- bulletin_posts → topic_posts
INSERT INTO topic_posts (
  session_id,
  seat_assignment_id,
  student_id,
  content,
  created_at
)
SELECT
  ls.id,
  NULL,
  bp.student_id,
  bp.content,
  bp.created_at
FROM bulletin_posts bp
JOIN bulletin_sessions bs ON bp.bulletin_session_id = bs.id
JOIN lesson_sessions ls ON ls.code = bs.code AND ls.session_type = 'bulletin';

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
  tp.id,
  bc.student_id,
  bc.content,
  bc.created_at
FROM bulletin_comments bc
JOIN bulletin_posts bp ON bc.bulletin_post_id = bp.id
JOIN bulletin_sessions bs ON bp.bulletin_session_id = bs.id
JOIN lesson_sessions ls ON ls.code = bs.code AND ls.session_type = 'bulletin'
JOIN topic_posts tp ON tp.session_id = ls.id AND tp.student_id = bp.student_id AND tp.content = bp.content;

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
JOIN bulletin_sessions bs ON bp.bulletin_session_id = bs.id
JOIN lesson_sessions ls ON ls.code = bs.code AND ls.session_type = 'bulletin'
JOIN topic_posts tp ON tp.session_id = ls.id AND tp.student_id = bp.student_id AND tp.content = bp.content;

-- ----------------------------------------
-- Step 3: 古いテーブルを削除
-- ----------------------------------------

DROP TABLE IF EXISTS bulletin_reactions;
DROP TABLE IF EXISTS bulletin_comments;
DROP TABLE IF EXISTS bulletin_posts;
DROP TABLE IF EXISTS bulletin_sessions;

-- ----------------------------------------
-- Step 4: インデックスの追加
-- ----------------------------------------

CREATE INDEX IF NOT EXISTS idx_lesson_sessions_type ON lesson_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_permanent ON lesson_sessions(is_permanent);

COMMIT;
```

#### 2-2. マイグレーション実行前の確認
```sql
-- データ件数の確認
SELECT 'v4_sessions', COUNT(*) FROM lesson_sessions;
SELECT 'bulletin_sessions', COUNT(*) FROM bulletin_sessions;
SELECT 'v4_posts', COUNT(*) FROM topic_posts;
SELECT 'bulletin_posts', COUNT(*) FROM bulletin_posts;
```

#### 2-3. マイグレーション実行
```bash
# Supabase SQL Editorで実行
# または
psql -h xxxxx.supabase.co -U postgres -d postgres -f migrations/001_v5_schema.sql
```

#### 2-4. マイグレーション後の検証
```sql
-- 統合後のデータ件数確認
SELECT session_type, COUNT(*) FROM lesson_sessions GROUP BY session_type;
SELECT COUNT(*) FROM topic_posts WHERE seat_assignment_id IS NULL;  -- 掲示板投稿

-- データの整合性確認
SELECT * FROM lesson_sessions WHERE session_type = 'bulletin' LIMIT 5;
SELECT * FROM topic_posts WHERE seat_assignment_id IS NULL LIMIT 5;
```

---

### Phase 3: v5アプリケーション開発

#### 3-1. 型定義の更新

**`src/types/index.ts`**
```typescript
export type SessionType = 'classroom' | 'bulletin';

export interface LessonSession {
  id: number;
  code: string;
  topic_title: string;
  topic_content: string | null;
  session_type: SessionType;       // 新規追加
  is_permanent: boolean;            // 新規追加
  created_by: number | null;        // 新規追加
  class_id: number | null;
  period: number | null;
  created_at: string;
}

export interface TopicPost {
  id: number;
  session_id: number;
  seat_assignment_id: number | null;  // nullable に変更
  student_id: number | null;
  content: string;
  created_at: string;
}
```

#### 3-2. セッション作成画面の拡張

**`src/app/teacher/create-session/page.tsx`**
```typescript
const [sessionType, setSessionType] = useState<'classroom' | 'bulletin'>('classroom');

// フォームに追加
<div>
  <label>セッションタイプ</label>
  <select value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
    <option value="classroom">教室モード（座席・クラス・時限）</option>
    <option value="bulletin">掲示板モード（全校・常設型）</option>
  </select>
</div>

// 条件付きレンダリング
{sessionType === 'classroom' && (
  <>
    <ClassSelect />
    <PeriodSelect />
  </>
)}
```

#### 3-3. トップ画面の拡張

**`src/app/page.tsx`**
```typescript
// 2つの入口を用意
<div className="grid grid-cols-2 gap-4">
  <Link href="/student">
    <div className="card">🏫 教室に入る（4桁コード）</div>
  </Link>
  <Link href="/bulletin">
    <div className="card">📌 掲示板を見る</div>
  </Link>
</div>
```

#### 3-4. 掲示板一覧画面の追加

**`src/app/bulletin/page.tsx`**
```typescript
export default function BulletinListPage() {
  const [bulletins, setBulletins] = useState<LessonSession[]>([]);

  useEffect(() => {
    fetch('/api/sessions?type=bulletin')
      .then(res => res.json())
      .then(data => setBulletins(data.data));
  }, []);

  return (
    <div>
      <h1>公共の掲示板</h1>
      {bulletins.map(bulletin => (
        <Link key={bulletin.id} href={`/bulletin/${bulletin.code}`}>
          <div>{bulletin.topic_title}</div>
        </Link>
      ))}
    </div>
  );
}
```

#### 3-5. 掲示板詳細画面

**`src/app/bulletin/[code]/page.tsx`**
```typescript
// 座席選択なし、直接投稿フォーム表示
export default function BulletinDetailPage() {
  // 実装内容は v4 の classroom ページをベースに簡素化
}
```

---

### Phase 4: API の更新

#### 4-1. セッション取得API

**`src/app/api/sessions/route.ts`**
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');  // 'classroom' | 'bulletin'

  let query = supabase.from('lesson_sessions').select('*');

  if (type) {
    query = query.eq('session_type', type);
  }

  const { data, error } = await query;
  // ...
}
```

#### 4-2. セッション作成API

**`src/app/api/sessions/route.ts` (POST)**
```typescript
export async function POST(request: Request) {
  const { sessionType, topicTitle, classId, period } = await request.json();

  const { data, error } = await supabase
    .from('lesson_sessions')
    .insert({
      code: generateCode(),
      topic_title: topicTitle,
      session_type: sessionType,
      is_permanent: sessionType === 'bulletin',
      class_id: sessionType === 'classroom' ? classId : null,
      period: sessionType === 'classroom' ? period : null,
    });
  // ...
}
```

---

### Phase 5: テスト

#### 5-1. 教室モードのテスト
- [ ] v4と同じ動作をするか確認
- [ ] 座席選択が正常に動作
- [ ] 投稿・リアクション・コメントが動作
- [ ] 欠席者管理が動作

#### 5-2. 掲示板モードのテスト
- [ ] 掲示板一覧が表示される
- [ ] 座席選択なしで投稿できる
- [ ] 常設型として動作する

#### 5-3. データ移行の検証
- [ ] v4の過去データが表示される
- [ ] 掲示板の過去データが表示される
- [ ] リアクション・コメントが正しく紐付いている

---

### Phase 6: デプロイ

#### 6-1. Vercelに新規デプロイ
```bash
# v5リポジトリをVercelにデプロイ
# 環境変数は既存のSupabaseを使用
NEXT_PUBLIC_TEACHER_PASSWORD=your_password
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

#### 6-2. カスタムドメイン設定（オプション）
```
v5: kokyou-no-kyoushitsu-v5.vercel.app
または myclassroom2025.vercel.app を移行
```

---

### Phase 7: 移行期間

#### 7-1. 並行稼働期間
```
【移行期間中】
v4: kokyou-no-kyoushitsu-v4.vercel.app（保守モード）
掲示板: kokyou-keijiban-v1.vercel.app（保守モード）
v5: kokyou-no-kyoushitsu-v5.vercel.app（新規）

↓ 2週間〜1ヶ月

【移行完了後】
v4: 停止
掲示板: 停止
v5: メインで運用
```

#### 7-2. ユーザー通知
- v4と掲示板のトップページに「v5に移行しました」の通知バナー
- 新しいURLへのリンクを表示

---

## 📊 ロールバック計画

万が一v5に問題があった場合：

### Step 1: v4/掲示板に戻す
```bash
# Vercelで v4 と 掲示板 のデプロイを再開
```

### Step 2: データベースをロールバック
```sql
-- バックアップから復元
psql -h xxxxx.supabase.co -U postgres -d postgres < backup_before_v5.sql
```

---

## 📝 チェックリスト

### 開発開始前
- [ ] v4と掲示板の運用実績を確認
- [ ] データバックアップ取得
- [ ] v5設計ドキュメント作成

### マイグレーション前
- [ ] マイグレーションSQL作成
- [ ] テスト環境で実行・検証
- [ ] ロールバック手順を確認

### マイグレーション後
- [ ] データ件数の一致確認
- [ ] データの整合性確認
- [ ] v5アプリケーションで動作確認

### デプロイ前
- [ ] 教室モードのテスト完了
- [ ] 掲示板モードのテスト完了
- [ ] 過去データの表示確認

### デプロイ後
- [ ] v5の本番動作確認
- [ ] ユーザー通知完了
- [ ] v4/掲示板のアクセスログ監視

---

## 🎯 成功の定義

- ✅ v4の過去の授業記録がすべて表示される
- ✅ 掲示板の過去の投稿がすべて表示される
- ✅ 教室モードと掲示板モードがシームレスに切り替えられる
- ✅ 既存ユーザーがログインできる
- ✅ データの損失がゼロ

---

**作成日**: 2025-10-16
**最終更新**: 2025-10-16
