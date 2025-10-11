import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/admin/list-tables
 * データベース内の全テーブル一覧とレコード数を取得
 */
export async function GET() {
  try {
    const tables = [
      'students',
      'classes',
      'lesson_sessions',
      'seat_assignments',
      'topic_posts',
      'reactions',
      'interactions',
      'quick_memos',
      'chat_messages',
    ];

    const results = await Promise.all(
      tables.map(async (table) => {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (error) {
            return { table, count: null, error: error.message };
          }

          return { table, count, error: null };
        } catch (err) {
          return { table, count: null, error: String(err) };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Failed to list tables:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'テーブル一覧の取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
