import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse, Interaction } from '@/types';
import { createNotification } from '@/lib/notifications';

/**
 * GET /api/interactions?targetType={type}&targetId={id}
 * コメントを取得
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');

    // バリデーション
    if (!targetType || !targetId) {
      return NextResponse.json(
        {
          success: false,
          error: 'targetTypeとtargetIdは必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // コメント取得（生徒情報も含む）
    const { data: interactions, error } = await supabase
      .from('interactions')
      .select(`
        *,
        students (
          id,
          display_name,
          student_number
        )
      `)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch interactions:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'コメントの取得に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    // データ整形
    const comments = (interactions || []).map((interaction) => ({
      id: interaction.id,
      target_type: interaction.target_type,
      target_id: interaction.target_id,
      student_id: interaction.student_id,
      type: interaction.type,
      comment_text: interaction.comment_text,
      created_at: interaction.created_at,
      student: interaction.students
        ? {
            id: interaction.students.id,
            display_name: interaction.students.display_name,
            student_number: interaction.students.student_number,
          }
        : null,
    }));

    const response: ApiResponse<typeof comments> = {
      success: true,
      data: comments,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET interactions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'コメント取得中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/interactions
 * コメントを投稿
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetType, targetId, studentId, commentText } = body;

    console.log('[Interactions API] POST request received:', {
      targetType,
      targetId,
      studentId,
      commentText: commentText?.substring(0, 50),
    });

    // バリデーション
    if (!targetType || !targetId || studentId === undefined || studentId === null || !commentText) {
      console.error('[Interactions API] Validation failed:', {
        hasTargetType: !!targetType,
        hasTargetId: !!targetId,
        studentIdValue: studentId,
        hasCommentText: !!commentText,
      });
      return NextResponse.json(
        {
          success: false,
          error: '全ての項目は必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    if (targetType !== 'topic' && targetType !== 'comment') {
      return NextResponse.json(
        {
          success: false,
          error: 'targetTypeは"topic"または"comment"である必要があります',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    if (commentText.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'コメント内容を入力してください',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // コメント投稿
    // studentId が 0 または -1 の場合は -1 (ゲスト)、-999 の場合はそのまま使用
    const finalStudentId = studentId === 0 || studentId === -1 ? -1 : studentId;
    console.log('[Interactions API] Final studentId:', { original: studentId, final: finalStudentId });

    const { data: interaction, error: insertError } = await supabase
      .from('interactions')
      .insert({
        target_type: targetType,
        target_id: targetId,
        student_id: finalStudentId,
        type: 'comment',
        comment_text: commentText.trim(),
      })
      .select()
      .single();

    if (insertError || !interaction) {
      console.error('[Interactions API] Failed to create interaction:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'コメントの投稿に失敗しました',
          details: insertError?.message,
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    console.log('[Interactions API] Comment posted successfully:', interaction.id);

    // トピック投稿者に通知を送る（targetType === 'topic' の場合のみ）
    // 生徒または教員（-999）からのコメントで通知を作成
    if (targetType === 'topic' && (studentId > 0 || studentId === -999)) {
      try {
        // トピック情報を取得
        const { data: topicPost } = await supabase
          .from('topic_posts')
          .select('*, sessions!inner(code, topic_title)')
          .eq('id', targetId)
          .single();

        // トピック投稿者が生徒（studentId > 0）で、かつコメント者が自分自身でない場合のみ通知
        if (topicPost && topicPost.student_id > 0 && topicPost.student_id !== studentId) {
          const sessionCode = topicPost.sessions?.code || 'SESSION';
          const topicTitle = topicPost.sessions?.topic_title || 'トピック';

          // コメント者の名前を取得
          let actorName = '誰か';
          if (studentId === -999) {
            actorName = '教科担当者';
          } else if (studentId > 0) {
            // 生徒の場合は名前を取得（オプション）
            actorName = '他の生徒';
          }

          await createNotification({
            studentId: topicPost.student_id,
            type: 'topic_comment_added',
            sourceType: 'classroom',
            sourceId: sessionCode,
            relatedId: targetId.toString(),
            title: 'トピックに新しいコメントがあります',
            message: `「${topicTitle}」に${actorName}からコメントが投稿されました`,
            linkUrl: `/all-classes?session=${sessionCode}&topic=${targetId}`,
            actorId: studentId,
          });
        }

        // コメントしている他の生徒にも通知（将来的に実装可能）
        // 現時点ではトピック投稿者のみに通知
      } catch (notificationError) {
        console.error('Notification creation error:', notificationError);
        // 通知失敗してもコメント投稿は成功とする
      }
    }

    const response: ApiResponse<Interaction> = {
      success: true,
      data: {
        id: interaction.id,
        target_type: interaction.target_type as 'topic' | 'comment',
        target_id: interaction.target_id,
        student_id: interaction.student_id,
        type: 'comment',
        comment_text: interaction.comment_text,
        created_at: interaction.created_at,
      },
      message: 'コメントを投稿しました',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST interactions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'コメント投稿中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
