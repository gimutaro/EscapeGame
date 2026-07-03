import type { Action } from './actions'
import type { GameState } from './state'
import { createInitialState } from './state'
import type { HotspotId, ItemId } from './types'
import { T } from './texts'
import type { ReduceResult } from './helpers'
import { hasItem, msg, result } from './helpers'
import * as living from './puzzles/living'
import * as clock from './puzzles/clock'
import * as piano from './puzzles/piano'
import * as bedroom from './puzzles/bedroom'
import * as study from './puzzles/study'
import * as doors from './puzzles/doors'
import { combineItems } from './puzzles/combine'

type Examine = (state: GameState) => ReduceResult

const EXAMINE_HANDLERS: Partial<Record<HotspotId, Examine>> = {
  sofa: living.examineSofa,
  lowTable: living.examineLowTable,
  cabinet: living.examineCabinet,
  musicBox: living.examineMusicBox,
  fireplace: living.examineFireplace,
  painting: living.examinePainting,
  clock: clock.examineClock,
  piano: piano.examinePiano,
  gramophone: living.examineGramophone,
  livingWindow: living.examineLivingWindow,
  entranceDoor: doors.examineEntrance,
  doorBedroom: doors.examineBedroomDoor,
  doorStudy: doors.examineStudyDoor,
  bed: bedroom.examineBed,
  vanity: bedroom.examineVanity,
  byobu: bedroom.examineByobu,
  wardrobe: bedroom.examineWardrobe,
  kimono: bedroom.examineKimono,
  jewelryBox: bedroom.examineJewelryBox,
  sideTable: bedroom.examineSideTable,
  bedroomWindow: bedroom.examineBedroomWindow,
  desk: study.examineDesk,
  globe: study.examineGlobe,
  bookshelf: study.examineBookshelf,
  portrait: study.examinePortrait,
  safe: study.examineSafe,
  safeKeyhole: study.examineSafe,
  lightSwitch: study.examineLightSwitch,
  armchair: study.examineArmchair,
  studyWindow: study.examineStudyWindow,
}

type Use = (state: GameState, item: ItemId) => ReduceResult

const useHandlers = (now: number): Partial<Record<HotspotId, Use>> => ({
  cabinet: (s, i) => living.useOnCabinet(s, i),
  musicBox: (s, i) => living.useOnMusicBox(s, i),
  fireplace: (s, i) => living.useOnFireplace(s, i),
  doorBedroom: (s, i) => doors.useOnBedroomDoor(s, i),
  doorStudy: (s, i) => doors.useOnStudyDoor(s, i),
  entranceDoor: (s, i) => doors.useOnEntrance(s, i, now),
  safe: (s, i) => study.useOnSafe(s, i),
  safeKeyhole: (s, i) => study.useOnSafe(s, i),
})

const hintKey = (puzzle: string, stage: number): string => `${puzzle}:${stage}`

/**
 * ルートリデューサ(純粋関数)。
 * now は時刻依存の状態(開始・脱出時刻)にのみ使う。
 */
export const reduce = (state: GameState, action: Action, now = 0): ReduceResult => {
  switch (action.type) {
    case 'NEW_GAME': {
      const fresh = { ...createInitialState(), phase: 'prologue' as const }
      return result(fresh, { kind: 'phaseChanged', phase: 'prologue' })
    }
    case 'PROLOGUE_DONE': {
      if (state.phase !== 'prologue') return result(state)
      return result(
        { ...state, phase: 'playing', startedAt: now },
        { kind: 'phaseChanged', phase: 'playing' },
      )
    }
    case 'ENDING_DONE': {
      if (state.phase !== 'ending') return result(state)
      return result({ ...state, phase: 'result' }, { kind: 'phaseChanged', phase: 'result' })
    }
    case 'RESTART': {
      return result(createInitialState(), { kind: 'phaseChanged', phase: 'title' })
    }
    case 'LOAD': {
      return result(action.state, { kind: 'phaseChanged', phase: action.state.phase })
    }
    case 'SELECT_ITEM': {
      if (action.item !== null && !hasItem(state, action.item)) return result(state)
      return result({ ...state, selectedItem: action.item }, { kind: 'sfx', sfx: 'tap' })
    }
    case 'EXAMINE': {
      const handler = EXAMINE_HANDLERS[action.target]
      if (!handler) return result(state)
      return handler(state)
    }
    case 'USE_ITEM': {
      if (!hasItem(state, action.item)) return result(state)
      const handler = useHandlers(now)[action.target]
      if (!handler) return result(state, msg(T.cantUseHere))
      return handler(state, action.item)
    }
    case 'COMBINE_ITEMS':
      return combineItems(state, action.a, action.b)
    case 'MOVE_TO_ROOM':
      return doors.moveToRoom(state, action.room)
    case 'SET_CLOCK':
      return clock.setClock(state, action.hour, action.minute)
    case 'PIANO_PRESS':
      return piano.pianoPress(state, action.note)
    case 'SET_JEWELRY_DIAL':
      return bedroom.setJewelryDial(state, action.index, action.value)
    case 'OPEN_JEWELRY':
      return bedroom.openJewelry(state)
    case 'SWAP_BOOKS':
      return study.swapBooks(state, action.a, action.b)
    case 'ROTATE_GLOBE':
      return study.rotateGlobe(state, action.yaw)
    case 'OPEN_GLOBE':
      return study.openGlobe(state)
    case 'TOGGLE_STUDY_LIGHT':
      return study.toggleStudyLight(state)
    case 'SET_SAFE_DIAL':
      return study.setSafeDial(state, action.index, action.value)
    case 'OPEN_SAFE':
      return study.openSafe(state)
    case 'HINT_VIEW': {
      const key = hintKey(action.puzzle, action.stage)
      if (state.seenHints.includes(key)) return result(state)
      return result({
        ...state,
        seenHints: [...state.seenHints, key],
        hintsUsed: state.hintsUsed + 1,
      })
    }
  }
}
