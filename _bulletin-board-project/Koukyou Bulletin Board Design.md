📋 「コウキョウのケイジバン」開発仕様書🎯 Claude Code開発者への依頼
この仕様書は「コウキョウのキョウシツ v4」の拡張機能として「コウキョウのケイジバン」を実装するためのものです。
開発にあたって、以下の点を特にお願いします：

ベストプラクティスの適用: コードの保守性、拡張性を重視した実装
率直な提案: 仕様に改善点があれば積極的に提案してください
創意工夫: ユーザー体験を向上させるアイデアを歓迎します
v5への移行を見据えた設計: 将来の統合を考慮したアーキテクチャ

あなたの技術的知見と創造性を最大限発揮して、生徒と教員にとって価値のある学習プラットフォームを一緒に作りましょう。
📚 1. プロジェクト概要1.1 位置づけとロードマップv4.0 コウキョウのキョウシツ（リアルタイム授業）
    ↓ [拡張機能として追加]
v4.5 コウキョウのケイジバン（ピアレビュー掲示板）
    ↓ [運用・改善]
v4.6-4.9 機能改善・統合準備
    ↓ [統合]
v5.0 統合版（教室+掲示板+ポートフォリオ）
1.2 開発方針
v4の既存機能には一切影響を与えない（独立した機能追加）
既存コンポーネントの最大限の再利用（認証、UI、リアクション等）
新規4テーブルの追加のみ（既存テーブルの変更なし）
v5への移行を考慮したAPI設計
1.3 コンセプト学習成果物（作品・レポート）を共有し、生徒同士でピアレビューを行うことで共同学習を促進するプラットフォーム🎨 2. 機能要件2.1 基本機能一覧機能カテゴリ詳細優先度掲示板管理複数掲示板の作成・管理必須作品投稿Googleドキュメント/サイトの共有必須ピアレビューテキストレビュー、相互評価必須動物アイコンレビュアー識別システム必須認証強化パスワード認証（将来Google OAuth）必須データ出力CSV出力機能必須通知レビュー通知（ページ内）推奨ランキングレビュアーランキング推奨2.2 ユーザー別機能教員機能

掲示板作成

タイトル設定（例: "2学期評価課題提出フォーム"）
詳細な課題説明
必須レビュー数の設定（受取・実施）
提出締切・レビュー締切の設定
対象生徒の指定（全校/学年/クラス/CSV）



管理機能

リアルタイムダッシュボード
提出状況の確認
未提出者の自動抽出
CSV形式でのデータ出力
不適切投稿の非表示化


生徒機能

作品投稿

タイトル・説明文の入力
Googleドキュメント/サイトのURL共有
投稿後の編集機能



ピアレビュー

良い点の記載
改善提案
質問
総合コメント



閲覧・検索

新着/話題/レビュー待ちでの並び替え
タイトル・説明文での検索
各種フィルター機能


💾 3. データベース設計3.1 新規テーブル1. 掲示板マスタ（boards）CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(4) UNIQUE NOT NULL,  -- 4桁アクセスコード
  title VARCHAR(200) NOT NULL,
  description TEXT,
  min_reviews_required INTEGER DEFAULT 0,
  min_reviews_to_give INTEGER DEFAULT 0,
  submission_deadline TIMESTAMP,
  review_deadline TIMESTAMP,
  target_students JSONB,  -- 対象生徒のリスト
  is_public BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active',  -- draft/active/closed/archived
  created_by UUID REFERENCES teachers(id),
  created_at TIMESTAMP DEFAULT NOW(),
  settings JSONB  -- その他の設定
);
2. 作品投稿（submissions）CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id),
  student_id UUID REFERENCES students(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  work_url TEXT NOT NULL,  -- Googleドキュメント等のURL
  work_type VARCHAR(20),  -- google-doc/google-site/other
  click_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT false,
  last_edited_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
3. ピアレビュー（peer_reviews）CREATE TABLE peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id),
  reviewer_id UUID REFERENCES students(id),
  strengths TEXT[],  -- 良い点の配列
  suggestions TEXT[],  -- 改善提案の配列
  questions TEXT[],  -- 質問の配列
  overall_comment TEXT,
  character_count INTEGER,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
