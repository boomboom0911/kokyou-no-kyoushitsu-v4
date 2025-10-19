-- ====================================
-- コウキョウのケイジバン v4.5 - デモデータ
-- ====================================
-- このスクリプトはデモ用のサンプルデータを作成します
-- 実行前に既存のデータをバックアップしてください

-- 既存のデモデータを削除（idempotent）
DELETE FROM peer_reviews WHERE submission_id IN (
  SELECT id FROM submissions WHERE board_id IN (
    SELECT id FROM boards WHERE code IN ('DEMO01', 'ART001', 'PROG01')
  )
);
DELETE FROM reviewer_profiles WHERE board_id IN (
  SELECT id FROM boards WHERE code IN ('DEMO01', 'ART001', 'PROG01')
);
DELETE FROM submissions WHERE board_id IN (
  SELECT id FROM boards WHERE code IN ('DEMO01', 'ART001', 'PROG01')
);
DELETE FROM boards WHERE code IN ('DEMO01', 'ART001', 'PROG01');

-- ====================================
-- 1. サンプル掲示板の作成
-- ====================================

-- メイン掲示板（活発に使われている想定）
INSERT INTO boards (
  code, title, description,
  min_reviews_required, min_reviews_to_give,
  submission_deadline, review_deadline,
  status, created_by,
  settings
) VALUES (
  'DEMO01',
  '情報デザイン課題 - Webサイト制作',
  'テーマ：SDGs（持続可能な開発目標）について調べて、魅力的なWebサイトを作成しましょう。Google Sitesを使って、見やすく分かりやすいページを目指してください。',
  3,  -- 最低3件のレビューが必要
  2,  -- 最低2件のレビューを実施
  NOW() + INTERVAL '7 days',  -- 1週間後が提出締切
  NOW() + INTERVAL '14 days', -- 2週間後がレビュー締切
  'active',
  1,  -- created_by
  '{"allow_edit": true, "allow_delete": false, "show_author_name": true}'::jsonb
);

-- 美術課題用掲示板
INSERT INTO boards (
  code, title, description,
  min_reviews_required, min_reviews_to_give,
  submission_deadline, review_deadline,
  status, created_by,
  settings
) VALUES (
  'ART001',
  '美術課題 - デジタルアート作品',
  'Googleスライドを使って、自由なテーマでデジタルアート作品を制作しましょう。色彩やレイアウトを工夫して、表現したいことが伝わるように仕上げてください。',
  2,
  2,
  NOW() + INTERVAL '10 days',
  NOW() + INTERVAL '17 days',
  'active',
  1,
  '{"allow_edit": true, "allow_delete": false, "show_author_name": true}'::jsonb
);

-- プログラミング課題用掲示板（締切間近の設定）
INSERT INTO boards (
  code, title, description,
  min_reviews_required, min_reviews_to_give,
  submission_deadline, review_deadline,
  status, created_by,
  settings
) VALUES (
  'PROG01',
  'プログラミング課題 - Scratchゲーム制作',
  'Scratchで簡単なゲームを作成し、プレイ方法や工夫した点をGoogleドキュメントにまとめましょう。',
  3,
  3,
  NOW() + INTERVAL '2 days',  -- 締切間近
  NOW() + INTERVAL '5 days',
  'active',
  1,
  '{"allow_edit": true, "allow_delete": false, "show_author_name": true}'::jsonb
);

-- ====================================
-- 2. サンプル作品投稿の作成
-- ====================================

-- DEMO2024掲示板への投稿（10件）
DO $$
DECLARE
  board_id_demo UUID;
  student_ids INTEGER[] := ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  submission_ids UUID[];
