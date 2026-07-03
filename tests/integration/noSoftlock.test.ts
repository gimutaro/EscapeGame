import { describe, expect, it } from 'vitest'
import type { Action } from '../../src/core/actions'
import { reduce } from '../../src/core/reducer'
import { createInitialState } from '../../src/core/state'
import { SOLUTION_STEPS } from '../../src/core/solution'
import type { GameState } from '../../src/core/state'
import { ITEM_IDS } from '../../src/core/types'
import type { HotspotId } from '../../src/core/types'
import { solveNext } from '../solver'

/** 再現可能な擬似乱数(依存を増やさない簡易 LCG) */
const lcg = (seed: number) => {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

const TARGETS: readonly HotspotId[] = [
  'sofa',
  'lowTable',
  'cabinet',
  'musicBox',
  'fireplace',
  'painting',
  'clock',
  'piano',
  'gramophone',
  'entranceDoor',
  'doorStudy',
  'doorBedroom',
  'bed',
  'vanity',
  'byobu',
  'wardrobe',
  'kimono',
  'jewelryBox',
  'sideTable',
  'desk',
  'globe',
  'bookshelf',
  'portrait',
  'safe',
  'lightSwitch',
  'armchair',
]

const NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] as const

/** 進行を乱しうる「嫌がらせ」アクションを乱数生成する(全ギミックを荒らす) */
const randomNoise = (rand: () => number, state: GameState): Action => {
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)] as T
  const roll = rand()
  if (roll < 0.3 && state.inventory.length > 0) {
    return { type: 'USE_ITEM', item: pick(state.inventory), target: pick(TARGETS) }
  }
  if (roll < 0.45) return { type: 'EXAMINE', target: pick(TARGETS) }
  if (roll < 0.53) {
    return { type: 'SET_JEWELRY_DIAL', index: pick([0, 1, 2] as const), value: Math.floor(rand() * 10) }
  }
  if (roll < 0.61) {
    return { type: 'SET_SAFE_DIAL', index: pick([0, 1, 2] as const), value: Math.floor(rand() * 10) }
  }
  if (roll < 0.7) return { type: 'PIANO_PRESS', note: pick(NOTES) }
  if (roll < 0.78) return { type: 'SWAP_BOOKS', a: Math.floor(rand() * 4), b: Math.floor(rand() * 4) }
  if (roll < 0.84) return { type: 'ROTATE_GLOBE', yaw: rand() * 360 }
  if (roll < 0.9) {
    return { type: 'SET_CLOCK', hour: 1 + Math.floor(rand() * 12), minute: 5 * Math.floor(rand() * 12) }
  }
  if (roll < 0.94) return { type: 'MOVE_TO_ROOM', room: pick(['living', 'bedroom', 'study'] as const) }
  if (roll < 0.97) return { type: 'SELECT_ITEM', item: state.inventory.length > 0 ? pick(state.inventory) : null }
  return { type: 'TOGGLE_STUDY_LIGHT' }
}

/** ソルバーで最後まで解く(有限手で完了しなければ失敗) */
const solveToEnd = (from: GameState, label: string): GameState => {
  let state = from
  for (let i = 0; i < 400; i++) {
    const action = solveNext(state)
    if (action === null) return state
    state = reduce(state, action, 1_000).state
  }
  throw new Error(`${label}: ソルバーが400手で完了しなかった(詰みの疑い)`)
}

/**
 * 詰み防止プロパティテスト(AC-03 / docs/03 §9)。
 * どんな順序・どんな誤操作で状態を荒らしても、
 * 自動ソルバーが必ず有限手で脱出に到達することを検証する。
 */
