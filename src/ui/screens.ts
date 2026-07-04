import { TITLE_FOR_HINTS } from '../core/constants'
import type { GameState } from '../core/state'
import { PROLOGUE_PAGES, endingPages } from '../core/texts'
import { button, clear, el, show } from './dom'

/** フェード層(部屋移動・脱出演出) */
export interface Fade {
  root: HTMLElement
  black(duration?: number): Promise<void>
  clearFade(): void
  whiteSlow(): Promise<void>
}

export const createFade = (): Fade => {
  const root = el('div', 'fade-layer')
  const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
  return {
    root,
    async black() {
      root.classList.remove('white', 'slow')
      root.classList.add('active')
      await wait(480)
    },
    clearFade() {
      root.classList.remove('active')
    },
    async whiteSlow() {
      root.classList.add('white', 'slow')
      root.classList.add('active')
      await wait(1800)
    },
  }
}

/** タイトル画面 */
export interface TitleScreen {
  root: HTMLElement
  show(hasSave: boolean): void
  hide(): void
}

export const createTitleScreen = (handlers: {
  onNewGame(): void
  onContinue(): void
  onSettings(): void
}): TitleScreen => {
  const root = el('div', 'screen title-screen hidden')
  const inner = el('div', 'title-inner')
  const menu = el('div', 'title-menu')
  const continueBtn = button('menu-btn', 'つづきから', handlers.onContinue)
  menu.appendChild(button('menu-btn', 'はじめる', handlers.onNewGame))
  menu.appendChild(continueBtn)
  menu.appendChild(button('menu-btn', '設定', handlers.onSettings))
  const titleText = el('div', 'title-text')
  const titleH1 = el('h1')
  const titleLine1 = el('span', 'title-line')
  titleLine1.textContent = '久遠寺邸の'
  const titleLine2 = el('span', 'title-line')
  titleLine2.textContent = '一夜'
  titleH1.append(titleLine1, document.createElement('wbr'), titleLine2)
  titleText.appendChild(titleH1)
  titleText.appendChild(el('div', 'subtitle', '大正浪漫脱出奇譚'))
  inner.appendChild(menu)
  inner.appendChild(titleText)
  root.appendChild(inner)
  root.appendChild(el('div', 'title-note', '音が鳴ります — 音量にご注意ください'))
  return {
    root,
    show(hasSave) {
      continueBtn.disabled = !hasSave
      show(root, true)
    },
    hide() {
      show(root, false)
    },
  }
}

/** プロローグ / エピローグ(紙芝居) */
export interface StoryScreen {
  root: HTMLElement
  play(pages: readonly string[], options: { dawn: boolean; withPetals?: boolean }, onDone: () => void): void
  hide(): void
}

