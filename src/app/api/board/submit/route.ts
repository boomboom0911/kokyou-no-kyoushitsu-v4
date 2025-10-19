import { NextRequest, NextResponse } from 'next/server';
import { createSubmission, updateSubmission } from '@/lib/board/supabase-client';
import { validateGoogleUrl, detectWorkType } from '@/lib/board/utils';
import { SubmissionForm } from '@/types/board';

/**
 * POST /api/board/submit
 * 作品を投稿
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    if (!body.boardId || !body.studentId) {
      return NextResponse.json(
        { success: false, error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }

    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'タイトルは必須です' },
        { status: 400 }
      );
    }

    if (!body.workUrl || body.workUrl.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '作品URLは必須です' },
        { status: 400 }
      );
    }

    // URL検証
    const urlValidation = validateGoogleUrl(body.workUrl);
    if (!urlValidation.valid) {
      return NextResponse.json(
        { success: false, error: urlValidation.error },
        { status: 400 }
      );
    }

    // 作品タイプを自動判定
    const workType = body.workType || detectWorkType(body.workUrl);

    const formData: SubmissionForm = {
      title: body.title,
      description: body.description || '',
      workUrl: body.workUrl,
      workType,
    };

    const submission = await createSubmission(
      body.boardId,
      body.studentId,
      formData
    );

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error: any) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '作品の投稿に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/board/submit
 * 作品を更新
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    if (!body.submissionId || !body.studentId) {
      return NextResponse.json(
        { success: false, error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }

    if (body.workUrl) {
      const urlValidation = validateGoogleUrl(body.workUrl);
      if (!urlValidation.valid) {
        return NextResponse.json(
          { success: false, error: urlValidation.error },
          { status: 400 }
        );
      }
    }

    const formData: Partial<SubmissionForm> = {
      title: body.title,
      description: body.description,
      workUrl: body.workUrl,
      workType: body.workType || (body.workUrl ? detectWorkType(body.workUrl) : undefined),
    };

    const submission = await updateSubmission(
      body.submissionId,
      body.studentId,
      formData
    );

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error: any) {
    console.error('Update submission error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '作品の更新に失敗しました' },
      { status: 500 }
    );
  }
}
