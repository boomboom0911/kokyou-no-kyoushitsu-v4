# 🚀 公共の掲示板 - 開発開始ガイド

このガイドを使って、別チャットで仕様を固めた後に掲示板開発をスムーズに開始できます。

---

## 📋 前提条件

### 完了していること
- ✅ 別チャットで掲示板の仕様を議論・確定
- ✅ `BULLETIN_BOARD_SPECIFICATION.md` に仕様を記録
- ✅ UIデザインを決定
- ✅ 認証方式を決定

### 必要な環境
- Node.js (v18以上)
- Git
- Supabaseアカウント（v4と共有）
- Vercelアカウント
- GitHubアカウント

---

## 🎯 開発開始の手順

### Step 1: 新規リポジトリの作成（5分）

#### 1-1. v4コードをコピー
```bash
cd /Users/boomboom0911/Developer/

# v4をベースに新しいプロジェクトを作成
git clone https://github.com/boomboom0911/kokyou-no-kyoushitsu-v4.git kokyou-keijiban-v1

cd kokyou-keijiban-v1
```

#### 1-2. Git設定を変更
```bash
# 既存のリモートを削除
git remote remove origin

# 新しいリポジトリを作成（GitHubで先に作成しておく）
git remote add origin https://github.com/boomboom0911/kokyou-keijiban-v1.git

# 初回プッシュ
git push -u origin main
```

#### 1-3. 不要なファイルを削除
```bash
# v4の開発記録などを削除
rm DEVELOPMENT_LOG_*.md
rm DEVELOPMENT_FINAL_REPORT.md

# 掲示板プロジェクトディレクトリを削除（もう不要）
rm -rf _bulletin-board-project

# 新しいREADMEを作成
cat > README.md << 'EOF'
# 📌 公共の掲示板

「コウキョウのキョウシツ v4」の派生アプリ。
クラスの枠を超えた常設型掲示板システム。

## 特徴
- ❌ 座席選択なし
- ❌ クラス制限なし
- ✅ 全校生徒が参加可能
- ✅ いつでもアクセス可能
- ✅ 常設型セッション

詳細は SPECIFICATION.md を参照。
EOF

git add .
git commit -m "chore: v4からフォーク、掲示板プロジェクト開始"
git push
```

---

### Step 2: Supabaseにテーブル追加（10分）

#### 2-1. Supabase SQL Editorを開く
https://supabase.com/dashboard → プロジェクト選択 → SQL Editor

#### 2-2. 以下のSQLを実行

**コピペ用SQL:**
```sql
-- ========================================
-- 公共の掲示板 - テーブル作成
-- ========================================

BEGIN;

-- 掲示板セッション
CREATE TABLE bulletin_sessions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(4) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES students(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 掲示板投稿
CREATE TABLE bulletin_posts (
  id SERIAL PRIMARY KEY,
  bulletin_session_id INTEGER NOT NULL REFERENCES bulletin_sessions(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 掲示板コメント
CREATE TABLE bulletin_comments (
  id SERIAL PRIMARY KEY,
  bulletin_post_id INTEGER NOT NULL REFERENCES bulletin_posts(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 掲示板リアクション
CREATE TABLE bulletin_reactions (
  id SERIAL PRIMARY KEY,
  bulletin_post_id INTEGER NOT NULL REFERENCES bulletin_posts(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reaction_type VARCHAR(10) NOT NULL CHECK (reaction_type IN ('surprise', 'convince', 'doubt')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bulletin_post_id, student_id, reaction_type)
);

-- インデックス
CREATE INDEX idx_bulletin_sessions_code ON bulletin_sessions(code);
CREATE INDEX idx_bulletin_sessions_active ON bulletin_sessions(is_active);
CREATE INDEX idx_bulletin_posts_session ON bulletin_posts(bulletin_session_id);
CREATE INDEX idx_bulletin_posts_student ON bulletin_posts(student_id);
CREATE INDEX idx_bulletin_comments_post ON bulletin_comments(bulletin_post_id);
CREATE INDEX idx_bulletin_reactions_post ON bulletin_reactions(bulletin_post_id);

-- RLS（Row Level Security）
ALTER TABLE bulletin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_reactions ENABLE ROW LEVEL SECURITY;

-- 全員が閲覧可能
CREATE POLICY "Anyone can view bulletin sessions" ON bulletin_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can view bulletin posts" ON bulletin_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can view bulletin comments" ON bulletin_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can view bulletin reactions" ON bulletin_reactions FOR SELECT USING (true);

-- ログインユーザーのみ投稿可能
CREATE POLICY "Authenticated users can insert posts" ON bulletin_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can insert comments" ON bulletin_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can insert reactions" ON bulletin_reactions FOR INSERT WITH CHECK (true);

-- 投稿者のみ編集・削除可能
CREATE POLICY "Authors can update their posts" ON bulletin_posts FOR UPDATE USING (student_id = current_setting('app.current_user_id', true)::INTEGER);
CREATE POLICY "Authors can delete their posts" ON bulletin_posts FOR DELETE USING (student_id = current_setting('app.current_user_id', true)::INTEGER);
CREATE POLICY "Authors can delete their comments" ON bulletin_comments FOR DELETE USING (student_id = current_setting('app.current_user_id', true)::INTEGER);
CREATE POLICY "Users can delete their reactions" ON bulletin_reactions FOR DELETE USING (student_id = current_setting('app.current_user_id', true)::INTEGER);

COMMIT;
```

#### 2-3. 実行確認
```sql
-- テーブルが作成されたか確認
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE 'bulletin_%';

-- 結果: bulletin_sessions, bulletin_posts, bulletin_comments, bulletin_reactions
```

---

### Step 3: 型定義の作成（5分）