4. レビュアープロフィール（reviewer_profiles）CREATE TABLE reviewer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  board_id UUID REFERENCES boards(id),
  animal_type VARCHAR(20),  -- fox/bear/rabbit等
  level INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  helpful_total INTEGER DEFAULT 0,
  decorations TEXT[],  -- 獲得した装飾
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, board_id)
);
3.2 インデックスCREATE INDEX idx_submissions_board ON submissions(board_id);
CREATE INDEX idx_reviews_submission ON peer_reviews(submission_id);
CREATE INDEX idx_profiles_student_board ON reviewer_profiles(student_id, board_id);
3.3 既存テーブルとの関係
再利用: students（生徒マスタ）、classes（クラス情報）
独立: lesson_sessions、seat_assignments、topic_posts（教室モード専用）
🎯 4. 画面設計4.1 URL構造教員用:
/teacher/boards              - 掲示板一覧
/teacher/boards/create       - 掲示板作成
/teacher/boards/[id]         - 掲示板管理
/teacher/boards/[id]/export  - データ出力

生徒用:
/board                       - コード入力画面
/board/[code]               - 掲示板メイン
/board/[code]/submit        - 作品投稿
/board/[code]/work/[id]     - 作品詳細・レビュー
/board/[code]/profile       - 自分のプロフィール
4.2 掲示板メイン画面の構成
ヘッダー: 検索バー、フィルタータブ
おすすめセクション:

🔥 今アツい作品（レビュー数多）
🌱 レビュー待ちの新作
🎲 ランダムピックアップ


作品一覧: カード形式でグリッド表示
サイドバー: レビュアーランキング
4.3 作品カードの表示内容
タイトル
説明文（最初の100文字）
👁 閲覧数
💬 レビュー数
バッジ（🔥話題/👀注目/🌱新着）
🦊 5. 動物アイコンシステム5.1 基本仕様
動物の種類: 8種類（🦊🐻🐰🦁🐸🦉🐧🐢）
割り当て: 掲示板ごとにランダム割り当て
永続性: 同一掲示板内では固定
5.2 成長システムレベルレビュー数表示例00動物 + 🥚🦊 🥚11-2動物 + 🌱🦊 🌱23-4動物 + 🌿🦊 🌿35-9動物 + 🌳🦊 🌳410-19動物 + 🌳✨🦊 🌳✨520+動物 + 🌳👑🦊 🌳👑5.3 プライバシー設定
一般生徒: 動物アイコンのみ表示
作品投稿者: 動物アイコン + レビュアー実名
教員: 完全な情報（実名・クラス・番号）
🔐 6. 認証システム6.1 Phase 1: パスワード認証（初期実装）
形式: メールアドレス + パスワード
初期パスワード: クラス-番号-ランダム4桁（例: 1-01-2847）
配布方法: 紙 または Google Classroom
変更: 初回ログイン後に変更推奨
6.2 Phase 2: Google認証（将来実装）
実装方法: Google Sign-In for Websites
必要な作業: Google Cloud ConsoleでのプロジェクトID取得
利点: パスワード不要、なりすまし防止
📊 7. CSV出力仕様7.1 出力種別と形式提出一覧クラス,番号,氏名,提出日時,タイトル,レビュー受取数,レビュー実施数,ステータス
1-A,01,山田太郎,2024-11-20 10:30,私の作品,3,4,完了
1-A,02,田中花子,,,,0,0,未提出
レビュー詳細作品ID,作品タイトル,投稿者,レビュアー,内容,文字数,日時
001,私の作品,山田太郎,🦊Lv.3,とても工夫されていて...,150,2024-11-21 14:20
未提出者リストクラス,番号,氏名,メールアドレス
1-A,02,田中花子,tanaka@school.ed.jp
1-B,15,佐藤次郎,sato@school.ed.jp
🚀 8. 実装優先順位Phase 1: MVP（2週間）
✅ 基本的な投稿・閲覧機能
✅ パスワード認証
✅ シンプルなレビュー機能
✅ 動物アイコン（基本版）
✅ CSV出力（基本）
Phase 2: 機能拡充（1ヶ月）
⬜ レビューテンプレート
⬜ 動物成長システム
⬜ 検索・フィルター機能
⬜ ランキング表示
⬜ 通知システム
Phase 3: 完成版（2ヶ月）
⬜ Google認証統合
⬜ 高度な分析機能
⬜ ポートフォリオ連携準備
⬜ パフォーマンス最適化
💻 9. 技術仕様9.1 技術スタックv4から継承
Framework: Next.js 15 (App Router)
Language: TypeScript
Styling: TailwindCSS
Database: Supabase
Deployment: Vercel
新規導入検討
Google OAuth: Google Identity Services（Phase 2）
CSV生成: Papa Parse
アニメーション: Framer Motion（オプション）
9.2 環境変数NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GOOGLE_CLIENT_ID=your_google_client_id  # Phase 2以降
9.3 ディレクトリ構造app/
├── classroom/        # 既存のv4教室モード
├── board/           # 新規追加
│   ├── [code]/
│   │   ├── page.tsx           # 掲示板メイン
│   │   ├── submit/
│   │   │   └── page.tsx       # 投稿画面
│   │   └── work/
│   │       └── [id]/
│   │           └── page.tsx   # 作品詳細
│   └── page.tsx              # コード入力
├── teacher/
│   └── boards/      # 新規追加
│       ├── page.tsx          # 一覧
│       ├── create/
│       │   └── page.tsx      # 作成
│       └── [id]/
│           ├── page.tsx      # 管理
│           └── export/
│               └── page.tsx  # 出力
└── api/
    └── board/       # 新規追加
        ├── create/
        ├── submit/
        ├── review/
        └── export/
