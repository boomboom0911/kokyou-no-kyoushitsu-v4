import { NextRequest, NextResponse } from 'next/server';
import { getSubmissionById } from '@/lib/board/supabase-client';

/**
 * GET /api/board/submission/[id]
 * 作品詳細を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const submission = await getSubmissionById(id);

    if (!submission) {
      return NextResponse.json(
        { success: false, error: '作品が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error: any) {
    console.error('Get submission error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '作品の取得に失敗しました' },
      { status: 500 }
    );
  }
}
