import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/types';

/**
 * DELETE /api/seats/cancel
 * 座席選択をキャンセル（座席割り当てとトピック投稿を削除）
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, studentEmail } = body;

    // バリデーション
    if (!sessionId || !studentEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'セッションIDとメールアドレスは必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // 生徒情報取得
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('google_email', studentEmail)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        {
          success: false,
          error: '生徒情報が見つかりません',
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // 座席割り当て情報を取得
    const { data: assignment, error: assignmentError } = await supabase
      .from('seat_assignments')
      .select('*')
      .eq('session_id', sessionId)
      .eq('student_id', student.id)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        {
          success: false,
          error: '座席割り当てが見つかりません',
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // トピック投稿があれば削除（CASCADE設定されていない場合に備えて明示的に削除）
    const { error: topicDeleteError } = await supabase
      .from('topic_posts')
      .delete()
      .eq('seat_assignment_id', assignment.id);

    if (topicDeleteError) {
      console.error('Failed to delete topic post:', topicDeleteError);
      // トピックがない場合はエラーにしない（無視して続行）
    }

    // 座席割り当てを削除
    const { error: deleteError } = await supabase
      .from('seat_assignments')
      .delete()
      .eq('id', assignment.id);

    if (deleteError) {
      console.error('Failed to delete seat assignment:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: '座席のキャンセルに失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    const response: ApiResponse<{ seat_number: number }> = {
      success: true,
      data: {
        seat_number: assignment.seat_number,
      },
      message: `座席 ${assignment.seat_number} の選択をキャンセルしました`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('DELETE seats/cancel error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '座席キャンセル中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
