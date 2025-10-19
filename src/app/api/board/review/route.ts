import { NextRequest, NextResponse } from 'next/server';
import {
  createReview,
  getReviewsBySubmission,
  incrementHelpfulCount,
  replyToReview,
  getSubmissionById,
} from '@/lib/board/supabase-client';
import { ReviewForm } from '@/types/board';
import { createNotification } from '@/lib/notifications';

/**
 * POST /api/board/review
 * レビューを投稿
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    if (!body.submissionId || !body.reviewerId || !body.boardId) {
      return NextResponse.json(
        { success: false, error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }

    // 少なくとも1つのレビュー項目が必要
    const hasContent =
      (body.strengths && body.strengths.length > 0) ||
      (body.suggestions && body.suggestions.length > 0) ||
      (body.questions && body.questions.length > 0) ||
      (body.overallComment && body.overallComment.trim().length > 0);

    if (!hasContent) {
      return NextResponse.json(
        { success: false, error: 'レビュー内容を入力してください' },
        { status: 400 }
      );
    }

    const formData: ReviewForm = {
      strengths: body.strengths || [],
      suggestions: body.suggestions || [],
      questions: body.questions || [],
      overallComment: body.overallComment || '',
    };

    const review = await createReview(
      body.submissionId,
      body.reviewerId,
      body.boardId,
      formData
    );

    // 作品投稿者に通知を送る
    try {
      const submission = await getSubmissionById(body.submissionId);
      if (submission && submission.student_id !== body.reviewerId) {
        // 掲示板コードを取得
        const boardCode = submission.boards?.code || 'BOARD';

        await createNotification({
          studentId: submission.student_id,
          type: 'board_review_received',
          sourceType: 'board',
          sourceId: boardCode,
          relatedId: review.id,
          title: '作品に新しいレビューが届きました',
          message: `「${submission.title}」にレビューが投稿されました`,
          linkUrl: `/board/${boardCode}/work/${submission.id}`,
          actorId: body.reviewerId,
        });
      }
    } catch (notificationError) {
      console.error('Notification creation error:', notificationError);
      // 通知失敗してもレビュー投稿は成功とする
    }

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error: any) {
    console.error('Review creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'レビューの投稿に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/board/review?submissionId=xxx
 * 作品へのレビュー一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'submissionId is required' },
        { status: 400 }
      );
    }

    const reviews = await getReviewsBySubmission(submissionId);

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'レビューの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/board/review
 * 「参考になった」を追加
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.reviewId) {
      return NextResponse.json(
        { success: false, error: 'reviewId is required' },
        { status: 400 }
      );
    }

    await incrementHelpfulCount(body.reviewId);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Increment helpful error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/board/review
 * レビューに返信を投稿（投稿者のみ）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.reviewId || !body.submissionId || !body.studentId || !body.responseText) {
      return NextResponse.json(
        { success: false, error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }

    if (!body.responseText.trim()) {
      return NextResponse.json(
        { success: false, error: '返信内容を入力してください' },
        { status: 400 }
      );
    }

    const review = await replyToReview(
      body.reviewId,
      body.submissionId,
      body.studentId,
      body.responseText.trim()
    );

    // レビュアーに返信通知を送る
    try {
      const submission = await getSubmissionById(body.submissionId);
      if (submission && review.reviewer_id !== body.studentId) {
        const boardCode = submission.boards?.code || 'BOARD';

        await createNotification({
          studentId: review.reviewer_id,
          type: 'board_reply_received',
          sourceType: 'board',
          sourceId: boardCode,
          relatedId: review.id,
          title: 'レビューに返信がありました',
          message: `「${submission.title}」の投稿者から返信が届きました`,
          linkUrl: `/board/${boardCode}/work/${submission.id}`,
          actorId: body.studentId,
        });
      }
    } catch (notificationError) {
      console.error('Notification creation error:', notificationError);
      // 通知失敗しても返信投稿は成功とする
    }

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error: any) {
    console.error('Reply to review error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '返信の投稿に失敗しました' },
      { status: 500 }
    );
  }
}
