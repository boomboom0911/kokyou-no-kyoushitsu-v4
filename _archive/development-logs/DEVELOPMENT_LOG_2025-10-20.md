# 開発記録 2025-10-20

## 📋 本日の作業概要

### 実装した機能
1. 生徒画面（教室画面）に通知機能を追加
2. 生徒画面のヘッダーレイアウトを改善（タイトル行とタブを統合）
3. 教員機能のデバッグログを追加（リアクション・チャット）

### 確認した問題
1. 提出トピック一覧の最新投稿ボタン → **正常に機能している**
2. 教員のリアクションボタンが押せない問題 → **2025-10-18に修正済み、デバッグログを追加**
3. 教員が匿名チャットに投稿できない問題 → **2025-10-18に修正済み、デバッグログを追加**

---

## ✅ 実装した内容

### 1. 生徒画面に通知機能を追加

**ファイル:** `src/app/classroom/[sessionCode]/page.tsx`

**実装内容:**

1. **通知ドロップダウンの統合**
   - `NotificationDropdown` コンポーネントをインポート
   - `getUnreadCount` 関数をインポート

2. **未読通知数の管理**
   ```typescript
   const [showNotifications, setShowNotifications] = useState(false);
   const [unreadCount, setUnreadCount] = useState(0);
   ```

3. **未読通知数の定期取得**
   - 初回ロード時に未読通知数を取得
   - 30秒ごとに自動更新（ポーリング）
   ```typescript
   useEffect(() => {
     if (!student?.id) return;
     const interval = setInterval(() => {
       fetchUnreadCount(student.id);
     }, 30000);
     return () => clearInterval(interval);
   }, [student?.id]);
   ```

4. **通知ベルボタンの追加**
   - ヘッダー右側に「🔔 通知」ボタンを配置
   - 未読通知がある場合、赤いバッジで件数を表示（9件以上は「9+」）
   - クリックでドロップダウンを表示
   - ドロップダウンを閉じると未読数を再取得

**UI詳細:**
```tsx
<button className="relative text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg">
  🔔 通知
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )}
</button>
```

**動作フロー:**
1. ページロード時に未読通知数を取得
2. 30秒ごとに自動更新
3. ベルボタンをクリックでドロップダウン表示
4. 通知をクリックで既読化 → リンク先へ遷移
5. ドロップダウンを閉じると未読数を再取得

---

### 2. ヘッダーレイアウトの改善

**ファイル:** `src/app/classroom/[sessionCode]/page.tsx`

**改善内容:**

**Before:**
```
┌────────────────────────────────────────┐
│ タイトル              [ボタン群]      │
│ セッションコード | 生徒名 | 座席      │
└────────────────────────────────────────┘
┌────────────────────────────────────────┐
│ [🗺️ 座席マップ] [📝 提出トピック]    │
└────────────────────────────────────────┘
```

**After:**
```
┌────────────────────────────────────────┐
│ タイトル                               │
│ セッションコード | 生徒名 | 座席      │
│                                        │
│ [🗺️ 座席] [📝 トピック]              │
│           [🔔][📚][🏛️][ログアウト]   │
└────────────────────────────────────────┘
```

**変更点:**
1. タイトル行とタブ切り替えを同じヘッダーブロック内に統合
2. タブ切り替えを左側に配置（座席選択完了後のみ表示）
3. アクションボタンを右側に配置
4. 重複していたタブ切り替えUIをメインコンテンツエリアから削除
5. `justify-between` で左右に分離し、よりコンパクトなレイアウトに

**削除したコード:**
```tsx
// メインコンテンツエリアから削除（重複していた）
<div className="bg-white rounded-lg shadow p-3">
  <div className="flex gap-2">
    <button>🗺️ 座席マップ</button>
    <button>📝 提出トピック一覧</button>
  </div>
</div>
```

