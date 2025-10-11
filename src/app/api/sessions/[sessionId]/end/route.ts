import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/types';

/**
 * POST /api/sessions/{sessionId}/end
 * セッションを終了し、欠席者を確定する
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const sessionIdNum = parseInt(sessionId, 10);

    // セッション情報を取得
    const { data: session, error: sessionError } = await supabase
      .from('lesson_sessions')
      .select('*, classes(name)')
      .eq('id', sessionIdNum)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: 'セッションが見つかりません',
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // クラスが選択されている場合のみ欠席者を記録
    if (session.class_id) {
      // クラスの全生徒を取得
      const { data: allStudents } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', session.class_id);

      // セッションに参加した生徒を取得
      const { data: attendees } = await supabase
        .from('seat_assignments')
        .select('student_id')
        .eq('session_id', sessionIdNum);

      const attendeeIds = new Set(attendees?.map((a) => a.student_id) || []);
      const absenteeIds = allStudents
        ?.filter((s) => !attendeeIds.has(s.id))
        .map((s) => s.id) || [];

      // 欠席記録を作成（既存の記録があれば上書き）
      if (absenteeIds.length > 0) {
        const absenteeRecords = absenteeIds.map((studentId) => ({
          session_id: sessionIdNum,
          student_id: studentId,
        }));

        // 既存の欠席記録を削除
        await supabase
          .from('absentees')
          .delete()
          .eq('session_id', sessionIdNum);

        // 新しい欠席記録を挿入
        const { error: absenteeError } = await supabase
          .from('absentees')
          .insert(absenteeRecords);

        if (absenteeError) {
          console.error('Failed to record absentees:', absenteeError);
        }
      }
    }

    // セッションを終了状態にマーク（ended_atを設定）
    const { error: updateError } = await supabase
      .from('lesson_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionIdNum);

    if (updateError) {
      console.error('Failed to mark session as ended:', updateError);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'セッションを終了しました',
        },
      } as ApiResponse<{ message: string }>,
      { status: 200 }
    );
  } catch (error) {
    console.error('POST sessions/[sessionId]/end error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'セッション終了処理に失敗しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
