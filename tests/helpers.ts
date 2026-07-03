import type { Action } from '../src/core/actions'
import type { GameEvent } from '../src/core/events'
import { reduce } from '../src/core/reducer'
import type { GameState } from '../src/core/state'
import { createInitialState } from '../src/core/state'
import { SOLUTION_STEPS } from '../src/core/solution'

/** Action 列を初期状態(または指定状態)から順に適用する */
export const play = (
  actions: readonly Action[],
  from: GameState = createInitialState(),
  now = 1_000,
): GameState => actions.reduce((s, a) => reduce(s, a, now).state, from)

/** 1 アクションを適用して state と events の両方を得る */
export const step = (
  state: GameState,
  action: Action,
  now = 1_000,
): { state: GameState; events: readonly GameEvent[] } => reduce(state, action, now)

/** 正規攻略の先頭 n 手まで進めた状態 */
export const playSolutionUntil = (n: number): GameState =>
  play(SOLUTION_STEPS.slice(0, n))

/** 正規攻略の「特定のアクションの直前」まで進めた状態 */
export const stateBefore = (predicate: (a: Action) => boolean): GameState => {
  const index = SOLUTION_STEPS.findIndex(predicate)
  if (index < 0) throw new Error('solution 内に該当アクションがありません')
  return playSolutionUntil(index)
}

export const messagesOf = (events: readonly GameEvent[]): readonly string[] =>
  events.flatMap((e) => (e.kind === 'message' ? [e.text] : []))

export const hasEvent = (events: readonly GameEvent[], kind: GameEvent['kind']): boolean =>
  events.some((e) => e.kind === kind)
