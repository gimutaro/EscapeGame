import type { GameState } from '../core/state'
import { SaveFileSchema } from './schema'

export const SAVE_KEY = 'kuonji.save.v1'

/** localStorage 互換の注入可能な保存先(テスト容易性のため) */
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** 保存。失敗(容量超過等)してもゲームは続行できるため握りつぶさず警告する。 */
export const saveGame = (storage: KeyValueStorage, state: GameState, now: number): boolean => {
  try {
    const file = { version: 1 as const, savedAt: now, state }
    storage.setItem(SAVE_KEY, JSON.stringify(file))
    return true
  } catch (error) {
    console.warn('セーブに失敗しました:', error)
    return false
  }
}

/**
 * 読み込み。壊れたデータは zod で検出し null を返す(呼び出し側が初期化を案内する)。
 * docs/03 詰み防止規則 R-8 準拠。
 */
export const loadGame = (storage: KeyValueStorage): GameState | null => {
  try {
    const raw = storage.getItem(SAVE_KEY)
    if (raw === null) return null
    const parsed = SaveFileSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      console.warn('セーブデータの検証に失敗しました。初期化します。')
      storage.removeItem(SAVE_KEY)
      return null
    }
    return parsed.data.state
  } catch (error) {
    console.warn('セーブデータの読み込みに失敗しました:', error)
    try {
      storage.removeItem(SAVE_KEY)
    } catch {
      /* 破損データの除去に失敗しても続行できる */
    }
    return null
  }
}

export const clearSave = (storage: KeyValueStorage): void => {
  try {
    storage.removeItem(SAVE_KEY)
  } catch (error) {
    console.warn('セーブデータの削除に失敗しました:', error)
  }
}

/** 状態変化のたびに呼ばれる保存のデバウンス(500ms)。cancel で予約を破棄できる */
export interface DebouncedSaver {
  (state: GameState): void
  cancel(): void
}

export const createDebouncedSaver = (storage: KeyValueStorage, delayMs = 500): DebouncedSaver => {
  let timer: ReturnType<typeof setTimeout> | null = null
  const saver = ((state: GameState) => {
    // タイトルは保存不要、リザルトは完走済み(clearSave と競合させない)
    if (state.phase === 'title' || state.phase === 'result') return
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      saveGame(storage, state, Date.now())
    }, delayMs)
  }) as DebouncedSaver
  saver.cancel = () => {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }
  return saver
}
