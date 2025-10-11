# 🏛️ コウキョウのキョウシツ v4

教室での議論を可視化・活性化するWebアプリケーション

## 🌐 デモURL
**https://kokyou-no-kyoushitsu-v4.vercel.app**

すぐに試せます！教科担当者パスワード: `teacher2025`

## 📚 ドキュメント

- 📖 [開発記録](./DEVELOPMENT_FINAL_REPORT.md) - プロジェクトの完成報告書
- 🎬 [デモガイド](./DEMO_GUIDE.md) - すぐに試せるデモの方法
- 🏫 [学校導入ガイド](./SCHOOL_DEPLOYMENT_GUIDE.md) - 自分の学校で使う方法

---

## 📝 概要

生徒が座席上に意見を投稿し、クラス全体で議論を深めるための教育支援アプリケーションです。

### v4の主な特徴

- ✅ **座席管理の簡素化**: 座席番号（1〜42）で統一
- ✅ **統合レイアウト**: 座席マップ + チャットパネル + 投稿機能を1画面に集約
- ✅ **座席モーダル**: 座席をクリックして投稿内容を即座に閲覧
- ✅ **漢字リアクション**: 理性的な反応を促す（驚・納・疑）
- ✅ **コメント機能**: 投稿に対する議論を深化
- ✅ **匿名チャット**: セッション全体での自由な議論
- ✅ **学習記録の強化**: ポートフォリオ機能
- ✅ **データエクスポート**: CSV形式での学習記録保存
- ✅ **教科担当者ダッシュボード**: リアルタイム統計とモニタリング

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **UI**: TailwindCSS
- **データベース**: Supabase (PostgreSQL)
- **開発サーバー**: Turbopack

## 📦 セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下を設定：

```bash
# Teacher password for authentication
NEXT_PUBLIC_TEACHER_PASSWORD=your_password_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# App
NODE_ENV=development
```

### 3. データベースのセットアップ

`_docs/V4_DESIGN_DOCUMENT.md` の「データベース設計」セクションを参照し、Supabaseでテーブルを作成してください。

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## 📁 ディレクトリ構造

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/             # 認証API
│   │   ├── sessions/         # セッション管理API
│   │   ├── seats/            # 座席選択API
│   │   └── topics/           # トピック投稿API
│   ├── student/              # 生徒用ログイン画面
│   └── classroom/            # 教室画面
│       └── [sessionCode]/    # 座席選択・投稿画面
├── components/               # 再利用可能コンポーネント
│   ├── SeatMap.tsx           # 座席表コンポーネント
│   ├── ChatPanel.tsx         # チャットパネル
│   ├── TopicCard.tsx         # トピック投稿カード
│   ├── ReactionBar.tsx       # リアクションバー
│   └── QuickMemo.tsx         # 学習メモ浮遊ボタン
├── lib/                      # ユーティリティ
│   ├── supabase.ts           # Supabaseクライアント
│   ├── database.types.ts     # DB型定義
│   ├── storage.ts            # LocalStorage管理
│   └── seat-utils.ts         # 座席番号ユーティリティ
└── types/                    # 型定義
    └── index.ts              # アプリケーション型定義