BEGIN
  SELECT id INTO board_id_demo FROM boards WHERE code = 'DEMO01';

  -- 投稿1: SDGs 目標14「海の豊かさを守ろう」
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, is_featured, created_at
  ) VALUES (
    board_id_demo, student_ids[1],
    'SDGs目標14 - 海洋プラスチック問題について',
    '海洋プラスチックごみの現状と、私たちにできることをまとめました。写真やグラフを使って分かりやすく説明しています。',
    'https://sites.google.com/view/ocean-plastic-sdgs14',
    'google_sites',
    45, true, NOW() - INTERVAL '5 days'
  ) RETURNING id INTO submission_ids[1];

  -- 投稿2: SDGs 目標7「エネルギーをみんなにそしてクリーンに」
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_demo, student_ids[2],
    '再生可能エネルギーの未来',
    '太陽光発電や風力発電について調べました。日本での導入状況と課題をまとめています。',
    'https://sites.google.com/view/renewable-energy-japan',
    'google_sites',
    32, NOW() - INTERVAL '4 days'
  ) RETURNING id INTO submission_ids[2];

  -- 投稿3: SDGs 目標12「つくる責任 つかう責任」
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_demo, student_ids[3],
    'ファストファッションと環境問題',
    '服を作る過程での環境負荷について調べました。エシカルファッションの大切さを伝えます。',
    'https://sites.google.com/view/ethical-fashion-sdgs',
    'google_sites',
    28, NOW() - INTERVAL '4 days'
  ) RETURNING id INTO submission_ids[3];

  -- 投稿4: SDGs 目標15「陸の豊かさも守ろう」
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_demo, student_ids[4],
    '森林破壊を止めるために',
    '世界の森林破壊の現状と、私たちができる行動を紹介しています。',
    'https://sites.google.com/view/save-forests-sdgs15',
    'google_sites',
    24, NOW() - INTERVAL '3 days'
  ) RETURNING id INTO submission_ids[4];

  -- 投稿5: SDGs 目標13「気候変動に具体的な対策を」
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_demo, student_ids[5],
    '地球温暖化と私たちの生活',
    '温暖化の影響と、日常生活でできるCO2削減の工夫をまとめました。',
    'https://sites.google.com/view/climate-action-daily',
    'google_sites',
    19, NOW() - INTERVAL '3 days'
  ) RETURNING id INTO submission_ids[5];

  -- 投稿6: SDGs 目標2「飢餓をゼロに」
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_demo, student_ids[6],
    '食品ロスを減らそう',
    '日本の食品ロスの実態と、フードバンクの取り組みについて紹介します。',
    'https://sites.google.com/view/food-waste-zero',
    'google_sites',
    15, NOW() - INTERVAL '2 days'
  ) RETURNING id INTO submission_ids[6];

  -- 投稿7: SDGs 目標11「住み続けられるまちづくりを」
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_demo, student_ids[7],
    '私たちの街のバリアフリー',
    '地域のバリアフリー状況を調査し、改善案を提案しました。',
    'https://sites.google.com/view/barrier-free-town',
    'google_sites',
    12, NOW() - INTERVAL '2 days'
  ) RETURNING id INTO submission_ids[7];

  -- 投稿8: SDGs 目標6「安全な水とトイレを世界中に」
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_demo, student_ids[8],
    '世界の水問題について考える',
    '安全な水にアクセスできない人々の現状と、支援活動について調べました。',
    'https://sites.google.com/view/clean-water-for-all',
    'google_sites',
    8, NOW() - INTERVAL '1 day'
  ) RETURNING id INTO submission_ids[8];

  -- 投稿9: SDGs 目標4「質の高い教育をみんなに」
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_demo, student_ids[9],
    '世界の教育格差',
    '途上国の教育環境について調べ、教育の大切さを伝えるサイトを作りました。',
    'https://sites.google.com/view/education-for-all-sdgs',
    'google_sites',
    5, NOW() - INTERVAL '1 day'
  ) RETURNING id INTO submission_ids[9];

  -- 投稿10: SDGs 目標3「すべての人に健康と福祉を」
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_demo, student_ids[10],
    'メンタルヘルスの大切さ',
    '心の健康について調べ、ストレス対処法などを紹介しています。',
    'https://sites.google.com/view/mental-health-matters',
    'google_sites',
    3, NOW() - INTERVAL '6 hours'
  ) RETURNING id INTO submission_ids[10];

  -- ====================================
  -- 3. サンプルレビューの作成
  -- ====================================

  -- 投稿1へのレビュー（4件）
  INSERT INTO peer_reviews (
    submission_id, reviewer_id, board_id,
    strengths, suggestions, questions, overall_comment,
    character_count, helpful_count, created_at
  ) VALUES
  (
    submission_ids[1], student_ids[2], board_id_demo,
    ARRAY['海洋プラスチックの写真がとても印象的でした', '統計データが具体的で説得力がありました', 'レイアウトが見やすく整理されていました'],
    ARRAY['解決策についてもう少し詳しく書けるといいと思います', '自分たちができることの具体例をもっと増やせそうです'],
    ARRAY['プラスチック製品の代わりに何を使えばいいですか？'],
    '海の環境問題について深く理解できました。写真や統計を使った説明がとても分かりやすかったです。今日から自分にもできることを実践したいと思いました。',
    234, 3, NOW() - INTERVAL '4 days'
  ),
  (
    submission_ids[1], student_ids[5], board_id_demo,
    ARRAY['問題の深刻さが伝わってきました', 'ビフォーアフターの写真が効果的でした'],
    ARRAY['企業の取り組みについても触れるといいかもしれません'],
    ARRAY['マイクロプラスチックについてもっと知りたいです'],
    '海洋プラスチック問題の現状がよく分かりました。自分も気をつけたいと思います。',
    178, 2, NOW() - INTERVAL '3 days'
  ),
  (
    submission_ids[1], student_ids[7], board_id_demo,
    ARRAY['グラフが分かりやすかったです', 'ナビゲーションが使いやすいです'],
    ARRAY['色使いをもう少し統一するとより洗練されます'],
    ARRAY[],
    'とても勉強になりました。デザインも見やすくて良かったです。',
    156, 1, NOW() - INTERVAL '2 days'
  ),
  (
    submission_ids[1], student_ids[9], board_id_demo,
    ARRAY['調査がしっかりしていました', '写真の選び方が良かったです'],
    ARRAY['参考文献を載せるとさらに良いと思います'],
    ARRAY['日本での取り組み事例はありますか？'],
    'プラスチック問題について詳しく学べました。自分も調べてみたくなりました。',
    189, 2, NOW() - INTERVAL '1 day'
  );

  -- 投稿2へのレビュー（3件）
  INSERT INTO peer_reviews (
    submission_id, reviewer_id, board_id,
    strengths, suggestions, questions, overall_comment,
    character_count, helpful_count, created_at
  ) VALUES
  (
    submission_ids[2], student_ids[1], board_id_demo,
    ARRAY['再生可能エネルギーの種類が網羅されていました', '図解が分かりやすかったです'],
    ARRAY['コストの比較があるとより良いと思います', '日本特有の課題をもっと掘り下げられそうです'],
    ARRAY['家庭でも太陽光発電を導入できますか？'],
    'エネルギー問題について考えるきっかけになりました。調査が詳しくて参考になります。',
    201, 1, NOW() - INTERVAL '3 days'
  ),
  (
    submission_ids[2], student_ids[4], board_id_demo,
    ARRAY['メリットとデメリットが整理されていました', '未来の展望が面白かったです'],
    ARRAY['海外の事例も紹介すると比較できます'],
    ARRAY['風力発電の騒音問題はどうなっていますか？'],
    '再生可能エネルギーへの理解が深まりました。バランスの取れた内容でした。',
    187, 2, NOW() - INTERVAL '2 days'
  ),
  (
    submission_ids[2], student_ids[8], board_id_demo,
    ARRAY['データが最新で信頼できました', 'ページ構成が論理的でした'],
    ARRAY['具体的な導入事例をもっと載せるといいです'],
    ARRAY[],
    'とても勉強になりました。エネルギー問題に興味を持ちました。',
    165, 0, NOW() - INTERVAL '1 day'
  );

  -- 投稿3へのレビュー（5件 - 人気作品）
  INSERT INTO peer_reviews (
    submission_id, reviewer_id, board_id,
    strengths, suggestions, questions, overall_comment,
    character_count, helpful_count, created_at
  ) VALUES
  (
    submission_ids[3], student_ids[1], board_id_demo,
    ARRAY['身近な問題として考えやすかったです', 'ファッション業界の現状がよく分かりました'],
    ARRAY['エシカルブランドの具体例がもっとあるといいです'],
    ARRAY['古着を買うのは良い選択ですか？'],
    'ファストファッションの裏側を知れて衝撃でした。これからは買い物の仕方を見直したいです。',
    198, 4, NOW() - INTERVAL '3 days'
  ),
  (
    submission_ids[3], student_ids[2], board_id_demo,
    ARRAY['問題提起が明確でした', 'デザインがおしゃれで内容に合っていました'],
    ARRAY['リサイクルの方法についても触れるといいかも'],
    ARRAY['サステナブルファッションはどこで買えますか？'],
    '服を買うときの意識が変わりました。大切に使おうと思います。',
    176, 3, NOW() - INTERVAL '3 days'
  ),
  (
    submission_ids[3], student_ids[6], board_id_demo,
    ARRAY['統計が説得力ありました', '写真が効果的でした'],
    ARRAY['日本のブランドの取り組みも紹介してほしいです'],
    ARRAY[],
    '環境に配慮した服選びをしたいと思いました。',
    154, 2, NOW() - INTERVAL '2 days'
  ),
  (
    submission_ids[3], student_ids[9], board_id_demo,
    ARRAY['自分ごととして考えられました', '解決策が具体的でした'],
    ARRAY['服の寿命を延ばす工夫も載せるといいです'],
    ARRAY['どのくらいの頻度で服を買うのが適切ですか？'],
    'ファッションと環境の関係について深く学べました。',
    167, 1, NOW() - INTERVAL '1 day'
  ),
  (
    submission_ids[3], student_ids[10], board_id_demo,
    ARRAY['問題意識が高いと感じました', '分かりやすい言葉で説明されていました'],
    ARRAY['修理やリメイクについても触れるといいかも'],
    ARRAY[],
    '服を大切に着ようと思いました。参考になりました。',
    142, 1, NOW() - INTERVAL '12 hours'
  );

  -- 投稿4へのレビュー（2件）
  INSERT INTO peer_reviews (
    submission_id, reviewer_id, board_id,
    strengths, suggestions, questions, overall_comment,
    character_count, helpful_count, created_at
  ) VALUES
  (
    submission_ids[4], student_ids[3], board_id_demo,
    ARRAY['森林の重要性がよく伝わりました', '写真が美しかったです'],
    ARRAY['日本の森林についても触れるといいです', 'FSC認証などの仕組みを説明すると良いかも'],
    ARRAY['植林活動に参加できる場所はありますか？'],
    '森林破壊の深刻さを知りました。自然を守る行動を起こしたいです。',
    183, 2, NOW() - INTERVAL '2 days'
  ),
  (
    submission_ids[4], student_ids[8], board_id_demo,
    ARRAY['データが充実していました', 'ページ構成が良かったです'],
    ARRAY['企業の取り組み事例も載せるといいです'],
    ARRAY[],
    '森を守ることの大切さが分かりました。',
    148, 0, NOW() - INTERVAL '1 day'
  );

  -- 投稿5へのレビュー（3件）
  INSERT INTO peer_reviews (
    submission_id, reviewer_id, board_id,
    strengths, suggestions, questions, overall_comment,
    character_count, helpful_count, created_at
  ) VALUES
  (
    submission_ids[5], student_ids[2], board_id_demo,
    ARRAY['身近な行動と結びついていて分かりやすかったです', 'CO2削減の具体例が参考になりました'],
    ARRAY['効果の大きさを数値で示すともっと良いです'],
    ARRAY['エアコンの設定温度は何度がいいですか？'],
    '今日からできることが沢山あると分かりました。実践したいです。',
    191, 1, NOW() - INTERVAL '2 days'
  ),
  (
    submission_ids[5], student_ids[4], board_id_demo,
    ARRAY['イラストが可愛くて見やすかったです', 'アクションが具体的でした'],
    ARRAY['もっと多くの行動例があるといいです'],
    ARRAY[],
    '温暖化対策、自分もやってみます！',
    159, 1, NOW() - INTERVAL '1 day'
  ),
  (
    submission_ids[5], student_ids[10], board_id_demo,
    ARRAY['データが最新でした', '分かりやすい説明でした'],
    ARRAY['グラフをもっと活用できそうです'],
    ARRAY['公共交通機関を使うとどのくらいCO2が減りますか？'],
    '気候変動について理解が深まりました。',
    172, 0, NOW() - INTERVAL '6 hours'
  );

  -- 投稿6へのレビュー（2件）
  INSERT INTO peer_reviews (
    submission_id, reviewer_id, board_id,
    strengths, suggestions, questions, overall_comment,
    character_count, helpful_count, created_at
  ) VALUES
  (
    submission_ids[6], student_ids[1], board_id_demo,
    ARRAY['食品ロスの実態に驚きました', '解決策が具体的でした'],
    ARRAY['賞味期限と消費期限の違いを説明するといいです'],
    ARRAY['フードバンクに寄付できる食品は何ですか？'],
    '食べ物を大切にしようと思いました。参考になりました。',
    177, 1, NOW() - INTERVAL '1 day'
  ),
  (
    submission_ids[6], student_ids[5], board_id_demo,
    ARRAY['統計が分かりやすかったです', 'フードバンクの紹介が良かったです'],
    ARRAY['家庭でできる保存方法も載せるといいです'],
    ARRAY[],
    '食品ロスを減らす工夫を実践したいです。',
    163, 0, NOW() - INTERVAL '12 hours'
  );

  -- 投稿7へのレビュー（2件）
  INSERT INTO peer_reviews (
    submission_id, reviewer_id, board_id,
    strengths, suggestions, questions, overall_comment,
    character_count, helpful_count, created_at
  ) VALUES
  (
    submission_ids[7], student_ids[2], board_id_demo,
    ARRAY['地域調査が丁寧でした', '改善案が現実的でした'],
    ARRAY['写真をもっと載せるとイメージしやすいです'],
    ARRAY['学校のバリアフリー状況はどうですか？'],
    '身近な場所から考えることが大切だと思いました。',
    169, 1, NOW() - INTERVAL '1 day'
  ),
  (
    submission_ids[7], student_ids[9], board_id_demo,
    ARRAY['実際に調査したのが素晴らしいです', '提案が具体的でした'],
    ARRAY['他の地域との比較があるといいです'],
    ARRAY[],
    'バリアフリーについて考えるきっかけになりました。',
    158, 0, NOW() - INTERVAL '6 hours'
  );

  -- 投稿8へのレビュー（1件）
  INSERT INTO peer_reviews (
    submission_id, reviewer_id, board_id,
    strengths, suggestions, questions, overall_comment,
    character_count, helpful_count, created_at
  ) VALUES
  (
    submission_ids[8], student_ids[3], board_id_demo,
    ARRAY['水問題の深刻さが伝わりました', '支援団体の紹介が良かったです'],
    ARRAY['日本の水資源についても触れるといいです', '節水の具体的な方法を載せるといいです'],
    ARRAY['支援活動に参加するにはどうすればいいですか？'],
    '水の大切さを改めて感じました。無駄遣いしないよう気をつけます。',
    185, 0, NOW() - INTERVAL '12 hours'
  );

  -- 投稿9へのレビュー（1件）
  INSERT INTO peer_reviews (
    submission_id, reviewer_id, board_id,
    strengths, suggestions, questions, overall_comment,
    character_count, helpful_count, created_at
  ) VALUES
  (
    submission_ids[9], student_ids[2], board_id_demo,
    ARRAY['教育格差の現状がよく分かりました', 'データが説得力ありました'],
    ARRAY['日本の教育支援についても触れるといいです'],
    ARRAY['自分たちにできる支援はありますか？'],
    '教育を受けられることのありがたさを感じました。',
    171, 0, NOW() - INTERVAL '6 hours'
  );

  -- 投稿10にはまだレビューなし（最近の投稿）

