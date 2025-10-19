/**
 * 統合通知システム
 * 掲示板と教室の両方の通知を管理
 */

import { supabase } from './supabase';

export interface Notification {
  id: string;
  student_id: number;
  type: 'board_review_received' | 'board_reply_received' | 'topic_comment_added';
  source_type: 'board' | 'classroom';
  source_id: string | null;
  related_id: string | null;
  title: string;
  message: string | null;
  link_url: string;
  actor_id: number | null;
  actor_name: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * 通知を作成
 */
export async function createNotification(params: {
  studentId: number;
  type: Notification['type'];
  sourceType: 'board' | 'classroom';
  sourceId?: string;
  relatedId?: string;
  title: string;
  message?: string;
  linkUrl: string;
  actorId?: number;
  actorName?: string;
}) {
  const { data, error } = await supabase.from('notifications').insert({
    student_id: params.studentId,
    type: params.type,
    source_type: params.sourceType,
    source_id: params.sourceId || null,
    related_id: params.relatedId || null,
    title: params.title,
    message: params.message || null,
    link_url: params.linkUrl,
    actor_id: params.actorId || null,
    actor_name: params.actorName || null,
  });

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }

  return data;
}

/**
 * 生徒の未読通知を取得
 */
export async function getUnreadNotifications(studentId: number) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('student_id', studentId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data as Notification[];
}

/**
 * 生徒のすべての通知を取得（既読含む、最新50件）
 */
export async function getAllNotifications(studentId: number, limit = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data as Notification[];
}

/**
 * 未読通知数を取得
 */
export async function getUnreadCount(studentId: number): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('is_read', false);

  if (error) {
    console.error('Error counting notifications:', error);
    return 0;
  }

  return count || 0;
}

/**
 * 通知を既読にする
 */
export async function markAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * すべての通知を既読にする
 */
export async function markAllAsRead(studentId: number) {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('student_id', studentId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}
