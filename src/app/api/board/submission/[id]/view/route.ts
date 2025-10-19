import { NextRequest, NextResponse } from 'next/server';
import { incrementViewCount } from '@/lib/board/supabase-client';

/**
 * POST /api/board/submission/[id]/view
 * 閲覧数を増やす
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await incrementViewCount(params.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Increment view count error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '閲覧数の更新に失敗しました' },
      { status: 500 }
    );
  }
}
