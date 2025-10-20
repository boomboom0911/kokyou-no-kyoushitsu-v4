import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/fix-teacher-records
 * 教員・ゲスト用のstudentレコードを作成（冪等性あり）
 */
export async function POST(request: NextRequest) {
  try {
    // 教員レコードを作成
    const { data: teacher, error: teacherError } = await supabase
      .from('students')
      .upsert({
        id: -999,
        google_email: 'teacher@system.local',
        class_id: null,
        student_number: 'TEACHER',
        display_name: '教員',
      }, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    // ゲストレコードを作成
    const { data: guest, error: guestError } = await supabase
      .from('students')
      .upsert({
        id: -1,
        google_email: 'guest@system.local',
        class_id: null,
        student_number: 'GUEST',
        display_name: 'ゲスト',
      }, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

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
