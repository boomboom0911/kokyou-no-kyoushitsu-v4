'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Notification, getUnreadNotifications, markAsRead, markAllAsRead } from '@/lib/notifications';
import { formatRelativeTime } from '@/lib/board/utils';

interface NotificationDropdownProps {
  studentId: number;
  onClose: () => void;
}

export function NotificationDropdown({ studentId, onClose }: NotificationDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 通知を取得
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      const data = await getUnreadNotifications(studentId);
      setNotifications(data);
      setIsLoading(false);
    };

    fetchNotifications();
  }, [studentId]);

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // 通知をクリック
  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markAsRead(notification.id);
      router.push(notification.link_url);
      onClose();
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  // すべて既読にする
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(studentId);
      setNotifications([]);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // アイコンを取得
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'board_review_received':
        return '✍️';
      case 'board_reply_received':
        return '💬';
      case 'topic_comment_added':
        return '💬';
      default:
        return '🔔';
    }
  };

  // ソースバッジ
  const getSourceBadge = (sourceType: 'board' | 'classroom', sourceId: string | null) => {
    if (sourceType === 'board') {
      return <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">📋 {sourceId}</span>;
    } else {
      return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">🏛️ 教室</span>;
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
    >
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-bold text-gray-900">
          🔔 通知 {notifications.length > 0 && `(${notifications.length}件の未読)`}
        </h3>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            すべて既読
          </button>
        )}
      </div>

      {/* 通知一覧 */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">未読の通知はありません</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex gap-3">
                  <span className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-xs text-gray-600 mb-2">
                        {notification.message}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {notification.source_id && getSourceBadge(notification.source_type, notification.source_id)}
                      <span>•</span>
                      <span>{formatRelativeTime(notification.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
