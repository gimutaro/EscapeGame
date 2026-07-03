import type { GameEvent } from './events'
import type { GameState } from './state'
import type { DocumentId, FlagId, ItemId } from './types'

export interface ReduceResult {
  readonly state: GameState
  readonly events: readonly GameEvent[]
}

export const result = (state: GameState, ...events: readonly GameEvent[]): ReduceResult => ({
  state,
  events,
})

export const msg = (text: string): GameEvent => ({ kind: 'message', text })

export const setFlag = (state: GameState, flag: FlagId): GameState => ({
  ...state,
  flags: { ...state.flags, [flag]: true },
})

export const setFlags = (state: GameState, ...flagIds: readonly FlagId[]): GameState =>
  flagIds.reduce((s, f) => setFlag(s, f), state)

export const addItem = (state: GameState, item: ItemId): GameState =>
  state.inventory.includes(item) ? state : { ...state, inventory: [...state.inventory, item] }

export const removeItem = (state: GameState, item: ItemId): GameState => ({
  ...state,
  inventory: state.inventory.filter((i) => i !== item),
  selectedItem: state.selectedItem === item ? null : state.selectedItem,
})

export const hasItem = (state: GameState, item: ItemId): boolean =>
  state.inventory.includes(item)

export const addDocument = (state: GameState, doc: DocumentId): GameState =>
  state.documents.includes(doc) ? state : { ...state, documents: [...state.documents, doc] }

export const deselect = (state: GameState): GameState =>
  state.selectedItem === null ? state : { ...state, selectedItem: null }

/** 角度差(度)を 0..180 に正規化して返す */
export const angularDistance = (a: number, b: number): number => {
  const d = Math.abs(((a - b) % 360) + 360) % 360
  return d > 180 ? 360 - d : d
}
