import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/debug/check-teacher
 * 教員・ゲスト用のstudentレコードが存在するか確認
 */
export async function GET(request: NextRequest) {
  try {
    // 教員レコード確認
    const { data: teacher, error: teacherError } = await supabase
      .from('students')
      .select('*')
      .eq('id', -999)
      .single();

    // ゲストレコード確認
    const { data: guest, error: guestError } = await supabase
      .from('students')
      .select('*')
      .eq('id', -1)
      .single();

    // 最近のチャットメッセージを確認（教員のメッセージがあるか）
    const { data: teacherChats, error: chatError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('student_id', -999)
      .order('created_at', { ascending: false })
      .limit(5);

    // 最近のコメントを確認（教員のコメントがあるか）
    const { data: teacherComments, error: commentError } = await supabase
      .from('interactions')
      .select('*')
      .eq('student_id', -999)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        teacher: {
          exists: !!teacher,
          data: teacher,
          error: teacherError?.message || null,
        },
        guest: {
          exists: !!guest,
          data: guest,
          error: guestError?.message || null,
        },
        teacherChats: {
          count: teacherChats?.length || 0,
          data: teacherChats,
          error: chatError?.message || null,
        },
        teacherComments: {
          count: teacherComments?.length || 0,
          data: teacherComments,
          error: commentError?.message || null,
        },
      },
    });
  } catch (error) {
    console.error('Debug check-teacher error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'エラーが発生しました',
      },
      { status: 500 }
    );
  }
}
