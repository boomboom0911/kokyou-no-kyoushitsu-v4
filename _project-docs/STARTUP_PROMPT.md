# コウキョウのキョウシツ v4 開発セッション起動プロンプト

このファイルは、Claude Codeで新しい開発セッションを開始する際に使用します。

## 起動時にコピー&ペーストするプロンプト

```
cd /Users/boomboom0911/Developer/kokyou-no-kyoushitsu-v4

コウキョウのキョウシツ v4 の不具合修正を行います。

以下のファイルを読んで、プロジェクトの現状を把握してください：
1. README.md（プロジェクト概要）
2. 最新のDEVELOPMENT_LOG_*.md（前回の開発記録）
3. V5_BACKLOG.md（バージョン5への申し送り事項）

読み終わったら、不具合修正の準備ができたことを報告してください。
```

## 開発終了時の手順

開発セッションを終了する際は、以下の作業を必ず実行してください：

### 1. 開発記録の作成
```bash
# ファイル名: DEVELOPMENT_LOG_YYYY-MM-DD.md
# 記載内容:
# - 修正した不具合一覧
# - 変更したファイルと変更内容
# - デプロイ状況
# - テスト項目
# - 次回への申し送り事項
```

### 2. バージョン5申し送り事項の更新
大きなテーブル変更が必要な機能要求は、V5_BACKLOG.md に記録してください。

### 3. Git コミット＆プッシュ
```bash
git add .
git commit -m "適切なコミットメッセージ"
git push origin main
```

### 4. Vercelデプロイ確認
以下のURLでデプロイ状況を確認：
- kokyou-no-kyoushitsu-v4.vercel.app
- myclassroom2025.vercel.app

## 開発ガイドライン

### ✅ 小さな修正（即座に対応可能）
- UIの表示不具合
- 既存機能のバグ修正
- パフォーマンス改善
- 既存APIの軽微な変更
- コンポーネントの改善

### ⚠️ 大きな変更（v5へ申し送り）
- データベーススキーマの変更
- 新しいテーブルの追加
- 外部キー制約の変更
- 既存データの大規模な移行が必要な変更
- アーキテクチャの大幅な変更

**判断基準**:
既存のデータやテーブル構造に影響を与え、データベースマイグレーションが必要な変更は v5 へ申し送り。

## プロジェクト構造（参考）

```
kokyou-no-kyoushitsu-v4/
├── src/
│   ├── app/
│   │   ├── api/              # APIルート
│   │   │   ├── chat/
│   │   │   ├── interactions/
│   │   │   ├── reactions/
│   │   │   └── seats/
│   │   └── classroom/        # 授業画面
│   ├── components/           # Reactコンポーネント
│   │   ├── ChatPanel.tsx
│   │   ├── SeatMap.tsx
│   │   └── TopicCard.tsx
│   ├── lib/                  # ユーティリティ
│   │   └── supabase.ts
│   └── types/                # 型定義
│       └── index.ts
├── DEVELOPMENT_LOG_*.md      # 開発記録
├── V5_BACKLOG.md            # v5申し送り事項
├── STARTUP_PROMPT.md        # このファイル
└── README.md                # プロジェクト概要
```

## 重要な技術情報

### 教員・ゲストID管理
- 教員: `studentId = null` → DB保存時 `-999`
- ゲスト: `studentId = 0 または -1` → DB保存時 `-1`
- 生徒: `studentId = 1〜` → そのまま保存

### データベース（Supabase）
- テーブル: students, lesson_sessions, seat_assignments, topic_posts, reactions, interactions, chat_messages, learning_memos
- RLS (Row Level Security) 有効
- student_id フィールドは基本的に NOT NULL（例外: interactions テーブル）

### 既知の制約
- `reactions` テーブルと `chat_messages` テーブルの `student_id` を nullable に変更できなかったため、固定ID（-999/-1）を使用

## よくある作業パターン

### 1. 新しい不具合修正を依頼された場合
1. 不具合の内容を確認
2. 影響範囲を特定（UI/API/DB）
3. データベース変更が必要か判断
   - YES → v5申し送り
   - NO → 修正実施
4. 修正後、開発記録を更新
5. Git コミット＆プッシュ

### 2. 機能追加を依頼された場合
1. 機能の詳細を確認
2. 必要なテーブル変更を洗い出し
3. テーブル変更が必要なら v5申し送り
4. それ以外は実装可能か検討
5. 実装 → テスト → 記録 → デプロイ

### 3. デプロイエラーが発生した場合
1. Vercelのログを確認
2. ビルドエラー/ランタイムエラーを特定
3. 修正 → 再プッシュ
4. デプロイ成功を確認

---

**次回開発セッション開始時**: このファイルの「起動時にコピー&ペーストするプロンプト」をClaude Codeに送信してください。
