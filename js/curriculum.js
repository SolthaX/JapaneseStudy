// Textbook structure: Genki I & II (3rd ed.) and Quartet I & II.
// Each chapter is broken into steps you tick off; grammar points are listed
// individually so the Books tab can show exactly what is left.
// Japanese text uses jp.js specs ([漢字|reading|English]) so only learned kanji show.

const TOKINI_SEARCH = 'https://www.youtube.com/@TokiniAndy/search?query=';
const PLAYLIST = (id) => `https://www.youtube.com/playlist?list=${id}`;

// ToKini Andy's official playlists (checked on his channel, Oct 2026).
export const TOKINI = {
  genki1: PLAYLIST('PLA_RcUI8km1NzJscgRwsMqDh0jnJ-8IuH'), // 【JLPT N5】GENKI Grammar Made Clear 【NO CHAT】
  genki2: PLAYLIST('PLA_RcUI8km1MyFgg6pYRYNDd1S-LC2ob5'), // 【JLPT N4】GENKI 2 Grammar Made Clear 【NO CHAT】
  quartet1: PLAYLIST('PLA_RcUI8km1OGb-FERttd9KCObqlYkdx1'), // 【JLPT N3】Intermediate Japanese | Quartet 1
  quartet2: PLAYLIST('PLA_RcUI8km1MTFeUhywqMyvAJDmP-X5_F'), // 【JLPT N2】Intermediate Japanese | Quartet 2
  conjugation: PLAYLIST('PLA_RcUI8km1PQTewCBuJiJ4uJcORDJw72'), // Japanese Conjugation Simplified
};

export const GENKI_STEPS = [
  { id: 'vocab', en: 'Vocabulary', ja: '[単語|たんご|]' },
  { id: 'video', en: 'Tokini Andy video', ja: '[動画|どうが|]' },
  { id: 'grammar', en: 'Grammar', ja: '[文法|ぶんぽう|]' },
  { id: 'dialogue', en: 'Dialogue', ja: '[会話|かいわ|]' },
  { id: 'workbook', en: 'Workbook', ja: 'ワークブック' },
  { id: 'kanji', en: 'Kanji', ja: '[漢字|かんじ|]' },
  { id: 'reading', en: 'Reading & Writing', ja: '[読み書き|よみかき|]' },
];

export const QUARTET_STEPS = [
  { id: 'vocab', en: 'Vocabulary', ja: '[単語|たんご|]' },
  { id: 'video', en: 'Tokini Andy video', ja: '[動画|どうが|]' },
  { id: 'yomu', en: 'Reading', ja: '[読む|よむ|]' },
  { id: 'kaku', en: 'Writing', ja: '[書く|かく|]' },
  { id: 'hanasu', en: 'Speaking', ja: '[話す|はなす|]' },
  { id: 'kiku', en: 'Listening', ja: '[聞く|きく|]' },
  { id: 'kanji', en: 'Kanji', ja: '[漢字|かんじ|]' },
];

const g = (n, ja, en, grammar) => ({ n, ja, en, grammar });

