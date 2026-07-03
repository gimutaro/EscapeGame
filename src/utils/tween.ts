/** 依存なしの小さなトゥイーン管理(演出用) */

export type Ease = (t: number) => number

export const easeInOutCubic: Ease = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export const easeOutCubic: Ease = (t) => 1 - Math.pow(1 - t, 3)

interface ActiveTween {
  elapsed: number
  duration: number
  ease: Ease
  onUpdate: (t: number) => void
  onDone?: () => void
}

export interface Tweens {
  add(
    duration: number,
    onUpdate: (t: number) => void,
    onDone?: () => void,
    ease?: Ease,
  ): void
  update(dt: number): void
}

export const createTweens = (): Tweens => {
  const active: ActiveTween[] = []
  return {
    add(duration, onUpdate, onDone, ease = easeInOutCubic) {
      active.push({ elapsed: 0, duration, ease, onUpdate, onDone })
      onUpdate(0)
    },
    update(dt) {
      for (let i = active.length - 1; i >= 0; i--) {
        const tw = active[i]
        if (!tw) continue
        tw.elapsed += dt
        const raw = Math.min(1, tw.elapsed / tw.duration)
        tw.onUpdate(tw.ease(raw))
        if (raw >= 1) {
          active.splice(i, 1)
          tw.onDone?.()
        }
      }
    },
  }
}

/** 遅延実行(トゥイーン管理に相乗り) */
export const delay = (tweens: Tweens, seconds: number, fn: () => void): void => {
  tweens.add(seconds, () => {}, fn, (t) => t)
}
