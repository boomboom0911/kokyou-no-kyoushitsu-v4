-- ====================================
-- コウキョウのケイジバン v4.5 - 簡易デモデータ
-- ====================================

-- 既存のデモデータを削除
DELETE FROM peer_reviews WHERE submission_id IN (
  SELECT id FROM submissions WHERE board_id IN (
    SELECT id FROM boards WHERE code IN ('DEMO01', 'ART001', 'PROG01')
  )
);
DELETE FROM reviewer_profiles WHERE board_id IN (
  SELECT id FROM boards WHERE code IN ('DEMO01', 'ART001', 'PROG01')
);
DELETE FROM submissions WHERE board_id IN (
  SELECT id FROM boards WHERE code IN ('DEMO01', 'ART001', 'PROG01')
);
DELETE FROM boards WHERE code IN ('DEMO01', 'ART001', 'PROG01');

-- ====================================
-- 1. 掲示板の作成
-- ====================================

INSERT INTO boards (code, title, description, min_reviews_required, min_reviews_to_give, submission_deadline, review_deadline, status, created_by, settings)
VALUES
('DEMO01', '情報デザイン課題 - Webサイト制作', 'テーマ：SDGs（持続可能な開発目標）について調べて、魅力的なWebサイトを作成しましょう。', 3, 2, NOW() + INTERVAL '7 days', NOW() + INTERVAL '14 days', 'active', 1, '{"allow_edit": true}'::jsonb),
('ART001', '美術課題 - デジタルアート作品', 'Googleスライドを使って、自由なテーマでデジタルアート作品を制作しましょう。', 2, 2, NOW() + INTERVAL '10 days', NOW() + INTERVAL '17 days', 'active', 1, '{"allow_edit": true}'::jsonb),
('PROG01', 'プログラミング課題 - Scratchゲーム制作', 'Scratchで簡単なゲームを作成し、プレイ方法や工夫した点をGoogleドキュメントにまとめましょう。', 3, 3, NOW() + INTERVAL '2 days', NOW() + INTERVAL '5 days', 'active', 1, '{"allow_edit": true}'::jsonb);

-- ====================================
-- 2. 作品投稿（DEMO01掲示板用）
-- ====================================

INSERT INTO submissions (board_id, student_id, title, description, work_url, work_type, view_count, is_featured, created_at)
SELECT
  (SELECT id FROM boards WHERE code = 'DEMO01'),
  1,
  'SDGs目標14 - 海洋プラスチック問題について',
  '海洋プラスチックごみの現状と、私たちにできることをまとめました。',
  'https://sites.google.com/view/ocean-plastic-sdgs14',
  'google-site',
  45,
  true,
  NOW() - INTERVAL '5 days';

-- 他の作品は省略（student_id=1のみ使用）

-- ====================================
-- 3. レビュー投稿は省略（student_id=1のみのため）
-- ====================================

-- ====================================
-- 完了メッセージ
-- ====================================

SELECT
  '========================================' as message
UNION ALL SELECT 'デモデータの作成が完了しました！'
UNION ALL SELECT '========================================'
UNION ALL SELECT ''
UNION ALL SELECT '作成されたデータ:'
UNION ALL SELECT '- 掲示板: 3件 (DEMO01, ART001, PROG01)'
UNION ALL SELECT '- 作品投稿: 1件 (DEMO01掲示板)'
UNION ALL SELECT '- レビュー: 0件'
UNION ALL SELECT ''
UNION ALL SELECT '次のステップ:'
UNION ALL SELECT '1. http://localhost:3000/board にアクセス'
UNION ALL SELECT '2. コード「DEMO01」を入力'
UNION ALL SELECT '3. 掲示板をテスト！'
UNION ALL SELECT '========================================';
