import type { BookColor, Note } from './types'

/**
 * 全ギミックの正解値の単一情報源(docs/03-puzzle-design.md 準拠)。
 * ロジック・3D 表示・テストは必ずここを参照する。
 */

/** L-5 柱時計: あぶり出しの便箋が示す時刻 */
export const CLOCK_ANSWER = { hour: 4, minute: 10 } as const

/** 柱時計の初期時刻(4時前で止まっている) */
export const CLOCK_INITIAL = { hour: 3, minute: 50 } as const

/** B-2 着物に描かれた花の数(= B-3 宝石箱の答え) */
export const KIMONO_FLOWERS = { sakura: 5, ume: 3, kiku: 7 } as const

/** B-3 宝石箱ダイヤル(桜・梅・菊の順) */
export const JEWELRY_ANSWER: readonly [number, number, number] = [
  KIMONO_FLOWERS.sakura,
  KIMONO_FLOWERS.ume,
  KIMONO_FLOWERS.kiku,
]

/** L-6/L-7 オルゴールの旋律(ミ・ソ・ラ・ド) */
export const MELODY: readonly Note[] = ['E4', 'G4', 'A4', 'C5']

/** S-5 本棚の色順(茜・山吹・若竹・瑠璃) */
export const BOOK_ANSWER: readonly BookColor[] = ['akane', 'yamabuki', 'wakatake', 'ruri']

/** 本棚の初期配置(正解と異なる崩れた並び) */
export const BOOK_INITIAL: readonly [BookColor, BookColor, BookColor, BookColor] = [
  'wakatake',
  'akane',
  'ruri',
  'yamabuki',
]

/** S-4 地球儀: 日本が正面を向く回転角と許容誤差(度) */
export const GLOBE_ANSWER_YAW = 0
export const GLOBE_TOLERANCE_DEG = 15
export const GLOBE_INITIAL_YAW = 150

/**
 * S-7 金庫ダイヤル: 時(4時10分の4)・咲子の桜(5)・旋律の音数(4)。
 * 参照元の値から導出し、美術と正解の食い違いを防ぐ。
 */
export const SAFE_ANSWER: readonly [number, number, number] = [
  CLOCK_ANSWER.hour,
  KIMONO_FLOWERS.sakura,
  MELODY.length,
]

/** インベントリの最大スロット数 */
export const INVENTORY_CAPACITY = 8

/** 本の色の表示名と色値(背表紙に色名を印字する: 色覚バリアフリー) */
export const BOOK_COLOR_INFO: Readonly<
  Record<BookColor, { readonly label: string; readonly hex: string }>
> = {
  akane: { label: '茜', hex: '#a63148' },
  yamabuki: { label: '山吹', hex: '#c89932' },
  wakatake: { label: '若竹', hex: '#5e9c76' },
  ruri: { label: '瑠璃', hex: '#2b4c8c' },
}

/** 音名の表示(ドレミ表記: 聴覚に依存しない表示に使う) */
export const NOTE_LABELS: Readonly<Record<Note, string>> = {
  C4: 'ド',
  D4: 'レ',
  E4: 'ミ',
  F4: 'ファ',
  G4: 'ソ',
  A4: 'ラ',
  B4: 'シ',
  C5: 'ド',
}

/** リザルトの称号(ヒント使用回数による) */
export const TITLE_FOR_HINTS = (hintsUsed: number): string => {
  if (hintsUsed === 0) return '大正の名探偵'
  if (hintsUsed <= 3) return '見事な推理'
  return '無事のご帰還'
}
