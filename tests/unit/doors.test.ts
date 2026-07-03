import { describe, expect, it } from 'vitest'
import { reduce } from '../../src/core/reducer'
import { play, step, stateBefore } from '../helpers'

const start = play([{ type: 'NEW_GAME' }, { type: 'PROLOGUE_DONE' }])

describe('扉の開錠', () => {
  it('寝室の鍵で扉Bが開き、鍵は消え、扉は開放のまま', () => {
    const withKey = play([{ type: 'SET_CLOCK', hour: 4, minute: 10 }], start)
    const opened = step(withKey, {
      type: 'USE_ITEM',
      item: 'bedroomKey',
      target: 'doorBedroom',
    }).state
    expect(opened.flags.bedroomUnlocked).toBe(true)
    expect(opened.inventory).not.toContain('bedroomKey')
    // 往復しても開いたまま
    const wentAndBack = play(
      [
        { type: 'MOVE_TO_ROOM', room: 'bedroom' },
        { type: 'MOVE_TO_ROOM', room: 'living' },
        { type: 'MOVE_TO_ROOM', room: 'bedroom' },
      ],
      opened,
    )
    expect(wentAndBack.currentRoom).toBe('bedroom')
  })
  it('間違った鍵では開かない', () => {
    const withKey = play([{ type: 'SET_CLOCK', hour: 4, minute: 10 }], start)
    const { state } = step(withKey, { type: 'USE_ITEM', item: 'bedroomKey', target: 'doorStudy' })
    expect(state.flags.studyUnlocked).toBe(false)
    expect(state.inventory).toContain('bedroomKey')
  })
})

describe('L-8 玄関(脱出)', () => {
  it('鍵なしで調べると施錠の案内', () => {
    const { events } = step(start, { type: 'EXAMINE', target: 'entranceDoor' })
    const text = events.map((e) => (e.kind === 'message' ? e.text : '')).join('')
    expect(text).toContain('錠')
  })
  it('玄関の鍵で ending フェーズへ移行し脱出時刻を記録', () => {
    const beforeEscape = stateBefore(
      (a) => a.type === 'USE_ITEM' && a.item === 'entranceKey',
    )
    const { state, events } = reduce(
      beforeEscape,
      { type: 'USE_ITEM', item: 'entranceKey', target: 'entranceDoor' },
      99_999,
    )
    expect(state.phase).toBe('ending')
    expect(state.flags.entranceUnlocked).toBe(true)
    expect(state.escapedAt).toBe(99_999)
    expect(events.some((e) => e.kind === 'effect' && e.effect === 'escape')).toBe(true)
    // ENDING_DONE でリザルトへ
    const result = reduce(state, { type: 'ENDING_DONE' }, 0).state
    expect(result.phase).toBe('result')
  })
})
