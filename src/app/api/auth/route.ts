import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse, AuthResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionCode, studentEmail } = body;

    // バリデーション
    if (!sessionCode || !studentEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'セッションコードとメールアドレスは必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // セッションコード形式チェック（4桁の英数字）
    if (!/^[A-Z0-9]{4}$/.test(sessionCode)) {
      return NextResponse.json(
        {
          success: false,
          error: 'セッションコードは4桁の英数字である必要があります',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // メールアドレス形式チェック
    if (!studentEmail.includes('@')) {
      return NextResponse.json(
        {
          success: false,
          error: '有効なメールアドレスを入力してください',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // セッション存在確認
    const { data: session, error: sessionError } = await supabase
      .from('lesson_sessions')
      .select('*')
      .eq('code', sessionCode)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: 'セッションが見つからないか、終了しています',
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // 生徒情報取得または作成
    let { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('google_email', studentEmail)
      .single();

    if (studentError && studentError.code === 'PGRST116') {
      // 生徒が存在しない場合は新規作成
      const displayName = studentEmail.split('@')[0]; // メールアドレスからデフォルト名生成
      const studentNumber = displayName; // 仮の出席番号

      const { data: newStudent, error: createError } = await supabase
        .from('students')
        .insert({
          google_email: studentEmail,
          display_name: displayName,
          student_number: studentNumber,
          class_id: session.class_id,
        })
        .select()
        .single();

      if (createError || !newStudent) {
        console.error('Failed to create student:', createError);
        return NextResponse.json(
          {
            success: false,
            error: '生徒情報の作成に失敗しました',
          } as ApiResponse<never>,
          { status: 500 }
        );
      }

      student = newStudent;
    } else if (studentError) {
      console.error('Failed to fetch student:', studentError);
      return NextResponse.json(
        {
          success: false,
          error: '生徒情報の取得に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: '生徒情報が見つかりません',
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // 認証成功
    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        student: {
          id: student.id,
          display_name: student.display_name,
          google_email: student.google_email,
          student_number: student.student_number,
          class_id: student.class_id,
        },
        session: {
          id: session.id,
          code: session.code,
          topic_title: session.topic_title,
          topic_content: session.topic_content,
          date: session.date,
          period: session.period,
          is_active: session.is_active,
          started_at: session.started_at,
          ended_at: session.ended_at,
          class_id: session.class_id,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '認証処理中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
