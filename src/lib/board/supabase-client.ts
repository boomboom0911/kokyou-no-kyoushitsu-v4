// ============================================================
// 掲示板用 Supabase クライアント関数
// ============================================================

import { supabase } from '@/lib/supabase';
import {
  Board,
  Submission,
  PeerReview,
  ReviewerProfile,
  BoardCreateForm,
  SubmissionForm,
  ReviewForm,
} from '@/types/board';
import { assignAnimal, calculateLevel } from './animal-assignment';
import { calculateReviewCharacterCount } from './utils';

// ============================================================
// Boards（掲示板）
// ============================================================

/**
 * コードから掲示板を取得
 */
export async function getBoardByCode(code: string) {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('status', 'active')
    .single();

  if (error) {
    console.error('Error fetching board:', error);
    return null;
  }

  return data as Board;
}

/**
 * IDから掲示板を取得
 */
export async function getBoardById(id: string) {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching board:', error);
    return null;
  }

  return data as Board;
}

/**
 * 掲示板を作成
 */
export async function createBoard(formData: BoardCreateForm, code: string) {
  const { data, error } = await supabase
    .from('boards')
    .insert({
      code: code.toUpperCase(),
      title: formData.title,
      description: formData.description,
      min_reviews_required: formData.minReviewsRequired,
      min_reviews_to_give: formData.minReviewsToGive,
      submission_deadline: formData.submissionDeadline,
      review_deadline: formData.reviewDeadline,
      target_students: formData.targetStudents
        ? formData.targetStudents.map(id => id.toString())
        : null,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating board:', error);
    throw error;
  }

  return data as Board;
}

/**
 * 掲示板一覧を取得
 */
export async function getBoards(status?: string) {
  let query = supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching boards:', error);
    return [];
  }

  return data as Board[];
}

// ============================================================
// Submissions（作品投稿）
// ============================================================

/**
 * 作品一覧を取得（統計情報付き）
 */
export async function getSubmissions(boardId: string, page = 1, perPage = 20) {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error } = await supabase
    .from('submission_with_stats')
    .select('*')
    .eq('board_id', boardId)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching submissions:', error);
    return [];
  }

  return data;
}

/**
 * 作品を取得
 */
export async function getSubmissionById(id: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      students:student_id (
        id,
        student_number,
        display_name,
        class_id
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching submission:', error);
    return null;
  }

  return data;
}

/**
 * 作品を投稿
 */
export async function createSubmission(
  boardId: string,
  studentId: number,
  formData: SubmissionForm
) {
  // 既存の投稿があるかチェック
  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('board_id', boardId)
    .eq('student_id', studentId)
    .single();

  if (existing) {
    throw new Error('この掲示板には既に作品を投稿しています');
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      board_id: boardId,
      student_id: studentId,
      title: formData.title,
      description: formData.description,
      work_url: formData.workUrl,
      work_type: formData.workType,
      visibility: 'public',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating submission:', error);
    throw error;
  }

  return data as Submission;
}

/**
 * 作品を更新
 */
