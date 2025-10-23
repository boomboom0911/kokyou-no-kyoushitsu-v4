import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/types';

interface SessionSummary {
  id: number;
  code: string;
  topic_title: string;
  topic_content: string | null;
  date: string;
  period: number;
  class_id: number | null;
  class_name: string | null;
  topic_count: number;
  started_at: string;
  ended_at: string | null;
}

/**
 * GET /api/sessions/all
 * 全セッションの一覧を取得（投稿数含む）
 */
export async function GET(request: NextRequest) {
  try {
    // 全セッションを取得
    // 並び順: 終了していないセッション → 終了済みセッション（日付・時限の降順）
    const { data: sessions, error: sessionsError } = await supabase
      .from('lesson_sessions')
      .select(`
        id,
        code,
        topic_title,
        topic_content,
        date,
        period,
        class_id,
        started_at,
        ended_at,
        classes (
          name
        )
      `)
      .order('date', { ascending: false })
      .order('period', { ascending: false });

    if (sessionsError) {
      console.error('Failed to fetch sessions:', sessionsError);
      return NextResponse.json(
        {
          success: false,
          error: 'セッション一覧の取得に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    // 各セッションの投稿数を取得
    const sessionSummaries: SessionSummary[] = await Promise.all(
      (sessions || []).map(async (session) => {
        // トピック投稿数を取得
        const { count } = await supabase
          .from('topic_posts')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', session.id);

        return {
          id: session.id,
          code: session.code,
          topic_title: session.topic_title,
          topic_content: session.topic_content,
          date: session.date,
          period: session.period,
          class_id: session.class_id,
          class_name: session.classes?.name || null,
          topic_count: count || 0,
          started_at: session.started_at,
          ended_at: session.ended_at,
        };
      })
    );

    // クライアント側で並び替え: 終了していないセッション → 終了済みセッション
    const sortedSessions = sessionSummaries.sort((a, b) => {
      // ended_atがnullのセッション（進行中）を先に
      if (a.ended_at === null && b.ended_at !== null) return -1;
      if (a.ended_at !== null && b.ended_at === null) return 1;

      // どちらも同じ状態なら、日付・時限の降順（既にソートされている）
      return 0;
    });

    const response: ApiResponse<{ sessions: SessionSummary[] }> = {
      success: true,
      data: {
        sessions: sortedSessions,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET sessions/all error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'セッション一覧取得中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
