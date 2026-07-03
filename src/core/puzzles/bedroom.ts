import { INVENTORY_CAPACITY, JEWELRY_ANSWER } from '../constants'
import type { GameState } from '../state'
import { T } from '../texts'
import type { ReduceResult } from '../helpers'
import { addDocument, addItem, msg, result, setFlag } from '../helpers'

/** B-1 鏡台(屏風の鏡文字が読める) */
export const examineVanity = (state: GameState): ReduceResult => {
  const next = addDocument(setFlag(state, 'mirrorSeen'), 'mirrorText')
  return result(
    next,
    msg('鏡に、部屋の屏風が映り込んでいる。——裏返しだった文字が、読める。'),
    { kind: 'document', doc: 'mirrorText' },
  )
}

export const examineByobu = (state: GameState): ReduceResult => {
  if (state.flags.mirrorSeen) {
    return result(state, msg('金彩の屏風。「たんすの着物、花を数えよ」——鏡越しに、そう読めた。'))
  }
  return result(
    state,
    msg('金彩の屏風に、裏返しの文字が書かれている。このままでは読みにくい。……向かいの鏡になら、映るだろうか。'),
  )
}

/** B-2 洋箪笥と着物 */
export const examineWardrobe = (state: GameState): ReduceResult => {
  if (!state.flags.wardrobeOpen) {
    const next = setFlag(state, 'wardrobeOpen')
    return result(
      next,
      { kind: 'effect', effect: 'wardrobeOpen' },
      { kind: 'sfx', sfx: 'doorOpen' },
      msg('観音扉を開けると、美しい訪問着が掛けられていた。'),
    )
  }
  return result(state, msg('咲子の訪問着が、大切に掛けられている。'))
}

export const examineKimono = (state: GameState): ReduceResult => {
  if (!state.flags.wardrobeOpen) {
    return result(state, msg('箪笥の扉が閉まっている。'))
  }
  const next = addDocument(setFlag(state, 'kimonoSeen'), 'kimonoNote')
  return result(next, { kind: 'document', doc: 'kimonoNote' })
}

/** B-3 宝石箱 */
export const examineJewelryBox = (state: GameState): ReduceResult => {
  if (state.flags.jewelrySolved) {
    return result(state, msg('宝石箱は開いたまま。ビロードの内張りが覗いている。'))
  }
  return result(
    state,
    msg('花の彫られたダイヤルが三つ付いた宝石箱。彫刻は左から、桜、梅、菊。'),
  )
}

export const setJewelryDial = (state: GameState, index: 0 | 1 | 2, value: number): ReduceResult => {
  if (state.flags.jewelrySolved) return result(state, msg('もう開いている。'))
  const v = ((Math.round(value) % 10) + 10) % 10
  const dials: [number, number, number] = [...state.jewelryDials]
  dials[index] = v
  return result({ ...state, jewelryDials: dials }, { kind: 'sfx', sfx: 'dialClick' })
}

export const openJewelry = (state: GameState): ReduceResult => {
  if (state.flags.jewelrySolved) return result(state, msg('中はもう空だ。'))
  const ok = state.jewelryDials.every((v, i) => v === JEWELRY_ANSWER[i])
  if (!ok) {
    return result(
      state,
      { kind: 'sfx', sfx: 'lockedRattle' },
      msg('留め金は開かない。数字が違うようだ。'),
    )
  }
  if (state.inventory.length + 2 > INVENTORY_CAPACITY) return result(state, msg(T.inventoryFull))
  const next = addItem(addItem(setFlag(state, 'jewelrySolved'), 'windingKey'), 'photoRight')
  return result(
    next,
    { kind: 'effect', effect: 'jewelryOpen' },
    { kind: 'sfx', sfx: 'unlock' },
    msg('留め金が外れた。中には銀のねじ巻きと、破れた写真の右半分。'),
    { kind: 'acquire', item: 'windingKey' },
    { kind: 'acquire', item: 'photoRight' },
  )
}

/** B-4 咲子の日記 */
export const examineSideTable = (state: GameState): ReduceResult => {
  const next = addDocument(setFlag(state, 'diaryRead'), 'diary')
  return result(next, { kind: 'sfx', sfx: 'paper' }, { kind: 'document', doc: 'diary' })
}

export const examineBed = (state: GameState): ReduceResult =>
  result(state, msg('真鍮枠の寝台。長く使われていないはずなのに、埃ひとつない。'))

export const examineBedroomWindow = (state: GameState): ReduceResult =>
  result(state, msg('レースのカーテン越しに、月。庭の木々が静かに揺れている。'))
