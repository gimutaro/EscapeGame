import type { Store } from '../core/store'
import type { GameState } from '../core/state'
import type { ItemId } from '../core/types'
import { ITEMS } from '../core/texts'
import { button, clear, el, show } from './dom'

/** 画面上部ボタン・インベントリ・注視ビューの「もどる」・柱時計の操作盤 */
export interface Hud {
  root: HTMLElement
  sync(state: GameState): void
  setIcons(icons: Record<ItemId, string>): void
  setInFocusView(view: string | null): void
  onZoomItem: ((item: ItemId) => void) | null
}

export const createHud = (
  store: Store,
  handlers: {
    onDocuments(): void
    onHints(): void
    onSettings(): void
    onBack(): void
  },
): Hud => {
  const root = el('div')
  let icons: Partial<Record<ItemId, string>> = {}
  let currentView: string | null = null

  // 右上ボタン
  const top = el('div', 'hud-top')
  top.appendChild(button('hud-btn', 'おぼえがき', handlers.onDocuments))
  top.appendChild(button('hud-btn', '？ ヒント', handlers.onHints))
  top.appendChild(button('hud-btn', '設 定', handlers.onSettings))
  root.appendChild(top)

  // もどる
  const back = button('back-btn hidden', 'も ど る', handlers.onBack)
  root.appendChild(back)

  // インベントリ
  const inventory = el('div', 'inventory')
  root.appendChild(inventory)

  // 柱時計の操作盤(fv-clock でのみ表示)
  const clockControls = el('div', 'clock-controls hidden')
  const addDialButton = (label: string, apply: (state: GameState) => { hour: number; minute: number }) => {
    clockControls.appendChild(
      button('dial-btn', label, () => {
        const state = store.getState()
        const next = apply(state)
        store.dispatch({ type: 'SET_CLOCK', hour: next.hour, minute: next.minute })
      }),
    )
  }
  clockControls.appendChild(el('span', 'label', '時針'))
  addDialButton('−', (s) => ({ hour: s.clock.hour - 1, minute: s.clock.minute }))
  addDialButton('＋', (s) => ({ hour: s.clock.hour + 1, minute: s.clock.minute }))
  clockControls.appendChild(el('span', 'label', '分針'))
  addDialButton('−', (s) => ({ hour: s.clock.hour, minute: s.clock.minute - 5 }))
  addDialButton('＋', (s) => ({ hour: s.clock.hour, minute: s.clock.minute + 5 }))
  root.appendChild(clockControls)

  // 地球儀ビューの操作説明
  const viewHint = el('div', 'view-hint-text hidden')
  root.appendChild(viewHint)

  const hud: Hud = {
    root,
    onZoomItem: null,
    setIcons(map) {
      icons = map
      hud.sync(store.getState())
    },
    sync(state) {
      // インベントリ描画
      clear(inventory)
      const slots = 8
      for (let i = 0; i < slots; i++) {
        const item = state.inventory[i]
        const slot = el('button', 'slot') as HTMLButtonElement
        slot.type = 'button'
        if (item) {
          slot.classList.add('filled')
          if (state.selectedItem === item) slot.classList.add('selected')
          const icon = icons[item]
          if (icon) {
            const img = el('img')
            img.src = icon
            img.alt = ITEMS[item].name
            slot.appendChild(img)
          }
          slot.appendChild(el('span', 'slot-name', ITEMS[item].name))
          const zoom = el('span', 'zoom', '⊕')
          zoom.addEventListener('click', (e) => {
            e.stopPropagation()
            hud.onZoomItem?.(item)
          })
          slot.appendChild(zoom)
          slot.addEventListener('click', () => {
            const selected = store.getState().selectedItem
            store.dispatch({ type: 'SELECT_ITEM', item: selected === item ? null : item })
          })
        }
        inventory.appendChild(slot)
      }
      const playing = state.phase === 'playing'
      show(inventory, playing)
      show(top, playing)
      show(back, playing && currentView !== null)
      show(clockControls, playing && currentView === 'fv-clock' && !state.flags.clockSolved)
      const hintText =
        currentView === 'fv-globe' && !state.flags.globeSolved
          ? '地球儀はドラッグで回せる ・ 留め金をクリック'
          : null
      viewHint.textContent = hintText ?? ''
      show(viewHint, playing && hintText !== null)
    },
    setInFocusView(view) {
      currentView = view
      hud.sync(store.getState())
    },
  }
  return hud
}
