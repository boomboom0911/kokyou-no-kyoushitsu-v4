# コウキョウのキョウシツ v5 申し送り事項

このファイルは、v4では対応できない大規模な変更や、データベーススキーマの変更が必要な機能要求を記録します。

---

## 📋 v5で実装すべき機能・改善

### 1. トピックテーマ機能（可変）

**要求日**: 2025-10-15
**要求内容**: セッションごとにトピックテーマを設定し、生徒のトピック投稿画面に表示する機能

**必要な変更**:
- `lesson_sessions` テーブルに `topic_prompt` カラムを追加（TEXT型）
  ```sql
  ALTER TABLE lesson_sessions ADD COLUMN topic_prompt TEXT;
  ```

**データ構造**:
- `topic_title`: セッションのタイトル（授業名）
- `topic_content`: セッションの説明・記録（教員用メモ）
- `topic_prompt`: トピックテーマ（生徒への問いかけ）← **新規追加**

**表示場所**:
- 生徒のトピック投稿画面（「トピックを投稿」の下）
- セッション作成時に入力欄を追加

**v4での暫定対応**:
固定テキスト「民主主義に関わるトピックを提出してください...」を表示中（src/app/classroom/[sessionCode]/page.tsx:316-320）

**v5での実装**:
1. データベースにカラム追加
2. セッション作成画面に「トピックテーマ」入力欄を追加
3. 生徒画面で `session.topic_prompt` を動的に表示
4. 編集機能も対応（教員ダッシュボード・みんなの議論画面）

---

### 2. リアクションボタンに「異」（異なる意見）を追加

**要求日**: 2025-10-19
**要求内容**: 現在のリアクションボタン（驚・納・疑）に加えて、「異」（異なる意見）ボタンを追加する

**必要な変更**:
1. **データベース制約の変更**:
   ```sql
   -- reactionsテーブルのCHECK制約を変更
   ALTER TABLE reactions
     DROP CONSTRAINT IF EXISTS reactions_reaction_type_check;

   ALTER TABLE reactions
     ADD CONSTRAINT reactions_reaction_type_check
     CHECK (reaction_type IN ('surprise', 'understand', 'question', 'disagree'));
   ```

2. **TypeScript型定義の更新** (src/types/index.ts):
   ```typescript
   export type ReactionType = 'surprise' | 'understand' | 'question' | 'disagree';

   export const REACTIONS = {
     // ... 既存のリアクション ...
     disagree: {
       id: 'disagree' as const,
       kanji: '異',
       label: '異なる意見',
       tooltip: '異なる意見がある、別の視点を持っている',
       color: '#8B5CF6', // 紫色
       emoji: '🤔💭',
     },
   };
   ```

**実装の影響範囲**:
- `src/types/index.ts`: 型定義とREACTIONS定数
- `src/components/ReactionBar.tsx`: UI表示（自動的に対応）
- `src/app/api/reactions/route.ts`: バリデーション（自動的に対応）

**v4で見送った理由**:
- データベースのCHECK制約変更が必要
- 既存データに影響を与えるスキーマ変更
- 安定性を優先し、段階的な実装を選択

**v5での実装手順**:
1. Supabaseで上記SQLを実行
2. 型定義を更新
3. 動作確認（既存のリアクション機能は変更不要）

**将来の拡張案**:
- リアクション種別を管理画面から追加・編集できる機能
- セッションごとに使用するリアクション種別をカスタマイズ
- 色やアイコンをカスタマイズ可能に

---

### 3. 提出物セッション機能

**要求日**: 2025-10-15
**要求内容**: メインセッション中に提出物専用のサブセッション画面を作成し、生徒がリンクを提出できる機能

**機能概要**:
1. **サブセッション画面**
   - メインセッションに「📎 提出物」タブを追加
   - 座席マップのみ表示
   - 各座席に提出物リンク（Googleドキュメント等）を表示

2. **リンク提出機能**
   - 生徒がGoogleドキュメントなどのURLを提出
   - 座席をクリックでモーダル表示
   - リンクをクリックで新しいタブで開く

3. **コメント機能**
   - 既存の `interactions` テーブルを流用
   - 提出物に対してコメント可能

4. **遅延提出対応**
   - 提出期限を設定可能（オプション）
   - 座席選択は不要（メインセッションと同じ座席、または出席番号順）
   - 欠席判定は不要（提出物専用）

