import { INVENTORY_CAPACITY, MELODY } from '../constants'
import type { GameState } from '../state'
import type { Note } from '../types'
import { T } from '../texts'
import type { ReduceResult } from '../helpers'
import { addItem, msg, result, setFlag } from '../helpers'

const isPrefixOfMelody = (input: readonly Note[]): boolean =>
  input.length <= MELODY.length && input.every((n, i) => n === MELODY[i])

/**
 * L-7 ピアノ: 旋律の再現。
 * 「正しい旋律の続き」だけを保持するプレフィックス方式:
 * どんな状態からでも ミ・ソ・ラ・ド を続けて弾けば必ず解ける(詰み防止)。
 */
export const pianoPress = (state: GameState, note: Note): ReduceResult => {
  if (state.flags.pianoSolved) {
    // 解決後も自由に弾ける(音だけ鳴る)
    return result(state, { kind: 'note', note })
  }
  const extended = [...state.pianoInput, note]
  const broke = !isPrefixOfMelody(extended)
  const input: readonly Note[] = broke ? (note === MELODY[0] ? [note] : []) : extended

  if (input.length === MELODY.length) {
    if (state.inventory.length + 1 > INVENTORY_CAPACITY) {
      return result({ ...state, pianoInput: [] }, { kind: 'note', note }, msg(T.inventoryFull))
    }
    const next = addItem(setFlag({ ...state, pianoInput: [] }, 'pianoSolved'), 'studyKey')
    return result(
      next,
      { kind: 'note', note },
      { kind: 'effect', effect: 'pianoDrawer' },
      { kind: 'sfx', sfx: 'sparkle' },
      msg('最後の音が響くと——かたり、と鍵盤の下から小さな引き出しが現れた。'),
      { kind: 'acquire', item: 'studyKey' },
    )
  }
  if (broke && state.pianoInput.length > 0) {
    // 始めかけた旋律が途切れた時だけ、そっと不協和の響きで知らせる
    return result({ ...state, pianoInput: input }, { kind: 'note', note }, {
      kind: 'sfx',
      sfx: 'dissonance',
    })
  }
  return result({ ...state, pianoInput: input }, { kind: 'note', note })
}

export const examinePiano = (state: GameState): ReduceResult => {
  if (state.flags.pianoSolved) {
    return result(state, msg('鍵盤下の隠し引き出しは、開いたままになっている。'))
  }
  return result(state, msg('アップライトピアノ。鍵盤の上に、音名を記した札が添えてある。'))
}
