import type { GameState } from '../state'
import type { RoomId } from '../types'
import { T } from '../texts'
import type { ReduceResult } from '../helpers'
import { deselect, msg, removeItem, result, setFlag } from '../helpers'

/** 部屋の隣接関係(リビングがハブ) */
const isAdjacent = (a: RoomId, b: RoomId): boolean =>
  (a === 'living' && (b === 'bedroom' || b === 'study')) ||
  (b === 'living' && (a === 'bedroom' || a === 'study'))

const doorUnlocked = (state: GameState, room: RoomId): boolean => {
  if (room === 'bedroom') return state.flags.bedroomUnlocked
  if (room === 'study') return state.flags.studyUnlocked
  return true
}

export const moveToRoom = (state: GameState, room: RoomId): ReduceResult => {
  if (room === state.currentRoom) return result(state)
  if (!isAdjacent(state.currentRoom, room)) return result(state)
  const gate: RoomId = room === 'living' ? state.currentRoom : room
  if (!doorUnlocked(state, gate)) {
    return result(state, { kind: 'sfx', sfx: 'lockedRattle' }, msg('鍵が掛かっている。'))
  }
  return result({ ...state, currentRoom: room }, { kind: 'roomChanged', room })
}

export const examineBedroomDoor = (state: GameState): ReduceResult => {
  if (state.flags.bedroomUnlocked) return result(state, msg('寝室へ続く扉。開いている。'))
  return result(
    state,
    { kind: 'sfx', sfx: 'lockedRattle' },
    msg('東の扉には鍵が掛かっている。札に「寝室」とある。'),
  )
}

export const examineStudyDoor = (state: GameState): ReduceResult => {
  if (state.flags.studyUnlocked) return result(state, msg('書斎へ続く扉。開いている。'))
  return result(
    state,
    { kind: 'sfx', sfx: 'lockedRattle' },
    msg('西の扉には鍵が掛かっている。札に「書斎」とある。'),
  )
}

export const examineEntrance = (state: GameState): ReduceResult => {
  if (state.flags.entranceUnlocked) return result(state, msg('玄関は開いている。'))
  return result(
    state,
    { kind: 'sfx', sfx: 'lockedRattle' },
    msg('両開きの玄関扉。重厚な錠が下りている。屋敷のどこかに、鍵があるはずだ。'),
  )
}

export const useOnBedroomDoor = (state: GameState, item: string): ReduceResult => {
  if (state.flags.bedroomUnlocked) return result(state, msg('もう開いている。'))
  if (item !== 'bedroomKey') return result(state, msg(T.doesntFit))
  const next = deselect(removeItem(setFlag(state, 'bedroomUnlocked'), 'bedroomKey'))
  return result(
    next,
    { kind: 'effect', effect: 'doorOpenBedroom' },
    { kind: 'sfx', sfx: 'unlock' },
    msg('鍵が回った。扉の向こうは寝室だ。'),
  )
}

export const useOnStudyDoor = (state: GameState, item: string): ReduceResult => {
  if (state.flags.studyUnlocked) return result(state, msg('もう開いている。'))
  if (item !== 'studyKey') return result(state, msg(T.doesntFit))
  const next = deselect(removeItem(setFlag(state, 'studyUnlocked'), 'studyKey'))
  return result(
    next,
    { kind: 'effect', effect: 'doorOpenStudy' },
    { kind: 'sfx', sfx: 'unlock' },
    msg('鍵が回った。扉の向こうは書斎だ。'),
  )
}

/** L-8 玄関の開錠 = 脱出 */
export const useOnEntrance = (state: GameState, item: string, now: number): ReduceResult => {
  if (state.flags.entranceUnlocked) return result(state, msg('玄関は開いている。'))
  if (item !== 'entranceKey') return result(state, msg(T.doesntFit))
  const unlocked = deselect(removeItem(setFlag(state, 'entranceUnlocked'), 'entranceKey'))
  const next: GameState = { ...unlocked, phase: 'ending', escapedAt: now }
  return result(
    next,
    { kind: 'effect', effect: 'escape' },
    { kind: 'phaseChanged', phase: 'ending' },
  )
}
