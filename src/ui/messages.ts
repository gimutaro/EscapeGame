import { MELODY, NOTE_LABELS } from '../core/constants'
import type { ItemId } from '../core/types'
import { ITEMS } from '../core/texts'
import { el } from './dom'
import type { Settings } from './settingsStore'

const CHAR_MS: Record<Settings['textSpeed'], number> = { slow: 64, normal: 34, fast: 10 }

/** メッセージウィンドウ(タイプライタ表示・クリックで送り) */
export interface Messages {
  root: HTMLElement
  push(text: string): void
  setSpeed(speed: Settings['textSpeed']): void
  clear(): void
}

export const createMessages = (): Messages => {
  const root = el('div', 'message hidden')
  const queue: string[] = []
  let typing: ReturnType<typeof setInterval> | null = null
  let hideTimer: ReturnType<typeof setTimeout> | null = null
  let current = ''
  let shown = 0
  let speed: Settings['textSpeed'] = 'normal'

  const stopTyping = () => {
    if (typing) clearInterval(typing)
    typing = null
  }

  const showNext = () => {
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = null
    const next = queue.shift()
    if (next === undefined) {
      root.classList.add('hidden')
      return
    }
    current = next
    shown = 0
    root.textContent = ''
    root.classList.remove('hidden')
    stopTyping()
    typing = setInterval(() => {
      shown++
      root.textContent = current.slice(0, shown)
      if (shown >= current.length) {
        stopTyping()
        hideTimer = setTimeout(showNext, 2800)
      }
    }, CHAR_MS[speed])
  }

  root.addEventListener('click', () => {
    if (typing) {
      // 表示中なら全文表示
      stopTyping()
      root.textContent = current
      hideTimer = setTimeout(showNext, 2200)
    } else {
      showNext()
    }
  })

  return {
    root,
    push(text) {
      queue.push(text)
      // 溜まりすぎた古い文は流す(連打時に何十秒も残らないように)
      while (queue.length > 3) queue.shift()
      if (root.classList.contains('hidden')) showNext()
    },
    setSpeed(value) {
      speed = value
    },
    clear() {
      queue.length = 0
      stopTyping()
      if (hideTimer) clearTimeout(hideTimer)
      root.classList.add('hidden')
    },
  }
}

/** アイテム取得トースト */
export interface Toasts {
  root: HTMLElement
  acquire(item: ItemId, icon: string | undefined): void
}

export const createToasts = (): Toasts => {
  const root = el('div', 'toasts')
  return {
    root,
    acquire(item, icon) {
      const toast = el('div', 'toast')
      if (icon) {
        const img = el('img')
        img.src = icon
        img.alt = ''
        toast.appendChild(img)
      }
      const label = el('span')
      const em = el('em', '', `「${ITEMS[item].name}」`)
      label.appendChild(em)
      label.appendChild(document.createTextNode('を手に入れた'))
      toast.appendChild(label)
      root.appendChild(toast)
      setTimeout(() => toast.classList.add('out'), 2100)
      setTimeout(() => toast.remove(), 2600)
    },
  }
}

/** オルゴール再生時の音名の浮遊表示(聴覚に頼らない保険) */
export const createMelodyNotes = (): { root: HTMLElement; play(): void } => {
  const root = el('div', 'melody-notes')
  return {
    root,
    play() {
      root.textContent = ''
      MELODY.forEach((note, i) => {
        const span = el('span', 'melody-note', NOTE_LABELS[note])
        span.style.animationDelay = `${0.2 + i * 0.72}s`
        root.appendChild(span)
      })
      setTimeout(() => {
        root.textContent = ''
      }, MELODY.length * 720 + 2200)
    },
  }
}
