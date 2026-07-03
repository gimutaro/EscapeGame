import { CLOCK_ANSWER, INVENTORY_CAPACITY } from '../constants'
import type { GameState } from '../state'
import { T } from '../texts'
import type { ReduceResult } from '../helpers'
import { addItem, msg, result, setFlag } from '../helpers'

const timeLabel = (hour: number, minute: number): string =>
  `${hour}時${minute === 0 ? '' : `${minute}分`}`

/** L-5 柱時計: 針を合わせる */
export const setClock = (state: GameState, hour: number, minute: number): ReduceResult => {
  if (state.flags.clockSolved) {
    return result(state, msg('時計は時を刻んでいる。もう針に触れるのはよそう。'))
  }
  const h = ((Math.round(hour) - 1 + 12 * 100) % 12) + 1
  const m = ((Math.round(minute / 5) * 5) % 60 + 60) % 60
  const moved: GameState = { ...state, clock: { hour: h, minute: m } }
  if (h === CLOCK_ANSWER.hour && m === CLOCK_ANSWER.minute) {
    if (state.inventory.length + 1 > INVENTORY_CAPACITY) {
      // 持ち物が満杯なら針は合わせられても鍵は取れない状態にしない(針を戻して案内)
      return result(state, msg(T.inventoryFull))
    }
    const next = addItem(setFlag(moved, 'clockSolved'), 'bedroomKey')
    return result(
      next,
      { kind: 'effect', effect: 'clockSolved' },
      { kind: 'sfx', sfx: 'chime' },
      msg('チャイムが四つ鳴り、振り子が動き出した。台座の小扉が開いている——中に鍵だ。'),
      { kind: 'acquire', item: 'bedroomKey' },
    )
  }
  return result(moved, { kind: 'sfx', sfx: 'dialClick' })
}

export const examineClock = (state: GameState): ReduceResult => {
  if (state.flags.clockSolved) {
    return result(
      state,
      msg(`柱時計は${timeLabel(CLOCK_ANSWER.hour, CLOCK_ANSWER.minute)}を指し、振り子が時を刻んでいる。`),
    )
  }
  return result(
    state,
    msg(
      `大きな柱時計。振り子は止まり、${timeLabel(state.clock.hour, state.clock.minute)}を指している。針は自由に動かせそうだ。`,
    ),
  )
}
