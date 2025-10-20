// Supabase JOIN のテスト
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Environment variables not loaded');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJoin() {
  console.log('Testing interactions JOIN with students...\n');

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

  console.log('Test: Teacher comments (student_id = -999)');
  console.log('Error:', teacherError?.message || 'None');
  console.log('Count:', teacherComments?.length || 0);
  if (teacherComments && teacherComments.length > 0) {
    console.log('Sample data:');
    teacherComments.forEach(item => {
      console.log(`  - ID: ${item.id}, student_id: ${item.student_id}, hasStudents: ${!!item.students}, comment: "${item.comment_text.substring(0, 30)}"`);
      if (item.students) {
        console.log(`    Student: ${item.students.display_name}`);
      } else {
        console.log(`    Student: null (JOIN failed)`);
      }
    });
  } else {
    console.log('  No teacher comments found');
  }

  console.log('\n---\n');

  // テスト3: 教員レコードの存在確認
  const { data: teacherRecord, error: recordError } = await supabase
    .from('students')
    .select('*')
    .eq('id', -999)
    .single();

  console.log('Test: Teacher record in students table');
  console.log('Error:', recordError?.message || 'None');
  console.log('Exists:', !!teacherRecord);
  if (teacherRecord) {
    console.log('Data:', { id: teacherRecord.id, display_name: teacherRecord.display_name, student_number: teacherRecord.student_number });
  }
}

testJoin().catch(console.error);
