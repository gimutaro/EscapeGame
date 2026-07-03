import type { GameState } from '../state'
import type { ItemId } from '../types'
import type { ReduceResult } from '../helpers'
import { addDocument, addItem, hasItem, msg, removeItem, result, setFlag } from '../helpers'

const isPhotoPair = (a: ItemId, b: ItemId): boolean =>
  (a === 'photoLeft' && b === 'photoRight') || (a === 'photoRight' && b === 'photoLeft')

/** S-2 思い出の写真(任意・物語補強) */
export const combineItems = (state: GameState, a: ItemId, b: ItemId): ReduceResult => {
  if (!hasItem(state, a) || !hasItem(state, b)) return result(state)
  if (!isPhotoPair(a, b)) {
    return result(state, msg('組み合わせられないようだ。'))
  }
  const next = addDocument(
    addItem(removeItem(removeItem(setFlag(state, 'photosCombined'), a), b), 'memoryPhoto'),
    'photoBack',
  )
  return result(
    next,
    { kind: 'sfx', sfx: 'combine' },
    msg('二つの写真が、ぴたりと重なった。——若き日の父と、子爵だ。'),
    { kind: 'acquire', item: 'memoryPhoto' },
    { kind: 'document', doc: 'photoBack' },
  )
}
