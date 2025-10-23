# 🎓 コウキョウのキョウシツ v4 - 初期設定ガイド

## 📅 作成日
2025年10月11日（土）

---

## 🎯 このガイドの目的

このガイドは、「コウキョウのキョウシツ v4」を**あなた自身の学校で使うため**の初期設定手順です。
以下の手順に従って、データベースのセットアップと生徒データの登録を行ってください。

---

## ⚠️ 前提条件

以下の環境が整っていることを確認してください：

1. ✅ Supabaseプロジェクトが作成済み
2. ✅ `.env.local` ファイルに以下の環境変数が設定済み:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_TEACHER_PASSWORD`
3. ✅ ローカル開発サーバーが起動可能（`npm run dev`）

---

## 📋 初期設定の手順

### Step 1: クラスデータのリセットと登録

**目的**: 古いクラスデータを削除し、あなたの学校のクラス（2-1 〜 2-5）を登録します。

#### ターミナルコマンド

```bash
# プロジェクトディレクトリに移動
cd /Users/boomboom0911/Developer/kokyou-no-kyoushitsu-v4

# 開発サーバーを起動（別のターミナルウィンドウで）
npm run dev

# 以下のコマンドを実行（別のターミナルで）
curl -X POST http://localhost:3000/api/admin/reset-classes
```

#### 実行結果の確認

```json
{
  "success": true,
  "data": {
    "deleted_count": 5,
    "created_classes": [
      { "id": 1, "name": "2-1", "grade": 2 },
      { "id": 2, "name": "2-2", "grade": 2 },
      { "id": 3, "name": "2-3", "grade": 2 },
      { "id": 4, "name": "2-4", "grade": 2 },
      { "id": 5, "name": "2-5", "grade": 2 }
    ]
  }
}
```

✅ `"success": true` が表示されればOK

---

### Step 2: テスト生徒データの登録

**目的**: テスト用に40名の生徒データ（各クラス8名）を登録します。

#### ターミナルコマンド

```bash
curl -X POST http://localhost:3000/api/admin/generate-test-students
```

#### 実行結果の確認

```json
{
  "success": true,
  "data": {
    "created_count": 40,
    "students": [
      {
        "id": 1,
        "google_email": "2101@nansho.ed.jp",
        "class_id": 1,
        "student_number": "2101",
        "display_name": "生徒2101"
      },
      // ... 残り39名
    ]
  }
}
```

✅ `"created_count": 40` が表示されればOK

#### 登録される生徒データ

| クラス | メールアドレス範囲 | 生徒数 |
|--------|-------------------|--------|
| 2-1 | 2101@nansho.ed.jp 〜 2108@nansho.ed.jp | 8名 |
| 2-2 | 2201@nansho.ed.jp 〜 2208@nansho.ed.jp | 8名 |
| 2-3 | 2301@nansho.ed.jp 〜 2308@nansho.ed.jp | 8名 |
| 2-4 | 2401@nansho.ed.jp 〜 2408@nansho.ed.jp | 8名 |
| 2-5 | 2501@nansho.ed.jp 〜 2508@nansho.ed.jp | 8名 |

---

## 🧪 動作確認

### 1. 教科担当者ログイン

1. ブラウザで http://localhost:3000 を開く
2. 右側の「教科担当者用」カードで「パスワード」を入力
   - パスワード: `.env.local` で設定した `NEXT_PUBLIC_TEACHER_PASSWORD`
3. 「ログイン」をクリック
4. セッション作成画面が表示されればOK

### 2. テストセッションの作成

1. セッション作成画面で以下を入力:
   - **クラス**: 2-1 を選択
   - **授業タイトル**: テストセッション
   - **授業内容**: 動作確認用のテストです
   - **時限**: 1
2. 「セッションを作成」をクリック
3. 4桁のセッションコード（例: AB12）が表示されればOK

### 3. 生徒ログイン

1. **新しいブラウザタブまたはシークレットモード**で http://localhost:3000 を開く
2. 左側の「生徒用」カードで「授業に参加」を選択
3. 以下を入力:
   - **セッションコード**: 先ほど表示された4桁コード（例: AB12）
   - **メールアドレス**: 2101@nansho.ed.jp
4. 「教室に入る」をクリック
5. 座席選択画面が表示されればOK

### 4. 座席選択と投稿

1. 空いている座席（例: 座席番号5）をクリック
2. 「座席 5 を確定」をクリック
3. テキストエリアに意見を入力（例: テスト投稿です）
4. 「投稿する」をクリック
5. 座席マップで座席が緑色になればOK

✅ ここまで正常に動作すれば、初期設定は完了です！

---

## 📝 実際の生徒データの登録方法

テスト生徒データの代わりに、**実際の生徒データ**を登録する場合は、以下の方法があります。

### 方法1: Supabase Dashboardから直接登録

1. Supabase Dashboard（https://supabase.com）にログイン
2. プロジェクトを選択
3. 左メニューから「Table Editor」→「students」を選択
4. 「Insert」→「Insert row」で1名ずつ登録

#### 登録する項目

- `google_email`: 生徒のメールアドレス（例: tanaka.taro@school.ed.jp）
- `class_id`: クラスID（1=2-1, 2=2-2, 3=2-3, 4=2-4, 5=2-5）
- `student_number`: 学籍番号（例: 2101）
- `display_name`: 表示名（例: 田中太郎）

### 方法2: CSVインポート（Supabase Dashboard）

1. Excelで生徒データを作成（列: google_email, class_id, student_number, display_name）
2. CSVファイルとして保存
3. Supabase Dashboard → Table Editor → students → 「...」メニュー → 「Import data via spreadsheet」
4. CSVファイルをアップロード

### 方法3: SQLで一括登録

```sql
-- Supabase Dashboard の SQL Editor で実行
INSERT INTO students (google_email, class_id, student_number, display_name) VALUES
('tanaka.taro@school.ed.jp', 1, '2101', '田中太郎'),
('suzuki.hanako@school.ed.jp', 1, '2102', '鈴木花子'),
-- 以下、生徒データを追加
;
```

---

## 🔧 トラブルシューティング

### エラー1: `fetch failed` が表示される

**原因**: Supabaseへの接続に失敗している

**解決策**:
1. `.env.local` の `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を確認
2. Supabaseプロジェクトが正常に動作しているか確認
3. 開発サーバーを再起動（`npm run dev`）

