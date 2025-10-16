# 📌 公共の掲示板プロジェクト

このディレクトリは、「コウキョウのキョウシツ v4」の派生アプリ「公共の掲示板」の開発資料を管理します。

---

## 📂 ディレクトリ構成

```
_bulletin-board-project/
├── README.md                           # このファイル
├── BULLETIN_BOARD_SPECIFICATION.md    # 掲示板の仕様書（別チャットで作成予定）
├── DATABASE_DESIGN.md                  # データベース設計
├── V5_INTEGRATION_ROADMAP.md           # v5統合ロードマップ
└── MIGRATION_GUIDE.md                  # v5移行時のマイグレーション手順
```

---

## 🎯 プロジェクト概要

### コンセプト
「コウキョウのキョウシツ v4」の座席ベース授業システムから、クラスの枠を超えた常設型掲示板システムへの派生。

### 主な違い（v4 vs 掲示板）

| 項目 | v4（教室） | 公共の掲示板 |
|------|-----------|-------------|
| **対象範囲** | 特定のクラス | 全校生徒 |
| **座席選択** | 必須 | 不要 |
| **セッション** | 時限単位（一時的） | 常設型（永続的） |
| **参加タイミング** | 授業中のみ | いつでもアクセス可能 |
| **用途** | リアルタイム授業での議論 | 継続的な意見収集・情報共有 |
| **欠席管理** | あり | なし |

---

## 🗄️ データベース戦略

### Phase 1: 掲示板開発中（今〜数週間）

**既存のSupabaseを共有し、新しいテーブルを追加**

```
Supabase（既存プロジェクト）
├── lesson_sessions（v4用）← そのまま
├── students（v4用）← そのまま、掲示板と共有
├── topic_posts（v4用）← そのまま
├── seat_assignments（v4用）← そのまま
├── ... その他v4用テーブル
│
├── bulletin_sessions（掲示板用）← 新規追加
├── bulletin_posts（掲示板用）← 新規追加
└── bulletin_comments（掲示板用）← 新規追加
```

**メリット:**
- ✅ v4のデータに一切影響なし
- ✅ 生徒マスタ（students）は共有できる
- ✅ Supabaseのコストが増えない（1プロジェクトのまま）
- ✅ v4アプリは動き続ける

---

### Phase 2: v5開発時

**マイグレーションで統合**

```sql
-- 既存テーブルにカラム追加
ALTER TABLE lesson_sessions
  ADD COLUMN session_type VARCHAR(20) DEFAULT 'classroom',
  ADD COLUMN is_permanent BOOLEAN DEFAULT false;

-- 掲示板データを統合テーブルに移行
INSERT INTO lesson_sessions (code, topic_title, session_type, is_permanent, ...)
SELECT code, title, 'bulletin', true, ... FROM bulletin_sessions;

-- 投稿データも統合
-- （同様の処理をbulletin_posts → topic_postsに実施）

-- 古いテーブルを削除
DROP TABLE bulletin_posts;
DROP TABLE bulletin_comments;
DROP TABLE bulletin_sessions;
```

**結果:**
```
Supabase（既存プロジェクト・統合後）
├── lesson_sessions（拡張版）← 教室も掲示板も含む
├── students（共通）
├── topic_posts（拡張版）← 教室も掲示板も含む
└── ... その他統合テーブル
```

---

## 🚀 開発フロー

### Step 1: 仕様策定（別チャットで実施予定）
- 掲示板の詳細機能を決定
- UI/UX設計
- 認証方式の決定
- データベーススキーマ設計

→ **`BULLETIN_BOARD_SPECIFICATION.md` に記録**

---

### Step 2: 新規リポジトリ作成

```bash
# v4のコードをベースに新しいリポジトリを作成
cd /Users/boomboom0911/Developer/
git clone https://github.com/boomboom0911/kokyou-no-kyoushitsu-v4.git kokyou-keijiban-v1

# 新しいリポジトリに切り替え
cd kokyou-keijiban-v1
git remote remove origin
git remote add origin https://github.com/boomboom0911/kokyou-keijiban-v1.git

# 初回プッシュ
git push -u origin main
```