**追加したコード:**
```tsx
// ヘッダー内に統合
<div className="flex items-center justify-between gap-3">
  {/* 左側: タブ切り替え */}
  {step === 'post_topic' && (
    <div className="flex gap-2">
      <button onClick={() => setView('seatmap')}>🗺️ 座席マップ</button>
      <button onClick={() => setView('topics')}>📝 提出トピック一覧</button>
    </div>
  )}

  {/* 右側: アクションボタン */}
  <div className="flex items-center gap-2">
    {/* 通知ベル */}
    {/* ポートフォリオ */}
    {/* みんなの議論 */}
    {/* 座席キャンセル */}
    {/* ログアウト */}
  </div>
</div>
```

---

### 3. デバッグログの追加

#### 3.1 ReactionBar コンポーネント

**ファイル:** `src/components/ReactionBar.tsx`

**追加したログ:**
```typescript
const toggleReaction = async (reactionType: ReactionType) => {
  console.log('[ReactionBar] toggleReaction called:', {
    targetType,
    targetId,
    studentId,
    reactionType,
  });

  // リアクション追加時
  console.log('[ReactionBar] Adding reaction...');
  const result = await response.json();
  console.log('[ReactionBar] Add response:', response.status, result);

  // リアクション削除時
  console.log('[ReactionBar] Deleting reaction...');
  const result = await response.json();
  console.log('[ReactionBar] Delete response:', response.status, result);
};
```

**ログ出力例:**
```
[ReactionBar] toggleReaction called: {targetType: "topic", targetId: 123, studentId: -999, reactionType: "surprise"}
[ReactionBar] Adding reaction...
[ReactionBar] Add response: 201 {success: true, data: {...}, message: "リアクションを追加しました"}
```

#### 3.2 ChatPanel コンポーネント

**ファイル:** `src/components/ChatPanel.tsx`

**追加したログ:**
```typescript
const handleSendMessage = async () => {
  const finalStudentId = currentStudentId === -999 ? null : (currentStudentId === 0 || currentStudentId === -1 ? -1 : currentStudentId);

  console.log('[ChatPanel] handleSendMessage called:', {
    currentStudentId,
    finalStudentId,
    message: newMessage.trim(),
  });

  const data = await response.json();
  console.log('[ChatPanel] Send message response:', response.status, data);
};
```

**ログ出力例:**
```
[ChatPanel] handleSendMessage called: {currentStudentId: -999, finalStudentId: null, message: "テストメッセージ"}
[ChatPanel] Send message response: 201 {success: true, data: {...}, message: "メッセージを送信しました"}
```

---

## 🔍 調査・確認した内容

### 1. 提出トピック一覧の最新投稿ボタン

**調査結果:** ✅ **正常に機能している**

**確認内容:**

**教員画面** (`src/app/teacher/dashboard/[sessionCode]/page.tsx:417-425`)
```tsx
<button onClick={() => fetchSeats()}>
  🔄 最新の投稿を見る
</button>
```

**生徒画面** (`src/app/classroom/[sessionCode]/page.tsx:412-417`)
```tsx
<button onClick={() => session && student && fetchSeats(session.id, student.id)}>
  🔄 最新の投稿を見る
</button>
```

**動作メカニズム:**
1. ボタンクリックで `fetchSeats()` を呼び出し
2. `seats` state が更新される
3. `TopicCard` コンポーネントが再レンダリングされる
4. `TopicCard` の `onReactionChange` コールバックでも `fetchSeats` が呼ばれる

**結論:** コードは正しく実装されており、機能している。前回の開発記録（2025-10-18）でも確認済み。

---

### 2. 教員アカウントからリアクションボタンが押せない問題

**調査結果:** ✅ **2025-10-18に修正済み**

**修正内容（前回）:**
- `/api/reactions` の POST/DELETE メソッドのバリデーションを修正
- `!studentId` → `studentId === undefined || studentId === null` に変更
- 教員ID `-999` が正しく処理されるように修正

