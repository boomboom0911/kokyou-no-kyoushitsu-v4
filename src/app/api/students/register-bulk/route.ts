import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/types';

interface StudentRow {
  email: string;
  displayName: string;
  studentNumber: string;
  classId: number | null;
}

interface BulkRegistrationResult {
  success_count: number;
  failed_count: number;
  errors: Array<{ email: string; error: string }>;
  successful_students: Array<{ email: string; displayName: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { students } = body as { students: StudentRow[] };

    // バリデーション
    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '生徒データが指定されていません',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const result: BulkRegistrationResult = {
      success_count: 0,
      failed_count: 0,
      errors: [],
      successful_students: [],
    };

    // 各生徒を順番に処理
    for (const student of students) {
      const { email, displayName, studentNumber, classId } = student;

      // 個別バリデーション
      if (!email || !displayName || !studentNumber) {
        result.failed_count++;
        result.errors.push({
          email: email || '(メールアドレス不明)',
          error: 'メールアドレス、表示名、学籍番号は必須です',
        });
        continue;
      }

      // メールアドレスの重複チェック
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('google_email', email)
        .single();

      if (existingStudent) {
        result.failed_count++;
        result.errors.push({
          email,
          error: 'このメールアドレスは既に登録されています',
        });
        continue;
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
        result.failed_count++;
        result.errors.push({
          email,
          error: '登録に失敗しました',
        });
        continue;
      }

      // 成功
      result.success_count++;
      result.successful_students.push({
        email,
        displayName,
      });
    }

    // 結果を返す
    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `${result.success_count}件の生徒を登録しました${
          result.failed_count > 0 ? `（${result.failed_count}件失敗）` : ''
        }`,
      } as ApiResponse<BulkRegistrationResult>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Bulk register students API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '一括登録中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
