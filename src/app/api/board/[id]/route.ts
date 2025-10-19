import { NextRequest, NextResponse } from 'next/server';
import { getBoardById } from '@/lib/board/supabase-client';

/**
 * GET /api/board/[id]
 * IDから掲示板を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const board = await getBoardById(params.id);

    if (!board) {
      return NextResponse.json(
        { success: false, error: '掲示板が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: board,
    });
  } catch (error: any) {
    console.error('Get board error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '掲示板の取得に失敗しました' },
      { status: 500 }
    );
  }
}
