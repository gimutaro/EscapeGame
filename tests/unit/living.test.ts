import { describe, expect, it } from 'vitest'
import { hasEvent, messagesOf, play, step } from '../helpers'

const start = play([{ type: 'NEW_GAME' }, { type: 'PROLOGUE_DONE' }])

describe('L-1 ソファ', () => {
  it('初回調査で真鍮の小鍵を得る', () => {
    const { state, events } = step(start, { type: 'EXAMINE', target: 'sofa' })
    expect(state.inventory).toContain('brassKey')
    expect(state.flags.sofaSearched).toBe(true)
    expect(hasEvent(events, 'acquire')).toBe(true)
  })
  it('二度目以降はフレーバーのみで鍵は増えない', () => {
    const once = step(start, { type: 'EXAMINE', target: 'sofa' }).state
    const { state } = step(once, { type: 'EXAMINE', target: 'sofa' })
    expect(state.inventory.filter((i) => i === 'brassKey')).toHaveLength(1)
  })
})

describe('子爵の手紙', () => {
  it('ローテーブルを調べると手紙がおぼえがきに記録される', () => {
    const { state, events } = step(start, { type: 'EXAMINE', target: 'lowTable' })
    expect(state.documents).toContain('viscountLetter')
    expect(events.some((e) => e.kind === 'document' && e.doc === 'viscountLetter')).toBe(true)
  })
})

describe('L-2 飾り棚', () => {
  const withKey = play([{ type: 'EXAMINE', target: 'sofa' }], start)
  it('施錠中は開かない', () => {
    const { state } = step(start, { type: 'EXAMINE', target: 'cabinet' })
    expect(state.flags.cabinetUnlocked).toBe(false)
  })
  it('真鍮の小鍵で開き、マッチ箱を得て鍵は消費される', () => {
    const { state } = step(withKey, { type: 'USE_ITEM', item: 'brassKey', target: 'cabinet' })
    expect(state.flags.cabinetUnlocked).toBe(true)
    expect(state.inventory).toContain('matchbox')
    expect(state.inventory).not.toContain('brassKey')
  })
  it('別のアイテムでは開かず、アイテムも消えない', () => {
    const opened = play(
      [
        { type: 'USE_ITEM', item: 'brassKey', target: 'cabinet' },
        { type: 'EXAMINE', target: 'painting' },
      ],
      withKey,
    )
    const { state } = step(opened, { type: 'USE_ITEM', item: 'blankLetter', target: 'musicBox' })
    expect(state.inventory).toContain('blankLetter')
    expect(state.flags.musicBoxWound).toBe(false)
  })
})

describe('L-3 絵画 / L-4 あぶり出し', () => {
  const prepared = play(
    [
      { type: 'EXAMINE', target: 'sofa' },
      { type: 'USE_ITEM', item: 'brassKey', target: 'cabinet' },
      { type: 'EXAMINE', target: 'painting' },
    ],
    start,
  )
  it('絵画から白紙の便箋を得る(1回のみ)', () => {
    expect(prepared.inventory).toContain('blankLetter')
    const again = step(prepared, { type: 'EXAMINE', target: 'painting' }).state
    expect(again.inventory.filter((i) => i === 'blankLetter')).toHaveLength(1)
  })
  it('火のない暖炉では便箋は変化しない', () => {
    const { state } = step(prepared, { type: 'USE_ITEM', item: 'blankLetter', target: 'fireplace' })
    expect(state.flags.letterRevealed).toBe(false)
    expect(state.inventory).toContain('blankLetter')
  })
  it('マッチで点火 → 便箋で「あぶり出しの便箋」が記録される', () => {
    const lit = step(prepared, { type: 'USE_ITEM', item: 'matchbox', target: 'fireplace' }).state
    expect(lit.flags.fireplaceLit).toBe(true)
    expect(lit.inventory).toContain('matchbox') // マッチは残る
    const { state } = step(lit, { type: 'USE_ITEM', item: 'blankLetter', target: 'fireplace' })
    expect(state.flags.letterRevealed).toBe(true)
    expect(state.inventory).not.toContain('blankLetter')
    expect(state.documents).toContain('revealedLetter')
  })
  it('点火済みの暖炉にマッチを重ねても案内のみ', () => {
    const lit = step(prepared, { type: 'USE_ITEM', item: 'matchbox', target: 'fireplace' }).state
    const { state, events } = step(lit, { type: 'USE_ITEM', item: 'matchbox', target: 'fireplace' })
    expect(state).toEqual(lit)
    expect(messagesOf(events).join('')).toContain('もう火は点いている')
  })
})

describe('L-6 オルゴール', () => {
  it('ねじ巻きがないと鳴らない', () => {
    const opened = play(
      [
        { type: 'EXAMINE', target: 'sofa' },
        { type: 'USE_ITEM', item: 'brassKey', target: 'cabinet' },
      ],
      start,
    )
    const { state, events } = step(opened, { type: 'EXAMINE', target: 'musicBox' })
    expect(state.flags.musicBoxWound).toBe(false)
    expect(hasEvent(events, 'melody')).toBe(false)
  })
})
