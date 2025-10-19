import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { stringify } from 'csv-stringify/sync';

/**
 * GET /api/board/[id]/export?type=submissions|reviews
 * CSV出力
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const exportType = searchParams.get('type') || 'submissions';
    const boardId = params.id;

    if (exportType === 'submissions') {
      // 提出一覧CSV
      const { data: submissions, error } = await supabase
        .from('submission_with_stats')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const csvData = submissions?.map((s) => ({
        クラス: s.class_id || '',
        出席番号: s.student_number,
        氏名: s.student_name,
        タイトル: s.title,
        説明: s.description || '',
        URL: s.work_url,
        閲覧数: s.view_count,
        受取レビュー数: s.review_count_actual,
        実施レビュー数: s.reviews_given_count,
        投稿日時: new Date(s.created_at).toLocaleString('ja-JP'),
      })) || [];

      const csv = stringify(csvData, {
        header: true,
        bom: true,
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="submissions_${boardId}.csv"`,
        },
      });
    } else if (exportType === 'reviews') {
      // レビュー詳細CSV
      const { data: reviews, error } = await supabase
        .from('peer_reviews')
        .select(`
          *,
          submission:submissions!inner(
            id,
            title,
            student_id,
            board_id,
            author:students!submissions_student_id_fkey(
              student_number,
              display_name
            )
          ),
          reviewer:students!peer_reviews_reviewer_id_fkey(
            student_number,
            display_name
          )
        `)
        .eq('submission.board_id', boardId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const csvData = reviews?.map((r: any) => ({
        作品タイトル: r.submission?.title || '',
        投稿者: r.submission?.author?.display_name || '',
        レビュアー: r.reviewer?.display_name || '',
        良い点: (r.strengths || []).join(' / '),
        改善提案: (r.suggestions || []).join(' / '),
        質問: (r.questions || []).join(' / '),
        総合コメント: r.overall_comment || '',
        文字数: r.character_count,
        参考になった数: r.helpful_count,
        投稿日時: new Date(r.created_at).toLocaleString('ja-JP'),
      })) || [];

      const csv = stringify(csvData, {
        header: true,
        bom: true,
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="reviews_${boardId}.csv"`,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid export type' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'エクスポートに失敗しました' },
      { status: 500 }
    );
  }
}
