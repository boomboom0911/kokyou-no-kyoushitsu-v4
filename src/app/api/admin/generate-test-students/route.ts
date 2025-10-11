import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/admin/generate-test-students
 * テスト用生徒データを生成（2-1〜2-5、各8名、計40名）
 */
export async function POST() {
  try {
    // クラス一覧を取得
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .order('name', { ascending: true });

    if (classesError) throw classesError;

    if (!classes || classes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'クラスデータが存在しません。先にクラスを作成してください。',
        },
        { status: 400 }
      );
    }

    // 各クラスに8名の生徒を生成
    const students = [];
    for (const cls of classes) {
      // クラス名から番号を抽出（例: 2-1 → 1）
      const classNumber = cls.name.split('-')[1];

      for (let i = 1; i <= 8; i++) {
        const studentNumber = `2${classNumber}${String(i).padStart(2, '0')}`; // 例: 2101, 2102, ...
        students.push({
          google_email: `${studentNumber}@nansho.ed.jp`,
          class_id: cls.id,
          student_number: studentNumber,
          display_name: `生徒${studentNumber}`,
        });
      }
    }

    // 既存の生徒データを削除（テストデータのみ）
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .like('google_email', '%@nansho.ed.jp');

    if (deleteError) {
      console.error('Failed to delete old test students:', deleteError);
      // エラーでも続行
    }

    // 新しい生徒データを一括挿入
    const { data: insertedStudents, error: insertError } = await supabase
      .from('students')
      .insert(students)
      .select();

    if (insertError) {
      console.error('Failed to insert test students:', insertError);
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      data: {
        count: insertedStudents?.length || 0,
        students: insertedStudents,
      },
      message: `${insertedStudents?.length || 0}名の生徒データを生成しました`,
    });
  } catch (error) {
    console.error('POST admin/generate-test-students error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'テストデータの生成に失敗しました',
      },
      { status: 500 }
    );
  }
}