📝 10. 開発上の注意事項10.1 パフォーマンス
200人規模の同時アクセスを想定
作品一覧の仮想スクロール実装推奨
画像の遅延読み込み
Supabaseリアルタイムの適切な使用
10.2 セキュリティ
XSS対策（ユーザー入力のサニタイズ）
Googleドキュメント埋め込み時のiframe制限
Rate limiting（連続投稿防止）
SQLインジェクション対策
10.3 アクセシビリティ
モバイルファースト設計
キーボードナビゲーション対応
スクリーンリーダー対応
色覚多様性への配慮
10.4 エラーハンドリング
適切なエラーメッセージ表示
オフライン時の対応
自動リトライ機能
🎯 11. 成功基準指標目標値測定方法提出率90%以上提出者数/対象者数平均レビュー数3件/作品総レビュー数/作品数システム稼働率99.5%Vercel Analyticsページ読み込み3秒以内Lighthouse生徒満足度4.0/5.0アンケート🔄 12. v5への移行計画12.1 統合準備（v4.6-4.9）
APIの共通化
コンポーネントの標準化
データベーススキーマの統一
UIデザインシステムの確立
12.2 移行手順
v4.7: API層の統合
v4.8: UI/UXの統一
v4.9: データ移行ツールの作成
v5.0: 完全統合版リリース
12.3 v5の新機能（予定）
実名での議論スペース
学習ポートフォリオ
AI支援機能
高度な分析機能
📎 付録A. 用語集用語説明掲示板課題提出とピアレビューを行う場作品生徒が提出した成果物（Googleドキュメント等）ピアレビュー生徒同士による相互評価レビュアー他者の作品に評価・コメントする生徒動物アイコンレビュアーを識別する匿名アイコンレベルレビュー実績に応じた成長段階装飾質の高いレビューに対する報酬バッジB. 参考資料
Supabase Documentation
Next.js 15 Documentation
Google Identity Services
TailwindCSS Documentation
C. 変更履歴日付バージョン変更内容2024-XX-XX1.0初版作成📬 連絡先開発に関する質問や提案は以下まで：
プロジェクトオーナー: [メールアドレス]
技術的な相談: [開発チームの連絡先]
開発者へのメッセージこの仕様書は議論のたたき台です。実装中に以下の点について改善案があれば、積極的にご提案ください：
より良いユーザー体験のためのUI/UX改善
パフォーマンスの最適化手法
セキュリティの強化策
コードの保守性向上のためのアーキテクチャ提案
一緒により良い学習プラットフォームを作りましょう！