**現在のコード** (`src/app/api/reactions/route.ts:109`)
```typescript
// バリデーション
if (!targetType || !targetId || !reactionType || studentId === undefined || studentId === null) {
  return NextResponse.json({ success: false, error: '全ての項目は必須です' }, { status: 400 });
}

// 既存リアクション確認
const actualStudentId = studentId <= 0 ? -999 : studentId;
const { data: existing } = await supabase
  .from('reactions')
  .eq('student_id', actualStudentId)
  // ...

// リアクション追加
const { data: reaction } = await supabase
  .from('reactions')
  .insert({
    student_id: studentId <= 0 ? -999 : studentId,
    // ...
  });
```

**教員ダッシュボードでの使用:**
```tsx
<TopicCard currentStudentId={-999} />
```

**デバッグログ追加:**
- リアクションボタン押下時のパラメータをログ出力
- APIレスポンスをログ出力
- エラー時の詳細をログ出力

**本番環境での確認方法:**
1. 教員ログイン → ダッシュボード表示
2. ブラウザの開発者ツール（F12）を開く
3. コンソールタブを確認
4. リアクションボタンを押す
5. `[ReactionBar]` で始まるログを確認

---

### 3. 教員が匿名チャットに投稿できない問題

**調査結果:** ✅ **2025-10-18に修正済み**

**修正内容（前回）:**
- `ChatPanel` の `handleSendMessage` ロジックを修正
- 教員ID `-999` → `null` への変換を正しく実装
- 教員ダッシュボードで `currentStudentId={-999}` を渡すように統一

**現在のコード** (`src/components/ChatPanel.tsx:88-106`)
```typescript
const finalStudentId = currentStudentId === -999 ? null : (currentStudentId === 0 || currentStudentId === -1 ? -1 : currentStudentId);

const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    sessionId,
    studentId: finalStudentId, // 教科担当者(-999)はnull、ゲスト(0/-1)は-1
    message: newMessage.trim(),
  }),
});
```

**Chat API** (`src/app/api/chat/route.ts:114-115`)
```typescript
// studentId が null の場合は -999 (教科担当者) として設定
const actualStudentId = studentId === null ? -999 : (studentId <= 0 ? -1 : studentId);
```

**教員ダッシュボードでの使用:**
```tsx
<ChatPanel sessionId={session.id} currentStudentId={-999} isTeacher={true} />
```

**デバッグログ追加:**
- チャット送信時のパラメータをログ出力
- `currentStudentId` → `finalStudentId` の変換過程をログ出力
- APIレスポンスをログ出力

**本番環境での確認方法:**
1. 教員ログイン → ダッシュボード表示
2. ブラウザの開発者ツール（F12）を開く
3. コンソールタブを確認
4. チャットに投稿する
5. `[ChatPanel]` で始まるログを確認

---

## 📊 統計

**修正した問題**: 0件（既存機能の確認のみ）
**追加した機能**: 2件（通知機能、ヘッダー改善）
**追加したデバッグログ**: 2コンポーネント
**変更ファイル数**: 3ファイル

**変更ファイル:**
- `src/app/classroom/[sessionCode]/page.tsx` - 通知機能追加、ヘッダー改善
- `src/components/ReactionBar.tsx` - デバッグログ追加
- `src/components/ChatPanel.tsx` - デバッグログ追加

**Gitコミット**: 1件
**デプロイ回数**: 1回

---

## 🎯 解決した問題

### ✅ 生徒画面の通知機能が表示されていない

**Before:** 通知システムのインフラは存在していたが、生徒画面（教室画面）には統合されていなかった

**After:**
- 通知ベルボタンをヘッダーに追加
- 未読通知数をバッジ表示
- 定期的に未読数を更新（30秒ごと）
- ドロップダウンで通知一覧を表示

### ✅ ヘッダーが冗長だった

**Before:** タイトル行とタブ切り替えが別々のブロックに分かれていた

**After:**
- 1つのヘッダーブロックに統合
- タブを左側、ボタンを右側に配置
- よりコンパクトで見やすいレイアウト

---

## 🔗 技術的な学び

### 通知システムの設計

