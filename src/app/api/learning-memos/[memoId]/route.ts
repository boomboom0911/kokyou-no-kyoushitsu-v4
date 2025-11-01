import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse, LearningMemo } from '@/types';

/**
 * PATCH /api/learning-memos/{memoId}
 * 学習メモを更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memoId: string }> }
) {
  try {
    const { memoId } = await params;
    const body = await request.json();
    const { is_favorite, tags, content } = body;

    // 更新データを構築
    const updateData: Partial<LearningMemo> = {};

    if (is_favorite !== undefined) {
      updateData.is_favorite = is_favorite;
    }
    if (tags !== undefined) {
      updateData.tags = tags;
    }
    if (content !== undefined) {
      if (content.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'メモ内容を入力してください',
          } as ApiResponse<never>,
          { status: 400 }
        );
      }
      updateData.content = content.trim();
    }

    // 更新するフィールドがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '更新する項目を指定してください',
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // メモ更新
    const { data: memo, error: updateError } = await supabase
      .from('learning_memos')
      .update(updateData)
      .eq('id', memoId)
      .select()
      .single();

    if (updateError || !memo) {
      console.error('Failed to update learning memo:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: '学習メモの更新に失敗しました',
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
      message: '学習メモを更新しました',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('PATCH learning-memos error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '学習メモ更新中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/learning-memos/{memoId}
 * 学習メモを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memoId: string }> }
) {
  try {
    const { memoId } = await params;

    const { error: deleteError } = await supabase
      .from('learning_memos')
      .delete()
      .eq('id', memoId);

    if (deleteError) {
      console.error('Failed to delete learning memo:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: '学習メモの削除に失敗しました',
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    const response: ApiResponse<null> = {
      success: true,
      message: '学習メモを削除しました',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('DELETE learning-memos error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '学習メモ削除中にエラーが発生しました',
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
