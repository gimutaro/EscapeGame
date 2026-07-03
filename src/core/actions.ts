import type { GameState } from './state'
import type { HintStage, HotspotId, ItemId, Note, PuzzleId, RoomId } from './types'

/** ゲームへの入力(判別可能ユニオン)。リデューサだけが状態を変更する。 */
export type Action =
  | { readonly type: 'NEW_GAME' }
  | { readonly type: 'PROLOGUE_DONE' }
  | { readonly type: 'EXAMINE'; readonly target: HotspotId }
  | { readonly type: 'SELECT_ITEM'; readonly item: ItemId | null }
  | { readonly type: 'USE_ITEM'; readonly item: ItemId; readonly target: HotspotId }
  | { readonly type: 'COMBINE_ITEMS'; readonly a: ItemId; readonly b: ItemId }
  | { readonly type: 'MOVE_TO_ROOM'; readonly room: RoomId }
  | { readonly type: 'SET_CLOCK'; readonly hour: number; readonly minute: number }
  | { readonly type: 'PIANO_PRESS'; readonly note: Note }
  | { readonly type: 'SET_JEWELRY_DIAL'; readonly index: 0 | 1 | 2; readonly value: number }
  | { readonly type: 'OPEN_JEWELRY' }
  | { readonly type: 'SWAP_BOOKS'; readonly a: number; readonly b: number }
  | { readonly type: 'ROTATE_GLOBE'; readonly yaw: number }
  | { readonly type: 'OPEN_GLOBE' }
  | { readonly type: 'TOGGLE_STUDY_LIGHT' }
  | { readonly type: 'SET_SAFE_DIAL'; readonly index: 0 | 1 | 2; readonly value: number }
  | { readonly type: 'OPEN_SAFE' }
  | { readonly type: 'HINT_VIEW'; readonly puzzle: PuzzleId; readonly stage: HintStage }
  | { readonly type: 'ENDING_DONE' }
  | { readonly type: 'RESTART' }
  | { readonly type: 'LOAD'; readonly state: GameState }