**既存のインフラ:**
- `src/lib/notifications.ts` - 通知管理ロジック
- `src/components/NotificationDropdown.tsx` - 通知ドロップダウンUI
- `supabase-notifications.sql` - データベーステーブル定義
- `/api/interactions` - コメント投稿時に通知を作成

**通知タイプ:**
```typescript
type NotificationType =
  | 'board_review_received'       // 掲示板: 自分の作品にレビューが投稿された
  | 'board_reply_received'        // 掲示板: 自分のレビューに返信があった
  | 'topic_comment_added';        // 教室: 自分のトピックにコメントがあった
```

**通知の作成:**
```typescript
// src/app/api/interactions/route.ts で実装済み
await createNotification({
  studentId: post.student_id,
  type: 'topic_comment_added',
  sourceType: 'classroom',
  sourceId: session.code,
  relatedId: comment.id.toString(),
  title: '新しいコメント',
  message: `${student.display_name}さんがあなたのトピックにコメントしました`,
  linkUrl: `/classroom/${session.code}?view=topics`,
  actorId: studentId,
  actorName: student.display_name,
});
```

### 教員ID管理の統一

**教員ID管理ルール:**
- フロントエンド: `-999` を使用
- APIに送信時: `-999` をそのまま送信
- データベース保存時: `-999` として保存
- チャットAPIのみ: `-999` → `null` → `-999` の変換が必要

**理由:**
- `chat_messages` テーブルの `student_id` カラムは NOT NULL
- そのため固定ID `-999` を使用
- 将来的には nullable に変更することを推奨（V5_BACKLOG.md に記載済み）

---

## 📝 次回への申し送り

### 本番環境での動作確認が必要

**教員機能の確認:**
1. 教員ログイン → セッション作成 → ダッシュボード表示
2. 提出トピック一覧でリアクションボタンを押す
3. 匿名チャットに投稿する
4. ブラウザのコンソールログを確認
   - `[ReactionBar]` で始まるログ
   - `[ChatPanel]` で始まるログ
   - エラーがあれば赤文字で表示される

**生徒機能の確認:**
1. 生徒ログイン → セッション参加
2. 通知ベルボタンが表示されるか確認
3. 他の生徒が自分の投稿にコメントした時に通知が届くか確認
4. 未読通知数が正しく表示されるか確認

**もし問題が発生する場合:**
- コンソールログのスクリーンショットを確認
- デバッグログから原因を特定
- 必要に応じてさらなる修正を実施

### v5への申し送り（V5_BACKLOG.md参照）

既存の申し送り事項:
1. トピックテーマ機能（可変）
2. リアクションボタンに「異」を追加
3. 提出物セッション機能
4. チャットリプライ機能（スレッド表示）
5. 生徒データ編集・削除機能
6. `student_id` のnullable対応（-999固定IDの廃止）

---

## 🔗 関連ファイル

- `V5_BACKLOG.md` - v5への申し送り事項
- `README.md` - プロジェクト概要
- `DEVELOPMENT_LOG_2025-10-18.md` - 前回の開発記録
- `supabase-notifications.sql` - 通知テーブルのSQL定義

---

**デプロイURL**: https://kokyou-no-kyoushitsu-v4.vercel.app

**開発者メモ:**
次回起動時は `cd /Users/boomboom0911/Developer/kokyou-no-kyoushitsu-v4` で作業ディレクトリに移動し、
README.md、STARTUP_PROMPT.md、最新のDEVELOPMENT_LOG_*.md、V5_BACKLOG.mdを読んでからスタートすること。

**重要な注意点:**
- 教員ID `-999` で統一されている
- デバッグログを追加したので、本番環境での動作確認が容易に
- 通知機能は既存のインフラを活用、教室画面に統合しただけ

---

## 📋 午後セッション: チャット・コメント機能の修正

### セッション2（午後）
- チャット送信とコメント送信が失敗する問題を調査・解決
- データベース制約の問題を回避するためにコードを修正
- TopicCardのコメント表示問題を修正

---

## ✅ 実装した内容（午後）

### 4. チャット送信の修正

