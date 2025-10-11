'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';

interface Class {
  id: number;
  name: string;
  grade: number | null;
}

interface StudentRow {
  email: string;
  displayName: string;
  studentNumber: string;
  classId: number | null;
}

export default function RegisterStudentsPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [studentEmail, setStudentEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [bulkData, setBulkData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // 教科担当者認証確認
    const teacherAuth = storage.load('teacher_auth');
    if (!teacherAuth?.authenticated) {
      router.push('/teacher');
      return;
    }

    fetchClasses();
  }, [router]);

  const fetchClasses = async () => {
    try {
      // 全クラスを取得（生徒データに紐づいていなくてもOK）
      const response = await fetch('/api/classes');
      const data = await response.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!studentEmail.trim() || !displayName.trim() || !studentNumber.trim()) {
        setError('すべての項目を入力してください');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/students/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: studentEmail.trim(),
          displayName: displayName.trim(),
          studentNumber: studentNumber.trim(),
          classId: selectedClassId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`生徒「${displayName}」を登録しました`);
        // フォームをリセット
        setStudentEmail('');
        setDisplayName('');
        setStudentNumber('');
      } else {
        setError(data.error || '生徒の登録に失敗しました');
      }
    } catch (err) {
      console.error('Register student error:', err);
      setError('登録中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!bulkData.trim()) {
        setError('データを入力してください');
        setLoading(false);
        return;
      }

      // TSV/CSV形式のデータをパース
      const lines = bulkData.trim().split('\n');
      const students: StudentRow[] = [];

      for (const line of lines) {
        // タブまたはカンマで分割
        const cols = line.split(/\t|,/).map(col => col.trim());

        if (cols.length < 2) {
          setError(`データ形式が不正です。各行に「メールアドレス」「表示名」「クラス名（オプション）」を入力してください`);
          setLoading(false);
          return;
        }

        const [email, name, className] = cols;

        // メールアドレスから学籍番号を自動生成
        const studentNumber = email.split('@')[0];

        // クラス名からクラスIDを検索
        let classId: number | null = selectedClassId;
        if (className) {
          const foundClass = classes.find(c => c.name === className.trim());
          if (foundClass) {
            classId = foundClass.id;
          }
        }

        students.push({
          email: email.trim(),
          displayName: name.trim(),
          studentNumber,
          classId,
        });
      }

      // 一括登録APIを呼び出し
      const response = await fetch('/api/students/register-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ students }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`${data.data.success_count}名の生徒を登録しました${data.data.failed_count > 0 ? `（${data.data.failed_count}名失敗）` : ''}`);
        setBulkData('');

        // 失敗した生徒がいる場合は詳細を表示
        if (data.data.errors && data.data.errors.length > 0) {
          const errorDetails = data.data.errors.map((err: any) =>
            `${err.email}: ${err.error}`
          ).join('\n');
          setError(`以下の生徒の登録に失敗しました:\n${errorDetails}`);
        }
      } else {
        setError(data.error || '一括登録に失敗しました');
      }
    } catch (err) {
      console.error('Bulk register error:', err);
      setError('一括登録中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                👥 生徒データ登録
              </h1>
              <p className="text-gray-600 mt-1">生徒情報を登録します</p>
            </div>
            <button
              onClick={() => router.push('/teacher/create-session')}
              className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100"
            >
              ← 戻る
            </button>
          </div>
        </div>

        {/* モード切り替え */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('single');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                mode === 'single'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              👤 単一登録
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('bulk');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                mode === 'bulk'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📊 一括登録（スプレッドシート）
            </button>
          </div>
        </div>

        {/* 単一登録フォーム */}
        {mode === 'single' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* メールアドレス */}
            <div>
              <label
                htmlFor="studentEmail"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                id="studentEmail"
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="例: tanaka.taro@school.ed.jp"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                disabled={loading}
              />
            </div>

            {/* 表示名 */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                表示名（氏名） <span className="text-red-500">*</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例: 田中太郎"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                disabled={loading}
              />
            </div>

            {/* 学籍番号 */}
            <div>
              <label
                htmlFor="studentNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                学籍番号 <span className="text-red-500">*</span>
              </label>
              <input
                id="studentNumber"
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="例: 2101"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                disabled={loading}
              />
            </div>

            {/* クラス選択 */}
            <div>
              <label
                htmlFor="class"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                クラス（オプション）
              </label>
              <select
                id="class"
                value={selectedClassId || ''}
                onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                disabled={loading}
              >
                <option value="">クラスを選択しない</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                クラスに所属しない生徒の場合は選択不要です
              </p>
            </div>

            {/* 成功メッセージ */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}

            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* 登録ボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {loading ? '登録中...' : '生徒を登録'}
            </button>
          </form>

            {/* 説明 */}
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">💡 使い方</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• メールアドレスは学校のGoogleアカウントのアドレスです</li>
                <li>• 表示名は座席マップに表示される名前です</li>
                <li>• 学籍番号は管理用の番号です（例: 2101）</li>
                <li>• クラスは任意です。複数クラスを担当する生徒などは選択不要です</li>
              </ul>
            </div>
          </div>
        )}

        {/* 一括登録フォーム */}
        {mode === 'bulk' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleBulkSubmit} className="space-y-6">
              {/* デフォルトクラス選択 */}
              <div>
                <label
                  htmlFor="defaultClass"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  デフォルトクラス（オプション）
                </label>
                <select
                  id="defaultClass"
                  value={selectedClassId || ''}
                  onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  disabled={loading}
                >
                  <option value="">クラスを選択しない</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  データにクラス名が含まれていない場合、このクラスが適用されます
                </p>
              </div>

              {/* スプレッドシートデータ入力 */}
              <div>
                <label
                  htmlFor="bulkData"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  生徒データ <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="bulkData"
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  placeholder="ExcelやGoogleスプレッドシートからコピー&ペーストしてください&#10;&#10;形式例:&#10;tanaka@school.ed.jp	田中太郎	2-1&#10;suzuki@school.ed.jp	鈴木花子	2-1&#10;sato@school.ed.jp	佐藤次郎	2-2"
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm text-gray-900 placeholder:text-gray-400 placeholder:font-sans"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  各行に「メールアドレス」「表示名」「クラス名（オプション）」をタブ区切りまたはカンマ区切りで入力。学籍番号はメールアドレスから自動生成されます。
                </p>
              </div>

              {/* 成功メッセージ */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm whitespace-pre-line">{success}</p>
                </div>
              )}

              {/* エラーメッセージ */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm whitespace-pre-line">{error}</p>
                </div>
              )}

              {/* 登録ボタン */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {loading ? '一括登録中...' : '一括登録'}
              </button>
            </form>

            {/* 説明 */}
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">💡 使い方</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• ExcelやGoogleスプレッドシートで生徒データを作成</li>
                <li>• 列は「メールアドレス」「表示名」「クラス名（オプション）」の順</li>
                <li>• 学籍番号はメールアドレスの@前の部分から自動生成されます</li>
                <li>• データを選択してコピー（Ctrl+C / Cmd+C）</li>
                <li>• 上のテキストエリアに貼り付け（Ctrl+V / Cmd+V）</li>
                <li>• 「一括登録」ボタンをクリック</li>
              </ul>
              <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                <p className="text-xs text-purple-700 font-semibold mb-1">例:</p>
                <pre className="text-xs text-gray-600 font-mono">
tanaka@school.ed.jp	田中太郎	2-1
suzuki@school.ed.jp	鈴木花子	2-1
sato@school.ed.jp	佐藤次郎	2-2
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
