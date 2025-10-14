# コウキョウのキョウシツ v5 申し送り事項

このファイルは、v4では対応できない大規模な変更や、データベーススキーマの変更が必要な機能要求を記録します。

---

## 📋 v5で実装すべき機能・改善

### 1. 生徒データの編集・削除機能

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

---

**注意事項**:
- このファイルは v4 開発中に随時更新してください
- v5 開発開始時に、このファイルを基に実装計画を立ててください
- 実装が完了した項目は、完了日を記載して ~~取り消し線~~ で表示してください
