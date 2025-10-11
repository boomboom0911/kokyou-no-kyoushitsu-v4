import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse, PortfolioEntry } from '@/types';

/**
 * GET /api/students/{studentId}/portfolio?tag={tag}&favorite={bool}
 * ポートフォリオを取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const tag = searchParams.get('tag');
    const favorite = searchParams.get('favorite');

    // 学習メモをベースにポートフォリオを構築
    let query = supabase
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

    // タグフィルタ
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // お気に入りフィルタ
    if (favorite === 'true') {
      query = query.eq('is_favorite', true);
    }

    const { data: memos, error: memosError } = await query;

    if (memosError) {
      console.error('Failed to fetch learning memos:', memosError);
      return NextResponse.json(
        {
          success: false,
          error: 'ポートフォリオの取得に失敗しました',
        } as ApiResponse<never>,
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

        // セッション情報がある場合
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

          // 反応したトピックを取得
          const { data: reactions } = await supabase
            .from('reactions')
            .select(`
              *,
              topic_posts (
                id,
                content,
                students (
                  display_name
                )
              )
            `)
            .eq('student_id', studentId)
            .eq('target_type', 'topic');

          if (reactions && reactions.length > 0) {
            entry.reacted_topics = reactions
              .filter((r) => r.topic_posts)
              .map((r) => ({
                topic_id: r.target_id,
                topic_content: r.topic_posts.content,
                author_name: r.topic_posts.students?.display_name || '不明',
                reaction_type: r.reaction_type as any,
                reacted_at: r.created_at,
              }));
          }

          // コメントしたトピックを取得
          const { data: interactions } = await supabase
            .from('interactions')
            .select(`
              *,
              topic_posts (
                id,
                content,
                students (
                  display_name
                )
              )
            `)
            .eq('student_id', studentId)
            .eq('target_type', 'topic');

          if (interactions && interactions.length > 0) {
            entry.commented_topics = interactions
              .filter((i) => i.topic_posts)
              .map((i) => ({
                topic_id: i.target_id,
                topic_content: i.topic_posts.content,
                author_name: i.topic_posts.students?.display_name || '不明',
                my_comment: i.comment_text,
                commented_at: i.created_at,
              }));
          }
        }

        return entry;
      })
    );

    const response: ApiResponse<{ memos: PortfolioEntry[] }> = {
      success: true,
      data: {
        memos: portfolioEntries,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET portfolio error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ポートフォリオ取得中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
