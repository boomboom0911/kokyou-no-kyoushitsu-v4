import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse, LessonSession } from '@/types';

/**
 * GET /api/sessions?code={sessionCode}
 * セッション情報を取得
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: 'セッションコードは必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // セッション情報取得（クラス名も含む）
    const { data: session, error } = await supabase
      .from('lesson_sessions')
      .select(`
        *,
        classes (
          id,
          name,
          grade
        )
      `)
      .eq('code', code)
      .single();

    if (error || !session) {
      return NextResponse.json(
        {
          success: false,
          error: 'セッションが見つかりません',
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    const response: ApiResponse<LessonSession & { class_name?: string }> = {
      success: true,
      data: {
        id: session.id,
        code: session.code,
        class_id: session.class_id,
        topic_title: session.topic_title,
        topic_content: session.topic_content,
        date: session.date,
        period: session.period,
        is_active: session.is_active,
        started_at: session.started_at,
        ended_at: session.ended_at,
        class_name: session.classes?.name,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET sessions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'セッション情報の取得中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions
 * 新規セッションを作成（教師用）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicTitle, topicContent, classId, period } = body;

    // バリデーション
    if (!topicTitle || !period) {
      return NextResponse.json(
        {
          success: false,
          error: 'トピックタイトルと時限は必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    if (period < 1 || period > 7) {
      return NextResponse.json(
        {
          success: false,
          error: '時限は1〜7の範囲で指定してください',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // 4桁のセッションコードを生成
    const code = generateSessionCode();

    // 今日の日付
    const today = new Date().toISOString().split('T')[0];

    // セッション作成
    const { data: session, error } = await supabase
      .from('lesson_sessions')
      .insert({
        code,
        class_id: classId || null,
        topic_title: topicTitle,
        topic_content: topicContent || null,
        date: today,
        period,
        is_active: true,
      })
      .select()
      .single();

    if (error || !session) {
      console.error('Failed to create session:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'セッションの作成に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    const response: ApiResponse<LessonSession> = {
      success: true,
      data: {
        id: session.id,
        code: session.code,
        class_id: session.class_id,
        topic_title: session.topic_title,
        topic_content: session.topic_content,
        date: session.date,
        period: session.period,
        is_active: session.is_active,
        started_at: session.started_at,
        ended_at: session.ended_at,
      },
      message: `セッション「${code}」を作成しました`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST sessions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'セッション作成中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sessions?id={sessionId}
 * セッション情報を更新（教師用）
 */
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('id');
    const body = await request.json();
    const { topicTitle, topicContent } = body;

    // バリデーション
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'セッションIDは必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    if (!topicTitle) {
      return NextResponse.json(
        {
          success: false,
          error: 'トピックタイトルは必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // セッション更新
    const { data: session, error } = await supabase
      .from('lesson_sessions')
      .update({
        topic_title: topicTitle,
        topic_content: topicContent || null,
      })
      .eq('id', parseInt(sessionId, 10))
      .select()
      .single();

    if (error || !session) {
      console.error('Failed to update session:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'セッションの更新に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    const response: ApiResponse<LessonSession> = {
      success: true,
      data: {
        id: session.id,
        code: session.code,
        class_id: session.class_id,
        topic_title: session.topic_title,
        topic_content: session.topic_content,
        date: session.date,
        period: session.period,
        is_active: session.is_active,
        started_at: session.started_at,
        ended_at: session.ended_at,
      },
      message: 'セッションを更新しました',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('PUT sessions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'セッション更新中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * 4桁のランダムな英数字コードを生成
 */
function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
