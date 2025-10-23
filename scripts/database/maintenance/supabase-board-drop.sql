-- ============================================
-- 既存の掲示板関連テーブルを削除
-- ============================================
-- 警告: このスクリプトは既存データを全て削除します

-- ビューを削除
DROP VIEW IF EXISTS submission_with_stats CASCADE;

-- トリガーを削除
DROP TRIGGER IF EXISTS trigger_update_review_counts ON peer_reviews;
DROP TRIGGER IF EXISTS trigger_boards_updated_at ON boards;
DROP TRIGGER IF EXISTS trigger_submissions_updated_at ON submissions;
DROP TRIGGER IF EXISTS trigger_peer_reviews_updated_at ON peer_reviews;
DROP TRIGGER IF EXISTS trigger_reviewer_profiles_updated_at ON reviewer_profiles;

-- 関数を削除
DROP FUNCTION IF EXISTS update_review_counts() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- テーブルを削除（外部キー制約があるので順序が重要）
DROP TABLE IF EXISTS peer_reviews CASCADE;
DROP TABLE IF EXISTS reviewer_profiles CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS boards CASCADE;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '既存テーブルの削除が完了しました';
  RAISE NOTICE '次のステップ: supabase-board-schema.sql を実行してください';
  RAISE NOTICE '========================================';
END $$;
