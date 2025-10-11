import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/admin/students
 * 全生徒データを取得（クラス情報含む）
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        classes:class_id (
          id,
          name,
          grade
        )
      `)
      .order('class_id', { ascending: true })
      .order('student_number', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Failed to fetch students:', error);
    return NextResponse.json(
      {
        success: false,
        error: '生徒データの取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
