import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse, Interaction } from '@/types';

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

    // バリデーション
    if (!targetType || !targetId || !studentId || !commentText) {
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
    // studentId が 0, -1, -999 の場合は教科担当者として null を設定
    const { data: interaction, error: insertError } = await supabase
      .from('interactions')
      .insert({
        target_type: targetType,
        target_id: targetId,
        student_id: (studentId <= 0 || studentId === -999) ? null : studentId,
        type: 'comment',
        comment_text: commentText.trim(),
      })
      .select()
      .single();

    if (insertError || !interaction) {
      console.error('Failed to create interaction:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'コメントの投稿に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
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
