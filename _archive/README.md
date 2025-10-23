# 📁 アーカイブフォルダ

このフォルダには、過去のバージョンや開発記録などの履歴ファイルを保管しています。

---

## 📂 ディレクトリ構造

```
_archive/
├── README.md (このファイル)
├── KOKYOU_NO_KYOSHITSU_DEVELOPMENT_STATUS.md (v3開発記録)
├── deleted-guides/        削除した重複ガイド
├── development-logs/      v4開発ログ (2025年10月14-21日)
├── summaries/            v4完成時の各種サマリー
└── v5-planning/          v5開発計画・研究メモ
```

---

## 📄 ファイル一覧

### v3開発記録

#### KOKYOU_NO_KYOSHITSU_DEVELOPMENT_STATUS.md
- **作成日**: 2025年10月3日
- **最終更新**: 2025年10月5日
- **内容**: v3の開発状況レポート
- **状態**: 完了・アーカイブ済み
- **注意**: v3（2025年10月3-5日）の開発記録。現在はv4を使用。

---

### deleted-guides/ - 削除した重複ガイド

以下のガイドは内容が重複していたため削除し、`DEMO_AND_SETUP_GUIDE.md`に統合されています。

- `DEMO_GUIDE.md` - 基本的なデモ説明（統合済み）
- `INITIAL_SETUP_GUIDE.md` - 初期設定ガイド（統合済み）
- `SCHOOL_DEPLOYMENT_GUIDE.md` - 学校導入ガイド（統合済み）
- `LINE_SHARE_MESSAGE.txt` - 完成時の宣伝メッセージ（不要）

**現在使用**: ルート直下の `DEMO_AND_SETUP_GUIDE.md`

---

### development-logs/ - v4開発ログ（8件）

v4の開発過程を記録した日次ログ（2025年10月14-21日）:

- `DEVELOPMENT_LOG_2025-10-14.md`
- `DEVELOPMENT_LOG_2025-10-15.md`
- `DEVELOPMENT_LOG_2025-10-15_2.md`
- `DEVELOPMENT_LOG_2025-10-16.md`
- `DEVELOPMENT_LOG_2025-10-16_2.md`
- `DEVELOPMENT_LOG_2025-10-18.md`
- `DEVELOPMENT_LOG_2025-10-20.md`
- `DEVELOPMENT_LOG_2025-10-21.md`

---

### summaries/ - v4完成時のサマリー（3件）

以下のサマリーは内容が重複していたため、ルート直下の `V4_COMPLETION_SUMMARY.md` に統合されています。

- `DEVELOPMENT_FINAL_REPORT.md` - 2025-10-11の完了報告
- `SESSION_SUMMARY_2025-10-12.md` - 2025-10-12のセッション記録
- `V4_REFINEMENT_SESSION.md` - 2025-10-12の改良記録

**現在使用**: ルート直下の `V4_COMPLETION_SUMMARY.md`

---

### v5-planning/ - v5開発計画（3件）

v5は別プロジェクトとして計画されているため、アーカイブ:

- `V5_BACKLOG.md` (588行) - v5開発バックログ
- `V5_DEVELOPMENT_NOTES.md` (1143行) - v5開発計画・機能詳細
- `EDUCATION_RESEARCH_REPORT_MEMO.md` (363行) - 教育研究メモ

---

## 🔖 現在のプロジェクト

**プロジェクト名**: コウキョウのキョウシツ v4
**ディレクトリ**: `/Users/boomboom0911/Developer/kokyou-no-kyoushitsu-v4`
**現在の主要ドキュメント**:
- `README.md` - プロジェクト概要
- `STARTUP_PROMPT.md` - AI用起動プロンプト
- `AI_SETUP_PROMPT.md` - AI導入サポート用
- `DEMO_AND_SETUP_GUIDE.md` - デモ・導入ガイド（統合版）
- `V4_COMPLETION_SUMMARY.md` - v4完成サマリー（統合版）

---

## 📚 バージョン履歴

| バージョン | 期間 | 状態 | 備考 |
|-----------|------|------|------|
| v3 | 2025年10月3-5日 | アーカイブ | 座席選択APIエラー対応中で終了 |
| v4 | 2025年10月14日〜現在 | 🚀 運用中 | 完全リニューアル・完成 |
| v5 | 未定 | 計画段階 | 議題別討論プラットフォーム構想 |

---

## 📊 整理履歴

### 2025年10月23日 - プロジェクト大規模整理
- v3開発記録をアーカイブに移動
- 重複ガイド4件を削除（統合済み）
- 開発ログ8件をアーカイブに移動
- 重複サマリー3件を整理（統合済み）
- v5計画書3件をアーカイブに移動
- SQLスクリプト9件を `scripts/database/` に移動
- ルート直下のファイルを33件 → 6件に削減（82%減）

**整理者**: Claude Code
