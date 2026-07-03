import type { GameState } from './state'
import type { PuzzleId } from './types'
import { hasItem } from './helpers'

export interface HintDef {
  readonly id: PuzzleId
  readonly title: string
  readonly stages: readonly [string, string, string]
  readonly available: (s: GameState) => boolean
  readonly solved: (s: GameState) => boolean
}

/** 全ギミックの3段階ヒント(docs/03-puzzle-design.md §4 準拠)。最終段は実質答え。 */
export const HINTS: readonly HintDef[] = [
  {
    id: 'L1',
    title: '目覚めた部屋で',
    stages: [
      'まずは身の回りから。眠っていたソファが気になる。',
      'クッションの隙間に、何か挟まっていないだろうか。',
      'ソファ中央のクッションを調べると「真鍮の小鍵」が見つかる。',
    ],
    available: () => true,
    solved: (s) => s.flags.sofaSearched,
  },
  {
    id: 'L2',
    title: '硝子戸の飾り棚',
    stages: [
      '北西の飾り棚に、小さな鍵穴がある。',
      'ソファで見つけた小鍵が合いそうだ。',
      '真鍮の小鍵を飾り棚に使う。マッチ箱が手に入り、オルゴールが見つかる。',
    ],
    available: (s) => s.flags.sofaSearched,
    solved: (s) => s.flags.cabinetUnlocked,
  },
  {
    id: 'L3',
    title: '壁の絵画',
    stages: [
      '壁の絵画、どこか様子がおかしくないか。',
      '傾いた額の裏には、何か挟めそうだ。',
      '暖炉の上の絵画を調べると「白紙の便箋」が落ちてくる。',
    ],
    available: () => true,
    solved: (s) => s.flags.paintingMoved,
  },
  {
    id: 'L4',
    title: '白紙の便箋',
    stages: [
      '白紙の便箋は、本当にただの白紙だろうか。',
      '古い手紙は、火であぶると文字が浮かぶことがある。',
      'マッチで暖炉に火を点け、便箋を暖炉に使う。時刻が浮かび上がる。',
    ],
    available: (s) => s.flags.paintingMoved && s.flags.cabinetUnlocked,
    solved: (s) => s.flags.letterRevealed,
  },
  {
    id: 'L5',
    title: '止まった柱時計',
    stages: [
      '便箋の時刻が手掛かり。この部屋で時を刻む物は?',
      '柱時計の針は、自由に動かせるようだ。',
      '柱時計を4時10分に合わせる。台座の小扉から出てきた鍵で、東の扉(寝室)を開けよう。',
    ],
    available: (s) => s.flags.letterRevealed,
    solved: (s) => s.flags.bedroomUnlocked,
  },
  {
    id: 'B1',
    title: '鏡台と屏風',
    stages: [
      '鏡台の鏡には、部屋の何かが映り込んでいる。',
      '屏風の読めない文字も、鏡越しなら……。',
      '鏡台を調べる。鏡に映った屏風の文字は「たんすの着物、花を数えよ」。',
    ],
    available: (s) => s.flags.bedroomUnlocked,
    solved: (s) => s.flags.mirrorSeen,
  },
  {
    id: 'B2',
    title: '箪笥の着物',
    stages: [
      '屏風の言葉に従って、箪笥を見よう。',
      '着物には三種類の花。それぞれ、いくつ咲いている?',
      '桜が5、梅が3、菊が7。',
    ],
    available: (s) => s.flags.mirrorSeen,
    solved: (s) => s.flags.kimonoSeen,
  },
  {
    id: 'B3',
    title: '花の宝石箱',
    stages: [
      '鏡台の上の宝石箱。花の彫られたダイヤルが三つ。',
      '彫られた花と、着物に咲く花の数を対応させる。',
      '桜5・梅3・菊7 に合わせて留め金を開ける。ねじ巻きと写真の右半分が手に入る。',
    ],
    available: (s) => s.flags.bedroomUnlocked,
    solved: (s) => s.flags.jewelrySolved,
  },
  {
    id: 'L6',
    title: '銀のねじ巻き',
    stages: [
      'ねじ巻きが合う品を、この屋敷のどこかで見た。',
      'リビングの飾り棚——オルゴールに使ってみよう。',
      'オルゴールにねじ巻きを使うと「ミ・ソ・ラ・ド」の旋律が流れる。',
    ],
    available: (s) => hasItem(s, 'windingKey'),
    solved: (s) => s.flags.musicBoxWound,
  },
  {
    id: 'L7',
    title: 'オルゴールの続き',
    stages: [
      'オルゴールの旋律には、続きの遊びがある。この屋敷で音を奏でられる物は?',
      'ピアノで同じ旋律を弾いてみよう。音名はオルゴールの蓋の裏にも刻まれている。',
      'ピアノで ミ・ソ・ラ・ド の順に弾く。隠し引き出しの鍵で、西の扉(書斎)を開けよう。',
    ],
    available: (s) => s.flags.musicBoxWound,
    solved: (s) => s.flags.studyUnlocked,
  },
  {
    id: 'S1',
    title: '書斎の机',
    stages: [
      '書斎の机。引き出しは開くだろうか。',
      '両袖机の引き出しを、順に開けてみよう。',
      '机の引き出しを調べると、写真の左半分と書きかけの手紙が見つかる。',
    ],
    available: (s) => s.flags.studyUnlocked,
    solved: (s) => s.flags.deskOpened,
  },
  {
    id: 'S2',
    title: '破れた写真',
    stages: [
      '写真は半分に破れている。もう片方は、どこかで見つからないか。',
      '持ち物の拡大画面で、二つの写真を組み合わせられそうだ。',
      '写真(右)と写真(左)を持ち物画面で組み合わせると「思い出の写真」になる。',
    ],
    available: (s) => hasItem(s, 'photoLeft') && hasItem(s, 'photoRight'),
    solved: (s) => s.flags.photosCombined,
  },
  {
    id: 'S3',
    title: '書斎の明かり',
    stages: [
      '書斎の入口脇に、照明のスイッチがある。',
      '暗くしないと、見えないものもある。',
      'スイッチで消灯すると、机の上の壁に「地球儀を回せ。日出づる国を正面に」と光る文字が浮かぶ。',
    ],
    available: (s) => s.flags.studyUnlocked,
    solved: (s) => s.flags.glowSeen,
  },
  {
    id: 'S4',
    title: '地球儀',
    stages: [
      '夜光の文字は、地球儀のことを指している。',
      '「日出づる国」は日本。地球儀を回して、日本をこちらへ向けよう。',
      '地球儀を回して日本を正面にし、留め金を開ける。中から覚書が出てくる。',
    ],
    available: (s) => s.flags.glowSeen,
    solved: (s) => s.flags.globeSolved,
  },
  {
    id: 'S5',
    title: '本棚の四冊',
    stages: [
      '日記に、本の並びについての癖が書かれていた。',
      '茜・山吹・若竹・瑠璃——すべて色の名前だ。',
      '四冊を左から 茜(赤)・山吹(黄)・若竹(緑)・瑠璃(青) の順に並べ替える。隠し棚から金庫の鍵が出る。',
    ],
    available: (s) => s.flags.studyUnlocked,
    solved: (s) => s.flags.bookshelfSolved,
  },
  {
    id: 'S6',
    title: '子爵の肖像',
    stages: [
      '覚書によれば、金庫は「わが肖像の裏」。',
      '南壁の肖像画、額の右下がわずかに浮いている。',
      '肖像画を調べると蝶番で開き、金庫が現れる。',
    ],
    available: (s) => s.flags.globeSolved,
    solved: (s) => s.flags.portraitOpen,
  },
  {
    id: 'S7',
    title: '三つの数字',
    stages: [
      '覚書の三つの数。答えはすべて、屋敷で解いた謎の中にある。',
      '柱時計の「時」・着物の桜の数・旋律の音の数。現物でいつでも確かめられる。',
      '本棚で見つけた鍵を差し、ダイヤルを 4・5・4 に合わせて開ける。',
    ],
    available: (s) => s.flags.portraitOpen,
    solved: (s) => s.flags.safeSolved,
  },
  {
    id: 'L8',
    title: '玄関へ',
    stages: [
      '金庫で手に入れた鍵の使い道は、ひとつ。',
      'リビング南の、両開きの玄関扉へ。',
      '玄関扉に玄関の鍵を使えば——脱出だ。',
    ],
    available: (s) => hasItem(s, 'entranceKey'),
    solved: (s) => s.flags.entranceUnlocked,
  },
]

/** いま表示すべきヒント(挑戦可能かつ未解決) */
export const availableHints = (state: GameState): readonly HintDef[] =>
  HINTS.filter((h) => h.available(state) && !h.solved(state))
