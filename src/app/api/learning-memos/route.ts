import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse, LearningMemo } from '@/types';

/**
 * GET /api/learning-memos?studentId={id}&sessionId={id}
 * 学習メモを取得
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const sessionId = searchParams.get('sessionId');

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          error: '生徒IDは必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    let query = supabase
      .from('learning_memos')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // セッション指定がある場合
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data: memos, error } = await query;

    if (error) {
      console.error('Failed to fetch learning memos:', error);
      return NextResponse.json(
        {
          success: false,
          error: '学習メモの取得に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    const response: ApiResponse<LearningMemo[]> = {
      success: true,
      data: memos || [],
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET learning-memos error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '学習メモ取得中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning-memos
 * 学習メモを作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, sessionId, content, tags } = body;

    // バリデーション
    if (!studentId || !content) {
      return NextResponse.json(
        {
          success: false,
          error: '生徒IDとメモ内容は必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'メモ内容を入力してください',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // メモ作成
    const { data: memo, error: insertError } = await supabase
      .from('learning_memos')
      .insert({
        student_id: studentId,
        session_id: sessionId || null,
        content: content.trim(),
        tags: tags || [],
        is_favorite: false,
      })
      .select()
      .single();

    if (insertError || !memo) {
      console.error('Failed to create learning memo:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: '学習メモの作成に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    const response: ApiResponse<LearningMemo> = {
      success: true,
      data: {
        id: memo.id,
        student_id: memo.student_id,
        session_id: memo.session_id,
        content: memo.content,
        tags: memo.tags,
        is_favorite: memo.is_favorite,
        created_at: memo.created_at,
        updated_at: memo.updated_at,
      },
      message: '学習メモを作成しました',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST learning-memos error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '学習メモ作成中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
