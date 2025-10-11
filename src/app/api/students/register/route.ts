import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, displayName, studentNumber, classId } = body;

    // バリデーション
    if (!email || !displayName || !studentNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'メールアドレス、表示名、学籍番号は必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // メールアドレスの重複チェック
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('google_email', email)
      .single();

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          error: 'このメールアドレスは既に登録されています',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // 生徒を登録
    const { data: newStudent, error: createError } = await supabase
      .from('students')
      .insert({
        google_email: email,
        display_name: displayName,
        student_number: studentNumber,
        class_id: classId || null,
      })
      .select()
      .single();

    if (createError || !newStudent) {
      console.error('Failed to create student:', createError);
      return NextResponse.json(
        {
          success: false,
          error: '生徒の登録に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newStudent,
        message: `生徒「${displayName}」を登録しました`,
      } as ApiResponse<typeof newStudent>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Register student API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '生徒登録中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
