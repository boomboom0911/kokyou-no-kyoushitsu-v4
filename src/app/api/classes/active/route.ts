import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/classes/active
 * 全クラスを取得
 */
export async function GET() {
  try {
    // 全クラスを取得
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .order('grade', { ascending: true })
      .order('name', { ascending: true });

    if (classesError) throw classesError;

    return NextResponse.json({
      success: true,
      data: classes || [],
    });
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'クラス一覧の取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