```

## 🚀 実装フェーズ

### ✅ Phase 1: プロジェクトセットアップ（完了）
- [x] Next.js 15プロジェクト作成
- [x] Supabase接続設定
- [x] TailwindCSS設定
- [x] 型定義ファイル作成

### ✅ Phase 2: コア機能（完了）
- [x] 認証API実装
- [x] セッション管理API実装
- [x] 座席選択機能実装
- [x] トピック投稿API実装
- [x] 生徒用ログイン画面
- [x] 教室画面（座席選択まで）

### ✅ Phase 3: 拡張機能（完了）
- [x] 漢字リアクション機能実装（驚・納・疑）
- [x] コメント機能実装
- [x] チャット機能実装
- [x] 学習メモ機能実装
- [x] ReactionBarコンポーネント
- [x] ディスカッション画面

### ✅ Phase 4: ポートフォリオ（完了）
- [x] 生徒用メニュー画面
- [x] ポートフォリオ画面
- [x] CSVエクスポート機能
- [x] QuickMemoコンポーネント
- [x] ポートフォリオAPI実装

### ✅ Phase 5: 教科担当者機能（完了）
- [x] 教科担当者認証システム（簡易パスワード認証）
- [x] 教科担当者ログイン画面
- [x] セッション作成画面
- [x] 教科担当者ダッシュボード
- [x] 視点切り替え機能（座席マップ/投稿一覧）
- [x] リアルタイム更新（5秒間隔）
- [x] 統計情報表示（参加者数・投稿数・投稿率）

### 🎨 Phase 6: UI統合・改善（完了）
- [x] 入力フィールドのテキスト色修正（7ファイル）
- [x] 座席ホバー/クリック機能（モーダル表示）
- [x] コメント機能の実装
- [x] 匿名チャット機能の実装
- [x] 統合レイアウトの実装（座席マップ + チャット + 条件付き投稿欄）
- [x] 教科担当者ダッシュボードへのチャット統合

### Phase 7: テスト・デバッグ（次回）
- [ ] 統合レイアウトの動作確認
- [ ] E2Eテスト
- [ ] バグ修正
- [ ] パフォーマンス最適化

## 🔑 主要API

### POST /api/auth
生徒認証

```json
{
  "sessionCode": "AB12",
  "studentEmail": "student@school.ed.jp"
}
```

### POST /api/seats/select
座席選択

```json
{
  "sessionId": 1,
  "seatNumber": 5,
  "studentEmail": "student@school.ed.jp"
}
```

### POST /api/topics/submit
トピック投稿

```json
{
  "sessionId": 1,
  "seatAssignmentId": 123,
  "content": "私の意見..."
}
```

## 🎯 使い方

### 生徒の流れ

1. トップページから「生徒ログイン」をクリック
2. セッションコード（4桁）とメールアドレスを入力
3. 座席を選択
4. トピックを投稿
5. 座席マップで他の生徒の投稿をクリックして閲覧
6. リアクション（驚・納・疑）やコメントで反応
7. 右側のチャットパネルで自由に議論
8. QuickMemoで学習メモを記録
9. マイポートフォリオで振り返り・CSVエクスポート

### 教科担当者の流れ

1. トップページから「教科担当者ログイン」をクリック
2. パスワード入力（環境変数で設定したパスワード）
3. セッションを作成（クラス選択・授業タイトル・内容・時限を入力）
4. 生成された4桁コードを生徒に共有（画面中央に大きく表示可能）
5. ダッシュボードで座席マップまたは投稿一覧を表示（生徒視点/教卓視点の切り替え可能）
6. 右側のチャットパネルで生徒の議論をモニタリング
7. リアルタイム統計（参加者数・投稿数・投稿率・欠席者数）を確認
8. セッション終了時に欠席者を自動記録
9. 過去の授業から欠席者リストや座席マップを確認可能

## 🚢 デプロイ方法（Vercel + Supabase）

このアプリケーションは**学校ごとに独立したインスタンス**として運用することを推奨します。各学校が独自のSupabaseデータベースとVercelデプロイメントを持ちます。

### デプロイモデル

**推奨: 学校ごとの独立デプロイ**
- 各学校が独自のSupabaseプロジェクトを作成
- 各学校が独自のVercelプロジェクトをデプロイ
- 生徒データと授業データが完全に分離される
- 学校ごとにカスタマイズ可能

### デプロイ手順

#### Step 1: Supabaseのセットアップ

1. [Supabase](https://supabase.com) にアクセスして新規プロジェクトを作成
2. プロジェクト作成後、以下の情報を控える：
   - `Project URL`: `https://xxxxx.supabase.co`
   - `anon public key`: プロジェクト設定の API Keys から取得

