'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SeatMap from '@/components/SeatMap';
import { SeatWithStudent, Student } from '@/types';
import { storage } from '@/lib/storage';

interface SessionSummary {
  id: number;
  code: string;
  topic_title: string;
  topic_content: string | null;
  date: string;
  period: number;
  class_id: number | null;
  class_name: string | null;
  topic_count: number;
  started_at: string;
}

interface ChatMessage {
  id: number;
  student_id: number;
  message: string;
  created_at: string;
  student?: {
    display_name: string;
  };
}

interface SessionDetails {
  seats: SeatWithStudent[];
  chat_count: number;
}

// 動物アイコンのリスト (42種類)
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

export default function AllClassesPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);
  const [sessionDetails, setSessionDetails] = useState<Record<number, SessionDetails>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});
  const [showChat, setShowChat] = useState<Record<number, boolean>>({});
  const [chatMessages, setChatMessages] = useState<Record<number, ChatMessage[]>>({});
  const [loadingChat, setLoadingChat] = useState<Record<number, boolean>>({});
  const [currentStudentId, setCurrentStudentId] = useState<number>(0);
  const [latestSessionCode, setLatestSessionCode] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState<boolean>(false);
  const [absenteesData, setAbsenteesData] = useState<Record<number, { count: number; students: Array<{ id: number; student_number: string; display_name: string }> }>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    // ログイン中の生徒情報を取得
    const storedStudent = storage.load<Student>('student');
    if (storedStudent) {
      setCurrentStudentId(storedStudent.id);
    }

    // 教科担当者認証を確認
    const teacherAuth = storage.load('teacher_auth');
    const isTeacherAuth = teacherAuth?.authenticated || false;

    if (isTeacherAuth) {
      setIsTeacher(true);
      // 教科担当者の場合、最新のセッションコードを取得
      const teacherSession = storage.load('teacher_session');
      if (teacherSession?.code) {
        setLatestSessionCode(teacherSession.code);
      }
    } else {
      // 生徒の場合、現在のセッションコードを取得
      const studentSession = storage.load('session');
      if (studentSession?.code) {
        setLatestSessionCode(studentSession.code);
      }
    }

    fetchSessions(isTeacherAuth);
  }, []);

  const fetchSessions = async (isTeacherAuth: boolean) => {
    try {
      const response = await fetch('/api/sessions/all');
      const data = await response.json();

      if (data.success) {
        setSessions(data.data.sessions);

        // 教科担当者の場合、全セッションの欠席者データを取得
        if (isTeacherAuth) {
          const absenteesPromises = data.data.sessions
            .filter((session: SessionSummary) => session.class_id)
            .map(async (session: SessionSummary) => {
              try {
                const absenteesResponse = await fetch(`/api/sessions/${session.id}/absentees`);
                const absenteesData = await absenteesResponse.json();
                return {
                  sessionId: session.id,
                  data: absenteesData.success ? {
                    count: absenteesData.data.absentees.length,
                    students: absenteesData.data.absentees,
                  } : null,
                };
              } catch (error) {
                console.error(`Failed to fetch absentees for session ${session.id}:`, error);
                return { sessionId: session.id, data: null };
              }
            });

          const absenteesResults = await Promise.all(absenteesPromises);
          const absenteesMap: Record<number, { count: number; students: Array<{ id: number; student_number: string; display_name: string }> }> = {};

          absenteesResults.forEach((result) => {
            if (result.data) {
              absenteesMap[result.sessionId] = result.data;
            }
          });

          setAbsenteesData(absenteesMap);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setLoading(false);
    }
  };

  const fetchSessionDetails = async (sessionId: number, forceRefresh = false) => {
    if (sessionDetails[sessionId] && !forceRefresh) {
      // すでに取得済み
      return;
    }

    setLoadingDetails({ ...loadingDetails, [sessionId]: true });

    try {
      const response = await fetch(`/api/sessions/${sessionId}/details`);
      const data = await response.json();

      if (data.success) {
        setSessionDetails({
          ...sessionDetails,
          [sessionId]: data.data,
        });
      }
    } catch (error) {
      console.error('Failed to fetch session details:', error);
    } finally {
      setLoadingDetails({ ...loadingDetails, [sessionId]: false });
    }
  };

  const handleSessionClick = async (sessionId: number) => {
    if (expandedSessionId === sessionId) {
      // 閉じる
      setExpandedSessionId(null);
    } else {
      // 展開
      setExpandedSessionId(sessionId);
      await fetchSessionDetails(sessionId);
    }
  };

  const handleChatToggle = async (sessionId: number) => {
    const isShowing = showChat[sessionId];
    setShowChat({ ...showChat, [sessionId]: !isShowing });

    // チャット履歴を取得（まだ取得していない場合）
    if (!isShowing && !chatMessages[sessionId]) {
      setLoadingChat({ ...loadingChat, [sessionId]: true });
      try {
        const response = await fetch(`/api/chat?sessionId=${sessionId}`);
        const data = await response.json();
        if (data.success) {
          setChatMessages({ ...chatMessages, [sessionId]: data.data });
        }
      } catch (error) {
        console.error('Failed to fetch chat messages:', error);
      } finally {
        setLoadingChat({ ...loadingChat, [sessionId]: false });
      }
    }
  };

  const handleOpenEditModal = (session: SessionSummary) => {
    setEditingSessionId(session.id);
    setEditTitle(session.topic_title);
    setEditContent(session.topic_content || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSessionId || !editTitle.trim() || editLoading) return;

    setEditLoading(true);
    try {
      const response = await fetch(`/api/sessions?id=${editingSessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicTitle: editTitle.trim(),
          topicContent: editContent.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // セッションリストを更新
        setSessions(sessions.map(s =>
          s.id === editingSessionId
            ? { ...s, topic_title: editTitle.trim(), topic_content: editContent.trim() || null }
            : s
        ));
        setShowEditModal(false);
        setEditingSessionId(null);
      } else {
        alert('更新に失敗しました: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to update session:', error);
      alert('更新中にエラーが発生しました');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* ヘッダー */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                🏛️ 過去の授業
              </h1>
              <p className="text-gray-600 mt-1">
                全クラス・全授業のトピック一覧
              </p>
            </div>
            <div className="flex gap-3">
              {latestSessionCode && (
                <button
                  onClick={() => router.push(isTeacher ? `/teacher/dashboard/${latestSessionCode}` : `/classroom/${latestSessionCode}`)}
                  className="text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-lg transition-colors"
                >
                  📚 現在の{isTeacher ? '授業' : '教室'}に戻る
                </button>
              )}
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                ← 戻る
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* セッション一覧 */}
      <div className="max-w-6xl mx-auto space-y-4">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center text-gray-500">
            まだ授業が実施されていません
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* セッションカード */}
              <div
                className="p-6 cursor-pointer"
                onClick={() => handleSessionClick(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono bg-purple-100 text-purple-700 px-3 py-1 rounded font-semibold text-sm">
                        {session.code}
                      </span>
                      <span className="text-sm text-gray-600">
                        📅 {session.date}
                      </span>
                      <span className="text-sm text-gray-600">
                        🕐 {session.period}時限
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                      {session.class_name && (
                        <span className="text-purple-600">{session.class_name} | </span>
                      )}
                      {session.topic_title}
                      {isTeacher && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(session);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          title="テーマを編集"
                        >
                          ✏️ 編集
                        </button>
                      )}
                    </h2>
                    {session.topic_content && (
                      <p className="text-sm text-gray-600 mb-3">
                        📋 {session.topic_content}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📝 投稿数: {session.topic_count}件</span>
                      {isTeacher && session.class_id && absenteesData[session.id] && (
                        <span className="text-red-600">
                          👥 欠席者: {absenteesData[session.id].count}名
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl text-gray-400">
                    {expandedSessionId === session.id ? '▲' : '▼'}
                  </div>
                </div>
              </div>

              {/* 展開エリア */}
              {expandedSessionId === session.id && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  {loadingDetails[session.id] ? (
                    <div className="text-center py-8 text-gray-500">
                      読み込み中...
                    </div>
                  ) : sessionDetails[session.id] ? (
                    <div className="space-y-4">
                      {/* 座席マップ */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          🗺️ 座席マップ
                          <span className="text-sm font-normal text-gray-500">
                            （クリックで投稿内容を表示）
                          </span>
                        </h3>
                        <div className="bg-white rounded-lg p-4">
                          <SeatMap
                            seats={sessionDetails[session.id].seats}
                            viewMode="student"
                            currentStudentId={isTeacher ? -999 : currentStudentId}
                            onReactionChange={() => fetchSessionDetails(session.id, true)}
                          />
                        </div>
                      </div>

                      {/* 欠席者リスト（教科担当者のみ） */}
                      {isTeacher && session.class_id && absenteesData[session.id] && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            👥 欠席者リスト
                            <span className="text-sm font-normal text-gray-500">
                              （{absenteesData[session.id].count}名）
                            </span>
                          </h3>
                          <div className="bg-white rounded-lg p-4">
                            {absenteesData[session.id].count === 0 ? (
                              <div className="text-center py-4 text-gray-500">
                                ✨ 全員出席
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {absenteesData[session.id].students.map((student) => (
                                  <div
                                    key={student.id}
                                    className="flex items-center gap-3 p-2 bg-gray-50 rounded"
                                  >
                                    <span className="text-sm text-gray-500 font-mono">
                                      {student.student_number}
                                    </span>
                                    <span className="text-gray-800">
                                      {student.display_name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* チャット履歴 */}
                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChatToggle(session.id);
                          }}
                          className="flex items-center gap-2 text-lg font-semibold text-gray-800 hover:text-purple-600 transition-colors"
                        >
                          💬 チャット履歴
                          <span className="text-sm font-normal text-gray-500">
                            ({sessionDetails[session.id].chat_count}件)
                          </span>
                          <span className="text-sm text-purple-600">
                            {showChat[session.id] ? '▼ 閉じる' : '▶ 表示'}
                          </span>
                        </button>

                        {showChat[session.id] && (
                          <div className="mt-3 bg-white rounded-lg p-4 max-h-96 overflow-y-auto">
                            {loadingChat[session.id] ? (
                              <p className="text-sm text-gray-500 text-center py-4">
                                読み込み中...
                              </p>
                            ) : chatMessages[session.id] && chatMessages[session.id].length > 0 ? (
                              <div className="space-y-3">
                                {chatMessages[session.id].map((msg) => (
                                  <div key={msg.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-gray-700">
                                        {msg.student_id === null || msg.student_id === -999 ? (
                                          '👨‍🏫 教科担当者'
                                        ) : msg.student_id === -1 ? (
                                          '🎭 ゲスト'
                                        ) : (
                                          <span className="flex items-center gap-1">
                                            <span className="text-base">{getAnimalIcon(msg.student_id)}</span>
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {new Date(msg.created_at).toLocaleString('ja-JP', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                      {msg.message}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-4">
                                チャット履歴はありません
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      詳細情報の取得に失敗しました
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* セッション編集モーダル（教員のみ） */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              セッション情報を編集
            </h2>

            <div className="space-y-4">
              {/* タイトル編集 */}
              <div>
                <label
                  htmlFor="editTitle"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  授業タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  id="editTitle"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="例: 民主主義とは何か"
                />
              </div>

              {/* 説明編集 */}
              <div>
                <label
                  htmlFor="editContent"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  授業の記録・メモ（授業後の振り返りや補足説明）
                </label>
                <textarea
                  id="editContent"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                  placeholder="授業の記録や振り返りを入力してください..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  ※この説明は「過去の授業」画面で表示されます
                </p>
              </div>

              {/* ボタン */}
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSessionId(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading || !editTitle.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {editLoading ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
