'use client';

import { useState } from 'react';

interface QuickMemoProps {
  studentId: number;
  sessionId?: number;
  onSave?: () => void;
}

export default function QuickMemo({ studentId, sessionId, onSave }: QuickMemoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!content.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/learning-memos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          sessionId: sessionId || null,
          content: content.trim(),
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✓ メモを保存しました');
        setContent('');
        setTags('');
        onSave?.();

        // 2秒後にメッセージをクリア
        setTimeout(() => {
          setMessage('');
        }, 2000);
      } else {
        setMessage('エラー: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to save memo:', error);
      setMessage('エラー: メモの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 浮遊ボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all z-50"
        title="クイックメモ"
      >
        {isOpen ? '×' : '📝'}
      </button>

      {/* メモパネル */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">📝 クイックメモ</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* メモ内容 */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="学んだこと、気づいたことをメモ..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm text-gray-900 placeholder:text-gray-400"
              disabled={loading}
            />

            {/* タグ */}
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="タグ (カンマ区切り)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-400"
              disabled={loading}
            />

            {/* メッセージ */}
            {message && (
              <div
                className={`text-sm px-3 py-2 rounded ${
                  message.startsWith('✓')
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {message}
              </div>
            )}

            {/* 保存ボタン */}
            <button
              onClick={handleSave}
              disabled={loading || !content.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              {loading ? '保存中...' : '保存'}
            </button>

            {sessionId && (
              <p className="text-xs text-gray-500 text-center">
                この授業に紐づけて保存されます
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
