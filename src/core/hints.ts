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
      '眠っていたソファを調べよう。',
      'クッションの隙間に何かある。',
      'ソファ中央のクッションに「真鍮の小鍵」。',
    ],
    available: () => true,
    solved: (s) => s.flags.sofaSearched,
  },
  {
    id: 'L2',
    title: '硝子戸の飾り棚',
    stages: [
      '北西の飾り棚に鍵穴がある。',
      'ソファで見つけた小鍵が合いそうだ。',
      '飾り棚に真鍮の小鍵を使う。マッチ箱とオルゴールが見つかる。',
    ],
    available: (s) => s.flags.sofaSearched,
    solved: (s) => s.flags.cabinetUnlocked,
  },
  {
    id: 'L3',
    title: '壁の絵画',
    stages: [
      '暖炉の上の絵画が傾いている。',
      '額の裏に何か挟まっている。',
      '絵画を調べると「白紙の便箋」が落ちてくる。',
    ],
    available: () => true,
    solved: (s) => s.flags.paintingMoved,
  },
  {
    id: 'L4',
    title: '白紙の便箋',
    stages: [
      'ただの白紙ではなさそうだ。',
      '火であぶると文字が浮かぶ。',
      'マッチで暖炉に火を点け、便箋を暖炉に使う。',
    ],
    available: (s) => s.flags.paintingMoved && s.flags.cabinetUnlocked,
    solved: (s) => s.flags.letterRevealed,
  },
  {
    id: 'L5',
    title: '止まった柱時計',
    stages: [
      '便箋に浮かんだ時刻が手掛かり。',
      '柱時計の針は自由に動かせる。',
      '柱時計を4時10分に。出てきた鍵で寝室の扉を開ける。',
    ],
    available: (s) => s.flags.letterRevealed,
    solved: (s) => s.flags.bedroomUnlocked,
  },
  {
    id: 'B1',
    title: '鏡台と屏風',
    stages: [
      '鏡台の鏡に何かが映っている。',
      '屏風の文字は鏡越しなら読める。',
      '鏡台を調べる。「たんすの着物、花を数えよ」。',
    ],
    available: (s) => s.flags.bedroomUnlocked,
    solved: (s) => s.flags.mirrorSeen,
  },
  {
    id: 'B2',
    title: '箪笥の着物',
    stages: [
      '箪笥の着物を見よう。',
      '三種類の花の数を数える。',
      '桜が5、梅が3、菊が7。',
    ],
    available: (s) => s.flags.mirrorSeen,
    solved: (s) => s.flags.kimonoSeen,
  },
  {
    id: 'B3',
    title: '花の宝石箱',
    stages: [
      '宝石箱のダイヤルに花が彫られている。',
      '花の数は着物が教えてくれる。',
      '桜5・梅3・菊7 に合わせ「開ける」を押す。',
    ],
    available: (s) => s.flags.bedroomUnlocked,
    solved: (s) => s.flags.jewelrySolved,
  },
  {
    id: 'L6',
    title: '銀のねじ巻き',
    stages: [
      'ねじ巻きの合う品がどこかにある。',
      'リビングのオルゴールに使おう。',
      'オルゴールにねじ巻きを使う。旋律は「ミ・ソ・ラ・ド」。',
    ],
    available: (s) => hasItem(s, 'windingKey'),
    solved: (s) => s.flags.musicBoxWound,
  },
  {
    id: 'L7',
    title: 'オルゴールの続き',
    stages: [
      '同じ旋律を奏でられる物がある。',
      'ピアノで同じ旋律を弾こう。',
      'ピアノで ミ・ソ・ラ・ド。出てきた鍵で書斎の扉を開ける。',
    ],
    available: (s) => s.flags.musicBoxWound,
    solved: (s) => s.flags.studyUnlocked,
  },
  {
    id: 'S1',
    title: '書斎の机',
    stages: [
      '机の引き出しを開けてみよう。',
      '中央の引き出しに何かある。',
      '引き出しから写真の左半分と手紙が見つかる。',
    ],
    available: (s) => s.flags.studyUnlocked,
    solved: (s) => s.flags.deskOpened,
  },
  {
    id: 'S2',
    title: '破れた写真',
    stages: [
      '写真のもう半分がどこかにある。',
      '持ち物の拡大画面で組み合わせられる。',
      '写真(右)と写真(左)を組み合わせる。',
    ],
    available: (s) => hasItem(s, 'photoLeft') && hasItem(s, 'photoRight'),
    solved: (s) => s.flags.photosCombined,
  },
  {
    id: 'S3',
    title: '書斎の明かり',
    stages: [
      '入口脇に照明のスイッチがある。',
      '暗くすると見えるものがある。',
      '消灯すると机の上の壁に光る文字が浮かぶ。',
    ],
    available: (s) => s.flags.studyUnlocked,
    solved: (s) => s.flags.glowSeen,
  },
  {
    id: 'S4',
    title: '地球儀',
    stages: [
      '夜光の文字は地球儀のことだ。',
      '「日出づる国」は日本。',
      '日本を正面に向け、留め金を開ける。',
    ],
    available: (s) => s.flags.glowSeen,
    solved: (s) => s.flags.globeSolved,
  },
  {
    id: 'S5',
    title: '本棚の四冊',
    stages: [
      '日記に本の並びの癖が書かれていた。',
      '茜・山吹・若竹・瑠璃は色の名前。',
      '左から 茜(赤)・山吹(黄)・若竹(緑)・瑠璃(青) に並べる。',
    ],
    available: (s) => s.flags.studyUnlocked,
    solved: (s) => s.flags.bookshelfSolved,
  },
  {
    id: 'S6',
    title: '子爵の肖像',
    stages: [
      '金庫は「わが肖像の裏」。',
      '南壁の肖像画を調べよう。',
      '肖像画が横に滑り、金庫が現れる。',
    ],
    available: (s) => s.flags.globeSolved,
    solved: (s) => s.flags.portraitOpen,
  },
  {
    id: 'S7',
    title: '三つの数字',
    stages: [
      '覚書の三つの数を思い出そう。',
      '時計の「時」・桜の数・旋律の音の数。',
      '鍵を差し、ダイヤルを 4・5・4 に合わせる。',
    ],
    available: (s) => s.flags.portraitOpen,
    solved: (s) => s.flags.safeSolved,
  },
  {
    id: 'L8',
    title: '玄関へ',
    stages: [
      '手に入れた鍵の使い道はひとつ。',
      'リビング南の玄関扉へ。',
      '玄関扉に玄関の鍵を使えば脱出だ。',
    ],
    available: (s) => hasItem(s, 'entranceKey'),
    solved: (s) => s.flags.entranceUnlocked,
  },
]

/** いま表示すべきヒント(挑戦可能かつ未解決) */
export const availableHints = (state: GameState): readonly HintDef[] =>
  HINTS.filter((h) => h.available(state) && !h.solved(state))
