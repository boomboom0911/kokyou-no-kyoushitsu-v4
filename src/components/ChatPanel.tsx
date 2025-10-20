'use client';

import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: number;
  student_id: number;
  message: string;
  created_at: string;
  student?: {
    display_name: string;
  };
}

interface ChatPanelProps {
  sessionId: number;
  currentStudentId: number;
  isTeacher?: boolean; // 教科担当者の場合true
}

// 動物アイコンのリスト (42種類 = 座席数と同じ)
const ANIMAL_ICONS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁',
  '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦄', '🐴',
  '🦊', '🐺', '🦝', '🐗', '🐙', '🦀', '🐌', '🦋', '🐞', '🐝',
  '🦎', '🐢', '🐍', '🦖', '🦕', '🐊', '🐳', '🐬', '🦈', '🐡',
  '🦑', '🦐'
];

// student_idから一意な動物アイコンを取得
const getAnimalIcon = (studentId: number | null): string => {
  if (studentId === null || studentId === -1 || studentId === -999 || studentId <= 0) return '';

  const index = studentId % ANIMAL_ICONS.length;
  return ANIMAL_ICONS[index];
};

export default function ChatPanel({ sessionId, currentStudentId, isTeacher = false }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // 3秒ごとに更新
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    // 自動スクロールは、ユーザーが手動でスクロールしていない場合のみ実行
    if (!isUserScrollingRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px以内なら下にいるとみなす

    isUserScrollingRef.current = !isAtBottom;
  };

  const scrollToBottom = () => {
    // scrollIntoViewの代わりにコンテナのscrollTopを直接操作して、
    // ページ全体がスクロールするのを防ぐ
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    isUserScrollingRef.current = false;
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat?sessionId=${sessionId}`);
      const data = await response.json();
      console.log('[ChatPanel] fetchMessages response:', {
        success: data.success,
        messageCount: data.data?.length || 0,
        messages: data.data?.map((m: ChatMessage) => ({
          id: m.id,
          student_id: m.student_id,
          message: m.message.substring(0, 20),
        })),
      });
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('[ChatPanel] Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || loading) {
      console.log('[ChatPanel] handleSendMessage blocked:', {
        hasMessage: !!newMessage.trim(),
        loading,
      });
      return;
    }

    const finalStudentId = currentStudentId === -999 ? null : (currentStudentId === 0 || currentStudentId === -1 ? -1 : currentStudentId);

    console.log('[ChatPanel] handleSendMessage called:', {
      currentStudentId,
      finalStudentId,
      message: newMessage.trim(),
    });

    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          studentId: finalStudentId, // 教科担当者(-999)はnull、ゲスト(0/-1)は-1
          message: newMessage.trim(),
        }),
      });

      const data = await response.json();
      console.log('[ChatPanel] Send message response:', response.status, data);

      if (data.success) {
        setNewMessage('');
        fetchMessages();
      } else {
        console.error('[ChatPanel] Failed to send message:', data);
        alert(`チャット送信失敗: ${data.error}`);
      }
    } catch (error) {
      console.error('[ChatPanel] Failed to send message:', error);
      alert('チャット送信中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg flex flex-col h-full max-h-full">
      {/* ヘッダー */}
      <div className="bg-purple-600 text-white px-4 py-3 rounded-t-lg">
        <h3 className="font-semibold">💬 匿名チャット</h3>
        <p className="text-xs text-purple-100">自由に質問や意見を投稿できます</p>
      </div>

      {/* メッセージ一覧 */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-8">
            まだメッセージがありません
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.student_id === currentStudentId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg p-3 ${
                  msg.student_id === currentStudentId
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="text-xs mb-1 opacity-75 flex items-center gap-1">
                  {msg.student_id === null || msg.student_id === -999 ? (
                    <span>👨‍🏫 教科担当者</span>
                  ) : msg.student_id === -1 ? (
                    <span>🎭 ゲスト</span>
                  ) : (
                    <span className="text-base">{getAnimalIcon(msg.student_id)}</span>
                  )}
                  <span>
                    •{' '}
                    {new Date(msg.created_at).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="メッセージを入力..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-400"
            disabled={loading}
          />
          <button
            onClick={() => {
              console.log('[ChatPanel] Send button clicked', {
                disabled: loading || !newMessage.trim(),
                loading,
                hasMessage: !!newMessage.trim(),
              });
              handleSendMessage();
            }}
            disabled={loading || !newMessage.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {loading ? '送信中...' : '送信'}
          </button>
        </div>
      </div>
    </div>
  );
}