---

### Step 3: Supabaseにテーブル追加

```sql
-- 掲示板セッション
CREATE TABLE bulletin_sessions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(4) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 掲示板投稿
CREATE TABLE bulletin_posts (
  id SERIAL PRIMARY KEY,
  bulletin_session_id INTEGER REFERENCES bulletin_sessions(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 掲示板コメント
CREATE TABLE bulletin_comments (
  id SERIAL PRIMARY KEY,
  bulletin_post_id INTEGER REFERENCES bulletin_posts(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS設定
ALTER TABLE bulletin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_comments ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能
CREATE POLICY "Anyone can view bulletin sessions" ON bulletin_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can view bulletin posts" ON bulletin_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can view bulletin comments" ON bulletin_comments FOR SELECT USING (true);

-- ログインユーザーのみ投稿可能
CREATE POLICY "Authenticated users can insert posts" ON bulletin_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can insert comments" ON bulletin_comments FOR INSERT WITH CHECK (true);
```

---

### Step 4: v4コードを掲示板用に改修

**削除する機能:**
- 座席選択画面
- クラス選択
- 時限選択
- 欠席管理

**追加する機能:**
- 掲示板一覧画面
- 掲示板への直接アクセス（常設型）
- 簡易認証（メールアドレスまたはニックネーム）

---

### Step 5: Vercelデプロイ

```bash
# 新しいリポジトリをVercelにデプロイ
# https://vercel.com/dashboard で「New Project」
# kokyou-keijiban-v1 をインポート

# 環境変数設定（v4と同じSupabaseを使用）
NEXT_PUBLIC_TEACHER_PASSWORD=your_password
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

### Step 6: 運用・フィードバック収集

- 実際に使ってもらう
- 不具合修正
- 機能追加
- v5への要望整理

---

### Step 7: v5統合準備

**詳細は `V5_INTEGRATION_ROADMAP.md` を参照**

---

## 📊 v4・掲示板・v5の関係図

```
【現在】
┌─────────────────┐
│   v4（教室）     │ ← 運用中
│ lesson_sessions │
└─────────────────┘

【掲示板開発中】
┌─────────────────┐   ┌──────────────────┐
│   v4（教室）     │   │  掲示板（新規）   │
│ lesson_sessions │   │ bulletin_sessions│
└─────────────────┘   └──────────────────┘
        ↓                      ↓
    【同じSupabaseを共有、テーブルは分離】

【v5統合後】
┌───────────────────────────────┐
│         v5（統合版）           │
│  lesson_sessions（拡張版）     │
│  - session_type: 'classroom'  │
│  - session_type: 'bulletin'   │
└───────────────────────────────┘
```

---

## 🔑 重要な原則

### 1. v4のデータを壊さない
- 既存のテーブルには一切触らない
- 新しいテーブルを追加するのみ
- v4アプリは動き続ける

### 2. 段階的に開発
- まず掲示板を独立して完成させる
- 実際に運用してフィードバック収集
- v5で慎重に統合

### 3. データの保全
- v4の授業記録は保持
- 掲示板の投稿も保持
- v5移行時にすべて引き継ぐ

---

## 📝 次のステップ

1. **別チャットで仕様議論**
   - 掲示板の詳細機能
   - UI/UX設計
   - データベーススキーマ

2. **`BULLETIN_BOARD_SPECIFICATION.md` 作成**
   - 議論した内容を仕様書にまとめる

3. **開発開始**
   - このREADMEの手順に従って実装

---

## 📚 関連ドキュメント

- **v4の設計書**: `../README.md`, `../_docs/V4_DESIGN_DOCUMENT.md`
- **v5申し送り**: `../V5_BACKLOG.md`
- **開発記録**: `../DEVELOPMENT_LOG_*.md`

---

**作成日**: 2025-10-16
**最終更新**: 2025-10-16
