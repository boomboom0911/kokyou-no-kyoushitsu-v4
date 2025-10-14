import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/types';

interface ChatMessage {
  id: number;
  session_id: number;
  student_id: number | null;
  message: string;
  created_at: string;
  sender_name: string;
}

/**
 * GET /api/chat?sessionId={sessionId}
 * チャットメッセージを取得
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

    // チャットメッセージ取得（生徒情報も含む）
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        students (
          display_name
        )
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch chat messages:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'チャットメッセージの取得に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    // データ整形
    const chatMessages: ChatMessage[] = (messages || []).map((msg) => ({
      id: msg.id,
      session_id: msg.session_id,
      student_id: msg.student_id,
      message: msg.message,
      created_at: msg.created_at,
      sender_name: msg.students?.display_name || '匿名',
    }));

    const response: ApiResponse<ChatMessage[]> = {
      success: true,
      data: chatMessages,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'チャットメッセージ取得中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat
 * チャットメッセージを送信
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, studentId, message } = body;

    // バリデーション
    if (!sessionId || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'セッションIDとメッセージは必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    if (message.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'メッセージを入力してください',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // studentId が 0 または -1 の場合は -1 (ゲスト) として設定、null の場合は -999 (教科担当者)
    const actualStudentId = studentId === null ? -999 : (studentId <= 0 ? -1 : studentId);

    // メッセージ投稿
    const { data: chatMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        student_id: actualStudentId,
        message: message.trim(),
      })
      .select()
      .single();

    if (insertError || !chatMessage) {
      console.error('Failed to create chat message:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'メッセージの送信に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    const response: ApiResponse<typeof chatMessage> = {
      success: true,
      data: chatMessage,
      message: 'メッセージを送信しました',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'メッセージ送信中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
