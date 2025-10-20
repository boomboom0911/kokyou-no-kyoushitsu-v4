// Supabase JOIN のテスト
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJoin() {
  console.log('Testing interactions JOIN with students...\n');

  // テスト1: 全てのコメントを取得（JOINあり）
  const { data: withJoin, error: joinError } = await supabase
    .from('interactions')
    .select(`
      *,
      students (
        id,
        display_name,
        student_number
      )
    `)
    .eq('type', 'comment')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('Test 1: With JOIN');
  console.log('Error:', joinError?.message || 'None');
  console.log('Count:', withJoin?.length || 0);
  if (withJoin && withJoin.length > 0) {
    console.log('Sample data:');
    withJoin.slice(0, 3).forEach(item => {
      console.log(`  - ID: ${item.id}, student_id: ${item.student_id}, hasStudents: ${!!item.students}`);
      if (item.students) {
        console.log(`    Student: ${item.students.display_name}`);
      }
    });
  }

  console.log('\n---\n');

  // テスト2: 教員のコメントのみを取得
  const { data: teacherComments, error: teacherError } = await supabase
    .from('interactions')
    .select(`
      *,
      students (
        id,
        display_name,
        student_number
      )
    `)
    .eq('student_id', -999)
    .eq('type', 'comment')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('Test 2: Teacher comments (student_id = -999)');
  console.log('Error:', teacherError?.message || 'None');
  console.log('Count:', teacherComments?.length || 0);
  if (teacherComments && teacherComments.length > 0) {
    console.log('Sample data:');
    teacherComments.forEach(item => {
      console.log(`  - ID: ${item.id}, student_id: ${item.student_id}, hasStudents: ${!!item.students}`);
      if (item.students) {
        console.log(`    Student: ${item.students.display_name}`);
      } else {
        console.log(`    Student: null (JOIN failed)`);
      }
    });
  }

  console.log('\n---\n');

  // テスト3: 教員レコードの存在確認
  const { data: teacherRecord, error: recordError } = await supabase
    .from('students')
    .select('*')
    .eq('id', -999)
    .single();

  console.log('Test 3: Teacher record in students table');
  console.log('Error:', recordError?.message || 'None');
  console.log('Exists:', !!teacherRecord);
  if (teacherRecord) {
    console.log('Data:', teacherRecord);
  }
}

testJoin().catch(console.error);