**必要なテーブル**:
```sql
-- 提出物セッション
CREATE TABLE submission_sessions (
  id SERIAL PRIMARY KEY,
  main_session_id INTEGER REFERENCES lesson_sessions(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,  -- 提出期限（NULL = 無期限）
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 提出物
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  submission_session_id INTEGER REFERENCES submission_sessions(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id),
  seat_number INTEGER NOT NULL,  -- メインセッションの座席番号または出席番号
  submission_url TEXT NOT NULL,
  submission_type VARCHAR(50),  -- 'google_docs', 'google_sheets', 'pdf', 'other'
  note TEXT,  -- 生徒からのメモ
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_session_id, student_id)
);

-- 提出物へのコメント（既存のinteractionsテーブルを拡張）
-- target_type = 'submission', target_id = submissions.id
```

**UI設計**:
1. **教員側**
   - セッション作成時に「提出物セッションを作成」オプション
   - タイトル・説明・期限を入力
   - ダッシュボードに「📎 提出物」タブを追加
   - 座席マップで提出状況を確認（提出済み: 緑、未提出: グレー）

2. **生徒側**
   - 座席画面に「📎 提出物」タブを追加
   - 座席マップと提出フォームを表示
   - URL入力 + オプションのメモ
   - 提出後も再編集可能（期限内）

**座席番号の扱い**:
- メインセッションで座席選択済みの場合: その座席番号を使用
- 座席未選択の場合: 出席番号（student_number）を使用

**期限管理**:
- 期限なし（NULL）: いつでも提出可能
- 期限あり: 期限後は提出不可（閲覧のみ）
- 期限表示: 「残り○時間」「期限切れ」などの表示

**v4で見送った理由**:
- 新しいテーブル（`submission_sessions`, `submissions`）の追加が必要
- メインセッションとの関係性が複雑（親子関係、期限管理など）
- 遅延提出・期限管理のロジックが複雑
- Google認証なしでもシンプルに使えるよう、URLのみでの実装

**v5での実装手順**:
1. データベーステーブルを作成
2. セッション作成画面に提出物セッション作成機能を追加
3. 教員ダッシュボードに「📎 提出物」タブを追加
4. 生徒画面に「📎 提出物」タブを追加
5. 提出・編集・削除機能を実装
6. コメント機能を統合
7. 期限管理・通知機能を実装

**将来の拡張案**:
- Google認証統合（Googleドキュメントの直接埋め込み）
- ファイルアップロード機能
- 自動採点・評価機能
- 提出状況の一括エクスポート（CSV）

---

### 4. チャットリプライ機能（スレッド表示）

**要求日**: 2025-10-15
**要求内容**: 匿名チャットで特定メッセージへのリプライを可能にし、LINEのようなスレッド表示を実現する

**機能概要**:
1. **リプライ機能**
   - 各チャットメッセージに「💬 返信」ボタンを追加
   - クリックで入力欄に返信先を表示
   - 返信元のメッセージを引用表示

2. **スレッド表示**
   - リプライされたメッセージは親メッセージの下にインデント表示
   - 視覚的に会話の流れが分かりやすい
   - 深いネストも対応（2-3階層まで）

3. **引用プレビュー**
   - 返信時に元メッセージの一部を表示
   - 長文の場合は省略（最初の50文字など）
   - クリックで元メッセージにスクロール（オプション）

**必要なテーブル変更**:
```sql
-- chat_messagesテーブルにカラム追加
ALTER TABLE chat_messages
  ADD COLUMN reply_to_message_id INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL;

-- インデックス追加（パフォーマンス向上）
CREATE INDEX idx_chat_reply ON chat_messages(reply_to_message_id);
```

**データ構造**:
```typescript
interface ChatMessage {
  id: number;
  session_id: number;
  student_id: number | null;
  message: string;
  reply_to_message_id: number | null;  // 新規追加
  created_at: string;

  // JOIN結果
  reply_to_message?: {
    id: number;
    message: string;
    student_id: number | null;
    created_at: string;
  };
}
```

**UI設計**:

1. **通常メッセージ**
   ```
   ┌─────────────────────────────────┐
   │ 🎭 ゲスト                   14:32│
   │ これはどう思いますか？          │
   │ [💬 返信]                      │
   └─────────────────────────────────┘
   ```

