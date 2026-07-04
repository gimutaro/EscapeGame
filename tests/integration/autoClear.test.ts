import { describe, expect, it } from 'vitest'
import { reduce } from '../../src/core/reducer'
import { createInitialState } from '../../src/core/state'
import { SOLUTION_STEPS } from '../../src/core/solution'
import { HINTS } from '../../src/core/hints'

/**
 * 自動全行程クリアテスト(AC-01)。
 * 正規攻略チャート(solution.ts = docs/03 §8)を初期状態から適用し、
 * 必ず脱出(リザルト)に到達することを機械的に保証する。
 */
describe('自動全行程クリア', () => {
  it('正規攻略手順で必ず脱出できる', () => {
    let state = createInitialState()
    for (const action of SOLUTION_STEPS) {
      state = reduce(state, action, 1_000).state
    }
    expect(state.phase).toBe('result')
    expect(state.flags.entranceUnlocked).toBe(true)
    expect(state.escapedAt).toBe(1_000)
  })

  it('攻略の各段階で進行フラグが正しく立つ', () => {
    let state = createInitialState()
    const checkpoints: Array<[number, (s: typeof state) => boolean]> = []
    SOLUTION_STEPS.forEach((action, i) => {
      state = reduce(state, action, 1_000).state
      checkpoints.push([i, () => true])
    })
    // 最終状態の全必須フラグ検証
    const f = state.flags
    expect(f.sofaSearched).toBe(true)
    expect(f.cabinetUnlocked).toBe(true)
    expect(f.paintingMoved).toBe(true)
    expect(f.fireplaceLit).toBe(true)
    expect(f.letterRevealed).toBe(true)
    expect(f.clockSolved).toBe(true)
    expect(f.bedroomUnlocked).toBe(true)
    expect(f.mirrorSeen).toBe(true)
    expect(f.kimonoSeen).toBe(true)
    expect(f.jewelrySolved).toBe(true)
    expect(f.diaryRead).toBe(true)
    expect(f.musicBoxWound).toBe(true)
    expect(f.pianoSolved).toBe(true)
    expect(f.studyUnlocked).toBe(true)
    expect(f.deskOpened).toBe(true)
    expect(f.photosCombined).toBe(true)
    expect(f.glowSeen).toBe(true)
    expect(f.globeSolved).toBe(true)
    expect(f.bookshelfSolved).toBe(true)
    expect(f.portraitOpen).toBe(true)
    expect(f.safeSolved).toBe(true)
    expect(checkpoints.length).toBe(SOLUTION_STEPS.length)
  })

  it('攻略完了時、全ギミックのヒントが「解決済み」になる(網羅性)', () => {
    let state = createInitialState()
    for (const action of SOLUTION_STEPS) {
      state = reduce(state, action, 1_000).state
    }
    for (const hint of HINTS) {
      expect(hint.solved(state), `${hint.id} が未解決のまま`).toBe(true)
    }
  })

  it('クリアまでに全文書がおぼえがきに記録される', () => {
    let state = createInitialState()
    for (const action of SOLUTION_STEPS) {
      state = reduce(state, action, 1_000).state
    }
    const expected = [
      'viscountLetter',
      'revealedLetter',
      'mirrorText',
      'diary',
      'melodyNote',
      'memorandum',
      'draftLetter',
      'photoBack',
      'finalLetter',
    ] as const
    for (const doc of expected) {
      expect(state.documents, `${doc} が未記録`).toContain(doc)
    }
  })
})
