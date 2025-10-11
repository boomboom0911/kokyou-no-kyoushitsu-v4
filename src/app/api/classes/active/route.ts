import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/classes/active
 * 生徒データに紐づいているクラスのみを取得
 */
export async function GET() {
  try {
    // 生徒データに存在するclass_idを取得（重複なし、nullを除外）
    const { data: studentClasses, error: studentsError } = await supabase
      .from('students')
      .select('class_id')
      .not('class_id', 'is', null);

    if (studentsError) throw studentsError;

    // class_idのユニークなリストを作成
    const activeClassIds = [...new Set(
      studentClasses?.map((s) => s.class_id).filter((id) => id !== null) || []
    )];

    if (activeClassIds.length === 0) {
      // 生徒データにクラスが紐づいていない場合は空配列を返す
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // 該当するクラスデータを取得
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .in('id', activeClassIds)
      .order('grade', { ascending: true })
      .order('name', { ascending: true });

    if (classesError) throw classesError;

    return NextResponse.json({
      success: true,
      data: classes || [],
    });
  } catch (error) {
    console.error('Failed to fetch active classes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'アクティブなクラス一覧の取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
