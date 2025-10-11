import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/admin/reset-classes
 * クラスデータをリセットして2-1〜2-5に更新
 */
export async function POST() {
  try {
    // 既存のクラスデータを全削除
    const { error: deleteError } = await supabase
      .from('classes')
      .delete()
      .neq('id', 0); // 全削除（id != 0は常にtrueなので全件削除）

    if (deleteError) {
      console.error('Failed to delete old classes:', deleteError);
      throw deleteError;
    }

    // 新しいクラスデータを作成（2-1〜2-5）
    const newClasses = [
      { name: '2-1', grade: 2 },
      { name: '2-2', grade: 2 },
      { name: '2-3', grade: 2 },
      { name: '2-4', grade: 2 },
      { name: '2-5', grade: 2 },
    ];

    const { data, error: insertError } = await supabase
      .from('classes')
      .insert(newClasses)
      .select();

    if (insertError) {
      console.error('Failed to insert new classes:', insertError);
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'クラスデータを更新しました（2-1〜2-5）',
    });
  } catch (error) {
    console.error('POST admin/reset-classes error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'クラスデータの更新に失敗しました',
      },
      { status: 500 }
    );
  }
}
