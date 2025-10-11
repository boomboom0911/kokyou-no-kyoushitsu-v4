import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse, Student } from '@/types';

/**
 * POST /api/auth/simple
 * メールアドレスのみで簡易認証（ポートフォリオアクセス用）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentEmail } = body;

    // バリデーション
    if (!studentEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'メールアドレスは必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // 生徒情報を取得
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('google_email', studentEmail)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        {
          success: false,
          error: '登録されていないメールアドレスです',
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    const response: ApiResponse<{ student: Student }> = {
      success: true,
      data: {
        student: {
          id: student.id,
          display_name: student.display_name,
          google_email: student.google_email,
          student_number: student.student_number,
          class_id: student.class_id,
        },
      },
      message: 'ログインしました',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('POST auth/simple error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '認証中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