2. **リプライメッセージ**
   ```
   ┌─────────────────────────────────┐
   │ 🐶 生徒A                    14:35│
   │ ↩️ 返信先: これはどう思いますか？ │
   │ 私はこう考えます                │
   │ [💬 返信]                      │
   └─────────────────────────────────┘
   ```

3. **返信入力中**
   ```
   ┌─────────────────────────────────┐
   │ 返信先: これはどう思いますか？   │
   │ [✕ キャンセル]                 │
   ├─────────────────────────────────┤
   │ [入力欄]                        │
   │ [送信]                          │
   └─────────────────────────────────┘
   ```

**実装の工夫**:
- ネストの深さを制限（最大2-3階層）
- 深いネストは折りたたみ表示
- モバイル対応（インデント幅を調整）

**v4で見送った理由**:
- テーブル変更が必要（`reply_to_message_id` カラム追加）
- ChatPanelコンポーネントの大幅な改修が必要
- ネストされたメッセージの表示ロジックが複雑
- 既存のチャット履歴表示（all-classes画面）にも影響
- バグのリスクが高く、安定性を優先

**v5での実装手順**:
1. `chat_messages` テーブルに `reply_to_message_id` カラムを追加
2. API修正: チャットメッセージ取得時に親メッセージ情報もJOIN
3. ChatPanelコンポーネントに返信ボタンを追加
4. 返信先プレビューUIを実装
5. スレッド表示ロジックを実装（再帰的または階層的）
6. 既存のチャット履歴表示も対応

**将来の拡張案**:
- 特定のリプライへの通知機能
- スレッドの折りたたみ/展開
- スレッド全体を別画面で表示
- メンション機能（@生徒A など）
- リアクション機能（チャットメッセージにも驚・納・疑）

---

### 5. 生徒データの編集・削除機能

**要求日**: 2025-10-14
**要求内容**: 管理者が生徒データを編集・削除できる機能

**必要な変更**:
- 管理者権限システムの実装
- 削除時の依存データ処理（CASCADE設定の見直し）
- 外部キー制約の整理
- データ削除履歴の保存機能

**v4で見送った理由**:
データベースの整合性に大きな影響を与える可能性があり、以下のテーブルに連鎖的な影響がある：
- `seat_assignments` (student_id)
- `topic_posts` (student_id)
- `reactions` (student_id)
- `interactions` (student_id)
- `chat_messages` (student_id)
- `learning_memos` (student_id)

**実装時の検討事項**:
1. 削除方式の選択
   - 物理削除（データを完全に削除）
   - 論理削除（deleted_atフラグを追加）
2. 関連データの扱い
   - CASCADE DELETE（全て削除）
   - SET NULL（参照をnullに）
   - 削除を禁止（関連データがある場合）
3. 監査ログの実装
   - 誰が、いつ、何を削除したかの記録

---

## 🗄️ データベーススキーマ改善

### 1. student_id のnullable対応

**現状の問題**:
教員やゲストを表現するために固定ID（-999, -1）を使用している。
以下のテーブルで `student_id` を nullable に変更しようとしたが失敗：
- `reactions` テーブル
- `chat_messages` テーブル

**v5での改善案**:
```sql
-- reactionsテーブル
ALTER TABLE reactions
  ALTER COLUMN student_id DROP NOT NULL;

-- chat_messagesテーブル
ALTER TABLE chat_messages
  ALTER COLUMN student_id DROP NOT NULL;
```

**移行手順**:
1. 既存の -999, -1 データを一時的に退避
2. カラムを nullable に変更
3. -999 → null、-1 → null に更新
4. アプリケーションコードも null を前提に書き直し

**メリット**:
- より自然なデータモデル
- 固定IDの衝突リスクがなくなる
- 外部キー制約をより適切に設定可能

---

## 🔧 技術的負債

### 1. 認証システムの改善

**現状**:
- 教員判定が `studentId === 0` や `studentId === null` など統一されていない
- ゲスト判定も複数のパターンが混在

**改善案**:
```typescript
// 役割（Role）ベースの認証システム
enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  GUEST = 'guest',
  ADMIN = 'admin',
}

interface User {
  id: number | null;
  role: UserRole;
  displayName: string;
}
```

### 2. リアクション・コメント数のキャッシュ

**現状**:
座席マップ表示時に毎回リアクション・コメント数を集計している。

**改善案**:
- `topic_posts` テーブルに `reaction_count`, `comment_count` カラムを追加
- リアクション/コメント追加時にトリガーまたはアプリケーション側でカウントを更新
- パフォーマンスの大幅な向上が期待できる

