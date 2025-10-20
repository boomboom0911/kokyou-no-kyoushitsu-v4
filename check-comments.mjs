import { readFileSync } from 'fs';

// 環境変数を読み込み
const envContent = readFileSync('.env.local', 'utf-8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1];

if (!supabaseUrl || !supabaseKey) {
  console.error('環境変数が読み込めませんでした');
  process.exit(1);
}

console.log('=== 最近投稿されたコメントを確認 ===\n');

// Supabaseに直接クエリ
const response = await fetch(`${supabaseUrl}/rest/v1/interactions?select=*&type=eq.comment&order=created_at.desc&limit=5`, {
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
});

const comments = await response.json();
console.log(`最近のコメント数: ${comments.length}\n`);

if (comments.length > 0) {
  console.log('最新のコメント:');
  comments.forEach((comment, index) => {
    console.log(`${index + 1}. ID: ${comment.id}`);
    console.log(`   student_id: ${comment.student_id}`);
    console.log(`   target_type: ${comment.target_type}, target_id: ${comment.target_id}`);
    console.log(`   comment: "${comment.comment_text}"`);
    console.log(`   created_at: ${comment.created_at}\n`);
  });

  // 最新のコメントのトピックに対して、APIで取得してみる
  const latestComment = comments[0];
  console.log(`\n=== トピックID ${latestComment.target_id} のコメントをAPIで取得 ===\n`);

  const apiResponse = await fetch(`http://localhost:3000/api/interactions?targetType=${latestComment.target_type}&targetId=${latestComment.target_id}`);
  const apiData = await apiResponse.json();

  console.log('APIレスポンス:');
  console.log('success:', apiData.success);
  console.log('コメント数:', apiData.data?.length || 0);

  if (apiData.data && apiData.data.length > 0) {
    console.log('\n取得されたコメント:');
    apiData.data.forEach((c, index) => {
      console.log(`${index + 1}. student_id: ${c.student_id}, hasStudent: ${!!c.student}`);
      console.log(`   comment: "${c.comment_text}"`);
      if (c.student) {
        console.log(`   student.display_name: ${c.student.display_name}`);
      } else {
        console.log(`   student: null (JOIN失敗または教員レコードなし)`);
      }
    });
  }
} else {
  console.log('コメントが見つかりませんでした');
}
