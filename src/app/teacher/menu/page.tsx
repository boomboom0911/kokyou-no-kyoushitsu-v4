'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import Link from 'next/link';

export default function TeacherMenuPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // 認証確認
    const auth = storage.load('teacher_auth');
    if (!auth || !auth.authenticated) {
      router.push('/');
      return;
    }
    setAuthenticated(true);
  }, [router]);

  const handleLogout = () => {
    storage.clear();
    router.push('/');
  };

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                👨‍🏫 教員メニュー
              </h1>
              <p className="text-gray-600 mt-1">
                授業管理・掲示板管理
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* メニューカード */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 1. 授業セッション管理 */}
          <Link href="/teacher/create-session">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-500">
              <div className="text-5xl mb-4">🏛️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                授業セッション管理
              </h2>
              <p className="text-gray-600 mb-4">
                新しい授業セッションを作成し、4桁のコードを生徒に共有します
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">できること:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• セッション作成（4桁コード自動生成）</li>
                  <li>• トピック・コメントのリアルタイム閲覧</li>
                  <li>• 授業進行状況の確認</li>
                  <li>• セッション終了管理</li>
                </ul>
              </div>
            </div>
          </Link>

          {/* 2. 掲示板管理 */}
          <div className="space-y-6">
            {/* 新しい掲示板を作成 */}
            <Link href="/teacher/boards/create">
              <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
                <div className="text-5xl mb-4">📋</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  新しい掲示板を作成
                </h2>
                <p className="text-gray-600 mb-4">
                  課題提出・ピアレビュー用の掲示板を作成します
                </p>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">設定項目:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 課題タイトル・説明文</li>
                    <li>• レビュー必要数の設定</li>
                    <li>• 提出・レビュー締切</li>
                    <li>• 4桁コード自動生成</li>
                  </ul>
                </div>
              </div>
            </Link>

            {/* 掲示板一覧 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>📊</span>
                <span>掲示板一覧</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                作成済みの掲示板を確認・管理できます
              </p>
              <BoardsList />
            </div>
          </div>
        </div>

        {/* 機能説明 */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">💡 システム概要</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">授業セッション:</h4>
              <p>リアルタイムの授業中に、生徒がトピックを投稿し、クラス全体で議論を行う機能です。</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">掲示板（ピアレビュー）:</h4>
              <p>課題提出後、動物アイコンで匿名性を保ちながら、生徒同士で相互評価を行う機能です。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 掲示板一覧コンポーネント
 */
function BoardsList() {
  const router = useRouter();
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await fetch('/api/board');
        const data = await response.json();
        if (data.success) {
          setBoards(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch boards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-500">
        読み込み中...
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
        <p className="mb-2">まだ掲示板がありません</p>
        <p className="text-xs">「新しい掲示板を作成」から始めましょう</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {boards.map((board) => (
        <button
          key={board.id}
          onClick={() => router.push(`/teacher/boards/${board.id}`)}
          className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">{board.title}</h4>
              <p className="text-xs text-gray-500 mt-1">
                コード: <span className="font-mono font-bold">{board.code}</span>
              </p>
            </div>
            <span className="text-xs text-gray-400">
              {new Date(board.created_at).toLocaleDateString('ja-JP')}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
