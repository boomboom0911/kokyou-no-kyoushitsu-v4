import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse, ReactionsSummary, ReactionType } from '@/types';

/**
 * GET /api/reactions?targetType={type}&targetId={id}&studentId={id}
 * リアクション情報を取得
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');
    const studentId = searchParams.get('studentId');

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

    if (targetType !== 'topic' && targetType !== 'comment') {
      return NextResponse.json(
        {
          success: false,
          error: 'targetTypeは"topic"または"comment"である必要があります',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // リアクション情報を取得
    const { data: reactions, error } = await supabase
      .from('reactions')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) {
      console.error('Failed to fetch reactions:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'リアクション情報の取得に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    // リアクション数を集計
    const counts = {
      surprise: 0,
      understand: 0,
      question: 0,
    };

    const myReactions: ReactionType[] = [];

    reactions?.forEach((reaction) => {
      const type = reaction.reaction_type as ReactionType;
      counts[type] = (counts[type] || 0) + 1;

      // 自分のリアクションを記録
      if (studentId && reaction.student_id === Number(studentId)) {
        myReactions.push(type);
      }
    });

    const response: ApiResponse<ReactionsSummary> = {
      success: true,
      data: {
        reactions: counts,
        myReactions,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET reactions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'リアクション情報の取得中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/reactions
 * リアクションを追加
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetType, targetId, reactionType, studentId } = body;

    // バリデーション
    if (!targetType || !targetId || !reactionType || !studentId) {
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

    if (
      reactionType !== 'surprise' &&
      reactionType !== 'understand' &&
      reactionType !== 'question'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'reactionTypeは"surprise"、"understand"、"question"のいずれかである必要があります',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // 既に同じリアクションをしているかチェック
    // studentId が 0 または -1 の場合は -999 (教員・ゲスト用固定ID) として検索
    const actualStudentId = studentId <= 0 ? -999 : studentId;
    const { data: existing } = await supabase
      .from('reactions')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('reaction_type', reactionType)
      .eq('student_id', actualStudentId)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: '既にこのリアクションをしています',
        } as ApiResponse<never>,
        { status: 409 }
      );
    }

    // リアクション追加
    // studentId が 0 または -1 の場合は -999 (教員・ゲスト用固定ID) を設定
    const { data: reaction, error: insertError } = await supabase
      .from('reactions')
      .insert({
        target_type: targetType,
        target_id: targetId,
        student_id: studentId <= 0 ? -999 : studentId,
        reaction_type: reactionType,
      })
      .select()
      .single();

    if (insertError || !reaction) {
      console.error('Failed to create reaction:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'リアクションの追加に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    const response: ApiResponse<typeof reaction> = {
      success: true,
      data: reaction,
      message: 'リアクションを追加しました',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST reactions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'リアクション追加中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reactions
 * リアクションを削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetType, targetId, reactionType, studentId } = body;

    // バリデーション
    if (!targetType || !targetId || !reactionType || !studentId) {
      return NextResponse.json(
        {
          success: false,
          error: '全ての項目は必須です',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // リアクション削除
    // studentId が 0 または -1 の場合は -999 として削除
    const actualStudentId = studentId <= 0 ? -999 : studentId;
    const { error: deleteError } = await supabase
      .from('reactions')
      .delete()
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('reaction_type', reactionType)
      .eq('student_id', actualStudentId);

    if (deleteError) {
      console.error('Failed to delete reaction:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: 'リアクションの削除に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'リアクションを取り消しました',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('DELETE reactions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'リアクション削除中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