export async function updateSubmission(
  id: string,
  studentId: number,
  formData: Partial<SubmissionForm>
) {
  const { data, error } = await supabase
    .from('submissions')
    .update({
      title: formData.title,
      description: formData.description,
      work_url: formData.workUrl,
      work_type: formData.workType,
      is_edited: true,
      edit_count: supabase.rpc('increment', { x: 1 }),
      last_edited_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('student_id', studentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating submission:', error);
    throw error;
  }

  return data as Submission;
}

/**
 * 閲覧数を増やす
 */
export async function incrementViewCount(id: string) {
  const { error } = await supabase
    .from('submissions')
    .update({ view_count: supabase.rpc('increment', { x: 1 }) })
    .eq('id', id);

  if (error) {
    console.error('Error incrementing view count:', error);
  }
}

// ============================================================
// Peer Reviews（ピアレビュー）
// ============================================================

/**
 * 作品へのレビュー一覧を取得
 */
export async function getReviewsBySubmission(submissionId: string) {
  const { data, error } = await supabase
    .from('peer_reviews')
    .select(`
      *,
      students:reviewer_id (
        id,
        student_number,
        display_name,
        class_id
      )
    `)
    .eq('submission_id', submissionId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return data;
}

/**
 * レビューを投稿
 */
export async function createReview(
  submissionId: string,
  reviewerId: number,
  boardId: string,
  formData: ReviewForm
) {
  // 自分の作品にレビューできないかチェック
  const { data: submission } = await supabase
    .from('submissions')
    .select('student_id')
    .eq('id', submissionId)
    .single();

  if (submission?.student_id === reviewerId) {
    throw new Error('自分の作品にはレビューできません');
  }

  // 既にレビュー済みかチェック
  const { data: existing } = await supabase
    .from('peer_reviews')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('reviewer_id', reviewerId)
    .single();

  if (existing) {
    throw new Error('既にこの作品をレビューしています');
  }

  // 文字数を計算
  const characterCount = calculateReviewCharacterCount(
    formData.strengths,
    formData.suggestions,
    formData.questions,
    formData.overallComment
  );

  // レビュアープロフィールが存在しなければ作成
  const animal = assignAnimal(reviewerId, boardId);
  const { data: profile } = await supabase
    .from('reviewer_profiles')
    .select('*')
    .eq('student_id', reviewerId)
    .eq('board_id', boardId)
    .single();

  if (!profile) {
    await supabase.from('reviewer_profiles').insert({
      student_id: reviewerId,
      board_id: boardId,
      animal_type: animal,
      level: 0,
      review_count: 0,
    });
  }

  // レビューを投稿
  const { data, error } = await supabase
    .from('peer_reviews')
    .insert({
      submission_id: submissionId,
      reviewer_id: reviewerId,
      strengths: formData.strengths,
      suggestions: formData.suggestions,
      questions: formData.questions,
      overall_comment: formData.overallComment,
      character_count: characterCount,
      status: 'published',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating review:', error);
    throw error;
  }

  return data as PeerReview;
}

/**
 * 「参考になった」を追加
 */
export async function incrementHelpfulCount(reviewId: string) {
  const { error } = await supabase
    .from('peer_reviews')
    .update({ helpful_count: supabase.rpc('increment', { x: 1 }) })
    .eq('id', reviewId);

  if (error) {
    console.error('Error incrementing helpful count:', error);
    throw error;
  }
}

/**
 * レビューに返信を投稿（投稿者のみ）
 */
export async function replyToReview(
  reviewId: string,
  submissionId: string,
  studentId: number,
  responseText: string
) {
  // 投稿者かどうか確認
  const { data: submission } = await supabase
    .from('submissions')
    .select('student_id')
    .eq('id', submissionId)
    .single();

  if (submission?.student_id !== studentId) {
    throw new Error('作品の投稿者のみが返信できます');
  }

  // 返信を更新
  const { data, error } = await supabase
    .from('peer_reviews')
    .update({
      author_response: responseText,
      response_created_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('submission_id', submissionId)
    .select()
    .single();

  if (error) {
    console.error('Error replying to review:', error);
    throw error;
  }

  return data;
}

// ============================================================
// Reviewer Profiles（レビュアープロフィール）
// ============================================================

/**
 * レビュアープロフィールを取得
 */
export async function getReviewerProfile(studentId: number, boardId: string) {
  const { data, error } = await supabase
    .from('reviewer_profiles')
    .select('*')
    .eq('student_id', studentId)
    .eq('board_id', boardId)
    .single();

  if (error) {
    // プロフィールが存在しない場合は作成
    const animal = assignAnimal(studentId, boardId);
    const { data: newProfile } = await supabase
      .from('reviewer_profiles')
      .insert({
        student_id: studentId,
        board_id: boardId,
        animal_type: animal,
        level: 0,
        review_count: 0,
      })
      .select()
      .single();

    return newProfile as ReviewerProfile;
  }

  return data as ReviewerProfile;
}

/**
 * レビュアーランキングを取得
 */
export async function getReviewerRanking(boardId: string, limit = 10) {
  const { data, error } = await supabase
    .from('reviewer_profiles')
    .select(`
      *,
      students:student_id (
        id,
        student_number,
        display_name,
        class_id
      )
    `)
    .eq('board_id', boardId)
    .order('level', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching reviewer ranking:', error);
    return [];
  }

  return data;
}

// ============================================================
// 統計情報
// ============================================================

/**
 * 掲示板の統計情報を取得
 */
export async function getBoardStats(boardId: string) {
  // 総投稿数
  const { count: totalSubmissions } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('board_id', boardId)
    .eq('visibility', 'public');

  // 総レビュー数
  const { count: totalReviews } = await supabase
    .from('peer_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .in('submission_id',
      supabase.from('submissions').select('id').eq('board_id', boardId)
    );

  // トップレビュアー
  const topReviewers = await getReviewerRanking(boardId, 5);

  return {
    totalSubmissions: totalSubmissions || 0,
    totalReviews: totalReviews || 0,
    averageReviews: totalSubmissions
      ? ((totalReviews || 0) / totalSubmissions).toFixed(1)
      : '0',
    topReviewers,
  };
}
