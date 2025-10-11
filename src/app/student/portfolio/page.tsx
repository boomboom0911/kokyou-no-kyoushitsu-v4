'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Student, GroupedPortfolio, PortfolioCard } from '@/types';
import MyTopicCardComponent from '@/components/portfolio/MyTopicCardComponent';
import ReactedTopicCardComponent from '@/components/portfolio/ReactedTopicCardComponent';
import CommentedTopicCardComponent from '@/components/portfolio/CommentedTopicCardComponent';
import QuickMemoCardComponent from '@/components/portfolio/QuickMemoCardComponent';

export default function PortfolioPageNew() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [portfolio, setPortfolio] = useState<GroupedPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMemoModal, setShowAddMemoModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [newMemoContent, setNewMemoContent] = useState('');
  const [newMemoTags, setNewMemoTags] = useState('');
  const [newMemoFavorite, setNewMemoFavorite] = useState(false);

  useEffect(() => {
    // 認証情報確認
    const storedStudent = storage.load<Student>('student');

    if (!storedStudent) {
      router.push('/student');
      return;
    }

    setStudent(storedStudent);
    fetchPortfolio(storedStudent.id);
  }, [router]);

  const fetchPortfolio = async (studentId: number) => {
    try {
      const response = await fetch(`/api/students/${studentId}/portfolio-grouped`);
      const data = await response.json();

      if (data.success) {
        setPortfolio(data.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
      setLoading(false);
    }
  };

  const handleAddMemo = async () => {
    if (!student || !selectedSessionId || !newMemoContent.trim()) return;

    try {
      const tags = newMemoTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const response = await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          sessionId: selectedSessionId,
          content: newMemoContent,
          tags,
          isFavorite: newMemoFavorite,
        }),
      });

      if (response.ok) {
        // ポートフォリオを再取得
        await fetchPortfolio(student.id);
        // モーダルを閉じる
        setShowAddMemoModal(false);
        setSelectedSessionId(null);
        setNewMemoContent('');
        setNewMemoTags('');
        setNewMemoFavorite(false);
      }
    } catch (error) {
      console.error('Failed to add memo:', error);
    }
  };

  const handleExport = () => {
    if (!student) return;
    window.open(
      `/api/export/portfolio?studentId=${student.id}&format=csv`,
      '_blank'
    );
  };

  const renderCard = (card: PortfolioCard) => {
    switch (card.type) {
      case 'my_topic':
        return <MyTopicCardComponent key={`topic-${card.topic_id}`} card={card} />;
      case 'reacted_topic':
        return (
          <ReactedTopicCardComponent
            key={`reacted-${card.topic_id}-${card.reacted_at}`}
            card={card}
          />
        );
      case 'commented_topic':
        return (
          <CommentedTopicCardComponent
            key={`commented-${card.topic_id}-${card.commented_at}`}
            card={card}
          />
        );
      case 'quick_memo':
        return <QuickMemoCardComponent key={`memo-${card.memo_id}`} card={card} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* ヘッダー */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                📚 マイポートフォリオ
              </h1>
              <p className="text-gray-600 mt-1">
                {student?.display_name}さんの学習記録
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                📥 CSVエクスポート
              </button>
              <button
                onClick={() => router.push('/student/menu')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← メニューに戻る
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ポートフォリオ一覧（セッションごと） */}
      <div className="max-w-5xl mx-auto space-y-8">
        {!portfolio || portfolio.sessions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center text-gray-500">
            まだ参加した授業がありません
          </div>
        ) : (
          portfolio.sessions.map((session) => (
            <div
              key={session.session_id}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              {/* セッションヘッダー */}
              <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-200">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {session.topic_title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded font-semibold">
                      {session.session_code}
                    </span>
                    <span>📅 {session.session_date}</span>
                    <span>🕐 {session.period}時限</span>
                    {session.class_name && <span>🏫 {session.class_name}</span>}
                    {session.seat_number && (
                      <span>💺 座席 {session.seat_number}</span>
                    )}
                    <span className="ml-auto text-xs text-gray-500">
                      {session.cards.length} 件の記録
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedSessionId(session.session_id);
                    setShowAddMemoModal(true);
                  }}
                  className="ml-4 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>メモを追加</span>
                </button>
              </div>

              {/* カード一覧 */}
              {session.cards.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  この授業の記録はまだありません
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {session.cards.map((card) => renderCard(card))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 新規メモ追加モーダル */}
      {showAddMemoModal && selectedSessionId && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowAddMemoModal(false);
            setSelectedSessionId(null);
            setNewMemoContent('');
            setNewMemoTags('');
            setNewMemoFavorite(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              📝 新しいメモを追加
            </h2>

            <div className="space-y-4">
              {/* メモ内容 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メモ内容
                </label>
                <textarea
                  value={newMemoContent}
                  onChange={(e) => setNewMemoContent(e.target.value)}
                  placeholder="学習メモを入力してください..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* タグ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タグ（カンマ区切り）
                </label>
                <input
                  type="text"
                  value={newMemoTags}
                  onChange={(e) => setNewMemoTags(e.target.value)}
                  placeholder="例: 重要, 復習, 質問"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* お気に入り */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="favorite"
                  checked={newMemoFavorite}
                  onChange={(e) => setNewMemoFavorite(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="favorite" className="text-sm text-gray-700">
                  ⭐ お気に入りに追加
                </label>
              </div>

              {/* ボタン */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddMemoModal(false);
                    setSelectedSessionId(null);
                    setNewMemoContent('');
                    setNewMemoTags('');
                    setNewMemoFavorite(false);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddMemo}
                  disabled={!newMemoContent.trim()}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  追加する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
