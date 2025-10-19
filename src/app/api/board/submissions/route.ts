import { NextRequest, NextResponse } from 'next/server';
import { getSubmissions } from '@/lib/board/supabase-client';

/**
 * GET /api/board/submissions?boardId=xxx&sortBy=new&page=1
 * 作品一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');
    const sortBy = searchParams.get('sortBy') || 'new';
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    if (!boardId) {
      return NextResponse.json(
        { success: false, error: 'boardId is required' },
        { status: 400 }
      );
    }

    let submissions = await getSubmissions(boardId, page, perPage);

    // ソート処理
    if (sortBy === 'popular') {
      // 人気順: レビュー数 > 閲覧数
      submissions = submissions.sort((a, b) => {
        if (b.review_count_actual !== a.review_count_actual) {
          return b.review_count_actual - a.review_count_actual;
        }
        return b.view_count - a.view_count;
      });
    } else if (sortBy === 'needsReview') {
      // レビュー待ち: レビュー数が少ない順
      submissions = submissions.sort((a, b) => {
        return a.review_count_actual - b.review_count_actual;
      });
    }
    // sortBy === 'new' の場合はすでに created_at DESC でソート済み

    return NextResponse.json({
      success: true,
      data: submissions,
      pagination: {
        page,
        perPage,
        total: submissions.length,
        hasMore: submissions.length === perPage,
      },
    });
  } catch (error: any) {
    console.error('Get submissions error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '作品一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
