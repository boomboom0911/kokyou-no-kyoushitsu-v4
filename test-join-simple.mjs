import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await supabase
  .from('interactions')
  .select('*, students(id, display_name)')
  .eq('student_id', -999)
  .limit(3);

console.log('Teacher comments:', data?.length || 0);
if (data) {
  data.forEach(c => console.log(`  - student_id: ${c.student_id}, hasStudents: ${!!c.students}`));
}
