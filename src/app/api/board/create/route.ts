import { NextRequest, NextResponse } from 'next/server';
import { createBoard } from '@/lib/board/supabase-client';
import { generateBoardCode } from '@/lib/board/utils';
import { BoardCreateForm } from '@/types/board';

/**
 * POST /api/board/create
 * 掲示板を作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'タイトルは必須です' },
        { status: 400 }
      );
    }

    // フォームデータの構築
    const formData: BoardCreateForm = {
      title: body.title,
      description: body.description || '',
      minReviewsRequired: body.minReviewsRequired || 0,
      minReviewsToGive: body.minReviewsToGive || 0,
      submissionDeadline: body.submissionDeadline || null,
      reviewDeadline: body.reviewDeadline || null,
      targetStudents: body.targetStudents || null,
    };

    // ユニークなコードを生成（最大10回試行）
    let code = generateBoardCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        const board = await createBoard(formData, code);
        return NextResponse.json({
          success: true,
          data: board,
        });
      } catch (error: any) {
        // コードの重複エラーの場合は再試行
        if (error.code === '23505' && attempts < maxAttempts - 1) {
          code = generateBoardCode();
          attempts++;
          continue;
        }
        throw error;
      }
    }

    return NextResponse.json(
      { success: false, error: '掲示板コードの生成に失敗しました' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Board creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '掲示板の作成に失敗しました' },
      { status: 500 }
    );
  }
}