export const BOOKS = [
  {
    id: 'genki1',
    playlist: TOKINI.genki1,
    title: 'Genki I',
    ja: 'げんき I',
    color: 'var(--sakura)',
    steps: GENKI_STEPS,
    video: (n) => `${TOKINI_SEARCH}${encodeURIComponent(`Genki lesson ${n}`)}`,
    chapters: [
      g(1, '[新しい|あたらしい|New][友達|ともだち|Friends]', 'New Friends', ['X は Y です', 'Question sentences か', 'Noun の Noun']),
      g(2, '[買い物|かいもの|Shopping]', 'Shopping', ['これ・それ・あれ・どれ', 'この・その・あの・どの + noun', 'ここ・そこ・あそこ・どこ', 'だれの noun', 'Noun も', 'Noun じゃないです', '〜ね / 〜よ']),
      g(3, 'デートの[約束|やくそく|promise]', 'Making a Date', ['Verb conjugation (ます)', 'Verb types', 'Particles で・に・へ・を', 'Time references', '〜ませんか', 'Frequency adverbs', 'Topic は']),
      g(4, '[初めて|はじめて|first]のデート', 'The First Date', ['あります / います', 'Describing where things are', 'Past tense of です', 'Past tense of verbs', 'も', '〜[時間|じかん|hours]', 'たくさん', 'と']),
      g(5, '[沖縄|おきなわ|Okinawa][旅行|りょこう|trip]', 'A Trip to Okinawa', ['Adjectives (present)', 'Adjectives (past)', 'Adjective + noun', '[好き|すき|like] / きらい', '〜ましょう / 〜ましょうか', 'Counting']),
      g(6, 'ロバートさんの[一日|いちにち|day]', "A Day in Robert's Life", ['て-form', '〜てください', '〜てもいいです', '〜てはいけません', 'Describing two activities', '〜から', '〜ましょうか (offer)']),
      g(7, '[家族|かぞく|family]の[写真|しゃしん|photo]', 'Family Picture', ['〜ている (in progress)', '〜ている (result)', 'メアリーさんは[髪|かみ|hair]が[長い|ながい|long]です', 'て-form joining adjectives & nouns', 'Stem + に[行く|いく|go]', 'Counting people']),
      g(8, 'バーベキュー', 'Barbecue', ['Short forms', 'Informal speech', '〜と[思います|おもいます|I think]', '〜と[言っていました|いっていました|said]', '〜ないでください', 'Verb のが[好き|すき|like]です', 'Subject particle が', '[何か|なにか|something] / [何も|なにも|nothing]']),
      g(9, 'かぶき', 'Kabuki', ['Past short forms', 'Past informal speech', '〜と[思います|おもいます|I think] (past)', '〜と[言っていました|いっていました|said] (past)', 'Qualifying nouns with verbs', 'まだ〜ていません', '〜から (reason)']),
      g(10, '[冬休み|ふゆやすみ|winter break]の[予定|よてい|plans]', 'Winter Vacation Plans', ['Comparing two items', 'Comparing three or more', 'Adjective / noun + の', '〜つもりだ', 'Adjective + なる', 'どこかに / どこにも', 'で (means)']),
      g(11, '[休み|やすみ|vacation]のあと', 'After the Vacation', ['〜たい', '〜たり〜たりする', '〜ことがある', 'Noun A や Noun B']),
      g(12, '[病気|びょうき|illness]', 'Feeling Ill', ['〜んです', '〜すぎる', '〜ほうがいいです', '〜ので', '〜なければいけません / 〜なきゃいけません', '〜でしょうか']),
    ],
  },
  {
    id: 'genki2',
    playlist: TOKINI.genki2,
    title: 'Genki II',
    ja: 'げんき II',
    color: 'var(--ai)',
    steps: GENKI_STEPS,
    video: (n) => `${TOKINI_SEARCH}${encodeURIComponent(`Genki lesson ${n}`)}`,
    chapters: [
      g(13, 'アルバイト[探し|さがし|search]', 'Looking for a Part-time Job', ['Potential verbs', '〜し', '〜そうです (looks like)', '〜てみる', 'なら', '[一週間|いっしゅうかん|a week]に[三回|さんかい|three times]']),
      g(14, 'バレンタインデー', "Valentine's Day", ['ほしい', '〜かもしれません', 'あげる / くれる / もらう', '〜たらどうですか', 'Number + も / Number + しか〜ない']),
      g(15, '[長野|ながの|Nagano][旅行|りょこう|trip]', 'A Trip to Nagano', ['Volitional form', 'Volitional + と[思っています|おもっています|thinking]', '〜ておく', 'Sentences qualifying nouns']),
      g(16, '[忘れ物|わすれもの|lost item]', 'Lost and Found', ['〜てあげる / くれる / もらう', '〜ていただけませんか', '〜といい', '〜[時|とき|when]', '〜てすみませんでした']),
      g(17, 'ぐちとうわさ', 'Grumble and Gossip', ['〜そうです (hearsay)', '〜って', '〜たら', '〜なくてもいいです', '〜みたいです', '〜[前に|まえに|before] / 〜てから']),
      g(18, 'ジョンさんのアルバイト', "John's Part-time Job", ['Transitive & intransitive verbs', '〜てしまう', '〜と', '〜ながら', '〜ばよかったです']),
      g(19, '[出迎え|でむかえ|meeting]', 'Meeting the Boss', ['Honorific verbs', 'Respectful advice (お〜ください)', '〜てくれてありがとう', '〜てよかったです', '〜はずです']),
      g(20, 'メアリーさんの[買い物|かいもの|shopping]', 'Mary Goes Shopping', ['Extra-modest expressions', 'Humble expressions', '〜ないで', 'Embedded questions', 'Name という item', '〜やすい / 〜にくい']),
      g(21, 'どろぼう', 'Burglar', ['Passive', '〜てある', '〜[間に|あいだに|while]', 'Adjective + する', '〜てほしい']),
      g(22, '[日本|にほん|Japan]の[教育|きょういく|education]', 'Education in Japan', ['Causative', 'Causative + てあげる / くれる', 'Stem + なさい', '〜ば', '〜のに', '〜のような / 〜のように']),
      g(23, '[別れ|わかれ|farewell]', 'Good-bye', ['Causative-passive', '〜ても', '〜ことにする', '〜ことにしている', '〜まで', '〜[方|かた|way of]']),
    ],
  },
  {
    id: 'quartet1',
    playlist: TOKINI.quartet1,
    title: 'Quartet I',
    ja: 'カルテット I',
    color: 'var(--matcha)',
    steps: QUARTET_STEPS,
    video: (n) => `${TOKINI_SEARCH}${encodeURIComponent(`Quartet lesson ${n}`)}`,
    chapters: [1, 2, 3, 4, 5, 6].map((n) => g(n, '', `Lesson ${n}`, [])),
  },
  {
    id: 'quartet2',
    playlist: TOKINI.quartet2,
    title: 'Quartet II',
    ja: 'カルテット II',
    color: 'var(--shu)',
    steps: QUARTET_STEPS,
    video: (n) => `${TOKINI_SEARCH}${encodeURIComponent(`Quartet lesson ${n}`)}`,
    chapters: [7, 8, 9, 10, 11, 12].map((n) => g(n, '', `Lesson ${n}`, [])),
  },
];

export const bookById = (id) => BOOKS.find((b) => b.id === id);

/** "第14課" as a spec (whole word: needs 第 and 課). */
export const lessonSpec = (n, numKana) => `[第${n}課|だい${numKana(n)}か|Lesson ${n}]`;
