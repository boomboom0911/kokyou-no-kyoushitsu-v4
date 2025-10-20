import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/fix-teacher-records
 * 教員・ゲスト用のstudentレコードを作成（冪等性あり）
 */
export async function POST(request: NextRequest) {
  try {
    // まず既存のレコードを確認
    const { data: existingTeacher } = await supabase
      .from('students')
      .select('*')
      .eq('id', -999)
      .single();

    const { data: existingGuest } = await supabase
      .from('students')
      .select('*')
      .eq('id', -1)
      .single();

    let teacherError = null;
    let guestError = null;

    // 教員レコードが存在しない場合のみ作成
    if (!existingTeacher) {
      const result = await supabase
        .from('students')
        .insert({
          id: -999,
          google_email: 'teacher@system.local',
          class_id: null,
          student_number: 'TEACHER',
          display_name: '教員',
        })
        .select()
        .single();
      teacherError = result.error;
    }

    // ゲストレコードが存在しない場合のみ作成
    if (!existingGuest) {
      const result = await supabase
        .from('students')
        .insert({
          id: -1,
          google_email: 'guest@system.local',
          class_id: null,
          student_number: 'GUEST',
          display_name: 'ゲスト',
        })
        .select()
        .single();
      guestError = result.error;
    }

    // 確認
    const { data: teacherCheck } = await supabase
      .from('students')
      .select('*')
      .eq('id', -999)
      .single();

    const { data: guestCheck } = await supabase
      .from('students')
      .select('*')
      .eq('id', -1)
      .single();

    return NextResponse.json({
      success: true,
      message: '教員・ゲストレコードを作成しました',
      data: {
        teacher: {
          created: !teacherError,
          data: teacherCheck,
          error: teacherError?.message || null,
        },
        guest: {
          created: !guestError,
          data: guestCheck,
          error: guestError?.message || null,
        },
      },
    });
  } catch (error) {
    console.error('Fix teacher records error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'エラーが発生しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
