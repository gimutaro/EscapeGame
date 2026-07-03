import { describe, expect, it } from 'vitest'
import { JEWELRY_ANSWER } from '../../src/core/constants'
import type { Action } from '../../src/core/actions'
import { play, step } from '../helpers'

const inBedroom = play([
  { type: 'NEW_GAME' },
  { type: 'PROLOGUE_DONE' },
  { type: 'EXAMINE', target: 'sofa' },
  { type: 'USE_ITEM', item: 'brassKey', target: 'cabinet' },
  { type: 'EXAMINE', target: 'painting' },
  { type: 'USE_ITEM', item: 'matchbox', target: 'fireplace' },
  { type: 'USE_ITEM', item: 'blankLetter', target: 'fireplace' },
  { type: 'SET_CLOCK', hour: 4, minute: 10 },
  { type: 'USE_ITEM', item: 'bedroomKey', target: 'doorBedroom' },
  { type: 'MOVE_TO_ROOM', room: 'bedroom' },
])

describe('B-1 鏡台と屏風', () => {
  it('鏡台を調べると鏡文字の内容が記録される', () => {
    const { state } = step(inBedroom, { type: 'EXAMINE', target: 'vanity' })
    expect(state.flags.mirrorSeen).toBe(true)
    expect(state.documents).toContain('mirrorText')
  })
  it('屏風を直接調べると鏡への誘導文が出る', () => {
    const { events } = step(inBedroom, { type: 'EXAMINE', target: 'byobu' })
    const text = events.map((e) => (e.kind === 'message' ? e.text : '')).join('')
    expect(text).toContain('鏡')
  })
})

describe('B-2 箪笥と着物', () => {
  it('箪笥を開けてから着物を調べると花の数が記録される', () => {
    const opened = step(inBedroom, { type: 'EXAMINE', target: 'wardrobe' }).state
    expect(opened.flags.wardrobeOpen).toBe(true)
    const { state } = step(opened, { type: 'EXAMINE', target: 'kimono' })
    expect(state.flags.kimonoSeen).toBe(true)
    expect(state.documents).toContain('kimonoNote')
  })
  it('箪笥が閉まっていると着物は調べられない', () => {
    const { state } = step(inBedroom, { type: 'EXAMINE', target: 'kimono' })
    expect(state.flags.kimonoSeen).toBe(false)
  })
})

describe('B-3 宝石箱', () => {
  const setDials = (values: readonly [number, number, number]): readonly Action[] => [
    { type: 'SET_JEWELRY_DIAL', index: 0, value: values[0] },
    { type: 'SET_JEWELRY_DIAL', index: 1, value: values[1] },
    { type: 'SET_JEWELRY_DIAL', index: 2, value: values[2] },
  ]
  it('正解(桜5・梅3・菊7)でねじ巻きと写真(右)を得る', () => {
    const state = play([...setDials(JEWELRY_ANSWER), { type: 'OPEN_JEWELRY' }], inBedroom)
    expect(state.flags.jewelrySolved).toBe(true)
    expect(state.inventory).toContain('windingKey')
    expect(state.inventory).toContain('photoRight')
  })
  it('不正解では開かず、何度でも回し直せる', () => {
    const wrong = play([...setDials([1, 2, 3]), { type: 'OPEN_JEWELRY' }], inBedroom)
    expect(wrong.flags.jewelrySolved).toBe(false)
    const retry = play([...setDials(JEWELRY_ANSWER), { type: 'OPEN_JEWELRY' }], wrong)
    expect(retry.flags.jewelrySolved).toBe(true)
  })
  it('ダイヤル値は 0..9 に正規化される', () => {
    const state = play([{ type: 'SET_JEWELRY_DIAL', index: 0, value: 15 }], inBedroom)
    expect(state.jewelryDials[0]).toBe(5)
    const neg = play([{ type: 'SET_JEWELRY_DIAL', index: 1, value: -3 }], inBedroom)
    expect(neg.jewelryDials[1]).toBe(7)
  })
  it('解決後はダイヤルが固定される', () => {
    const solved = play([...setDials(JEWELRY_ANSWER), { type: 'OPEN_JEWELRY' }], inBedroom)
    const { state } = step(solved, { type: 'SET_JEWELRY_DIAL', index: 0, value: 9 })
    expect(state.jewelryDials).toEqual(JEWELRY_ANSWER)
  })
})

describe('B-4 日記', () => {
  it('サイドテーブルで日記が記録される', () => {
    const { state } = step(inBedroom, { type: 'EXAMINE', target: 'sideTable' })
    expect(state.flags.diaryRead).toBe(true)
    expect(state.documents).toContain('diary')
  })
})