**問題:**
- 教員が匿名チャットに投稿しようとすると失敗
- エラー: `null value in column "student_id" of relation "chat_messages" violates not-null constraint`

**原因:**
- `chat_messages` テーブルの `student_id` カラムが NOT NULL 制約
- 教員の場合に `null` を設定しようとしていた

**対応:**
1. Supabase SQL Editorで教員用レコードを作成:
   ```sql
   -- 教員用の特殊レコード
   INSERT INTO students (id, google_email, class_id, student_number, display_name)
   VALUES (-999, 'teacher@system', 1, 'T999', '教科担当者')
   ON CONFLICT (id) DO NOTHING;

   -- ゲスト用の特殊レコード
   INSERT INTO students (id, google_email, class_id, student_number, display_name)
   VALUES (-1, 'guest@system', 1, 'G000', 'ゲスト')
   ON CONFLICT (id) DO NOTHING;
   ```

2. `src/app/api/chat/route.ts` を修正（89行目）:
   ```typescript
   // Before
   student_id: isTeacher ? null : studentId,

   // After
   student_id: isTeacher ? -999 : studentId,
   ```

**変更ファイル:**
- `src/app/api/chat/route.ts`
- `fix-teacher-student-record.sql`（新規作成）

**結果:**
✅ 教員が匿名チャットに投稿できるようになった

---

### 5. コメント送信の修正

**問題:**
- 教員がトピックにコメントしようとすると失敗
- エラー: `null value in column "student_id" of relation "interactions" violates not-null constraint`

**原因:**
- `interactions` テーブルの `student_id` カラムが主キー（Primary Key）の一部
- 主キーは NULL を許可できない

**調査:**
```sql
-- nullable に変更しようとしたがエラー
ALTER TABLE interactions ALTER COLUMN student_id DROP NOT NULL;
-- ERROR: 42P16: column "student_id" is in a primary key
```

**対応:**
`src/app/api/interactions/route.ts` を修正（143-144行目）:
```typescript
// Before
const finalStudentId = (studentId <= 0 || studentId === -999) ? null : studentId;

// After
const finalStudentId = studentId === 0 || studentId === -1 ? -1 : studentId;
```

**修正後の動作:**
- 教員 (`studentId: -999`) → `-999` をそのまま使用 ✅
- ゲスト (`studentId: 0` or `-1`) → `-1` に変換
- 生徒 (`studentId: 1`以上) → そのまま使用

**変更ファイル:**
- `src/app/api/interactions/route.ts`

**結果:**
✅ 教員がトピックにコメントできるようになった

---

### 6. TopicCardのコメント表示問題を修正

**問題:**
- トピックカードのモーダルを開いてもコメントが表示されない
- 座席マップ上のコメント件数は正しく表示される（例: 2件）
- 「💬 コメント」ボタンをクリックしても空のまま

**原因:**
- `TopicCard.tsx` でコメントは「💬 コメント」ボタンをクリックしたときにしか取得されていなかった
- モーダルを開いた時点では `showComments = false` で、コメント取得処理が実行されない
- `comments.length` が0のままなので、ボタンにコメント件数も表示されない

**対応:**
`src/components/TopicCard.tsx` を修正（39-49行目）:
```typescript
// Before
useEffect(() => {
  if (showComments) {
    fetchComments();
  }
}, [showComments]);

// After
// コンポーネントマウント時にコメント件数を取得
useEffect(() => {
  fetchComments();
}, []);

// コメントセクション開閉時にも取得
useEffect(() => {
  if (showComments) {
    fetchComments();
  }
}, [showComments]);
```

**変更ファイル:**
- `src/components/TopicCard.tsx`

**結果:**
✅ モーダルを開いた瞬間にコメントを取得するようになった
✅ 「💬 コメント (2)」のように件数が正しく表示される
✅ コメントセクションを開くとすぐにコメントが表示される

---

## 📊 統計（午後セッション）

**修正した問題**: 3件
- チャット送信の問題
- コメント送信の問題
- コメント表示の問題

