-- 現在データベースに登録されている生徒を確認
SELECT
  id,
  google_email,
  display_name,
  student_number,
  class_id,
  created_at
FROM students
ORDER BY id
LIMIT 10;
