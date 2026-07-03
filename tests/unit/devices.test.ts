import { describe, expect, it } from 'vitest'
import { CLOCK_ANSWER, MELODY } from '../../src/core/constants'
import { hasEvent, play, step } from '../helpers'

const start = play([{ type: 'NEW_GAME' }, { type: 'PROLOGUE_DONE' }])

describe('L-5 柱時計', () => {
  it('正解時刻で寝室の鍵を得る', () => {
    const { state, events } = step(start, {
      type: 'SET_CLOCK',
      hour: CLOCK_ANSWER.hour,
      minute: CLOCK_ANSWER.minute,
    })
    expect(state.flags.clockSolved).toBe(true)
    expect(state.inventory).toContain('bedroomKey')
    expect(hasEvent(events, 'effect')).toBe(true)
  })
  it('不正解の時刻では何も起きず、針は自由に動く', () => {
    const { state } = step(start, { type: 'SET_CLOCK', hour: 9, minute: 45 })
    expect(state.clock).toEqual({ hour: 9, minute: 45 })
    expect(state.flags.clockSolved).toBe(false)
  })
  it('時針は1〜12、分針は5分刻みに正規化される', () => {
    const a = step(start, { type: 'SET_CLOCK', hour: 13, minute: 62 }).state
    expect(a.clock.hour).toBe(1)
    expect(a.clock.minute).toBe(0)
    const b = step(start, { type: 'SET_CLOCK', hour: 0, minute: -5 }).state
    expect(b.clock.hour).toBe(12)
    expect(b.clock.minute).toBe(55)
  })
  it('解決後は針が固定され、正解時刻の表示が保たれる(R-6)', () => {
    const solved = step(start, {
      type: 'SET_CLOCK',
      hour: CLOCK_ANSWER.hour,
      minute: CLOCK_ANSWER.minute,
    }).state
    const { state } = step(solved, { type: 'SET_CLOCK', hour: 8, minute: 0 })
    expect(state.clock).toEqual(CLOCK_ANSWER)
    expect(state.inventory.filter((i) => i === 'bedroomKey')).toHaveLength(1)
  })
})

describe('L-7 ピアノ', () => {
  it('正しい旋律で書斎の鍵を得る', () => {
    const state = play(
      MELODY.map((note) => ({ type: 'PIANO_PRESS' as const, note })),
      start,
    )
    expect(state.flags.pianoSolved).toBe(true)
    expect(state.inventory).toContain('studyKey')
    expect(state.pianoInput).toHaveLength(0)
  })
  it('間違えると入力がリセットされ、ペナルティはない', () => {
    const wrong = play(
      [
        { type: 'PIANO_PRESS', note: 'E4' },
        { type: 'PIANO_PRESS', note: 'G4' },
        { type: 'PIANO_PRESS', note: 'A4' },
        { type: 'PIANO_PRESS', note: 'B4' }, // 最後だけ違う
      ],
      start,
    )
    expect(wrong.flags.pianoSolved).toBe(false)
    expect(wrong.pianoInput).toHaveLength(0)
    // やり直せば解ける
    const solved = play(
      MELODY.map((note) => ({ type: 'PIANO_PRESS' as const, note })),
      wrong,
    )
    expect(solved.flags.pianoSolved).toBe(true)
  })
  it('解決後も自由に弾けるが鍵は増えない', () => {
    const solved = play(
      MELODY.map((note) => ({ type: 'PIANO_PRESS' as const, note })),
      start,
    )
    const after = play(
      MELODY.map((note) => ({ type: 'PIANO_PRESS' as const, note })),
      solved,
    )
    expect(after.inventory.filter((i) => i === 'studyKey')).toHaveLength(1)
  })
})

describe('入力途中の状態', () => {
  it('3音まではただ蓄積される', () => {
    const state = play(
      [
        { type: 'PIANO_PRESS', note: 'E4' },
        { type: 'PIANO_PRESS', note: 'G4' },
        { type: 'PIANO_PRESS', note: 'A4' },
      ],
      start,
    )
    expect(state.pianoInput).toEqual(['E4', 'G4', 'A4'])
  })
})