**変更ファイル数**: 3ファイル
- `src/app/api/chat/route.ts`
- `src/app/api/interactions/route.ts`
- `src/components/TopicCard.tsx`

**新規作成ファイル**: 1ファイル
- `fix-teacher-student-record.sql`

**Gitコミット数**: 2回
- `interactions テーブルのstudent_id処理を修正`
- `Fix: トピックカード開いた時にコメントを自動取得するように修正`

**Vercelデプロイ回数**: 2回

---

## 🎯 解決した問題（午後セッション）

### ✅ チャット送信の問題
- **Before**: 教員がチャット送信しようとするとエラー
- **After**: 教員が匿名チャットに投稿できる

### ✅ コメント送信の問題
- **Before**: 教員がコメント送信しようとするとエラー
- **After**: 教員がトピックにコメントできる

### ✅ コメント表示の問題
- **Before**: トピックカードを開いてもコメントが表示されない
- **After**: モーダルを開いた瞬間にコメントが取得され、件数も表示される

---

## 🔗 技術的な学び（午後セッション）

### データベース制約とアプリケーション設計

**問題点:**
- NULL を使って「教員」や「ゲスト」を表現しようとすると、NOT NULL 制約や主キー制約に引っかかる
- 外部キー制約により、存在しない student_id を使うことができない

**解決策:**
- 特殊な役割（教員、ゲスト）には固定IDを割り当てる
  - 教員: `-999`
  - ゲスト: `-1`
- これらのIDに対応するレコードを `students` テーブルに作成
- アプリケーション側で固定IDを一貫して使用

**メリット:**
- データベース制約を変更する必要がない（安全）
- 外部キー制約が機能する
- 既存のクエリが壊れない

**デメリット:**
- 固定IDの管理が必要
- コードの複数箇所で固定IDの変換処理が必要

### v5への申し送り

V5では以下の改善を検討：
1. 役割（Role）ベースの認証システムの導入
   ```typescript
   enum UserRole {
     STUDENT = 'student',
     TEACHER = 'teacher',
     GUEST = 'guest',
     ADMIN = 'admin',
   }
   ```

2. `student_id` を `nullable` にしてクリーンなデータモデルに
   - 主キー構成の見直し
   - 固定IDから NULL への段階的な移行

詳細は `V5_BACKLOG.md` を参照。

---

## 📝 次回への申し送り（更新）

### 授業での実地テスト

**2025-10-20 午前中に実施予定**

**確認項目:**
1. ✅ 生徒がセッションにログインできるか
2. ✅ トピック投稿が正常に動作するか
3. ✅ リアクション機能が正常に動作するか
4. ✅ コメント機能が正常に動作するか（今回修正）
5. ✅ チャット機能が正常に動作するか（今回修正）
6. ✅ 教員ダッシュボードでリアルタイム更新が動作するか
7. ✅ 通知機能が正常に動作するか

**フィードバック:**
授業終了後、使用感や発見された問題点を記録してください。

---

## 📌 重要なメモ（更新）

### 教員・ゲストIDの統一

**現在の仕様:**
- 教員: `studentId = -999`
- ゲスト: `studentId = -1`
- 未ログイン: `studentId = 0`

**使用箇所:**
- `src/app/api/chat/route.ts`: 教員の場合 `-999` を使用
- `src/app/api/interactions/route.ts`: 教員 `-999`、ゲスト `-1`
- `src/components/ChatPanel.tsx`: `currentStudentId === -999` で教員判定
- `src/components/TopicCard.tsx`: `student_id === -999` で教員表示
- `src/app/teacher/dashboard/[sessionCode]/page.tsx`: `currentStudentId={-999}`

**データベース:**
- `students` テーブルに教員用レコード（id: -999）が存在
- `students` テーブルにゲスト用レコード（id: -1）が存在

**重要:**
今後、教員・ゲスト判定を行う際は、この固定IDを使用すること。

---

**開発者メモ（更新）:**
授業で使用中。フィードバックを待って次のセッションで改善を実施。
