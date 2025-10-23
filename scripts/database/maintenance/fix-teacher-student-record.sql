-- ============================================
-- 教員・ゲスト用の固定学生レコードを作成
-- ============================================
-- このSQLをSupabase SQL Editorで実行してください

-- 教員用の固定レコード (id = -999)
INSERT INTO students (id, google_email, class_id, student_number, display_name, created_at)
VALUES (-999, 'teacher@system.local', NULL, 'TEACHER', '教員', NOW())
ON CONFLICT (id) DO NOTHING;

-- ゲスト用の固定レコード (id = -1)
INSERT INTO students (id, google_email, class_id, student_number, display_name, created_at)
VALUES (-1, 'guest@system.local', NULL, 'GUEST', 'ゲスト', NOW())
ON CONFLICT (id) DO NOTHING;

-- 確認
SELECT id, student_number, display_name, google_email FROM students WHERE id IN (-999, -1) ORDER BY id;
