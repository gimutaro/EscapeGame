import type { Action } from '../src/core/actions'
import {
  BOOK_ANSWER,
  CLOCK_ANSWER,
  GLOBE_ANSWER_YAW,
  GLOBE_TOLERANCE_DEG,
  JEWELRY_ANSWER,
  MELODY,
  SAFE_ANSWER,
} from '../src/core/constants'
import { angularDistance } from '../src/core/helpers'
import type { GameState } from '../src/core/state'

const firstDialMismatch = (
  dials: readonly [number, number, number],
  answer: readonly [number, number, number],
): 0 | 1 | 2 | null => {
  for (const i of [0, 1, 2] as const) {
    if (dials[i] !== answer[i]) return i
  }
  return null
}

/**
 * 自動ソルバー: 任意の到達可能状態から「次にすべき一手」を返す。
 * null は完了(リザルト到達)。
 * これが常に有限手で完了することが「どの状態からも脱出できる」ことの証明になる。
 */
export const solveNext = (s: GameState): Action | null => {
  if (s.phase === 'title') return { type: 'NEW_GAME' }
  if (s.phase === 'prologue') return { type: 'PROLOGUE_DONE' }
  if (s.phase === 'ending') return { type: 'ENDING_DONE' }
  if (s.phase === 'result') return null

  const f = s.flags
  // Phase 1: リビング
  if (!f.letterRead) return { type: 'EXAMINE', target: 'lowTable' }
  if (!f.sofaSearched) return { type: 'EXAMINE', target: 'sofa' }
  if (!f.cabinetUnlocked) return { type: 'USE_ITEM', item: 'brassKey', target: 'cabinet' }
  if (!f.paintingMoved) return { type: 'EXAMINE', target: 'painting' }
  if (!f.fireplaceLit) return { type: 'USE_ITEM', item: 'matchbox', target: 'fireplace' }
  if (!f.letterRevealed) return { type: 'USE_ITEM', item: 'blankLetter', target: 'fireplace' }
  if (!f.clockSolved) {
    return { type: 'SET_CLOCK', hour: CLOCK_ANSWER.hour, minute: CLOCK_ANSWER.minute }
  }
  if (!f.bedroomUnlocked) return { type: 'USE_ITEM', item: 'bedroomKey', target: 'doorBedroom' }
  // Phase 2: 寝室
  if (s.currentRoom !== 'bedroom' && !f.jewelrySolved) {
    return s.currentRoom === 'living'
      ? { type: 'MOVE_TO_ROOM', room: 'bedroom' }
      : { type: 'MOVE_TO_ROOM', room: 'living' }
  }
  if (!f.diaryRead) return { type: 'EXAMINE', target: 'sideTable' }
  if (!f.mirrorSeen) return { type: 'EXAMINE', target: 'vanity' }
  if (!f.wardrobeOpen) return { type: 'EXAMINE', target: 'wardrobe' }
  if (!f.kimonoSeen) return { type: 'EXAMINE', target: 'kimono' }
  if (!f.jewelrySolved) {
    const i = firstDialMismatch(s.jewelryDials, JEWELRY_ANSWER)
    if (i !== null) return { type: 'SET_JEWELRY_DIAL', index: i, value: JEWELRY_ANSWER[i] }
    return { type: 'OPEN_JEWELRY' }
  }
  // Phase 2 後半: リビングに戻って旋律
  if (!f.musicBoxWound) {
    if (s.currentRoom !== 'living') return { type: 'MOVE_TO_ROOM', room: 'living' }
    return { type: 'USE_ITEM', item: 'windingKey', target: 'musicBox' }
  }
  if (!f.pianoSolved) {
    // プレフィックス方式なので、旋律の続きを弾けば必ず解ける
    const nextNote = MELODY[s.pianoInput.length] ?? MELODY[0]
    if (nextNote === undefined) throw new Error('unreachable')
    return { type: 'PIANO_PRESS', note: nextNote }
  }
  if (!f.studyUnlocked) return { type: 'USE_ITEM', item: 'studyKey', target: 'doorStudy' }
  // Phase 3: 書斎
  if (s.currentRoom !== 'study' && !f.safeSolved) {
    return s.currentRoom === 'living'
      ? { type: 'MOVE_TO_ROOM', room: 'study' }
      : { type: 'MOVE_TO_ROOM', room: 'living' }
  }
  if (!f.deskOpened) return { type: 'EXAMINE', target: 'desk' }
  if (!f.photosCombined) return { type: 'COMBINE_ITEMS', a: 'photoLeft', b: 'photoRight' }
  if (!f.glowSeen) return { type: 'TOGGLE_STUDY_LIGHT' }
  if (!f.globeSolved) {
    if (angularDistance(s.globeYaw, GLOBE_ANSWER_YAW) > GLOBE_TOLERANCE_DEG) {
      return { type: 'ROTATE_GLOBE', yaw: GLOBE_ANSWER_YAW }
    }
    return { type: 'OPEN_GLOBE' }
  }
  if (!f.bookshelfSolved) {
    // どんな並びからでも: 最初に違う位置へ、正しい色の本を入れ替えで運ぶ
    for (let i = 0; i < 4; i++) {
      if (s.bookOrder[i] !== BOOK_ANSWER[i]) {
        const j = s.bookOrder.findIndex((c, k) => k > i && c === BOOK_ANSWER[i])
        return { type: 'SWAP_BOOKS', a: i, b: j }
      }
    }
    throw new Error('本棚: 正しい並びなのに未解決')
  }
  if (!f.portraitOpen) return { type: 'EXAMINE', target: 'portrait' }
  if (!f.safeKeyInserted) return { type: 'USE_ITEM', item: 'safeKey', target: 'safe' }
  if (!f.safeSolved) {
    const i = firstDialMismatch(s.safeDials, SAFE_ANSWER)
    if (i !== null) return { type: 'SET_SAFE_DIAL', index: i, value: SAFE_ANSWER[i] }
    return { type: 'OPEN_SAFE' }
  }
  // 脱出
  if (!f.entranceUnlocked) {
    if (s.currentRoom !== 'living') return { type: 'MOVE_TO_ROOM', room: 'living' }
    return { type: 'USE_ITEM', item: 'entranceKey', target: 'entranceDoor' }
  }
  throw new Error('解決不能な状態に到達した(ソルバーの網羅漏れ)')
}