### エラー2: `created_count: 0` が表示される

**原因**: すでに生徒データが存在している

**解決策**:
1. Supabase Dashboard → Table Editor → students で既存データを確認
2. 既存データを削除してから再実行
3. または、新しいメールアドレスでテスト生徒を登録

### エラー3: クラスが表示されない

**原因**: クラスデータが正しく登録されていない

**解決策**:
1. Supabase Dashboard → Table Editor → classes でデータを確認
2. Step 1 の「クラスデータのリセットと登録」を再実行

---

## 🎉 初期設定完了後の次のステップ

1. **デモを試す**: [DEMO_GUIDE.md](./DEMO_GUIDE.md) を参照して、全機能を体験
2. **学校での導入**: [SCHOOL_DEPLOYMENT_GUIDE.md](./SCHOOL_DEPLOYMENT_GUIDE.md) を参照して、Vercelにデプロイ
3. **v5開発の準備**: [V5_DEVELOPMENT_NOTES.md](./V5_DEVELOPMENT_NOTES.md) を参照して、次の機能を検討

---

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. [README.md](./README.md) - 基本的な使い方
2. [SCHOOL_DEPLOYMENT_GUIDE.md](./SCHOOL_DEPLOYMENT_GUIDE.md) - トラブルシューティング
3. GitHub Issues: https://github.com/boomboom0911/kokyou-no-kyoushitsu-v4/issues

---

**初期設定、お疲れさまでした！** 🎊

「コウキョウのキョウシツ v4」を存分に活用して、素晴らしい授業を実現してください！
