// Textbook structure: Genki I & II (3rd ed.) and Quartet I & II.
// Each chapter is broken into steps you tick off; grammar points are listed
// individually so the Books tab can show exactly what is left.

const TOKINI_SEARCH = 'https://www.youtube.com/@TokiniAndy/search?query=';

export const GENKI_STEPS = [
  { id: 'vocab', en: 'Vocabulary', ja: '単語' },
  { id: 'video', en: 'Tokini Andy video', ja: '動画' },
  { id: 'grammar', en: 'Grammar', ja: '文法' },
  { id: 'dialogue', en: 'Dialogue', ja: '会話' },
  { id: 'workbook', en: 'Workbook', ja: 'ワークブック' },
  { id: 'kanji', en: 'Kanji', ja: '漢字' },
  { id: 'reading', en: 'Reading & Writing', ja: '読み書き' },
];

export const QUARTET_STEPS = [
  { id: 'vocab', en: 'Vocabulary', ja: '単語' },
  { id: 'video', en: 'Tokini Andy video', ja: '動画' },
  { id: 'yomu', en: 'Reading', ja: '読む' },
  { id: 'kaku', en: 'Writing', ja: '書く' },
  { id: 'hanasu', en: 'Speaking', ja: '話す' },
  { id: 'kiku', en: 'Listening', ja: '聞く' },
  { id: 'kanji', en: 'Kanji', ja: '漢字' },
];

const g = (n, ja, en, grammar) => ({ n, ja, en, grammar });