export const createStoryScreen = (): StoryScreen => {
  const root = el('div', 'screen story-screen hidden')
  const text = el('div', 'story-text')
  const guide = el('div', 'story-guide', '画面をクリックして進む')
  const skip = el('button', 'skip-btn', 'とばす ≫')
  skip.type = 'button'
  const petals = el('canvas') as HTMLCanvasElement
  petals.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;'
  root.appendChild(petals)
  root.appendChild(text)
  root.appendChild(guide)
  root.appendChild(skip)

  let pages: readonly string[] = []
  let index = 0
  let onDoneCb: (() => void) | null = null
  let petalTimer: number | null = null
  let renderTimer: number | null = null

  const clearRenderTimer = () => {
    if (renderTimer !== null) clearTimeout(renderTimer)
    renderTimer = null
  }

  const finish = () => {
    clearRenderTimer()
    const cb = onDoneCb
    onDoneCb = null
    show(root, false)
    if (petalTimer !== null) cancelAnimationFrame(petalTimer)
    petalTimer = null
    cb?.()
  }

  const render = () => {
    const page = pages[index]
    if (page === undefined) {
      finish()
      return
    }
    clearRenderTimer()
    text.classList.add('dim')
    // .story-text の transition: opacity 0.7s と揃える(完全にフェードアウトしてから差し替える)
    renderTimer = window.setTimeout(() => {
      renderTimer = null
      text.textContent = page
      text.classList.remove('dim')
    }, 700)
  }

  root.addEventListener('click', () => {
    if (onDoneCb === null) return
    index++
    render()
  })
  skip.addEventListener('click', (e) => {
    e.stopPropagation()
    finish()
  })

  const startPetals = () => {
    const ctx = petals.getContext('2d')
    if (!ctx) return
    petals.width = window.innerWidth
    petals.height = window.innerHeight
    const items = Array.from({ length: 26 }, () => ({
      x: Math.random() * petals.width,
      y: Math.random() * petals.height,
      speed: 22 + Math.random() * 34,
      sway: Math.random() * Math.PI * 2,
      size: 4 + Math.random() * 5,
    }))
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ctx.clearRect(0, 0, petals.width, petals.height)
      for (const petal of items) {
        petal.y += petal.speed * dt
        petal.sway += dt * 1.6
        petal.x += Math.sin(petal.sway) * 24 * dt
        if (petal.y > petals.height + 10) {
          petal.y = -10
          petal.x = Math.random() * petals.width
        }
        ctx.save()
        ctx.translate(petal.x, petal.y)
        ctx.rotate(petal.sway)
        ctx.fillStyle = 'rgba(244, 206, 216, 0.82)'
        ctx.beginPath()
        ctx.ellipse(0, 0, petal.size, petal.size * 0.62, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      petalTimer = requestAnimationFrame(tick)
    }
    petalTimer = requestAnimationFrame(tick)
  }

  return {
    root,
    play(nextPages, options, onDone) {
      pages = nextPages
      index = 0
      onDoneCb = onDone
      root.classList.toggle('dawn', options.dawn)
      text.textContent = ''
      show(root, true)
      if (options.withPetals) startPetals()
      render()
    },
    hide() {
      show(root, false)
    },
  }
}

/** リザルト画面 */
export interface ResultScreen {
  root: HTMLElement
  show(state: GameState): void
  hide(): void
}

export const createResultScreen = (handlers: {
  onReplay(): void
  onTitle(): void
}): ResultScreen => {
  const root = el('div', 'screen story-screen dawn hidden')
  return {
    root,
    show(state) {
      clear(root)
      const panel = el('div', 'result-panel')
      panel.appendChild(el('div', 'caption', '— 脱出成功 —'))
      panel.appendChild(el('h2', '', TITLE_FOR_HINTS(state.hintsUsed)))
      const elapsedMs = (state.escapedAt ?? state.startedAt) - state.startedAt
      const minutes = Math.floor(elapsedMs / 60000)
      const seconds = Math.floor((elapsedMs % 60000) / 1000)
      const stats = el('div', 'result-stats')
      stats.appendChild(
        document.createTextNode(`脱出までの時間 …… ${minutes}分${String(seconds).padStart(2, '0')}秒`),
      )
      stats.appendChild(el('br'))
      stats.appendChild(document.createTextNode(`ヒント …… ${state.hintsUsed}回`))
      panel.appendChild(stats)
      const actions = el('div', 'result-actions')
      actions.appendChild(button('menu-btn', 'もう一度遊ぶ', handlers.onReplay))
      actions.appendChild(button('menu-btn', 'タイトルへ', handlers.onTitle))
      panel.appendChild(actions)
      root.appendChild(panel)
      show(root, true)
    },
    hide() {
      show(root, false)
    },
  }
}

/** WebGL2 非対応の案内 */
export const showWebglFallback = (container: HTMLElement): void => {
  const overlay = el('div', 'webgl-fallback')
  const panel = el('div', 'modal')
  panel.style.padding = '34px'
  panel.appendChild(el('h2', '', '申し訳ありません'))
  const text = el('div', 'confirm-text')
  text.textContent =
    'このブラウザでは 3D 表示(WebGL2)が利用できないため、ゲームを開始できません。最新の Chrome / Edge / Safari / Firefox でお試しください。'
  panel.appendChild(text)
  overlay.appendChild(panel)
  container.appendChild(overlay)
}

export { PROLOGUE_PAGES, endingPages }