**`src/types/bulletin.ts`** を新規作成:
```typescript
export interface BulletinSession {
  id: number;
  code: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface BulletinPost {
  id: number;
  bulletin_session_id: number;
  student_id: number | null;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface BulletinComment {
  id: number;
  bulletin_post_id: number;
  student_id: number | null;
  content: string;
  created_at: string;
}

export interface BulletinReaction {
  id: number;
  bulletin_post_id: number;
  student_id: number;
  reaction_type: 'surprise' | 'convince' | 'doubt';
  created_at: string;
}
```

---

### Step 4: v4の不要機能を削除（30分）

#### 4-1. 削除対象のファイル・機能
- [ ] `src/app/classroom/[sessionCode]/page.tsx` の座席選択機能
- [ ] `src/app/teacher/create-session/page.tsx` のクラス選択
- [ ] `src/app/teacher/create-session/page.tsx` の時限選択
- [ ] `src/app/teacher/dashboard/[sessionCode]/page.tsx` の欠席管理
- [ ] `src/components/SeatMap.tsx`（使わない場合）

#### 4-2. 残す機能
- ✅ 認証システム（`src/app/api/auth`）
- ✅ チャット機能（`src/components/ChatPanel.tsx`）
- ✅ リアクション機能（`src/components/ReactionBar.tsx`）
- ✅ コメント機能（`src/components/TopicCard.tsx`）

---

### Step 5: 掲示板機能の実装（2〜3時間）

#### 5-1. トップ画面の修正

**`src/app/page.tsx`**
```typescript
export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">📌 公共の掲示板</h1>
        <div className="space-y-4">
          <Link href="/bulletin">
            <button className="btn-primary">掲示板を見る</button>
          </Link>
          <Link href="/teacher">
            <button className="btn-secondary">教員ログイン</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

#### 5-2. 掲示板一覧画面

**`src/app/bulletin/page.tsx`** を新規作成
```typescript
'use client';

import { useEffect, useState } from 'react';
import { BulletinSession } from '@/types/bulletin';
import Link from 'next/link';

export default function BulletinListPage() {
  const [bulletins, setBulletins] = useState<BulletinSession[]>([]);

  useEffect(() => {
    fetch('/api/bulletins')
      .then(res => res.json())
      .then(data => setBulletins(data.data || []));
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📌 掲示板一覧</h1>
      <div className="grid gap-4">
        {bulletins.map(bulletin => (
          <Link key={bulletin.id} href={`/bulletin/${bulletin.code}`}>
            <div className="card hover:shadow-lg cursor-pointer">
              <h2 className="text-xl font-semibold">{bulletin.title}</h2>
              {bulletin.description && (
                <p className="text-gray-600">{bulletin.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

#### 5-3. 掲示板詳細画面

**`src/app/bulletin/[code]/page.tsx`** を新規作成
```typescript
// v4の classroom/[sessionCode]/page.tsx をベースに
// 座席選択を削除し、直接投稿フォームを表示
```

#### 5-4. API実装

**`src/app/api/bulletins/route.ts`** を新規作成
```typescript
import { createClient } from '@/lib/supabase';

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bulletin_sessions')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, data });
}
```

---

### Step 6: Vercelデプロイ（10分）

#### 6-1. Vercelに新規プロジェクト作成
1. https://vercel.com/dashboard にアクセス
2. 「New Project」をクリック
3. `kokyou-keijiban-v1` リポジトリをインポート

#### 6-2. 環境変数を設定
```
NEXT_PUBLIC_TEACHER_PASSWORD=your_password
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

#### 6-3. デプロイ実行
「Deploy」をクリック

---

### Step 7: 動作確認（15分）

- [ ] 掲示板一覧が表示される
- [ ] 掲示板にアクセスできる
- [ ] ログインできる
- [ ] 投稿できる
- [ ] リアクションできる
- [ ] コメントできる

---

## 📝 開発中のTips

### v4との差分を最小限に
- 座席関連のコードだけを削除
- その他のコンポーネントは流用

### テストデータの作成
```sql
-- テスト用掲示板を作成
INSERT INTO bulletin_sessions (code, title, description) VALUES
('TEST', 'テスト掲示板', '開発用のテスト掲示板です');
```

### デバッグ
```bash
# ローカルで開発サーバー起動
npm run dev

# ブラウザで http://localhost:3000 を開く
```

---

## 🔗 参考ドキュメント

- **データベース設計**: `DATABASE_DESIGN.md`
- **v5統合計画**: `V5_INTEGRATION_ROADMAP.md`
- **v4の設計書**: `../_docs/V4_DESIGN_DOCUMENT.md`

---

## 🆘 困ったとき

### v4のコードがわからない
→ `../src/` 以下を参照。特に `classroom/[sessionCode]/page.tsx` が参考になります

### Supabaseエラー
→ RLSポリシーを確認。`bulletin_sessions` などのRLSが有効になっているか確認

### Vercelデプロイエラー
→ ビルドログを確認。環境変数が正しく設定されているか確認

---

## ✅ 完了チェックリスト

### 開発開始前
- [ ] 仕様を `BULLETIN_BOARD_SPECIFICATION.md` に記録
- [ ] 新規リポジトリ作成
- [ ] Supabaseにテーブル追加

### 開発中
- [ ] 不要機能を削除
- [ ] 掲示板一覧画面実装
- [ ] 掲示板詳細画面実装
- [ ] API実装

### デプロイ前
- [ ] ローカルで動作確認
- [ ] テストデータで検証

### デプロイ後
- [ ] 本番環境で動作確認
- [ ] ユーザーに共有

---

**準備ができたら、別チャットで仕様を固めてから、このガイドに従って開発を開始してください！**

---

**作成日**: 2025-10-16
**最終更新**: 2025-10-16