### 3. チャットのリアルタイム更新

**現状**:
3秒ごとのポーリングでチャットメッセージを取得。

**改善案**:
- Supabase Realtime を使用したリアルタイム購読
- WebSocket接続によるプッシュ通知
- より自然なチャット体験の提供

---

## 🎨 UI/UX改善

### 1. レスポンシブデザインの強化

**現状**:
デスクトップ中心の設計で、スマートフォンでの表示が最適化されていない。

**改善案**:
- 座席マップのモバイル最適化
- タブレット端末での縦置き・横置き対応
- タッチ操作の改善

### 2. アクセシビリティの向上

**改善案**:
- キーボードナビゲーションの完全対応
- スクリーンリーダー対応
- カラーコントラスト比の改善
- ARIA属性の適切な設定

---

## 📊 新機能アイデア

### 1. 投票機能

**概要**:
教員が複数の選択肢を提示し、生徒が投票できる機能。

**必要なテーブル**:
```sql
CREATE TABLE polls (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES lesson_sessions(id),
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- ['選択肢1', '選択肢2', ...]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE poll_votes (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id),
  student_id INTEGER REFERENCES students(id),
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(poll_id, student_id)
);
```

### 2. グループディスカッション機能

**概要**:
座席を複数のグループに分け、グループ内でのディスカッションを促進。

**必要なテーブル**:
```sql
CREATE TABLE discussion_groups (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES lesson_sessions(id),
  group_name TEXT NOT NULL,
  seat_numbers INTEGER[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE group_posts (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES discussion_groups(id),
  student_id INTEGER REFERENCES students(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. 学習分析ダッシュボード

**概要**:
生徒の参加度、投稿頻度、リアクション傾向などを可視化。

**機能**:
- セッションごとの参加統計
- 生徒ごとの活動履歴
- トピックの人気度ランキング
- 時系列での活動推移グラフ

---

## 🚀 パフォーマンス最適化

### 1. データベースインデックスの追加

**推奨インデックス**:
```sql
-- reactions テーブル
CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX idx_reactions_student ON reactions(student_id);

-- interactions テーブル
CREATE INDEX idx_interactions_target ON interactions(target_type, target_id);
CREATE INDEX idx_interactions_student ON interactions(student_id);

-- chat_messages テーブル
CREATE INDEX idx_chat_session ON chat_messages(session_id, created_at);
```

### 2. API レスポンスの最適化

**改善案**:
- 不要なデータの取得を削減
- ページネーションの実装
- GraphQL への移行検討（大量のデータ取得が必要な場合）

---

## 📝 ドキュメント整備

### 1. API仕様書の作成

**必要なドキュメント**:
- エンドポイント一覧
- リクエスト/レスポンス形式
- エラーコード一覧
- 認証方式の説明

### 2. 開発者ガイドの充実

**内容**:
- ローカル開発環境のセットアップ手順
- テスト実行方法
- デプロイ手順
- トラブルシューティング

---

## 🔒 セキュリティ強化

### 1. Row Level Security (RLS) の見直し

**現状確認が必要な項目**:
- 生徒が他の生徒のデータを閲覧/編集できないか
- 教員の権限が適切に設定されているか
- ゲストユーザーのアクセス制限

### 2. 入力バリデーションの強化

**改善項目**:
- XSS対策の徹底
- SQLインジェクション対策（Supabaseクライアント使用で基本的に保護済み）
- CSRF対策の実装

---

## 更新履歴

| 日付 | 追加者 | 追加内容 |
|------|--------|---------|
| 2025-10-14 | Claude Code | 初版作成。生徒データ編集・削除機能、データベーススキーマ改善、技術的負債を記録 |
| 2025-10-15 | Claude Code | トピックテーマ機能（可変）を追加。v4では固定テキストで暫定対応 |
| 2025-10-15 | Claude Code | 提出物セッション機能を追加。リンク提出・期限管理・遅延提出対応 |
| 2025-10-15 | Claude Code | チャットリプライ機能を追加。LINEのようなスレッド表示 |

---

**注意事項**:
- このファイルは v4 開発中に随時更新してください
- v5 開発開始時に、このファイルを基に実装計画を立ててください
- 実装が完了した項目は、完了日を記載して ~~取り消し線~~ で表示してください