END $$;

-- ====================================
-- 4. ART001掲示板への投稿（5件）
-- ====================================

DO $$
DECLARE
  board_id_art UUID;
  student_ids INTEGER[] := ARRAY[1, 2, 3, 4, 5];
  submission_ids UUID[];
BEGIN
  SELECT id INTO board_id_art FROM boards WHERE code = 'ART001';

  -- 美術作品1
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_art, student_ids[1],
    '夜空の下で - デジタルコラージュ',
    '星空と街の風景を組み合わせた作品です。色のグラデーションにこだわりました。',
    'https://docs.google.com/presentation/d/1234567890/edit',
    'google_slides',
    18, NOW() - INTERVAL '3 days'
  ) RETURNING id INTO submission_ids[1];

  -- 美術作品2
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_art, student_ids[2],
    '四季の移ろい',
    '春夏秋冬をそれぞれ一枚のスライドで表現しました。',
    'https://docs.google.com/presentation/d/1234567891/edit',
    'google_slides',
    14, NOW() - INTERVAL '2 days'
  ) RETURNING id INTO submission_ids[2];

  -- 美術作品3
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, is_featured, created_at
  ) VALUES (
    board_id_art, student_ids[3],
    '未来都市のイメージ',
    'テクノロジーと自然が共存する未来の街を想像して描きました。',
    'https://docs.google.com/presentation/d/1234567892/edit',
    'google_slides',
    25, true, NOW() - INTERVAL '4 days'
  ) RETURNING id INTO submission_ids[3];

  -- 美術作品4
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_art, student_ids[4],
    '音楽を視覚化する',
    '好きな曲のイメージを形と色で表現してみました。',
    'https://docs.google.com/presentation/d/1234567893/edit',
    'google_slides',
    11, NOW() - INTERVAL '1 day'
  ) RETURNING id INTO submission_ids[4];

  -- 美術作品5
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_art, student_ids[5],
    '感情のパレット',
    '喜び、悲しみ、怒り、平穏などの感情を色で表現しました。',
    'https://docs.google.com/presentation/d/1234567894/edit',
    'google_slides',
    8, NOW() - INTERVAL '12 hours'
  ) RETURNING id INTO submission_ids[5];

  -- レビュー（いくつか追加）
  INSERT INTO peer_reviews (
    submission_id, reviewer_id, board_id,
    strengths, suggestions, questions, overall_comment,
    character_count, helpful_count, created_at
  ) VALUES
  (
    submission_ids[1], student_ids[2], board_id_art,
    ARRAY['色のグラデーションがきれいです', '構図が良いです'],
    ARRAY['もう少しコントラストを強くしてもいいかも'],
    ARRAY[],
    '夜空の表現が素敵でした。雰囲気が出ています。',
    145, 1, NOW() - INTERVAL '2 days'
  ),
  (
    submission_ids[3], student_ids[1], board_id_art,
    ARRAY['発想が面白いです', '細部までこだわっていますね'],
    ARRAY['色使いをもう少し工夫できそうです'],
    ARRAY['どんなソフトを使いましたか？'],
    '未来都市のアイデアが素晴らしいです。ワクワクしました。',
    156, 2, NOW() - INTERVAL '3 days'
  );

