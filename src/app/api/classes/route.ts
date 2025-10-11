import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/classes - クラス一覧を取得
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('grade', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
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
