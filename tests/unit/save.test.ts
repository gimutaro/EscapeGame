import { describe, expect, it } from 'vitest'
import type { KeyValueStorage } from '../../src/save/storage'
import { SAVE_KEY, clearSave, loadGame, saveGame } from '../../src/save/storage'
import { playSolutionUntil } from '../helpers'
import { createInitialState } from '../../src/core/state'

const memoryStorage = (): KeyValueStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

describe('セーブ往復(R-8)', () => {
  it('保存 → 読込で状態が同値になる', () => {
    const storage = memoryStorage()
    const state = playSolutionUntil(20)
    expect(saveGame(storage, state, 123)).toBe(true)
    const loaded = loadGame(storage)
    expect(loaded).toEqual(state)
  })
  it('セーブがなければ null', () => {
    expect(loadGame(memoryStorage())).toBeNull()
  })
  it('壊れた JSON は検出して初期化(null)', () => {
    const storage = memoryStorage()
    storage.setItem(SAVE_KEY, '{壊れたデータ')
    expect(loadGame(storage)).toBeNull()
    expect(storage.getItem(SAVE_KEY)).toBeNull() // 破損データは除去される
  })
  it('スキーマ違反(改竄)を検出して null', () => {
    const storage = memoryStorage()
    const state = createInitialState()
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({ version: 1, savedAt: 0, state: { ...state, inventory: ['偽アイテム'] } }),
    )
    expect(loadGame(storage)).toBeNull()
  })
  it('ゲーム不変条件の破れ(詰みを持ち込む改竄)も検出する', () => {
    const state = createInitialState()
    const cases = [
      // 本が順列でない → 本棚が解けなくなる
      { ...state, bookOrder: ['akane', 'akane', 'akane', 'akane'] },
      // ダイヤルが範囲外
      { ...state, safeDials: [4, 5, 40] },
      // 所持品の重複
      { ...state, inventory: ['matchbox', 'matchbox'] },
    ]
    for (const broken of cases) {
      const storage = memoryStorage()
      storage.setItem(SAVE_KEY, JSON.stringify({ version: 1, savedAt: 0, state: broken }))
      expect(loadGame(storage), JSON.stringify(broken.bookOrder)).toBeNull()
    }
  })
  it('バージョン不一致は読み込まない', () => {
    const storage = memoryStorage()
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({ version: 2, savedAt: 0, state: createInitialState() }),
    )
    expect(loadGame(storage)).toBeNull()
  })
  it('clearSave で削除できる', () => {
    const storage = memoryStorage()
    saveGame(storage, createInitialState(), 0)
    clearSave(storage)
    expect(storage.getItem(SAVE_KEY)).toBeNull()
  })
  it('保存先が例外を投げてもクラッシュしない', () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('storage unavailable')
      },
      setItem: () => {
        throw new Error('quota exceeded')
      },
      removeItem: () => {
        throw new Error('storage unavailable')
      },
    }
    expect(saveGame(broken, createInitialState(), 0)).toBe(false)
    expect(loadGame(broken)).toBeNull()
    expect(() => clearSave(broken)).not.toThrow()
  })
})