END $$;

-- ====================================
-- 5. PROG01掲示板への投稿（3件 - 締切間近）
-- ====================================

DO $$
DECLARE
  board_id_prog UUID;
  student_ids INTEGER[] := ARRAY[1, 2, 3];
  submission_ids UUID[];
BEGIN
  SELECT id INTO board_id_prog FROM boards WHERE code = 'PROG01';

  -- プログラミング作品1
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_prog, student_ids[1],
    'シューティングゲーム制作記録',
    'Scratchで作ったシューティングゲームの説明書です。敵の動きや得点システムの工夫を解説しています。',
    'https://docs.google.com/document/d/1234567895/edit',
    'google_docs',
    22, NOW() - INTERVAL '1 day'
  ) RETURNING id INTO submission_ids[1];

  -- プログラミング作品2
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_prog, student_ids[2],
    'パズルゲーム - ブロック崩し',
    'ブロック崩しゲームを作りました。難易度調整とステージ設計について説明しています。',
    'https://docs.google.com/document/d/1234567896/edit',
    'google_docs',
    16, NOW() - INTERVAL '18 hours'
  ) RETURNING id INTO submission_ids[2];

  -- プログラミング作品3
  INSERT INTO submissions (
    board_id, student_id, title, description, work_url, work_type,
    view_count, created_at
  ) VALUES (
    board_id_prog, student_ids[3],
    'アクションゲーム制作ドキュメント',
    'ジャンプアクションゲームを作りました。キャラクターの動きとステージギミックを工夫しました。',
    'https://docs.google.com/document/d/1234567897/edit',
    'google_docs',
    12, NOW() - INTERVAL '8 hours'
  ) RETURNING id INTO submission_ids[3];

  -- レビュー1件のみ（締切間近でレビューが少ない状況）
  INSERT INTO peer_reviews (
    submission_id, reviewer_id, board_id,
    strengths, suggestions, questions, overall_comment,
    character_count, helpful_count, created_at
  ) VALUES
  (
    submission_ids[1], student_ids[2], board_id_prog,
    ARRAY['ゲームのアイデアが面白いです', '説明が分かりやすいです'],
    ARRAY['プレイ動画があるともっと良いです'],
    ARRAY['どのくらいの時間で作りましたか？'],
    'シューティングゲーム、やってみたいです。工夫が伝わりました。',
    168, 0, NOW() - INTERVAL '12 hours'
  );

END $$;

-- ====================================
-- 完了メッセージ
-- ====================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'デモデータの作成が完了しました！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '作成されたデータ:';
  RAISE NOTICE '- 掲示板: 3件';
  RAISE NOTICE '  - DEMO01 (SDGsテーマ): 10作品、27レビュー';
  RAISE NOTICE '  - ART001 (デジタルアート): 5作品、2レビュー';
  RAISE NOTICE '  - PROG01 (Scratchゲーム): 3作品、1レビュー';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ:';
  RAISE NOTICE '1. http://localhost:3000/board にアクセス';
  RAISE NOTICE '2. コード「DEMO01」を入力して掲示板を表示';
  RAISE NOTICE '3. 作品の閲覧、レビュー機能をテスト';
  RAISE NOTICE '4. 教員画面から統計とCSV出力をテスト';
  RAISE NOTICE '';
  RAISE NOTICE 'テスト用コード:';
  RAISE NOTICE '- DEMO01: 活発に使われている掲示板（レビュー多数）';
  RAISE NOTICE '- ART001: 美術課題用掲示板';
  RAISE NOTICE '- PROG01: 締切間近の掲示板（レビュー少なめ）';
  RAISE NOTICE '========================================';
END $$;
