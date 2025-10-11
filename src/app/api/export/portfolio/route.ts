import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { portfolioToCSV } from '@/lib/csv-export';
import { PortfolioEntry } from '@/types';

/**
 * GET /api/export/portfolio?studentId={id}&format=csv
 * ポートフォリオをCSV形式でエクスポート
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const format = searchParams.get('format') || 'csv';

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          error: '生徒IDは必須です',
        },
        { status: 400 }
      );
    }

    if (format !== 'csv') {
      return NextResponse.json(
        {
          success: false,
          error: '現在サポートされている形式はCSVのみです',
        },
        { status: 400 }
      );
    }

    // ポートフォリオデータを取得（APIを直接呼ぶのではなく、同じロジックを使用）
    const { data: memos, error: memosError } = await supabase
      .from('learning_memos')
      .select(`
        *,
        lesson_sessions (
          id,
          code,
          topic_title,
          date,
          period,
          class_id,
          classes (
            name
          )
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (memosError) {
      console.error('Failed to fetch learning memos:', memosError);
      return NextResponse.json(
        {
          success: false,
          error: 'ポートフォリオの取得に失敗しました',
        },
        { status: 500 }
      );
    }

    // 各メモに対して関連情報を取得
    const portfolioEntries: PortfolioEntry[] = await Promise.all(
      (memos || []).map(async (memo) => {
        const entry: PortfolioEntry = {
          memo_id: memo.id,
          memo_content: memo.content,
          memo_tags: memo.tags,
          is_favorite: memo.is_favorite,
          memo_created_at: memo.created_at,
        };

        if (memo.lesson_sessions) {
          const session = memo.lesson_sessions;
          entry.session_id = session.id;
          entry.session_code = session.code;
          entry.topic_title = session.topic_title;
          entry.session_date = session.date;
          entry.period = session.period;
          entry.class_name = session.classes?.name;

          // 座席番号を取得
          const { data: seatAssignment } = await supabase
            .from('seat_assignments')
            .select('seat_number')
            .eq('session_id', session.id)
            .eq('student_id', studentId)
            .single();

          if (seatAssignment) {
            entry.seat_number = seatAssignment.seat_number as any;
          }

          // 自分のトピック投稿を取得
          const { data: topicPost } = await supabase
            .from('topic_posts')
            .select('content, created_at')
            .eq('session_id', session.id)
            .eq('student_id', studentId)
            .single();

          if (topicPost) {
            entry.my_topic_content = topicPost.content;
            entry.topic_created_at = topicPost.created_at;
          }

          // 反応数とコメント数を取得
          const { data: reactions } = await supabase
            .from('reactions')
            .select('id')
            .eq('student_id', studentId)
            .eq('target_type', 'topic');

          const { data: interactions } = await supabase
            .from('interactions')
            .select('id')
            .eq('student_id', studentId)
            .eq('target_type', 'topic');

          entry.reacted_topics = reactions || [];
          entry.commented_topics = interactions || [];
        }

        return entry;
      })
    );

    // CSV生成
    const csv = portfolioToCSV(portfolioEntries);

    // ファイル名を生成
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `portfolio_${studentId}_${timestamp}.csv`;

    // CSVレスポンスを返す
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export portfolio error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'エクスポート中にエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
