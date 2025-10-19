import { NextRequest, NextResponse } from 'next/server';
import { getBoardStats } from '@/lib/board/supabase-client';

/**
 * GET /api/board/[id]/stats
 * 掲示板の統計情報を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stats = await getBoardStats(params.id);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Get board stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '統計情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
