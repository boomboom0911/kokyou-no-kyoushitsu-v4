import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse, SeatWithStudent } from '@/types';

interface SessionDetails {
  seats: SeatWithStudent[];
  chat_count: number;
}

/**
 * GET /api/sessions/{sessionId}/details
 * セッションの詳細情報を取得（座席情報＋チャット件数）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const sessionIdNum = parseInt(sessionId, 10);

    // 座席情報を取得
    const { data: seatAssignments, error: seatsError } = await supabase
      .from('seat_assignments')
      .select(`
        id,
        seat_number,
        students (
          id,
          display_name,
          google_email,
          student_number,
          class_id
        )
      `)
      .eq('session_id', sessionIdNum)
      .order('seat_number');

    if (seatsError) {
      console.error('Failed to fetch seats:', seatsError);
      return NextResponse.json(
        {
          success: false,
          error: '座席情報の取得に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    // 各座席のトピック投稿を取得
    const seats: SeatWithStudent[] = await Promise.all(
      (seatAssignments || []).map(async (assignment) => {
        // トピック投稿を取得
        const { data: topicPost } = await supabase
          .from('topic_posts')
          .select('*')
          .eq('session_id', sessionIdNum)
          .eq('student_id', assignment.students.id)
          .single();

        return {
          seat_number: assignment.seat_number,
          seat_assignment_id: assignment.id,
          student: {
            id: assignment.students.id,
            display_name: assignment.students.display_name,
            google_email: assignment.students.google_email,
            student_number: assignment.students.student_number,
            class_id: assignment.students.class_id,
          },
          topic_post: topicPost || null,
        };
      })
    );

    // チャット件数を取得
    const { count: chatCount } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionIdNum);

    const response: ApiResponse<SessionDetails> = {
      success: true,
      data: {
        seats,
        chat_count: chatCount || 0,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET session details error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'セッション詳細取得中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
