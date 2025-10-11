'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { LessonSession, SeatWithStudent } from '@/types';
import SeatMap from '@/components/SeatMap';
import TopicCard from '@/components/TopicCard';
import ChatPanel from '@/components/ChatPanel';

export default function TeacherDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const sessionCode = params.sessionCode as string;

  const [session, setSession] = useState<LessonSession | null>(null);
  const [seats, setSeats] = useState<SeatWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'seatmap' | 'discussion'>('seatmap');
  const [viewMode, setViewMode] = useState<'teacher' | 'student'>('student'); // 座席マップの向き（デフォルトは生徒視点）
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showAbsenteesModal, setShowAbsenteesModal] = useState(false);
  const [showSessionCodeModal, setShowSessionCodeModal] = useState(false);
  const [absenteeData, setAbsenteeData] = useState<{
    total: number;
    attendees: number;
    absentees: Array<{ id: number; student_number: string; display_name: string }>;
  } | null>(null);

  useEffect(() => {
    // 教科担当者認証確認
    const teacherAuth = storage.load('teacher_auth');
    if (!teacherAuth?.authenticated) {
      router.push('/teacher');
      return;
    }

    // セッション情報取得
    fetchSession();
    fetchSeats();
  }, [router, sessionCode]);

  // 自動更新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchSeats();
      // クラスが選択されている場合は欠席者データも更新（モーダルは表示しない）
      if (session?.id && session?.class_id) {
        fetch(`/api/sessions/${session.id}/absentees`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setAbsenteeData(data.data);
            }
          })
          .catch((err) => console.error('Failed to auto-refresh absentees:', err));
      }
    }, 5000); // 5秒ごとに更新

    return () => clearInterval(interval);
  }, [autoRefresh, session?.id, session?.class_id]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/sessions?code=${sessionCode}`);
      const data = await response.json();

      if (data.success) {
        setSession(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    }
  };

  const fetchSeats = async () => {
    if (!session?.id) {
      // セッションIDが取得できていない場合は一度取得
      const response = await fetch(`/api/sessions?code=${sessionCode}`);
      const data = await response.json();
      if (data.success) {
        setSession(data.data);
        fetchSeatsById(data.data.id);
      }
    } else {
      fetchSeatsById(session.id);
    }
  };

  const fetchSeatsById = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/seats?sessionId=${sessionId}`);
      const data = await response.json();

      if (data.success) {
        setSeats(data.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch seats:', error);
      setLoading(false);
    }
  };

  const fetchAbsentees = async () => {
    if (!session?.id) return;

    try {
      const response = await fetch(`/api/sessions/${session.id}/absentees`);
      const data = await response.json();

      if (data.success) {
        setAbsenteeData(data.data);
        setShowAbsenteesModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch absentees:', error);
    }
  };

  const handleShowSessionCode = () => {
    setShowSessionCodeModal(true);
  };

  const handleCopySessionCode = () => {
    navigator.clipboard.writeText(sessionCode).then(() => {
      // コピー成功のフィードバック
      const originalText = '📋 コピー完了！';
      alert(originalText);
    }).catch((err) => {
      console.error('Failed to copy:', err);
    });
  };

  const handleEndSession = async () => {
    if (!session?.id) return;

    const confirmMessage = session.class_id
      ? 'このセッションを終了しますか？\n欠席者が記録され、新規作成画面に戻ります。'
      : 'このセッションを終了しますか？\n新規作成画面に戻ります。';

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/sessions/${session.id}/end`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        // teacher_sessionをクリア
        storage.remove('teacher_session');
        // 新規作成画面に戻る
        router.push('/teacher/create-session');
      } else {
        alert('セッション終了に失敗しました: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      alert('セッション終了中にエラーが発生しました');
    }
  };

  const participantCount = seats.length;
  const postedCount = seats.filter((s) => s.topic_post).length;
  const absenteeCount = absenteeData ? absenteeData.absentees.length : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 p-6 flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">
                👨‍🏫 教室画面
              </h1>
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                <span className="font-semibold">{session?.topic_title}</span>
                <span>|</span>
                <span>セッションコード:</span>
                <span
                  onClick={handleShowSessionCode}
                  className="font-mono font-bold text-purple-600 px-3 py-1 rounded bg-purple-50 hover:bg-purple-200 hover:scale-110 transition-all duration-200 cursor-pointer relative group"
                  title="クリックで大きく表示"
                >
                  {sessionCode}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    🔍 クリックで拡大表示
                  </span>
                </span>
              </p>
              {session?.topic_content && (
                <p className="text-sm text-gray-500 mt-2 max-w-3xl">
                  📋 {session.topic_content}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <button
                onClick={() => router.push('/all-classes')}
                className="text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-lg transition-colors"
              >
                🏛️ 過去の授業
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                  autoRefresh
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {autoRefresh ? '🔄 自動更新ON' : '⏸️ 自動更新OFF'}
              </button>
              <button
                onClick={handleEndSession}
                className="text-sm bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg"
              >
                セッション終了
              </button>
              <button
                onClick={() => router.push('/teacher/create-session')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← 新規作成
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 統計情報 + 視点切り替え */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center justify-between gap-4">
            {/* 統計情報 */}
            <div className="flex gap-6">
              <div>
                <div className="text-xs text-gray-500">出席数</div>
                <div className="text-xl font-bold text-blue-600">{participantCount}</div>
              </div>
              {session?.class_id && (
                <div>
                  <div className="text-xs text-gray-500">欠席者数</div>
                  <div className="text-xl font-bold text-red-600">
                    {absenteeData ? absenteeData.absentees.length : '-'}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500">投稿済み</div>
                <div className="text-xl font-bold text-green-600">{postedCount}</div>
              </div>
            </div>

            {/* 表示切り替え */}
            <div className="flex gap-3">
              {/* 欠席者確認ボタン（クラスが選択されている場合のみ） */}
              {session?.class_id && (
                <button
                  onClick={fetchAbsentees}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200"
                >
                  👥 欠席者を確認
                </button>
              )}

              {/* 座席マップ/投稿一覧 切り替え */}
              <div className="flex gap-2">
                <button
                  onClick={() => setView('seatmap')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    view === 'seatmap'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🗺️ 座席マップ
                </button>
                <button
                  onClick={() => setView('discussion')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    view === 'discussion'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💬 投稿一覧
                </button>
              </div>

              {/* 座席マップの向き切り替え（座席マップ表示時のみ） */}
              {view === 'seatmap' && (
                <div className="flex gap-2 border-l pl-3">
                  <button
                    onClick={() => setViewMode('student')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'student'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    👨‍🎓 生徒から
                  </button>
                  <button
                    onClick={() => setViewMode('teacher')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'teacher'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    👨‍🏫 教卓から
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 max-w-7xl mx-auto overflow-auto w-full">
        {view === 'seatmap' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左カラム: 座席マップ */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">座席マップ</h2>
                <SeatMap seats={seats} viewMode={viewMode} currentStudentId={0} />
              </div>
            </div>

            {/* 右カラム: チャットパネル */}
            <div className="lg:col-span-1">
              {session && (
                <div className="sticky top-6">
                  <ChatPanel sessionId={session.id} currentStudentId={0} />
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'discussion' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左カラム: 投稿一覧 */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-semibold">投稿一覧</h2>
              </div>

              {seats.filter((s) => s.topic_post).length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  まだ投稿がありません
                </div>
              ) : (
                seats
                  .filter((s) => s.topic_post && s.student)
                  .map((seat) =>
                    seat.topic_post && seat.student ? (
                      <TopicCard
                        key={seat.topic_post.id}
                        post={seat.topic_post}
                        author={seat.student}
                        currentStudentId={0} // 教科担当者は0を指定
                        seatNumber={seat.seat_number}
                      />
                    ) : null
                  )
              )}
            </div>

            {/* 右カラム: チャットパネル */}
            <div className="lg:col-span-1">
              {session && (
                <div className="sticky top-6">
                  <ChatPanel sessionId={session.id} currentStudentId={0} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 欠席者確認モーダル */}
      {showAbsenteesModal && absenteeData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAbsenteesModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  👥 欠席者リスト
                </h2>
                <button
                  onClick={() => setShowAbsenteesModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* 欠席者リスト */}
              {absenteeData.absentees.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-lg">
                  ✨ 全員出席
                </div>
              ) : (
                <div className="space-y-2">
                  {absenteeData.absentees.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-500 font-mono">
                        {student.student_number}
                      </span>
                      <span className="text-gray-800 font-medium">
                        {student.display_name}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 閉じるボタン */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowAbsenteesModal(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* セッションコード拡大表示モーダル */}
      {showSessionCodeModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setShowSessionCodeModal(false)}
        >
          <div
            className="text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* タイトル */}
            <h2 className="text-6xl font-bold text-white mb-12 animate-pulse">
              セッションコード
            </h2>

            {/* セッションコード */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl p-16 shadow-2xl mb-12">
              <div className="font-mono font-black text-white text-[20rem] leading-none tracking-widest">
                {sessionCode}
              </div>
            </div>

            {/* 説明とボタン */}
            <div className="space-y-8">
              <p className="text-4xl text-white font-semibold">
                このコードを入力して教室に入室してください
              </p>

              <div className="flex gap-6 justify-center">
                <button
                  onClick={handleCopySessionCode}
                  className="bg-white hover:bg-gray-100 text-purple-600 font-bold text-3xl px-12 py-6 rounded-2xl transition-all hover:scale-105 shadow-lg"
                >
                  📋 コピー
                </button>
                <button
                  onClick={() => setShowSessionCodeModal(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold text-3xl px-12 py-6 rounded-2xl transition-all hover:scale-105 shadow-lg"
                >
                  ✕ 閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
