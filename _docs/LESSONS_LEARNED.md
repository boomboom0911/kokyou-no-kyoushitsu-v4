# 📚 開発から得た教訓（Lessons Learned）

**プロジェクト**: 公共のキョウシツ v3 → v4への移行
**作成日**: 2025年10月5日

---

## 🎯 プロジェクト概要

公共のキョウシツは、教室での議論を可視化・活性化するためのWebアプリケーションです。生徒が自分の意見を座席上に投稿し、クラス全体で共有・議論できます。

---

## ✅ 成功した部分

### 1. 教師画面の実装
- セッション作成機能（4桁コード生成）
- ダッシュボード表示
- リアルタイム更新の仕組み
- **評価**: 安定動作、再利用可能

### 2. 認証システム
- Google Email認証（簡易版）
- 学生データベース連携
- **評価**: 動作確認済み、v4でもそのまま使用可能

### 3. データベース設計
- Supabase使用
- テーブル構造（students, lesson_sessions, topic_posts, chat_messages）
- リレーション設定
- **評価**: 90%は良好、座席部分のみ要改善

### 4. リアルタイム機能
- Supabaseのリアルタイム購読
- 座席・トピック・チャットの更新通知
- **評価**: 正常動作

---

## ❌ 問題が発生した部分

### 1. 座席管理の複雑化 ⚠️ **最大の問題**

#### 問題内容
- **0-based vs 1-based の混在**
  - フロントエンド: 0-based (row: 0-5, col: 0-5)
  - データベース: 1-based (seat_row: 1-7, seat_col: 1-6)
  - 変換処理が複数箇所に散在

- **座席表現方法の不統一**
  - `{row: number, col: number}` 形式
  - 座席番号（1〜42）
  - 文字列表記（"A1", "B2"など）

#### 発生したエラー
```
new row for relation "seat_assignments" violates check constraint "seat_assignments_seat_row_check"
```
- 原因: 0-basedのrowをそのまま1-basedデータベースに挿入

#### 影響
- 座席選択が失敗
- デバッグが困難
- コードの可読性低下

#### 教訓
✅ **座席は最初から番号（1〜42）で統一すべき**
- データベース: `seat_number` カラム1つのみ
- フロントエンド: 座席番号のみ扱う
- 表示時のみrow/colに変換（表示ロジック内で完結）

---

### 2. LocalStorageの扱い

#### 問題内容
- データ構造変更時に古いデータが残る
- 毎回手動で `localStorage.clear()` が必要
- ブラウザキャッシュとの混同

#### 発生したエラー
```
セッションID、座席位置、学生メールは必須です
```
- 原因: 古いLocalStorageデータに`studentEmail`フィールドがない

#### 教訓
✅ **LocalStorageにバージョン管理を実装**
```javascript
const STORAGE_VERSION = 1
const data = {
  version: STORAGE_VERSION,
  studentId: ...,
  studentName: ...,
  // ...
}

// 読み込み時
const saved = JSON.parse(localStorage.getItem('user'))
if (!saved || saved.version !== STORAGE_VERSION) {
  // 古いデータは破棄
  localStorage.removeItem('user')
}
```

✅ **開発時の自動クリア機能**
```javascript
// 開発環境でのみ、アプリバージョンが変わったらクリア
if (process.env.NODE_ENV === 'development') {
  const APP_VERSION = '4.0'
  if (localStorage.getItem('appVersion') !== APP_VERSION) {
    localStorage.clear()
    localStorage.setItem('appVersion', APP_VERSION)
  }
}
```

---

### 3. データベーススキーマの制約

#### 問題内容
- `seat_row`, `seat_col` に CHECK制約があり、0を許可しない
- スキーマ確認が不十分だった

#### 教訓
✅ **最初にスキーマを完全に確認**
- CHECK制約
- FOREIGN KEY制約
- UNIQUE制約
- DEFAULT値

✅ **スキーマ確認スクリプトを作成**
```javascript
// check-schema.mjs
const { data } = await supabase.from('table_name').select('*').limit(0)
// カラム情報を確認
```

---

### 4. API設計の不一致

#### 問題内容
- APIリクエスト: `{seatRow, seatCol}` (0-based)
- APIバリデーション: 1-7行、1-6列を期待
- 変換ロジックの不備

#### 教訓
✅ **APIインターフェースを明確に定義**
```typescript
// 良い例
interface SeatSelectRequest {
  sessionId: number
  seatNumber: number  // 1-42
  studentEmail: string
}

// 悪い例（混乱を招く）
interface SeatSelectRequest {
  sessionId: number
  seatRow: number  // 0-based? 1-based?
  seatCol: number  // 0-based? 1-based?
  studentEmail: string
}
```

---

## 📋 v4への改善方針

### 1. 座席管理の完全再設計 🎯

