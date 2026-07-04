import {
  BOOK_ANSWER,
  GLOBE_ANSWER_YAW,
  GLOBE_TOLERANCE_DEG,
  INVENTORY_CAPACITY,
  SAFE_ANSWER,
} from '../constants'
import type { GameState } from '../state'
import type { BookColor } from '../types'
import { T } from '../texts'
import type { ReduceResult } from '../helpers'
import {
  addDocument,
  addItem,
  angularDistance,
  deselect,
  msg,
  removeItem,
  result,
  setFlag,
} from '../helpers'

/** S-1 机の引き出し */
export const examineDesk = (state: GameState): ReduceResult => {
  if (state.flags.deskOpened) {
    return result(state, msg('引き出しには、もう何もない。バンカーズランプが緑色に灯っている。'))
  }
  if (state.inventory.length + 1 > INVENTORY_CAPACITY) return result(state, msg(T.inventoryFull))
  const next = addDocument(addItem(setFlag(state, 'deskOpened'), 'photoLeft'), 'draftLetter')
  return result(
    next,
    { kind: 'sfx', sfx: 'drawer' },
    msg('引き出しの中に、破れた写真の左半分と、書きかけの手紙。'),
    { kind: 'acquire', item: 'photoLeft' },
    { kind: 'document', doc: 'draftLetter' },
  )
}

/** S-3 照明スイッチ(消灯で夜光文字) */
export const toggleStudyLight = (state: GameState): ReduceResult => {
  const turningOff = state.studyLightOn
  const toggled: GameState = { ...state, studyLightOn: !state.studyLightOn }
  if (!turningOff) {
    return result(toggled, { kind: 'effect', effect: 'lightsOn' }, { kind: 'sfx', sfx: 'switch' })
  }
  if (!state.flags.glowSeen) {
    const next = setFlag(toggled, 'glowSeen')
    return result(
      next,
      { kind: 'effect', effect: 'lightsOff' },
      { kind: 'sfx', sfx: 'switch' },
      msg('明かりが落ちると——机の上の壁に、淡く光る文字が浮かんだ。'),
    )
  }
  return result(toggled, { kind: 'effect', effect: 'lightsOff' }, { kind: 'sfx', sfx: 'switch' })
}

/** S-4 地球儀 */
export const rotateGlobe = (state: GameState, yaw: number): ReduceResult => {
  if (state.flags.globeSolved) return result(state)
  const normalized = ((yaw % 360) + 360) % 360
  return result({ ...state, globeYaw: normalized })
}

export const openGlobe = (state: GameState): ReduceResult => {
  if (state.flags.globeSolved) return result(state, msg('覚書はもう手にした。'))
  if (angularDistance(state.globeYaw, GLOBE_ANSWER_YAW) > GLOBE_TOLERANCE_DEG) {
    return result(
      state,
      { kind: 'sfx', sfx: 'lockedRattle' },
      msg('留め金はびくともしない。'),
    )
  }
  const next = addDocument(setFlag(state, 'globeSolved'), 'memorandum')
  return result(
    next,
    { kind: 'effect', effect: 'globeOpen' },
    { kind: 'sfx', sfx: 'unlock' },
    msg('日本を正面に向けると、留め金が軽く外れた。上半球が開き、中に一枚の覚書。'),
    { kind: 'document', doc: 'memorandum' },
  )
}

export const examineGlobe = (state: GameState): ReduceResult => {
  if (state.flags.globeSolved) {
    return result(state, msg('地球儀の上半分は開いたままだ。'))
  }
  return result(
    state,
    msg('木製の台に載った地球儀。自由に回せる。赤道のあたりに継ぎ目と、小さな留め金がある。'),
  )
}

/** S-5 本棚の色順 */
export const swapBooks = (state: GameState, a: number, b: number): ReduceResult => {
  if (state.flags.bookshelfSolved) return result(state, msg('もう動かす必要はないだろう。'))
  if (!Number.isInteger(a) || !Number.isInteger(b) || a === b) return result(state)
  if (a < 0 || a > 3 || b < 0 || b > 3) return result(state)
  const order = [...state.bookOrder] as [BookColor, BookColor, BookColor, BookColor]
  const va = order[a] as BookColor
  const vb = order[b] as BookColor
  order[a] = vb
  order[b] = va
  const moved: GameState = { ...state, bookOrder: order }
  const solved = order.every((c, i) => c === BOOK_ANSWER[i])
  if (!solved) return result(moved, { kind: 'sfx', sfx: 'bookSlide' })
  if (state.inventory.length + 1 > INVENTORY_CAPACITY) return result(state, msg(T.inventoryFull))
  const next = addItem(setFlag(moved, 'bookshelfSolved'), 'safeKey')
  return result(
    next,
    { kind: 'sfx', sfx: 'bookSlide' },
    { kind: 'effect', effect: 'bookshelfSecret' },
    { kind: 'sfx', sfx: 'sparkle' },
    msg('かちり、と音がして棚板の一部が開いた。奥に、重い鍵が隠されている。'),
    { kind: 'acquire', item: 'safeKey' },
  )
}