describe('詰み防止(ソフトロック不可能性)', () => {
  it('大量の乱雑な操作の後でも、必ず脱出できる(乱数20シード)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rand = lcg(seed * 7919)
      let state = createInitialState()
      state = reduce(state, { type: 'NEW_GAME' }, 0).state
      state = reduce(state, { type: 'PROLOGUE_DONE' }, 0).state
      // 正規手順とノイズをでたらめに混ぜ、ゲームを中途半端に荒らす
      const depth = Math.floor(rand() * SOLUTION_STEPS.length)
      let progressed = 0
      while (progressed < depth) {
        if (rand() < 0.5) {
          const next = solveNext(state)
          if (next === null) break
          state = reduce(state, next, 1_000).state
          progressed++
        } else {
          state = reduce(state, randomNoise(rand, state), 1_000).state
        }
      }
      // どんな中間状態からでもソルバーで完了できる
      const finished = solveToEnd(state, `seed=${seed}`)
      expect(finished.phase, `seed=${seed} で脱出失敗`).toBe('result')
      expect(finished.flags.entranceUnlocked).toBe(true)
    }
  })

  it('R-3: アイテムを誤った対象に使っても消えない', () => {
    let state = createInitialState()
    state = reduce(state, { type: 'NEW_GAME' }, 0).state
    state = reduce(state, { type: 'PROLOGUE_DONE' }, 0).state
    state = reduce(state, { type: 'EXAMINE', target: 'sofa' }, 0).state
    expect(state.inventory).toContain('brassKey')
    for (const target of TARGETS.filter((t) => t !== 'cabinet')) {
      state = reduce(state, { type: 'USE_ITEM', item: 'brassKey', target }, 0).state
      expect(state.inventory, `${target} への誤使用で鍵が消えた`).toContain('brassKey')
    }
    state = reduce(state, { type: 'USE_ITEM', item: 'brassKey', target: 'cabinet' }, 0).state
    expect(state.inventory).not.toContain('brassKey')
    expect(state.flags.cabinetUnlocked).toBe(true)
  })

  it('R-1: 進行フラグはどんな操作でも後退しない(正規手順+ノイズ)', () => {
    const rand = lcg(42)
    let state = createInitialState()
    for (const action of SOLUTION_STEPS) {
      // ノイズ → 正規手順の順に適用し、毎回フラグの単調性を確認
      const noisy = reduce(state, randomNoise(rand, state), 1_000).state
      for (const [flag, value] of Object.entries(state.flags)) {
        if (value) expect(noisy.flags[flag as keyof typeof noisy.flags]).toBe(true)
      }
      const prev = noisy
      state = reduce(noisy, action, 1_000).state
      for (const [flag, value] of Object.entries(prev.flags)) {
        if (value) {
          expect(
            state.flags[flag as keyof typeof state.flags],
            `${flag} が後退した(action=${action.type})`,
          ).toBe(true)
        }
      }
    }
  })

  it('R-5: ダイヤル・針・本は解決前なら何度でも動かせる', () => {
    let state = createInitialState()
    state = reduce(state, { type: 'NEW_GAME' }, 0).state
    state = reduce(state, { type: 'PROLOGUE_DONE' }, 0).state
    state = reduce(state, { type: 'SET_CLOCK', hour: 7, minute: 30 }, 0).state
    expect(state.clock).toEqual({ hour: 7, minute: 30 })
    state = reduce(state, { type: 'SET_CLOCK', hour: 12, minute: 0 }, 0).state
    expect(state.clock).toEqual({ hour: 12, minute: 0 })
    const order0 = state.bookOrder
    state = reduce(state, { type: 'SWAP_BOOKS', a: 0, b: 2 }, 0).state
    state = reduce(state, { type: 'SWAP_BOOKS', a: 0, b: 2 }, 0).state
    expect(state.bookOrder).toEqual(order0)
  })

  it('インベントリは設計上の上限(8)を超えない', () => {
    let state = createInitialState()
    let maxCount = 0
    for (const action of SOLUTION_STEPS) {
      state = reduce(state, action, 1_000).state
      maxCount = Math.max(maxCount, state.inventory.length)
      for (const item of state.inventory) {
        expect(ITEM_IDS).toContain(item)
      }
    }
    expect(maxCount).toBeLessThanOrEqual(8)
  })
})
