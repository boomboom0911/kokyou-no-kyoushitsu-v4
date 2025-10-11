import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/sessions/[sessionId]/absentees - セッションの欠席者リストを取得
export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = parseInt(params.sessionId);

    // セッション情報を取得してclass_idを確認
    const { data: session, error: sessionError } = await supabase
      .from('lesson_sessions')
      .select('class_id')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    // クラスが指定されていない場合は空配列を返す
    if (!session.class_id) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // クラスの全生徒を取得
    const { data: allStudents, error: studentsError } = await supabase
      .from('students')
      .select('id, student_number, display_name')
      .eq('class_id', session.class_id)
      .order('student_number', { ascending: true });

    if (studentsError) throw studentsError;

    // セッションに参加している生徒（座席を選択した生徒）を取得
    const { data: attendees, error: attendeesError } = await supabase
      .from('seat_assignments')
      .select('student_id')
      .eq('session_id', sessionId);

    if (attendeesError) throw attendeesError;

    // 参加者のIDセット
    const attendeeIds = new Set(attendees.map((a) => a.student_id));

    // 欠席者 = 全生徒 - 参加者
    const absentees = allStudents.filter((student) => !attendeeIds.has(student.id));

    return NextResponse.json({
      success: true,
      data: {
        total: allStudents.length,
        attendees: attendees.length,
        absentees: absentees,
      },
    });
  } catch (error) {
    console.error('Failed to fetch absentees:', error);
    return NextResponse.json(
      {
        success: false,
        error: '欠席者リストの取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
