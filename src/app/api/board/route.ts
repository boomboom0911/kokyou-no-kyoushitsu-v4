import { NextRequest, NextResponse } from 'next/server';
import { getBoardByCode, getBoards } from '@/lib/board/supabase-client';

/**
 * GET /api/board?code=XXXX
 * 掲示板を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
      // コード指定の場合：単一の掲示板を取得
      const board = await getBoardByCode(code);

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
    } else {
      // コード未指定の場合：掲示板一覧を取得
      const boards = await getBoards('active');

      return NextResponse.json({
        success: true,
        data: boards,
      });
    }
  } catch (error: any) {
    console.error('Get board error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '掲示板の取得に失敗しました' },
      { status: 500 }
    );
  }
}
