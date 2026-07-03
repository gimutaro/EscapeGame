import { describe, expect, it } from 'vitest'
import { HINTS, availableHints } from '../../src/core/hints'
import { PUZZLE_IDS } from '../../src/core/types'
import { reduce } from '../../src/core/reducer'
import { createInitialState } from '../../src/core/state'
import { SOLUTION_STEPS } from '../../src/core/solution'
import { play } from '../helpers'

describe('ヒント定義の網羅性(R-7)', () => {
  it('全ギミック ID にヒントが定義されている', () => {
    const ids = HINTS.map((h) => h.id)
    for (const id of PUZZLE_IDS) {
      expect(ids, `${id} のヒントがない`).toContain(id)
    }
  })
  it('全ヒントに空でない3段階の文言がある', () => {
    for (const hint of HINTS) {
      expect(hint.stages).toHaveLength(3)
      for (const stage of hint.stages) {
        expect(stage.length, `${hint.id} に空のヒント`).toBeGreaterThan(4)
      }
    }
  })
})

describe('ヒントの提示(挑戦可能かつ未解決のみ)', () => {
  it('開始直後は序盤のヒントだけが並ぶ', () => {
    const start = play([{ type: 'NEW_GAME' }, { type: 'PROLOGUE_DONE' }])
    const ids = availableHints(start).map((h) => h.id)
    expect(ids).toContain('L1')
    expect(ids).toContain('L3')
    expect(ids).not.toContain('B1') // 寝室未開放
    expect(ids).not.toContain('S7')
  })
  it('攻略が進むと解決済みのヒントは消える', () => {
    const mid = play([
      { type: 'NEW_GAME' },
      { type: 'PROLOGUE_DONE' },
      { type: 'EXAMINE', target: 'sofa' },
    ])
    const ids = availableHints(mid).map((h) => h.id)
    expect(ids).not.toContain('L1')
    expect(ids).toContain('L2')
  })
  it('攻略中のどの時点でも、未解決の必須ヒントが少なくとも1つ提示される', () => {
    let state = createInitialState()
    for (const action of SOLUTION_STEPS) {
      state = reduce(state, action, 1_000).state
      if (state.phase !== 'playing') continue
      if (state.flags.entranceUnlocked) continue
      const hints = availableHints(state)
      expect(hints.length, 'プレイ中にヒントが空になった').toBeGreaterThan(0)
    }
  })
})