#### データベース
```sql
-- seat_assignmentsテーブル
CREATE TABLE seat_assignments (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES lesson_sessions(id),
  student_id BIGINT REFERENCES students(id),
  seat_number INTEGER NOT NULL,  -- 1-42
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT seat_number_range CHECK (seat_number >= 1 AND seat_number <= 42),
  UNIQUE(session_id, seat_number),
  UNIQUE(session_id, student_id)
)
```

#### API設計
```typescript
// POST /api/seats/select
{
  sessionId: number,
  seatNumber: number,  // 1-42のみ
  studentEmail: string
}

// レスポンス
{
  success: true,
  data: {
    id: number,
    seatNumber: number,
    student: { id, name, email }
  }
}
```

#### フロントエンド
```typescript
// 座席番号のみ扱う
const [selectedSeat, setSelectedSeat] = useState<number | null>(null) // 1-42

// 表示時のみ行列に変換
const getSeatPosition = (seatNumber: number) => {
  const row = Math.floor((seatNumber - 1) / 6)  // 0-6
  const col = (seatNumber - 1) % 6               // 0-5
  return { row, col }
}
```

---

### 2. LocalStorage管理の標準化

```typescript
// lib/storage.ts
const STORAGE_VERSION = 1

export const storage = {
  save: (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify({
      version: STORAGE_VERSION,
      data
    }))
  },

  load: (key: string) => {
    const item = localStorage.getItem(key)
    if (!item) return null

    const parsed = JSON.parse(item)
    if (parsed.version !== STORAGE_VERSION) {
      localStorage.removeItem(key)
      return null
    }

    return parsed.data
  }
}
```

---

### 3. 型定義の厳格化

```typescript
// lib/types.ts

// 座席番号は専用の型
export type SeatNumber = number & { __brand: 'SeatNumber' }

export const createSeatNumber = (n: number): SeatNumber | null => {
  if (n < 1 || n > 42) return null
  return n as SeatNumber
}

// 使用例
const seat = createSeatNumber(5) // SeatNumber
const invalid = createSeatNumber(50) // null
```

---

### 4. エラーハンドリングの改善

```typescript
// 現在: エラーメッセージが不明瞭
{ error: '入室できませんでした' }

// 改善: 詳細なエラーコード
{
  error: {
    code: 'SEAT_ALREADY_TAKEN',
    message: '座席5は既に使用されています',
    details: { seatNumber: 5, occupiedBy: '青山 朝太郎' }
  }
}
```

---

## 🛠️ 開発プロセスの改善

### 1. テスト駆動開発（推奨）
```
1. データベーススキーマ確定
2. API仕様書作成（OpenAPI）
3. APIのテストケース作成
4. API実装
5. フロントエンド実装
```

### 2. デバッグツールの活用
- Chrome DevTools Application タブでLocalStorage確認
- Supabase Studioでデータ確認
- Network タブでAPI通信確認

### 3. ドキュメント駆動開発
- DEVELOPMENT_LOG.mdの継続的更新
- API仕様書の作成
- データフロー図の作成

---

## 📊 再利用可能なコード

### ✅ そのまま使える
1. 教師画面UI（コピー）
2. 認証API（`/api/auth`）
3. セッション管理API（`/api/sessions`）
4. チャットAPI（`/api/chat`）
5. トピック投稿API（`/api/topics/submit`）
6. リアクションAPI（`/api/reactions`）

### 🔧 調整が必要
1. 座席選択API（完全再実装）
2. 生徒画面（座席部分を再実装）
3. 参加者取得API（座席番号対応）

### ❌ 廃棄
1. 座席のrow/col変換ロジック
2. 古いLocalStorage管理

---

## 🎓 技術的な学び

### Next.js 15 + Turbopack
- ✅ 高速なビルド
- ⚠️ ポート競合の自動回避（3000→3001）
- ✅ ホットリロードが快適

### Supabase
- ✅ リアルタイム購読が強力
- ✅ Row Level Securityは今後実装推奨
- ⚠️ CHECK制約の確認が重要

### TypeScript
- ✅ 型定義で多くのバグを防止
- ⚠️ `any`型は極力避ける
- ✅ Brand型でより厳密な型チェック可能

---

## 📝 次回への引き継ぎ

### v4で最初に実装すべき機能（優先順位順）

1. **座席選択機能**（シンプルな設計で完全動作させる）
   - データベーススキーマ更新
   - API実装（座席番号ベース）
   - フロントエンド実装
   - E2Eテスト

2. **トピック投稿**（v3から移植）
   - APIはほぼそのまま使用可能
   - フロントエンドも調整のみ

3. **チャット機能**（v3から移植）
   - リアルタイム購読も含めて移植

4. **いいね・コメント**（v3から移植）

5. **教師画面**（v3から移植）

---

## 🚀 v4の成功基準

- ✅ 座席選択が100%成功する
- ✅ LocalStorageの問題が発生しない
- ✅ エラーメッセージが明確
- ✅ コードが読みやすく、メンテナンス容易
- ✅ E2Eテストが通る

---

**作成者**: Claude Code
**最終更新**: 2025年10月5日

**次のステップ**: 追加機能要件のヒアリング → v4設計書作成