3. SQL Editorで以下のテーブルを作成（`_docs/V4_DESIGN_DOCUMENT.md` 参照）：
   - `classes` - クラス情報
   - `students` - 生徒マスタ
   - `lesson_sessions` - 授業セッション
   - `seat_assignments` - 座席割り当て
   - `topic_posts` - トピック投稿
   - `reactions` - リアクション
   - `comments` - コメント
   - `chat_messages` - チャットメッセージ
   - `learning_memos` - 学習メモ
   - `absentees` - 欠席者記録

4. **Row Level Security (RLS) の設定**：
   - 各テーブルでRLSを有効化
   - anon roleに適切な権限を付与（詳細は設計書参照）

5. **初期データの投入**（オプション）：
   ```sql
   -- クラスデータの例
   INSERT INTO classes (name, grade) VALUES
   ('2-1', 2),
   ('2-2', 2),
   ('2-3', 2),
   ('2-4', 2),
   ('2-5', 2);
   ```

6. **生徒データの登録**：
   - 管理用APIエンドポイント `/api/admin/generate-test-students` を使用
   - または直接SQLで生徒データを投入
   ```sql
   INSERT INTO students (google_email, class_id, student_number, display_name) VALUES
   ('2101@school.ed.jp', 1, '2101', '生徒2101'),
   -- 以下、各生徒分...
   ```

#### Step 2: Vercelへのデプロイ

1. [Vercel](https://vercel.com) にアクセスしてログイン

2. 「New Project」から、このGitHubリポジトリをインポート

3. 環境変数を設定（Environment Variables）：
   ```
   NEXT_PUBLIC_TEACHER_PASSWORD=your_secure_password
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

4. 「Deploy」をクリック

5. デプロイ完了後、URLが発行されます（例: `https://your-app.vercel.app`）

#### Step 3: 動作確認

1. デプロイされたURLにアクセス
2. 教科担当者ログインで設定したパスワードでログインできるか確認
3. テストセッションを作成
4. 生徒用画面からセッションコードで参加できるか確認

### デプロイ後の管理

#### 生徒データの追加・更新

生徒データは以下の方法で管理できます：

1. **Supabase Dashboard経由**:
   - Supabaseの管理画面から `students` テーブルを直接編集

2. **管理用API経由**:
   - `/api/admin/generate-test-students` でテスト生徒を一括生成
   - カスタム管理画面を実装（今後の拡張）

#### パスワードの変更

Vercelの管理画面から環境変数 `NEXT_PUBLIC_TEACHER_PASSWORD` を更新し、再デプロイします。

#### データのバックアップ

Supabaseの管理画面から定期的にデータベースのバックアップを取得することを推奨します。

### 複数校での運用

複数の学校で使用する場合：

1. **各学校ごとに独立したデプロイを推奨**
   - 学校A: Supabase Project A + Vercel Deployment A
   - 学校B: Supabase Project B + Vercel Deployment B

2. **利点**:
   - データが完全に分離される
   - 学校ごとにカスタマイズ可能
   - 一方の障害が他方に影響しない
   - パフォーマンスが向上

3. **運用**:
   - 各学校の管理者がSupabaseとVercelのアカウントを管理
   - または、開発者が各学校用のプロジェクトを代理管理

## 📚 ドキュメント

詳細な設計書は `_docs/` ディレクトリを参照してください：

- `V4_DESIGN_DOCUMENT.md` - 完全設計書
- `V4_ADDITIONAL_FEATURES.md` - 追加機能仕様
- `LESSONS_LEARNED.md` - v3からの教訓

## 🛡️ セキュリティ

- Row Level Security (RLS) を使用してデータアクセスを制御
- 生徒は自分のデータのみアクセス可能
- LocalStorageでセッション情報を管理

## 📄 ライセンス

MIT

## 👨‍💻 開発者

開発: Claude Code & User
