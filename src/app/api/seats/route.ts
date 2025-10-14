import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse, SeatWithStudent } from '@/types';

/**
 * GET /api/seats?sessionId={sessionId}
 * セッションの座席配置を取得
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'セッションIDは必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // 座席割り当て情報を取得（生徒情報とトピック投稿も含む）
    const { data: assignments, error } = await supabase
      .from('seat_assignments')
      .select(`
        *,
        students (
          id,
          display_name,
          google_email,
          student_number,
          class_id
        ),
        topic_posts (
          id,
          content,
          created_at,
          updated_at
        )
      `)
      .eq('session_id', sessionId);

    if (error) {
      console.error('Failed to fetch seat assignments:', error);
      return NextResponse.json(
        {
          success: false,
          error: '座席情報の取得に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    // トピックIDのリストを取得
    const topicIds = (assignments || [])
      .filter((a) => a.topic_posts && a.topic_posts.length > 0)
      .map((a) => a.topic_posts[0].id);

    // リアクション数とコメント数を集計
    let reactionCounts: Record<number, number> = {};
    let commentCounts: Record<number, number> = {};

    if (topicIds.length > 0) {
      // リアクション数を取得
      const { data: reactions } = await supabase
        .from('reactions')
        .select('target_id')
        .eq('target_type', 'topic')
        .in('target_id', topicIds);

      if (reactions) {
        reactions.forEach((r) => {
          reactionCounts[r.target_id] = (reactionCounts[r.target_id] || 0) + 1;
        });
      }

      // コメント数を取得
      const { data: comments } = await supabase
        .from('interactions')
        .select('target_id')
        .eq('target_type', 'topic')
        .eq('type', 'comment')
        .in('target_id', topicIds);

      if (comments) {
        comments.forEach((c) => {
          commentCounts[c.target_id] = (commentCounts[c.target_id] || 0) + 1;
        });
      }
    }

    // 座席情報を整形（seat_assignment_idも含める）
    const seats = (assignments || []).map((assignment) => ({
      seat_number: assignment.seat_number,
      seat_assignment_id: assignment.id, // 座席割り当てID
      student: assignment.students
        ? {
            id: assignment.students.id,
            display_name: assignment.students.display_name,
            google_email: assignment.students.google_email,
            student_number: assignment.students.student_number,
            class_id: assignment.students.class_id,
          }
        : null,
      topic_post:
        assignment.topic_posts && assignment.topic_posts.length > 0
          ? {
              id: assignment.topic_posts[0].id,
              content: assignment.topic_posts[0].content,
              created_at: assignment.topic_posts[0].created_at,
              updated_at: assignment.topic_posts[0].updated_at,
              session_id: Number(sessionId),
              student_id: assignment.student_id,
              seat_assignment_id: assignment.id,
              reaction_count: reactionCounts[assignment.topic_posts[0].id] || 0,
              comment_count: commentCounts[assignment.topic_posts[0].id] || 0,
            }
          : null,
    }));

    const response: ApiResponse<SeatWithStudent[]> = {
      success: true,
      data: seats,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET seats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '座席情報の取得中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