export const examineBookshelf = (state: GameState): ReduceResult => {
  if (state.flags.bookshelfSolved) {
    return result(state, msg('隠し棚は開いたままになっている。'))
  }
  return result(
    state,
    msg('壁一面の本棚。目の高さの段だけ、色布の背の本が四冊、抜き差しできるようになっている。背には色の名。'),
  )
}

/** S-6 肖像画 → S-7 金庫 */
export const examinePortrait = (state: GameState): ReduceResult => {
  if (state.flags.portraitOpen) {
    return result(state, msg('額の奥に、金庫が見えている。'))
  }
  const next = setFlag(state, 'portraitOpen')
  return result(
    next,
    { kind: 'effect', effect: 'portraitOpen' },
    { kind: 'sfx', sfx: 'doorOpen' },
    msg('肖像画の額に手を掛けると、壁に沿ってすっと横へ滑った。——壁の窪みに、金庫だ。'),
  )
}

export const examineSafe = (state: GameState): ReduceResult => {
  if (state.flags.safeSolved) return result(state, msg('金庫は開いている。'))
  if (state.flags.safeKeyInserted) {
    return result(state, msg('鍵は差した。あとは三つのダイヤルだ。'))
  }
  return result(
    state,
    msg('無骨な金庫。三連のダイヤルと鍵穴。——両方を正しく揃えねば、開かないだろう。'),
  )
}

export const useOnSafe = (state: GameState, item: string): ReduceResult => {
  if (!state.flags.portraitOpen) return result(state, msg(T.cantUseHere))
  if (item !== 'safeKey') return result(state, msg(T.doesntFit))
  if (state.flags.safeKeyInserted) return result(state, msg('鍵はもう差してある。'))
  const next = deselect(removeItem(setFlag(state, 'safeKeyInserted'), 'safeKey'))
  return result(
    next,
    { kind: 'effect', effect: 'safeKeyIn' },
    { kind: 'sfx', sfx: 'unlock' },
    msg('鍵が滑り込み、半分だけ回った。——あとは、三つの数字だ。'),
  )
}

export const setSafeDial = (state: GameState, index: 0 | 1 | 2, value: number): ReduceResult => {
  if (state.flags.safeSolved) return result(state, msg('もう開いている。'))
  const v = ((Math.round(value) % 10) + 10) % 10
  const dials: [number, number, number] = [...state.safeDials]
  dials[index] = v
  return result({ ...state, safeDials: dials }, { kind: 'sfx', sfx: 'dialClick' })
}

export const openSafe = (state: GameState): ReduceResult => {
  if (state.flags.safeSolved) return result(state, msg('中の物は、もう受け取った。'))
  if (!state.flags.safeKeyInserted) {
    return result(
      state,
      { kind: 'sfx', sfx: 'lockedRattle' },
      msg('取っ手は動かない。——鍵穴が塞がったままだ。'),
    )
  }
  const ok = state.safeDials.every((v, i) => v === SAFE_ANSWER[i])
  if (!ok) {
    return result(state, { kind: 'sfx', sfx: 'lockedRattle' }, msg('開かない。数字が違う。'))
  }
  if (state.inventory.length + 2 > INVENTORY_CAPACITY) return result(state, msg(T.inventoryFull))
  const next = addDocument(
    addItem(addItem(setFlag(state, 'safeSolved'), 'entranceKey'), 'pocketWatch'),
    'finalLetter',
  )
  return result(
    next,
    { kind: 'effect', effect: 'safeOpen' },
    { kind: 'sfx', sfx: 'safeThunk' },
    msg('重い扉が、ごとりと開いた。'),
    { kind: 'acquire', item: 'entranceKey' },
    { kind: 'acquire', item: 'pocketWatch' },
    { kind: 'document', doc: 'finalLetter' },
  )
}

export const examineLightSwitch = (state: GameState): ReduceResult =>
  result(
    state,
    msg(state.studyLightOn ? '真鍮のスイッチプレート。指を掛けてみたくなる。' : 'スイッチは下りている。'),
  )

export const examineArmchair = (state: GameState): ReduceResult =>
  result(state, msg('使い込まれた安楽椅子。肘掛けに、読みかけの本が伏せてある。'))

export const examineStudyWindow = (state: GameState): ReduceResult =>
  result(state, msg('木の鎧戸の隙間から、細く月光が差し込んでいる。'))
