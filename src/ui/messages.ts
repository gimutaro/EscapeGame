import { MELODY, NOTE_LABELS } from '../core/constants'
import type { ItemId } from '../core/types'
import { ITEMS } from '../core/texts'
import { el } from './dom'

const CHAR_MS = 34

/** メッセージウィンドウ(タイプライタ表示)
 *  自動では消えない。同じ内容がもう一度来たら閉じる(=同じ場所の再クリックで消える)。
 *  違う内容が来たら置き換え、ウィンドウ自体のクリックでも閉じられる。 */
export interface Messages {
  root: HTMLElement
  push(text: string): void
  clear(): void
  /** 画面のどこをクリックしても呼ぶ: 表示途中なら全文表示、表示済みなら閉じる */
  dismiss(): void
}

export const createMessages = (): Messages => {
  const root = el('div', 'message hidden')
  let typing: ReturnType<typeof setInterval> | null = null
  let current = ''
  let shown = 0

  const stopTyping = () => {
    if (typing) clearInterval(typing)
    typing = null
  }

  const hide = () => {
    stopTyping()
    current = ''
    root.classList.add('hidden')
  }

  const show = (text: string) => {
    stopTyping()
    current = text
    shown = 0
    root.textContent = ''
    root.classList.remove('hidden')
    typing = setInterval(() => {
      shown++
      root.textContent = current.slice(0, shown)
      if (shown >= current.length) stopTyping()
    }, CHAR_MS)
  }

  const dismiss = () => {
    if (root.classList.contains('hidden')) return
    if (typing) {
      // 表示途中なら全文表示
      stopTyping()
      root.textContent = current
    } else {
      hide()
    }
  }

  root.addEventListener('click', dismiss)

  return {
    root,
    dismiss,
    push(text) {
      const visible = !root.classList.contains('hidden')
      if (visible && text === current) {
        if (typing) {
          // 表示途中の再クリックは全文表示
          stopTyping()
          root.textContent = current
        } else {
          // 表示済みの同じ内容をもう一度 → 閉じる
          hide()
        }
        return
      }
      show(text)
    },
    clear() {
      hide()
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
