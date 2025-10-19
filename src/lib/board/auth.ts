/**
 * 掲示板用の認証ヘルパー関数
 */

import { storage } from '@/lib/storage';

export interface Student {
  id: number;
  google_email: string;
  display_name: string;
  student_number: number;
  class_id: string;
}

/**
 * ログイン中の生徒情報を取得
 */
export function getLoggedInStudent(): Student | null {
  try {
    const student = storage.load('student');
    return student || null;
  } catch {
    return null;
  }
}

/**
 * ログイン中の生徒IDを取得
 */
export function getStudentId(): number | null {
  const student = getLoggedInStudent();
  return student?.id || null;
}

/**
 * ログインしているかチェック
 */
export function isLoggedIn(): boolean {
  return getLoggedInStudent() !== null;
}

/**
 * ログインページにリダイレクト
 */
export function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/student';
  }
}
