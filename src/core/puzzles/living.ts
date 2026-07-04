import { INVENTORY_CAPACITY, MELODY, NOTE_LABELS } from '../constants'
import type { GameState } from '../state'
import { T } from '../texts'
import type { ReduceResult } from '../helpers'
import {
  addDocument,
  addItem,
  deselect,
  msg,
  removeItem,
  result,
  setFlag,
} from '../helpers'

const melodyLabel = MELODY.map((n) => NOTE_LABELS[n]).join('・')

const canCarry = (state: GameState, count: number): boolean =>
  state.inventory.length + count <= INVENTORY_CAPACITY

/** L-1 ソファ(クッションの下の鍵) */
export const examineSofa = (state: GameState): ReduceResult => {
  if (state.flags.sofaSearched) {
    return result(state, msg('上等なビロードのソファ。座り心地は申し分なかった。'))
  }
  if (!canCarry(state, 1)) return result(state, msg(T.inventoryFull))
  const next = addItem(setFlag(state, 'sofaSearched'), 'brassKey')
  return result(
    next,
    msg('クッションの隙間に、小さな鍵が挟まっていた。'),
    { kind: 'acquire', item: 'brassKey' },
  )
}

/** 子爵の手紙(ローテーブル) */
export const examineLowTable = (state: GameState): ReduceResult => {
  if (state.flags.letterRead) {
    return result(state, msg('子爵の手紙。ローテーブルに置かれている。'))
  }
  const next = addDocument(setFlag(state, 'letterRead'), 'viscountLetter')
  return result(next, { kind: 'sfx', sfx: 'paper' }, { kind: 'document', doc: 'viscountLetter' })
}

/** L-2 飾り棚 */
export const examineCabinet = (state: GameState): ReduceResult => {
  if (!state.flags.cabinetUnlocked) {
    return result(state, msg('硝子戸の飾り棚。小さな鍵穴が付いている。'), {
      kind: 'sfx',
      sfx: 'lockedRattle',
    })
  }
  return result(state, msg('棚にはオルゴールが収まっている。'))
}

export const useOnCabinet = (state: GameState, item: string): ReduceResult => {
  if (state.flags.cabinetUnlocked) return result(state, msg('棚はもう開いている。'))
  if (item !== 'brassKey') return result(state, msg(T.doesntFit))
  if (!canCarry(state, 1)) return result(state, msg(T.inventoryFull))
  const next = deselect(
    addItem(removeItem(setFlag(state, 'cabinetUnlocked'), 'brassKey'), 'matchbox'),
  )
  return result(
    next,
    { kind: 'effect', effect: 'cabinetOpen' },
    { kind: 'sfx', sfx: 'unlock' },
    msg('棚が開いた。マッチ箱と、古いオルゴールが収められている。'),
    { kind: 'acquire', item: 'matchbox' },
  )
}

/** L-6 オルゴール */
export const examineMusicBox = (state: GameState): ReduceResult => {
  if (!state.flags.cabinetUnlocked) {
    return result(state, msg('硝子戸越しに、細工の美しいオルゴールが見える。'))
  }
  if (!state.flags.musicBoxWound) {
    return result(
      state,
      msg('美しい細工のオルゴール。背にねじ巻きの穴があるが、肝心のねじ巻きが見当たらない。'),
    )
  }
  return result(state, { kind: 'melody' }, msg(`オルゴールが旋律を奏でる。——${melodyLabel}。`))
}

export const useOnMusicBox = (state: GameState, item: string): ReduceResult => {
  if (!state.flags.cabinetUnlocked) return result(state, msg('硝子戸が閉まっている。'))
  if (state.flags.musicBoxWound) return result(state, msg('ねじはもう巻いてある。'))
  if (item !== 'windingKey') return result(state, msg(T.doesntFit))
  const next = deselect(
    addDocument(removeItem(setFlag(state, 'musicBoxWound'), 'windingKey'), 'melodyNote'),
  )
  return result(
    next,
    { kind: 'melody' },
    msg(`ねじを巻くと、オルゴールが歌い出した。——${melodyLabel}。蓋の裏にも同じ音名が刻まれている。`),
  )
}

/** L-3 傾いた絵画 */
export const examinePainting = (state: GameState): ReduceResult => {
  if (state.flags.paintingMoved) {
    return result(state, msg('山あいの湖を描いた油彩。今はまっすぐに掛かっている。'))
  }
  if (!canCarry(state, 1)) return result(state, msg(T.inventoryFull))
  const next = addItem(setFlag(state, 'paintingMoved'), 'blankLetter')
  return result(
    next,
    { kind: 'effect', effect: 'paintingDrop' },
    msg('額の傾きを直そうとすると、裏から白い便箋が滑り落ちてきた。'),
    { kind: 'acquire', item: 'blankLetter' },
  )
}

/** L-4 暖炉(点火とあぶり出し) */
export const examineFireplace = (state: GameState): ReduceResult => {
  if (!state.flags.fireplaceLit) {
    return result(state, msg('大理石の暖炉。薪が組んであるが、火は入っていない。'))
  }
  return result(state, msg('炎がぱちぱちと爆ぜて、部屋を暖めている。'))
}

export const useOnFireplace = (state: GameState, item: string): ReduceResult => {
  if (item === 'matchbox') {
    if (state.flags.fireplaceLit) return result(state, msg('もう火は点いている。'))
    const next = deselect(setFlag(state, 'fireplaceLit'))
    return result(
      next,
      { kind: 'effect', effect: 'fireplaceLight' },
      { kind: 'sfx', sfx: 'matchStrike' },
      msg('マッチを擦り、薪に火を移した。橙色の炎が部屋を照らす。'),
    )
  }
  if (item === 'blankLetter') {
    if (!state.flags.fireplaceLit) {
      return result(state, msg('便箋を火にかざしたい……が、暖炉に火が入っていない。'))
    }
    const next = deselect(
      addDocument(removeItem(setFlag(state, 'letterRevealed'), 'blankLetter'), 'revealedLetter'),
    )
    return result(
      next,
      { kind: 'effect', effect: 'revealLetter' },
      msg('便箋を火にかざすと、じわり、と茶色の文字が浮かび上がった。'),
      { kind: 'document', doc: 'revealedLetter' },
    )
  }
  return result(state, msg('火にくべる気にはなれない。'))
}

/** 装飾・フレーバー */
export const examineGramophone = (state: GameState): ReduceResult =>
  result(state, msg('ラッパ咲きの蓄音機。円盤が掛かっておらず、静かに眠っている。'))

export const examineLivingWindow = (state: GameState): ReduceResult =>
  result(state, msg('ステンドグラス越しに、藍色の夜。庭の桜がほの白く見える。'))