export const BOOKS = [
  {
    id: 'genki1',
    title: 'Genki I',
    ja: 'げんき I',
    color: 'var(--sakura)',
    steps: GENKI_STEPS,
    video: (n) => `${TOKINI_SEARCH}${encodeURIComponent(`Genki lesson ${n}`)}`,
    chapters: [
      g(1, '新しい友達', 'New Friends', ['X は Y です', 'Question sentences か', 'Noun の Noun']),
      g(2, '買い物', 'Shopping', ['これ・それ・あれ・どれ', 'この・その・あの・どの + noun', 'ここ・そこ・あそこ・どこ', 'だれの noun', 'Noun も', 'Noun じゃないです', '〜ね / 〜よ']),
      g(3, 'デートの約束', 'Making a Date', ['Verb conjugation (ます)', 'Verb types', 'Particles で・に・へ・を', 'Time references', '〜ませんか', 'Frequency adverbs', 'Topic は']),
      g(4, '初めてのデート', 'The First Date', ['あります / います', 'Describing where things are', 'Past tense of です', 'Past tense of verbs', 'も', '〜時間', 'たくさん', 'と']),
      g(5, '沖縄旅行', 'A Trip to Okinawa', ['Adjectives (present)', 'Adjectives (past)', 'Adjective + noun', '好き / きらい', '〜ましょう / 〜ましょうか', 'Counting']),
      g(6, 'ロバートさんの一日', "A Day in Robert's Life", ['て-form', '〜てください', '〜てもいいです', '〜てはいけません', 'Describing two activities', '〜から', '〜ましょうか (offer)']),
      g(7, '家族の写真', 'Family Picture', ['〜ている (in progress)', '〜ている (result)', 'メアリーさんは髪が長いです', 'て-form joining adjectives & nouns', 'Stem + に行く', 'Counting people']),
      g(8, 'バーベキュー', 'Barbecue', ['Short forms', 'Informal speech', '〜と思います', '〜と言っていました', '〜ないでください', 'Verb のが好きです', 'Subject particle が', '何か / 何も']),
      g(9, 'かぶき', 'Kabuki', ['Past short forms', 'Past informal speech', '〜と思います (past)', '〜と言っていました (past)', 'Qualifying nouns with verbs', 'まだ〜ていません', '〜から (reason)']),
      g(10, '冬休みの予定', 'Winter Vacation Plans', ['Comparing two items', 'Comparing three or more', 'Adjective / noun + の', '〜つもりだ', 'Adjective + なる', 'どこかに / どこにも', 'で (means)']),
      g(11, '休みのあと', 'After the Vacation', ['〜たい', '〜たり〜たりする', '〜ことがある', 'Noun A や Noun B']),
      g(12, '病気', 'Feeling Ill', ['〜んです', '〜すぎる', '〜ほうがいいです', '〜ので', '〜なければいけません / 〜なきゃいけません', '〜でしょうか']),
    ],
  },
  {
    id: 'genki2',
    title: 'Genki II',
    ja: 'げんき II',
    color: 'var(--ai)',
    steps: GENKI_STEPS,
    video: (n) => `${TOKINI_SEARCH}${encodeURIComponent(`Genki lesson ${n}`)}`,
    chapters: [
      g(13, 'アルバイト探し', 'Looking for a Part-time Job', ['Potential verbs', '〜し', '〜そうです (looks like)', '〜てみる', 'なら', '一週間に三回']),
      g(14, 'バレンタインデー', "Valentine's Day", ['ほしい', '〜かもしれません', 'あげる / くれる / もらう', '〜たらどうですか', 'Number + も / Number + しか〜ない']),
      g(15, '長野旅行', 'A Trip to Nagano', ['Volitional form', 'Volitional + と思っています', '〜ておく', 'Sentences qualifying nouns']),
      g(16, '忘れ物', 'Lost and Found', ['〜てあげる / くれる / もらう', '〜ていただけませんか', '〜といい', '〜時', '〜てすみませんでした']),
      g(17, 'ぐちとうわさ', 'Grumble and Gossip', ['〜そうです (hearsay)', '〜って', '〜たら', '〜なくてもいいです', '〜みたいです', '〜前に / 〜てから']),
      g(18, 'ジョンさんのアルバイト', "John's Part-time Job", ['Transitive & intransitive verbs', '〜てしまう', '〜と', '〜ながら', '〜ばよかったです']),
      g(19, '出迎え', 'Meeting the Boss', ['Honorific verbs', 'Respectful advice (お〜ください)', '〜てくれてありがとう', '〜てよかったです', '〜はずです']),
      g(20, 'メアリーさんの買い物', 'Mary Goes Shopping', ['Extra-modest expressions', 'Humble expressions', '〜ないで', 'Embedded questions', 'Name という item', '〜やすい / 〜にくい']),
      g(21, 'どろぼう', 'Burglar', ['Passive', '〜てある', '〜間に', 'Adjective + する', '〜てほしい']),
      g(22, '日本の教育', 'Education in Japan', ['Causative', 'Causative + てあげる / くれる', 'Stem + なさい', '〜ば', '〜のに', '〜のような / 〜のように']),
      g(23, '別れ', 'Good-bye', ['Causative-passive', '〜ても', '〜ことにする', '〜ことにしている', '〜まで', '〜方']),
    ],
  },
  {
    id: 'quartet1',
    title: 'Quartet I',
    ja: 'カルテット I',
    color: 'var(--matcha)',
    steps: QUARTET_STEPS,
    video: (n) => `${TOKINI_SEARCH}${encodeURIComponent(`Quartet lesson ${n}`)}`,
    chapters: [1, 2, 3, 4, 5, 6].map((n) => g(n, `第${n}課`, `Lesson ${n}`, [])),
  },
  {
    id: 'quartet2',
    title: 'Quartet II',
    ja: 'カルテット II',
    color: 'var(--shu)',
    steps: QUARTET_STEPS,
    video: (n) => `${TOKINI_SEARCH}${encodeURIComponent(`Quartet lesson ${n}`)}`,
    chapters: [7, 8, 9, 10, 11, 12].map((n) => g(n, `第${n}課`, `Lesson ${n}`, [])),
  },
];

export const bookById = (id) => BOOKS.find((b) => b.id === id);
