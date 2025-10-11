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

interface SessionDetails {
  seats: SeatWithStudent[];
  chat_count: number;
}

export default function AllClassesPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);
  const [sessionDetails, setSessionDetails] = useState<Record<number, SessionDetails>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});
  const [showChat, setShowChat] = useState<Record<number, boolean>>({});
  const [currentStudentId, setCurrentStudentId] = useState<number>(0);
  const [latestSessionCode, setLatestSessionCode] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState<boolean>(false);
  const [absenteesData, setAbsenteesData] = useState<Record<number, { count: number; students: Array<{ id: number; student_number: string; display_name: string }> }>>({});

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

  const fetchSessionDetails = async (sessionId: number) => {
    if (sessionDetails[sessionId]) {
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
    setShowChat({ ...showChat, [sessionId]: !showChat[sessionId] });

    // チャット履歴を取得（まだ取得していない場合）
    if (!showChat[sessionId]) {
      // TODO: チャット履歴取得API呼び出し
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
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                      {session.class_name && (
                        <span className="text-purple-600">{session.class_name} | </span>
                      )}
                      {session.topic_title}
                    </h2>
                    {session.topic_content && (
                      <p className="text-sm text-gray-600 mb-3">
                        {session.topic_content}
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
                            currentStudentId={currentStudentId}
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
                          <div className="mt-3 bg-white rounded-lg p-4">
                            <p className="text-sm text-gray-500 text-center py-4">
                              チャット履歴の表示機能は実装中です
                            </p>
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
    </div>
  );
}
