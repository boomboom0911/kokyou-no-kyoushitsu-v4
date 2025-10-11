import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse, SeatAssignment } from '@/types';
import { isValidSeatNumber } from '@/lib/seat-utils';

/**
 * POST /api/seats/select
 * 座席を選択
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, seatNumber, studentEmail } = body;

    // バリデーション
    if (!sessionId || !seatNumber || !studentEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'セッションID、座席番号、メールアドレスは必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // 座席番号の範囲チェック
    if (!isValidSeatNumber(seatNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: '座席番号は1〜42の範囲で指定してください',
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

    // 既にこのセッションで座席を選択済みかチェック
    const { data: existingAssignment } = await supabase
      .from('seat_assignments')
      .select('*')
      .eq('session_id', sessionId)
      .eq('student_id', student.id)
      .single();

    if (existingAssignment) {
      return NextResponse.json(
        {
          success: false,
          error: '既に座席を選択済みです',
        } as ApiResponse<never>,
        { status: 409 }
      );
    }

    // 指定された座席が既に使用されているかチェック
    const { data: seatTaken } = await supabase
      .from('seat_assignments')
      .select('*')
      .eq('session_id', sessionId)
      .eq('seat_number', seatNumber)
      .single();

    if (seatTaken) {
      return NextResponse.json(
        {
          success: false,
          error: 'この座席は既に使用されています',
        } as ApiResponse<never>,
        { status: 409 }
      );
    }

    // 座席割り当て作成
    const { data: assignment, error: assignmentError } = await supabase
      .from('seat_assignments')
      .insert({
        session_id: sessionId,
        student_id: student.id,
        seat_number: seatNumber,
      })
      .select()
      .single();

    if (assignmentError || !assignment) {
      console.error('Failed to create seat assignment:', assignmentError);
      return NextResponse.json(
        {
          success: false,
          error: '座席の割り当てに失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    const response: ApiResponse<SeatAssignment & { student: typeof student }> = {
      success: true,
      data: {
        id: assignment.id,
        session_id: assignment.session_id,
        student_id: assignment.student_id,
        seat_number: assignment.seat_number as any, // SeatNumber型として扱う
        created_at: assignment.created_at,
        student: {
          id: student.id,
          display_name: student.display_name,
          google_email: student.google_email,
          student_number: student.student_number,
          class_id: student.class_id,
        },
      },
      message: `座席 ${seatNumber} を選択しました`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST seats/select error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '座席選択中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
