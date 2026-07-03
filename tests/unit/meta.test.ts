import { describe, expect, it } from 'vitest'
import { reduce } from '../../src/core/reducer'
import { createInitialState } from '../../src/core/state'
import { TITLE_FOR_HINTS } from '../../src/core/constants'
import { play, step } from '../helpers'

const start = play([{ type: 'NEW_GAME' }, { type: 'PROLOGUE_DONE' }])

describe('フェーズ遷移', () => {
  it('NEW_GAME → prologue → PROLOGUE_DONE → playing(開始時刻を記録)', () => {
    const s0 = createInitialState()
    expect(s0.phase).toBe('title')
    const s1 = reduce(s0, { type: 'NEW_GAME' }, 100).state
    expect(s1.phase).toBe('prologue')
    const s2 = reduce(s1, { type: 'PROLOGUE_DONE' }, 5_000).state
    expect(s2.phase).toBe('playing')
    expect(s2.startedAt).toBe(5_000)
  })
  it('playing 中の PROLOGUE_DONE は無効', () => {
    const { state } = step(start, { type: 'PROLOGUE_DONE' })
    expect(state).toEqual(start)
  })
  it('RESTART でタイトルへ戻り初期化される', () => {
    const mid = play([{ type: 'EXAMINE', target: 'sofa' }], start)
    const { state } = step(mid, { type: 'RESTART' })
    expect(state.phase).toBe('title')
    expect(state.inventory).toHaveLength(0)
  })
  it('LOAD で状態が置き換わる', () => {
    const mid = play([{ type: 'EXAMINE', target: 'sofa' }], start)
    const { state } = step(createInitialState(), { type: 'LOAD', state: mid })
    expect(state).toEqual(mid)
  })
})

describe('アイテム選択', () => {
  it('持っているアイテムだけ選択できる', () => {
    const withKey = play([{ type: 'EXAMINE', target: 'sofa' }], start)
    const sel = step(withKey, { type: 'SELECT_ITEM', item: 'brassKey' }).state
    expect(sel.selectedItem).toBe('brassKey')
    const none = step(start, { type: 'SELECT_ITEM', item: 'brassKey' }).state
    expect(none.selectedItem).toBeNull()
  })
  it('null で選択解除できる', () => {
    const withKey = play(
      [
        { type: 'EXAMINE', target: 'sofa' },
        { type: 'SELECT_ITEM', item: 'brassKey' },
      ],
      start,
    )
    const { state } = step(withKey, { type: 'SELECT_ITEM', item: null })
    expect(state.selectedItem).toBeNull()
  })
  it('使用成功でアイテムが消えると選択も解除される', () => {
    const prepared = play(
      [
        { type: 'EXAMINE', target: 'sofa' },
        { type: 'SELECT_ITEM', item: 'brassKey' },
      ],
      start,
    )
    const { state } = step(prepared, { type: 'USE_ITEM', item: 'brassKey', target: 'cabinet' })
    expect(state.selectedItem).toBeNull()
  })
})

describe('ヒント使用回数', () => {
  it('同じヒントは一度だけ数える', () => {
    let s = start
    s = reduce(s, { type: 'HINT_VIEW', puzzle: 'L1', stage: 0 }, 0).state
    s = reduce(s, { type: 'HINT_VIEW', puzzle: 'L1', stage: 0 }, 0).state
    expect(s.hintsUsed).toBe(1)
    s = reduce(s, { type: 'HINT_VIEW', puzzle: 'L1', stage: 1 }, 0).state
    expect(s.hintsUsed).toBe(2)
  })
  it('称号はヒント使用回数で決まる', () => {
    expect(TITLE_FOR_HINTS(0)).toBe('大正の名探偵')
    expect(TITLE_FOR_HINTS(1)).toBe('見事な推理')
    expect(TITLE_FOR_HINTS(3)).toBe('見事な推理')
    expect(TITLE_FOR_HINTS(4)).toBe('無事のご帰還')
  })
})

describe('移動', () => {
  it('施錠中の部屋へは移動できない', () => {
    const { state } = step(start, { type: 'MOVE_TO_ROOM', room: 'bedroom' })
    expect(state.currentRoom).toBe('living')
  })
  it('寝室と書斎は隣接していない(リビング経由)', () => {
    const inBedroom = {
      ...start,
      currentRoom: 'bedroom' as const,
      flags: { ...start.flags, bedroomUnlocked: true, studyUnlocked: true },
    }
    const { state } = step(inBedroom, { type: 'MOVE_TO_ROOM', room: 'study' })
    expect(state.currentRoom).toBe('bedroom')
  })
})
