import type { Action } from './actions'
import type { GameEvent } from './events'
import type { GameState } from './state'
import { reduce } from './reducer'

export type Listener = (
  state: GameState,
  events: readonly GameEvent[],
  action: Action,
) => void

export interface Store {
  getState: () => GameState
  dispatch: (action: Action) => void
  subscribe: (listener: Listener) => () => void
}

/** 単方向データフローの薄いストア。状態変更は reduce のみが行う。 */
export const createStore = (initial: GameState, now: () => number = Date.now): Store => {
  let state = initial
  const listeners = new Set<Listener>()

  return {
    getState: () => state,
    dispatch: (action) => {
      const { state: next, events } = reduce(state, action, now())
      state = next
      for (const listener of listeners) {
        listener(state, events, action)
      }
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
