import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse, TopicPost } from '@/types';

/**
 * POST /api/topics/submit
 * トピック投稿を作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, seatAssignmentId, content } = body;

    // バリデーション
    if (!sessionId || !seatAssignmentId || !content) {
      return NextResponse.json(
        {
          success: false,
          error: 'セッションID、座席割り当てID、投稿内容は必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '投稿内容を入力してください',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // 座席割り当て情報を取得
    const { data: assignment, error: assignmentError } = await supabase
      .from('seat_assignments')
      .select('*')
      .eq('id', seatAssignmentId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        {
          success: false,
          error: '座席割り当て情報が見つかりません',
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // 既にこの座席でトピック投稿済みかチェック
    const { data: existingPost } = await supabase
      .from('topic_posts')
      .select('*')
      .eq('session_id', sessionId)
      .eq('student_id', assignment.student_id)
      .single();

    if (existingPost) {
      return NextResponse.json(
        {
          success: false,
          error: '既にトピックを投稿済みです',
        } as ApiResponse<never>,
        { status: 409 }
      );
    }

    // トピック投稿作成
    const { data: post, error: postError } = await supabase
      .from('topic_posts')
      .insert({
        session_id: sessionId,
        student_id: assignment.student_id,
        seat_assignment_id: seatAssignmentId,
        content: content.trim(),
      })
      .select()
      .single();

    if (postError || !post) {
      console.error('Failed to create topic post:', postError);
      return NextResponse.json(
        {
          success: false,
          error: 'トピックの投稿に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    const response: ApiResponse<TopicPost> = {
      success: true,
      data: {
        id: post.id,
        session_id: post.session_id,
        student_id: post.student_id,
        seat_assignment_id: post.seat_assignment_id,
        content: post.content,
        created_at: post.created_at,
        updated_at: post.updated_at,
      },
      message: 'トピックを投稿しました',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST topics/submit error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'トピック投稿中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
