import { PortfolioEntry } from '@/types';

/**
 * ポートフォリオデータをCSV形式に変換
 */
export function portfolioToCSV(entries: PortfolioEntry[]): string {
  // CSVヘッダー
  const headers = [
    '日付',
    '授業タイトル',
    '時限',
    'クラス',
    '座席番号',
    'メモ内容',
    'タグ',
    'お気に入り',
    '自分の投稿',
    '反応したトピック数',
    'コメント数',
  ];

  // CSVデータ行を生成
  const rows = entries.map((entry) => {
    return [
      entry.session_date || '',
      entry.topic_title || '',
      entry.period?.toString() || '',
      entry.class_name || '',
      entry.seat_number?.toString() || '',
      escapeCSV(entry.memo_content),
      entry.memo_tags.join('; '),
      entry.is_favorite ? 'はい' : 'いいえ',
      entry.my_topic_content ? escapeCSV(entry.my_topic_content) : '',
      entry.reacted_topics?.length.toString() || '0',
      entry.commented_topics?.length.toString() || '0',
    ];
  });

  // CSVを構築
  const csvLines = [headers.join(','), ...rows.map((row) => row.join(','))];

  // BOM付きUTF-8（Excelで正しく開けるように）
  return '\uFEFF' + csvLines.join('\n');
}

/**
 * トピック投稿データをCSV形式に変換
 */
export function discussionsToCSV(discussions: any[]): string {
  // CSVヘッダー
  const headers = [
    '日付',
    '授業タイトル',
    '投稿者',
    '座席番号',
    'トピック内容',
    '驚の数',
    '納の数',
    '疑の数',
    'コメント数',
    '投稿日時',
  ];

  // CSVデータ行を生成
  const rows = discussions.map((discussion) => {
    return [
      discussion.session_date || '',
      discussion.topic_title || '',
      discussion.author_name || '',
      discussion.seat_number?.toString() || '',
      escapeCSV(discussion.content),
      discussion.reactions?.surprise?.toString() || '0',
      discussion.reactions?.understand?.toString() || '0',
      discussion.reactions?.question?.toString() || '0',
      discussion.comment_count?.toString() || '0',
      discussion.created_at || '',
    ];
  });

  // CSVを構築
  const csvLines = [headers.join(','), ...rows.map((row) => row.join(','))];

  // BOM付きUTF-8
  return '\uFEFF' + csvLines.join('\n');
}

/**
 * CSV用に文字列をエスケープ
 */
function escapeCSV(value: string): string {
  if (!value) return '';

  // ダブルクォートを2つに
  const escaped = value.replace(/"/g, '""');

  // カンマ、改行、ダブルクォートを含む場合はダブルクォートで囲む
  if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
    return `"${escaped}"`;
  }

  return escaped;
}

/**
 * CSVファイルをダウンロード
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
