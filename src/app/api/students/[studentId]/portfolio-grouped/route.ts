import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  ApiResponse,
  GroupedPortfolio,
  SessionPortfolio,
  MyTopicCard,
  ReactedTopicCard,
  CommentedTopicCard,
  QuickMemoCard,
  PortfolioCard,
  ReactionCounts,
} from '@/types';

/**
 * GET /api/students/{studentId}/portfolio-grouped
 * セッションごとにグループ化されたポートフォリオを取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const studentIdNum = parseInt(studentId, 10);

    // 1. 生徒が参加した全セッションを取得
    const { data: seatAssignments, error: seatError } = await supabase
      .from('seat_assignments')
      .select(`
        session_id,
        seat_number,
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
      .eq('student_id', studentIdNum)
      .order('lesson_sessions(date)', { ascending: false })
      .order('lesson_sessions(period)', { ascending: false });

    if (seatError) {
      console.error('Failed to fetch seat assignments:', seatError);
      return NextResponse.json(
        {
          success: false,
          error: 'セッション情報の取得に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    if (!seatAssignments || seatAssignments.length === 0) {
      // セッションに参加していない場合は空配列を返す
      return NextResponse.json(
        {
          success: true,
          data: { sessions: [] } as GroupedPortfolio,
        } as ApiResponse<GroupedPortfolio>,
        { status: 200 }
      );
    }

    // 2. 各セッションのカードを構築
    const sessionPortfolios: SessionPortfolio[] = await Promise.all(
      seatAssignments.map(async (assignment) => {
        const session = assignment.lesson_sessions;
        const sessionId = assignment.session_id;
        const cards: PortfolioCard[] = [];

        // 2-1. 自分のトピック投稿を取得
        const { data: myTopic } = await supabase
          .from('topic_posts')
          .select('id, content, created_at')
          .eq('session_id', sessionId)
          .eq('student_id', studentIdNum)
          .single();

        if (myTopic) {
          // リアクション数を取得
          const { data: reactions } = await supabase
            .from('reactions')
            .select('reaction_type')
            .eq('target_type', 'topic')
            .eq('target_id', myTopic.id);

          const reactionCounts: ReactionCounts = {
            surprise: reactions?.filter((r) => r.reaction_type === 'surprise').length || 0,
            understand: reactions?.filter((r) => r.reaction_type === 'understand').length || 0,
            question: reactions?.filter((r) => r.reaction_type === 'question').length || 0,
          };

          // コメント数を取得
          const { data: comments } = await supabase
            .from('interactions')
            .select('id')
            .eq('target_type', 'topic')
            .eq('target_id', myTopic.id);

          const myTopicCard: MyTopicCard = {
            type: 'my_topic',
            topic_id: myTopic.id,
            content: myTopic.content,
            created_at: myTopic.created_at,
            seat_number: assignment.seat_number,
            reactions_count: reactionCounts,
            comments_count: comments?.length || 0,
          };

          cards.push(myTopicCard);
        }

        // 2-2. リアクションしたトピックを取得（自分の投稿は除外）
        const { data: reactedTopics } = await supabase
          .from('reactions')
          .select(`
            reaction_type,
            created_at,
            topic_posts (
              id,
              content,
              student_id
            )
          `)
          .eq('student_id', studentIdNum)
          .eq('target_type', 'topic')
          .neq('topic_posts.student_id', studentIdNum);

        if (reactedTopics) {
          // セッションIDでフィルタリング（JOINで取得できないため手動フィルタ）
          const { data: sessionTopicIds } = await supabase
            .from('topic_posts')
            .select('id')
            .eq('session_id', sessionId);

          const sessionTopicIdSet = new Set(sessionTopicIds?.map((t) => t.id) || []);

          reactedTopics
            .filter((r) => r.topic_posts && sessionTopicIdSet.has(r.topic_posts.id))
            .forEach((r) => {
              if (r.topic_posts) {
                const reactedCard: ReactedTopicCard = {
                  type: 'reacted_topic',
                  topic_id: r.topic_posts.id,
                  content: r.topic_posts.content,
                  my_reaction_type: r.reaction_type as any,
                  reacted_at: r.created_at,
                };
                cards.push(reactedCard);
              }
            });
        }

        // 2-3. コメントしたトピックを取得（自分の投稿は除外）
        const { data: commentedTopics } = await supabase
          .from('interactions')
          .select(`
            comment_text,
            created_at,
            topic_posts (
              id,
              content,
              student_id
            )
          `)
          .eq('student_id', studentIdNum)
          .eq('target_type', 'topic')
          .neq('topic_posts.student_id', studentIdNum);

        if (commentedTopics) {
          // セッションIDでフィルタリング
          const { data: sessionTopicIds } = await supabase
            .from('topic_posts')
            .select('id')
            .eq('session_id', sessionId);

          const sessionTopicIdSet = new Set(sessionTopicIds?.map((t) => t.id) || []);

          commentedTopics
            .filter((c) => c.topic_posts && sessionTopicIdSet.has(c.topic_posts.id))
            .forEach((c) => {
              if (c.topic_posts) {
                const commentedCard: CommentedTopicCard = {
                  type: 'commented_topic',
                  topic_id: c.topic_posts.id,
                  content: c.topic_posts.content,
                  my_comment: c.comment_text,
                  commented_at: c.created_at,
                };
                cards.push(commentedCard);
              }
            });
        }

        // 2-4. クイックメモを取得
        const { data: quickMemos } = await supabase
          .from('learning_memos')
          .select('id, content, tags, is_favorite, created_at')
          .eq('session_id', sessionId)
          .eq('student_id', studentIdNum)
          .order('created_at', { ascending: true });

        if (quickMemos) {
          quickMemos.forEach((memo) => {
            const memoCard: QuickMemoCard = {
              type: 'quick_memo',
              memo_id: memo.id,
              content: memo.content,
              tags: memo.tags || [],
              is_favorite: memo.is_favorite,
              created_at: memo.created_at,
            };
            cards.push(memoCard);
          });
        }

        // カードを作成日時順にソート
        cards.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeA - timeB;
        });

        return {
          session_id: sessionId,
          session_code: session.code,
          topic_title: session.topic_title,
          session_date: session.date,
          period: session.period,
          class_name: session.classes?.name,
          seat_number: assignment.seat_number,
          cards,
        } as SessionPortfolio;
      })
    );

    const response: ApiResponse<GroupedPortfolio> = {
      success: true,
      data: {
        sessions: sessionPortfolios,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET portfolio-grouped error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ポートフォリオ取得中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
