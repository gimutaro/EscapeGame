import { describe, expect, it, vi } from 'vitest'
import { createStore } from '../../src/core/store'
import { createInitialState } from '../../src/core/state'
import { createDebouncedSaver, loadGame, type KeyValueStorage } from '../../src/save/storage'

const memoryStorage = (): KeyValueStorage => {
  const data = new Map<string, string>()
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

describe('store', () => {
  it('dispatch で状態が進み、購読者に state と events が届く', () => {
    const store = createStore(createInitialState(), () => 777)
    const seen: string[] = []
    const unsubscribe = store.subscribe((state, events, action) => {
      seen.push(`${action.type}:${state.phase}:${events.length}`)
    })
    store.dispatch({ type: 'NEW_GAME' })
    store.dispatch({ type: 'PROLOGUE_DONE' })
    expect(store.getState().phase).toBe('playing')
    expect(store.getState().startedAt).toBe(777)
    expect(seen).toHaveLength(2)
    unsubscribe()
    store.dispatch({ type: 'EXAMINE', target: 'sofa' })
    expect(seen).toHaveLength(2) // 解除後は呼ばれない
  })
})

describe('オートセーブ(デバウンス)', () => {
  it('連続する状態変化は1回にまとめて保存される', () => {
    vi.useFakeTimers()
    const storage = memoryStorage()
    const saver = createDebouncedSaver(storage, 500)
    const store = createStore(createInitialState(), () => 1)
    store.subscribe((state) => saver(state))
    store.dispatch({ type: 'NEW_GAME' })
    store.dispatch({ type: 'PROLOGUE_DONE' })
    store.dispatch({ type: 'EXAMINE', target: 'sofa' })
    expect(loadGame(storage)).toBeNull() // まだ保存されていない
    vi.advanceTimersByTime(600)
    const loaded = loadGame(storage)
    expect(loaded?.phase).toBe('playing')
    expect(loaded?.inventory).toContain('brassKey')
    vi.useRealTimers()
  })
  it('タイトル・リザルトの状態は保存しない', () => {
    vi.useFakeTimers()
    const storage = memoryStorage()
    const saver = createDebouncedSaver(storage, 500)
    saver(createInitialState())
    saver({ ...createInitialState(), phase: 'result' })
    vi.advanceTimersByTime(600)
    expect(loadGame(storage)).toBeNull()
    vi.useRealTimers()
  })
  it('cancel で予約済みの保存を破棄できる(完走時の clearSave と競合しない)', () => {
    vi.useFakeTimers()
    const storage = memoryStorage()
    const saver = createDebouncedSaver(storage, 500)
    const store = createStore(createInitialState(), () => 1)
    store.subscribe((state) => saver(state))
    store.dispatch({ type: 'NEW_GAME' })
    store.dispatch({ type: 'PROLOGUE_DONE' })
    saver.cancel()
    vi.advanceTimersByTime(600)
    expect(loadGame(storage)).toBeNull()
    vi.useRealTimers()
  })
})
