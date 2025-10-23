# 🚀 コウキョウのキョウシツ v5 開発ガイド

**対象**: Claude Code / AI開発アシスタント
**目的**: v4の構造を効率的に理解し、v5の新機能を検討・実装する

---

## 📋 目次

1. [v4プロジェクト概要](#v4プロジェクト概要)
2. [効率的な読み込み順序](#効率的な読み込み順序)
3. [アーキテクチャ理解](#アーキテクチャ理解)
4. [データベース構造](#データベース構造)
5. [API設計パターン](#api設計パターン)
6. [コンポーネント設計](#コンポーネント設計)
7. [v5で検討すべき改善点](#v5で検討すべき改善点)
8. [v5新機能の要件](#v5新機能の要件)

---

## v4プロジェクト概要

### 🎯 プロジェクトの性格
「コウキョウのキョウシツ v4」は、教室での議論を可視化・活性化するWebアプリケーション。

**主要機能**:
1. **授業セッション** - リアルタイム座席選択・トピック投稿・議論
2. **掲示板システム** - 課題提出・匿名ピアレビュー
3. **通知システム** - リアルタイム通知・未読管理
4. **ポートフォリオ** - 学習記録のエクスポート

**技術スタック**:
- Next.js 15 (App Router) + TypeScript
- Supabase (PostgreSQL + Realtime)
- TailwindCSS
- Vercel デプロイ

---

## 効率的な読み込み順序

### 📖 Phase 1: プロジェクト全体像の把握（5分）

以下を順番に読む：

1. **`README.md`** - プロジェクト概要・主要機能
2. **`V4_COMPLETION_SUMMARY.md`** - v4で実装された全機能の詳細
3. **`DEMO_AND_SETUP_GUIDE.md`** - システムの動作・使い方

### 🏗️ Phase 2: アーキテクチャ理解（10分）

以下を順番に読む：

1. **型定義の理解**:
   ```
   src/types/index.ts        # 全データモデルの型定義（最重要）
   src/types/board.ts        # 掲示板専用の型定義
   ```

2. **データベーススキーマ**:
   ```
   scripts/database/schema/supabase-schema.sql          # 基本スキーマ
   scripts/database/schema/supabase-board-schema.sql    # 掲示板スキーマ
   scripts/database/schema/supabase-notifications.sql   # 通知スキーマ
   ```

3. **共通ライブラリ**:
   ```
   src/lib/supabase.ts       # Supabaseクライアント設定
   src/lib/storage.ts        # localStorage認証管理
   src/lib/notifications.ts  # 通知システム
   ```

### 🔌 Phase 3: API設計パターンの把握（15分）

APIは機能別に15グループに分類：

```
src/app/api/
├── auth/              認証（生徒・教員）
├── sessions/          授業セッション管理
├── seats/             座席割り当て
├── topics/            トピック投稿
├── reactions/         リアクション
├── interactions/      コメント
├── chat/              匿名チャット
├── learning-memos/    学習メモ
├── board/             掲示板・レビュー
├── notifications/     通知
├── students/          生徒管理
├── classes/           クラス管理
├── export/            データエクスポート
├── admin/             管理機能
└── debug/             デバッグ用
```

**重要なAPI例**:
- `src/app/api/sessions/route.ts` - セッションCRUD
- `src/app/api/board/route.ts` - 掲示板CRUD
- `src/app/api/interactions/route.ts` - コメント・通知連携
- `src/app/api/notifications/route.ts` - 通知管理

### 🧩 Phase 4: コンポーネント構造の理解（10分）

```
src/components/
├── SeatMap.tsx                   # 座席マップ（教室の核心）
├── TopicCard.tsx                 # トピック表示・コメント
├── ChatPanel.tsx                 # チャットパネル
├── ReactionBar.tsx               # リアクションバー
├── QuickMemo.tsx                 # 学習メモ
├── NotificationDropdown.tsx      # 通知ドロップダウン
├── board/
│   ├── SubmissionCard.tsx       # 作品提出カード
│   └── ReviewCard.tsx           # レビューカード
└── portfolio/
    ├── MyTopicCardComponent.tsx        # ポートフォリオ表示
    ├── ReactedTopicCardComponent.tsx
    └── CommentedTopicCardComponent.tsx
```

### 📄 Phase 5: 主要ページの理解（15分）

```
src/app/
├── page.tsx                          # トップページ（生徒/教員選択）
├── student/
│   ├── page.tsx                     # 生徒ログイン
│   ├── menu/page.tsx                # 生徒メニュー
│   └── portfolio/page.tsx           # ポートフォリオ
├── teacher/
│   ├── menu/page.tsx                # 教員メニュー
│   ├── create-session/page.tsx      # セッション作成
│   ├── register-students/page.tsx   # 生徒登録
│   └── boards/
│       ├── create/page.tsx          # 掲示板作成
│       └── [id]/page.tsx            # 掲示板管理
├── classroom/[sessionCode]/page.tsx  # 教室（生徒・教員共通）
├── all-classes/page.tsx             # 全授業一覧
└── board/[code]/page.tsx            # 掲示板参加
```

---

## アーキテクチャ理解

### 🏛️ システムアーキテクチャ

```
┌─────────────────────────────────────────────┐
│         Next.js 15 App Router               │
│  (Server Components + Client Components)    │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│           API Routes (39 endpoints)         │
│    /api/sessions, /api/board, etc.          │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│        Supabase PostgreSQL Database         │
│     + Realtime Subscriptions (WebSocket)    │
└─────────────────────────────────────────────┘
```

### 🔑 認証システム

**現在の実装** (v4):
- **localStorage ベース** - `src/lib/storage.ts`
- **固定ID方式**:
  - 教員: `student_id = -999`
  - ゲスト: `student_id = -1`
  - 生徒: `student_id > 0`

**v5への改善提案**:
- Google OAuth 2.0 実装
- セッショントークン管理
- RLS (Row Level Security) の活用

### 📊 データフロー

#### 1. 授業セッションのフロー

```
教員: セッション作成
  ↓
4桁コード生成 (lesson_sessions)
  ↓
生徒: コード入力 → 座席選択
  ↓
seat_assignments テーブルに記録
  ↓
トピック投稿 (topic_posts)
  ↓
リアクション・コメント (reactions, interactions)
  ↓
リアルタイム更新 (Supabase Realtime)
```

#### 2. 掲示板のフロー

```
教員: 掲示板作成 (boards)
  ↓
生徒: 作品提出 (board_submissions)
  ↓
他の生徒: レビュー投稿 (board_reviews)
  ↓
投稿者: レビューに返信 (board_review_replies)
  ↓
通知生成 (notifications)
```

---

## データベース構造

### 📋 主要テーブル一覧

#### 基本マスタ
```sql
classes              -- クラスマスタ (2-1, 2-2など)
students             -- 生徒マスタ (id, email, class_id)
```

#### 授業セッション関連
```sql
lesson_sessions      -- 授業セッション (code, topic_title, ended_at)
seat_assignments     -- 座席割り当て (session_id, student_id, seat_number)
topic_posts          -- トピック投稿 (content, session_id, student_id)
reactions            -- リアクション (target_type, target_id, reaction_type)
interactions         -- コメント (target_type, target_id, comment_text)
chat_messages        -- 匿名チャット (session_id, student_id, message)
learning_memos       -- 学習メモ (student_id, session_id, content)
absences             -- 欠席記録 (session_id, student_id)
```

#### 掲示板関連
```sql
boards               -- 掲示板 (code, title, review_required_count)
board_submissions    -- 作品提出 (board_id, student_id, content)
board_reviews        -- レビュー (submission_id, reviewer_id, rating)
board_review_replies -- レビュー返信 (review_id, reply_text)
```

#### 通知システム
```sql
notifications        -- 通知 (student_id, type, message, is_read)
```

### 🔗 重要な外部キー関係

```
lesson_sessions
  ↓
seat_assignments → students
  ↓
topic_posts
  ↓
reactions, interactions (target_type: 'topic' | 'comment')

boards
  ↓
board_submissions → students
  ↓
board_reviews → students (reviewer)
  ↓
board_review_replies
  ↓
notifications
```

### 📌 固定IDの設計

```typescript
// src/types/index.ts で定義
// 特殊な student_id:
-999: 教員アカウント (教科担当者)
  -1: ゲストアカウント (未登録ユーザー)
 1~N: 登録済み生徒
```

この設計により、生徒テーブルに特殊レコードを挿入することで、教員・ゲストも統一的に扱える。

---

## API設計パターン

### 🎨 統一されたAPIレスポンス形式

全APIは以下の型を返す：

```typescript
// src/types/index.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

**成功例**:
```json
{
  "success": true,
  "data": { "session": {...} },
  "message": "セッションを作成しました"
}
```

**エラー例**:
```json
{
  "success": false,
  "error": "セッションコードが見つかりません"
}
```

### 🔧 APIの命名規則

```
GET    /api/resource          # 一覧取得
POST   /api/resource          # 新規作成
GET    /api/resource/[id]     # 詳細取得
PUT    /api/resource/[id]     # 更新
DELETE /api/resource/[id]     # 削除

# 特殊なアクション
POST   /api/sessions/[id]/end      # セッション終了
GET    /api/board/[id]/stats       # 統計取得
POST   /api/board/review           # レビュー投稿
```

### 📡 リアルタイム更新の実装

Supabase Realtime を使用：

```typescript
// 座席変更のリアルタイム監視例
const channel = supabase
  .channel('seat-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'seat_assignments',
      filter: `session_id=eq.${sessionId}`
    },
    (payload) => {
      console.log('Seat changed:', payload);
      fetchSeats(); // 再取得
    }
  )
  .subscribe();
```

**監視対象**:
- `seat_assignments` - 座席変更
- `topic_posts` - トピック投稿
- `chat_messages` - チャット
- `notifications` - 通知

---

## コンポーネント設計

### 🧩 主要コンポーネントの責務

#### 1. SeatMap.tsx - 座席マップ
**責務**:
- 7行6列（42席）の座席配置を表示
- 座席の状態管理（空席・着席・投稿済み）
- クリック → 座席選択 or トピック詳細表示
- 教員視点 vs 生徒視点の切り替え

**Props**:
```typescript
{
  seats: SeatWithStudent[];
  currentStudentId: number;
  isTeacher: boolean;
  onSeatClick: (seat: SeatWithStudent) => void;
  viewMode: 'student' | 'teacher';
}
```

#### 2. TopicCard.tsx - トピック表示
**責務**:
- トピック内容の表示
- リアクションバーの表示
- コメント一覧の表示
- 新規コメント投稿フォーム
- 認証チェック（未ログインは投稿不可）

**Props**:
```typescript
{
  post: TopicPost;
  currentStudentId: number | null;
  onReactionChange?: () => void;
}
```

#### 3. NotificationDropdown.tsx - 通知
**責務**:
- 未読通知の表示
- バッジカウント表示
- 10秒ごとの自動更新
- 既読管理
- リンククリックで対象画面へ遷移

**State**:
```typescript
{
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
}
```

### 🎨 状態管理パターン

v4では主に **React Hooks** を使用：

```typescript
// 典型的な状態管理パターン
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch('/api/endpoint');
      const json = await response.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error);
      }
    } catch (e) {
      setError('通信エラー');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [dependency]);
```

**v5への改善提案**:
- Zustand / Jotai などの軽量状態管理導入
- React Query でのサーバーステート管理
- キャッシュ戦略の最適化

---

## v5で検討すべき改善点

### 🔍 v4の課題と改善案

#### 1. **認証システムの強化**
**現状**:
- localStorage ベースの簡易認証
- セキュリティが脆弱

**v5での改善**:
- ✅ Google OAuth 2.0 の実装
- ✅ JWT トークン管理
- ✅ Supabase Auth の活用
- ✅ RLS (Row Level Security) の有効化

#### 2. **パフォーマンス最適化**
**現状**:
- 全データをクライアント側で取得
- リアルタイム更新が多すぎる場合にパフォーマンス低下

**v5での改善**:
- ✅ ページネーション実装
- ✅ 仮想スクロール（長いリスト）
- ✅ Debounce / Throttle の適用
- ✅ React Query でのキャッシュ戦略

#### 3. **エラーハンドリングの統一**
**現状**:
- エラー処理が場所によって異なる
- ユーザーへのフィードバックが不十分

**v5での改善**:
- ✅ 統一されたエラーバウンダリ
- ✅ トースト通知ライブラリ (react-hot-toast)
- ✅ エラーログの収集 (Sentry など)

#### 4. **アクセシビリティ対応**
**現状**:
- ARIA属性が不足
- キーボード操作の考慮不足

**v5での改善**:
- ✅ ARIA属性の追加
- ✅ フォーカス管理の改善
- ✅ スクリーンリーダー対応

#### 5. **テストカバレッジ**
**現状**:
- テストコードが存在しない

**v5での改善**:
- ✅ Vitest + React Testing Library
- ✅ E2Eテスト (Playwright)
- ✅ API統合テスト

---

## v5新機能の要件

### 🌟 最重要機能: 議題別リアルタイム討論プラットフォーム

**インスピレーション**: Audrey Tang（オードリー・タン）氏の「Polis」

#### コンセプト
- 授業を超えて、学校全体で民主主義を学び実装する場
- 過去の授業トピックから議題を選び、有志で参加する実名制討論
- 意見の可視化（2次元マップ）とコンセンサスの発見

#### 主要機能

##### 1. 議題の発見と募集
```
フロー:
1. 生徒が「みんなの議論」から興味あるトピックを発見
2. 「この議題について討論したい」ボタンをクリック
3. 議題タイトル・説明を編集して討論スレッドを作成
4. 他の生徒に参加を呼びかけ（通知・掲示板）
```

**新規テーブル設計案**:
```sql
CREATE TABLE discussion_threads (
  id BIGSERIAL PRIMARY KEY,
  source_topic_id BIGINT REFERENCES topic_posts(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  creator_student_id BIGINT REFERENCES students(id),
  is_active BOOLEAN DEFAULT true,
  participant_limit INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE discussion_participants (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT REFERENCES discussion_threads(id),
  student_id BIGINT REFERENCES students(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, student_id)
);
```

##### 2. 実名制リアルタイム討論
```
機能:
- WebSocketベースのリアルタイムチャット
- 発言の構造化（賛成・反対・質問・提案）
- タイムスタンプ付き発言履歴
- モデレーション機能（教員による監視）
```

**新規テーブル設計案**:
```sql
CREATE TABLE discussion_messages (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT REFERENCES discussion_threads(id),
  student_id BIGINT REFERENCES students(id),
  message_type VARCHAR(20) CHECK (message_type IN ('statement', 'agree', 'disagree', 'question', 'proposal')),
  content TEXT NOT NULL,
  parent_message_id BIGINT REFERENCES discussion_messages(id), -- スレッド型
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### 3. 意見の可視化（Polis風マップ）
```
機能:
- 各参加者の意見を2次元座標にマッピング
- クラスタリング: 似た意見のグループを可視化
- 対立軸の発見: 意見が分かれるポイントを明示
- コンセンサス領域: 全員が賛成する意見を強調表示
```

**実装案**:
- フロントエンド: D3.js / Chart.js による可視化
- バックエンド: PCA（主成分分析）またはt-SNEで次元削減
- データ: 各発言への賛成・反対投票をベクトル化

**新規テーブル設計案**:
```sql
CREATE TABLE discussion_votes (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT REFERENCES discussion_threads(id),
  message_id BIGINT REFERENCES discussion_messages(id),
  voter_student_id BIGINT REFERENCES students(id),
  vote_type VARCHAR(10) CHECK (vote_type IN ('agree', 'disagree', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, voter_student_id)
);

CREATE TABLE discussion_map_positions (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT REFERENCES discussion_threads(id),
  student_id BIGINT REFERENCES students(id),
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### 4. コンセンサスの発見
```
機能:
- 「全員賛成」の意見を自動検出
- 共通基盤リストの生成
- 対立を超えた「第三の道」の提案を促す
```

**実装案**:
```typescript
// 擬似コード
function findConsensus(votes: Vote[]): Message[] {
  return messages.filter(msg => {
    const agreeRate = votes.filter(v =>
      v.message_id === msg.id && v.vote_type === 'agree'
    ).length / totalParticipants;

    return agreeRate >= 0.8; // 80%以上の賛成
  });
}
```

##### 5. 提案と投票
```
機能:
- 解決策の提案フォーム
- 「最も多くの人が受け入れられる案」を選ぶ投票
- ランク選択投票（1位、2位、3位を選択）
- 結果の可視化（票の分布）
```

**新規テーブル設計案**:
```sql
CREATE TABLE discussion_proposals (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT REFERENCES discussion_threads(id),
  proposer_student_id BIGINT REFERENCES students(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE proposal_votes (
  id BIGSERIAL PRIMARY KEY,
  proposal_id BIGINT REFERENCES discussion_proposals(id),
  voter_student_id BIGINT REFERENCES students(id),
  rank INTEGER CHECK (rank >= 1 AND rank <= 3), -- ランク選択
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(proposal_id, voter_student_id)
);
```

#### 教育的意義
- **民主主義の実践**: 多様な意見を尊重しながら合意形成
- **批判的思考**: 自分の意見を構造化し、他者の意見を分析
- **Plurality（多元性）**: 対立ではなく、多様性を活かす方法を学ぶ
- **探究学習の基盤**: 深い問いを立て、クラスを超えて議論

---

### 🔧 その他の新機能候補

#### 2. 匿名チャット機能の拡張
**現状**: 完全匿名のフラットなチャット

**v5での改善**:
- ✅ スレッド型チャット（LINE風リプライ機能）
- ✅ 教員画面での発言者表示（ホバー時）
- ✅ 不適切発言の通報機能

#### 3. ポートフォリオのAI分析
**新機能**:
- ✅ 学習傾向の自動分析（よくリアクションする内容）
- ✅ 成長の可視化（投稿の質の変化）
- ✅ おすすめトピックの提案

#### 4. グループワーク機能
**新機能**:
- ✅ 授業内でのグループ分け
- ✅ グループ専用チャット・座席エリア
- ✅ グループ成果物の提出

---

## 🚀 v5開発の開始手順

### Step 1: v4の理解（このガイドを読む）
```bash
# このファイルを読む
cat V5_DEVELOPMENT_GUIDE.md
```

### Step 2: 重要ファイルを順番に読む
```bash
# Phase 1: 全体像
cat README.md
cat V4_COMPLETION_SUMMARY.md

# Phase 2: アーキテクチャ
cat src/types/index.ts
cat scripts/database/schema/supabase-schema.sql

# Phase 3: API設計
ls src/app/api/
cat src/app/api/sessions/route.ts
cat src/app/api/interactions/route.ts

# Phase 4: コンポーネント
cat src/components/SeatMap.tsx
cat src/components/TopicCard.tsx
```

### Step 3: v5新機能の設計
```bash
# アーカイブされたv5計画書を参照
cat _archive/v5-planning/V5_BACKLOG.md
cat _archive/v5-planning/V5_DEVELOPMENT_NOTES.md
```

### Step 4: プロトタイプの作成
```bash
# 新しいブランチを作成
git checkout -b feature/v5-discussion-platform

# データベーススキーマの更新
# scripts/database/schema/v5-discussion-schema.sql を作成

# API実装
# src/app/api/discussions/ を作成

# フロントエンド実装
# src/app/discussion/[threadId]/page.tsx を作成
```

---

## 📚 参考リソース

### v4の主要ドキュメント
- `README.md` - プロジェクト概要
- `V4_COMPLETION_SUMMARY.md` - 実装機能一覧
- `DEMO_AND_SETUP_GUIDE.md` - 使い方・セットアップ
- `STARTUP_PROMPT.md` - AI用起動プロンプト

### アーカイブ資料
- `_archive/v5-planning/V5_BACKLOG.md` - v5機能バックログ
- `_archive/v5-planning/V5_DEVELOPMENT_NOTES.md` - v5詳細計画
- `_archive/development-logs/` - v4開発の記録

### 技術ドキュメント
- `_docs/V4_DESIGN_DOCUMENT.md` - v4設計ドキュメント
- `_docs/V4_ADDITIONAL_FEATURES.md` - 追加機能の設計
- `_bulletin-board-project/` - 掲示板システムの設計

---

## 🎯 v5開発の成功基準

### 機能要件
- ✅ 議題別討論プラットフォームの実装
- ✅ Polis風の意見可視化
- ✅ コンセンサスの自動検出
- ✅ 提案・投票システム

### 非機能要件
- ✅ 認証システムの強化（Google OAuth）
- ✅ パフォーマンス最適化（1000人規模対応）
- ✅ テストカバレッジ 80%以上
- ✅ アクセシビリティ準拠（WCAG 2.1 AA）

### ユーザビリティ
- ✅ 直感的なUI/UX
- ✅ モバイル対応
- ✅ リアルタイム性の確保（1秒以内の更新）

---

## ✅ チェックリスト: v5開発前の確認事項

- [ ] v4の全ドキュメントを読んだ
- [ ] データベーススキーマを理解した
- [ ] API設計パターンを把握した
- [ ] 主要コンポーネントの責務を理解した
- [ ] v5新機能の要件を明確化した
- [ ] 技術スタックの選定（必要に応じて追加ライブラリ）
- [ ] 開発環境のセットアップ
- [ ] Supabaseプロジェクトの準備

---

**作成日**: 2025年10月23日
**作成者**: Claude Code
**バージョン**: 1.0

このガイドを使って、効率的にv4を理解し、v5の開発を開始してください。
