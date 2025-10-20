'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Student, LessonSession, SeatWithStudent } from '@/types';
import SeatMap from '@/components/SeatMap';
import ChatPanel from '@/components/ChatPanel';
import QuickMemo from '@/components/QuickMemo';
import TopicCard from '@/components/TopicCard';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { getUnreadCount } from '@/lib/notifications';

export default function ClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionCode = params.sessionCode as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [session, setSession] = useState<LessonSession | null>(null);
  const [seats, setSeats] = useState<SeatWithStudent[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [mySeat, setMySeat] = useState<number | null>(null);
  const [topicContent, setTopicContent] = useState('');
  const [hasPosted, setHasPosted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'select_seat' | 'post_topic'>('select_seat');
  const [view, setView] = useState<'seatmap' | 'topics'>('seatmap');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 認証情報確認
    const storedStudent = storage.load<Student>('student');
    const storedSession = storage.load<LessonSession>('session');

    if (!storedStudent || !storedSession || storedSession.code !== sessionCode) {
      router.push('/student');
      return;
    }

    setStudent(storedStudent);
    setSession(storedSession);

    // 座席情報を取得
    fetchSeats(storedSession.id, storedStudent.id);

    // 未読通知数を取得
    fetchUnreadCount(storedStudent.id);
  }, [sessionCode, router]);

  // 未読通知数を定期的に取得（30秒ごと）
  useEffect(() => {
    if (!student?.id) return;

    const interval = setInterval(() => {
      fetchUnreadCount(student.id);
    }, 30000);

    return () => clearInterval(interval);
  }, [student?.id]);

  const fetchUnreadCount = async (studentId: number) => {
    try {
      const count = await getUnreadCount(studentId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchSeats = async (sessionId: number, studentId: number) => {
    try {
      const response = await fetch(`/api/seats?sessionId=${sessionId}`);
      const data = await response.json();

      if (data.success) {
        setSeats(data.data);

        // 自分の座席を確認
        const mySeatData = data.data.find(
          (s: SeatWithStudent) => s.student?.id === studentId
        );

        if (mySeatData) {
          setMySeat(mySeatData.seat_number);
          setStep('post_topic');

          // トピック投稿済みかチェック
          if (mySeatData.topic_post) {
            setHasPosted(true);
            setTopicContent(mySeatData.topic_post.content);
          }
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch seats:', err);
      setError('座席情報の取得に失敗しました');
      setLoading(false);
    }
  };

  const handleSeatSelect = async () => {
    if (!selectedSeat || !student || !session) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/seats/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          seatNumber: selectedSeat,
          studentEmail: student.google_email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMySeat(selectedSeat);
        setStep('post_topic');
        fetchSeats(session.id, student.id);
      } else {
        setError(data.error || '座席の選択に失敗しました');
      }
    } catch (err) {
      console.error('Seat select error:', err);
      setError('座席選択中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSubmit = async () => {
    if (!topicContent.trim() || !student || !session) return;

    setLoading(true);
    setError('');

    try {
      // 座席割り当てIDを取得
      const mySeatData = seats.find((s) => s.seat_number === mySeat);
      if (!mySeatData || !mySeatData.seat_assignment_id) {
        setError('座席情報が見つかりません');
        setLoading(false);
        return;
      }

      const seatAssignmentId = mySeatData.seat_assignment_id;

      const response = await fetch('/api/topics/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          seatAssignmentId,
          content: topicContent.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setHasPosted(true);
        fetchSeats(session.id, student.id);
      } else {
        setError(data.error || 'トピックの投稿に失敗しました');
      }
    } catch (err) {
      console.error('Topic submit error:', err);
      setError('トピック投稿中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSeat = async () => {
    if (!student || !session) return;

    const confirmed = window.confirm(
      '座席の選択をキャンセルしますか？\n投稿した内容も削除されます。'
    );

    if (!confirmed) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/seats/cancel', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          studentEmail: student.google_email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 状態をリセット
        setMySeat(null);
        setSelectedSeat(null);
        setTopicContent('');
        setHasPosted(false);
        setStep('select_seat');
        fetchSeats(session.id, student.id);
      } else {
        setError(data.error || '座席のキャンセルに失敗しました');
      }
    } catch (err) {
      console.error('Cancel seat error:', err);
      setError('座席キャンセル中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <div className="flex-shrink-0 max-w-7xl w-full mx-auto px-4 pt-2 pb-1.5">
        <div className="bg-white rounded-lg shadow p-3">
          {/* タイトル行 */}
          <div className="mb-2">
            <h1 className="text-lg font-bold text-gray-800 leading-tight">
              {session?.topic_title}
            </h1>
            <p className="text-[10px] text-gray-500">
              {sessionCode} | {student?.display_name}
              {mySeat && ` | 座席 ${mySeat}`}
            </p>
          </div>

          {/* タブ＋ボタン行 */}
          <div className="flex items-center justify-between gap-3">
            {/* 左側: タブ切り替え（座席選択完了後のみ表示） */}
            {step === 'post_topic' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setView('seatmap')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    view === 'seatmap'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🗺️ 座席マップ
                </button>
                <button
                  onClick={() => setView('topics')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    view === 'topics'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📝 提出トピック一覧
                </button>
              </div>
            )}
            {step === 'select_seat' && <div></div>}

            {/* 右側: アクションボタン */}
            <div className="flex items-center gap-2">
              {/* 通知ベル */}
              {student && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    🔔 通知
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && student && (
                    <NotificationDropdown
                      studentId={student.id}
                      onClose={() => {
                        setShowNotifications(false);
                        fetchUnreadCount(student.id);
                      }}
                    />
                  )}
                </div>
              )}

              <button
                onClick={() => router.push('/student/menu')}
                className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                📚 ポートフォリオ
              </button>
              <button
                onClick={() => router.push('/all-classes')}
                className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                🏛️ みんなの議論
              </button>
              {mySeat && step === 'post_topic' && (
                <button
                  onClick={handleCancelSeat}
                  disabled={loading}
                  className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  座席キャンセル
                </button>
              )}
              <button
                onClick={() => router.push('/student')}
                className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 pb-1.5 overflow-y-auto">
        {step === 'select_seat' && (
          <div className="space-y-6 py-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">座席を選択してください</h2>
              <SeatMap
                seats={seats}
                onSeatSelect={setSelectedSeat}
                selectedSeat={selectedSeat}
                currentStudentSeat={mySeat}
                viewMode="student"
              />

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {selectedSeat && (
                <div className="mt-6 mb-6 flex justify-center">
                  <button
                    onClick={handleSeatSelect}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
                  >
                    {loading ? '選択中...' : `座席 ${selectedSeat} を確定`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'post_topic' && (
          <div className="space-y-3 py-2">
            {/* 座席マップビュー */}
            {view === 'seatmap' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* 左カラム: 座席マップ + トピック投稿 */}
                <div className="lg:col-span-2 space-y-2">
                  {/* 座席マップ */}
                  <div className="bg-white rounded-lg shadow p-2.5">
                    <h2 className="text-sm font-semibold mb-1.5">座席表</h2>
                    <SeatMap
                      seats={seats}
                      currentStudentSeat={mySeat}
                      currentStudentId={student?.id || 0}
                      viewMode="student"
                      onReactionChange={() => session && student && fetchSeats(session.id, student.id)}
                    />
                  </div>

                  {/* トピック投稿（投稿していない場合のみ表示） */}
                  {!hasPosted && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-xl font-semibold mb-4">トピックを投稿</h2>

                      {/* 固定テキスト: トピックテーマの説明 */}
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          ℹ️ 民主主義に関わるトピックを提出してください。単語や記事の見出しだけでなく、トピックの内容や何を問いたいかを説明するようにしてください。
                        </p>
                      </div>

                      <textarea
                        value={topicContent}
                        onChange={(e) => setTopicContent(e.target.value)}
                        placeholder="あなたの意見を書いてください..."
                        disabled={loading}
                        className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                      />

                      {error && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-red-700 text-sm">{error}</p>
                        </div>
                      )}

                      <div className="mt-4">
                        <button
                          onClick={handleTopicSubmit}
                          disabled={loading || !topicContent.trim()}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                          {loading ? '投稿中...' : '投稿する'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 投稿完了メッセージ */}
                  {hasPosted && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-700 font-medium">✓ トピックを投稿しました</p>
                        <p className="text-sm text-green-600 mt-1">座席マップで投稿を確認できます（緑色の座席）</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 右カラム: チャットパネル */}
                <div className="lg:col-span-1">
                  {student && session && (
                    <div className="sticky top-3 h-[calc(100vh-8rem)]">
                      <ChatPanel sessionId={session.id} currentStudentId={student.id} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* トピック一覧ビュー */}
            {view === 'topics' && (
              <div className="space-y-4">
                {/* ヘッダー */}
                <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">📝 提出トピック一覧</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      この授業で提出されたトピックを確認できます（新しい順）
                    </p>
                  </div>
                  <button
                    onClick={() => session && student && fetchSeats(session.id, student.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    🔄 最新の投稿を見る
                  </button>
                </div>

                {/* 投稿一覧（新しい順） */}
                {seats.filter((s) => s.topic_post).length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    まだ投稿がありません
                  </div>
                ) : (
                  seats
                    .filter((s) => s.topic_post && s.student)
                    .sort((a, b) => {
                      // created_at で降順ソート（新しい順）
                      const dateA = a.topic_post?.created_at ? new Date(a.topic_post.created_at).getTime() : 0;
                      const dateB = b.topic_post?.created_at ? new Date(b.topic_post.created_at).getTime() : 0;
                      return dateB - dateA;
                    })
                    .map((seat) =>
                      seat.topic_post && seat.student ? (
                        <TopicCard
                          key={seat.topic_post.id}
                          post={seat.topic_post}
                          author={seat.student}
                          currentStudentId={student?.id || 0}
                          seatNumber={seat.seat_number}
                          onReactionChange={() => session && student && fetchSeats(session.id, student.id)}
                        />
                      ) : null
                    )
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* QuickMemo */}
      {student && session && (
        <QuickMemo studentId={student.id} sessionId={session.id} />
      )}
    </div>
  );
}
