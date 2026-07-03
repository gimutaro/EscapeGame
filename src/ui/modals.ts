import type { Store } from '../core/store'
import { availableHints } from '../core/hints'
import { DOCUMENTS } from '../core/texts'
import type { DocumentId } from '../core/types'
import { button, clear, el } from './dom'
import type { Settings, SettingsStore } from './settingsStore'

export interface Modals {
  root: HTMLElement
  openDocumentList(): void
  openDocument(doc: DocumentId): void
  openHints(): void
  openSettings(): void
  openCredits(): void
  confirm(text: string, onYes: () => void): void
  openCustom(title: string, build: (body: HTMLElement) => void, onClose?: () => void): void
  closeAll(): void
  isOpen(): boolean
}

export const createModals = (store: Store, settings: SettingsStore): Modals => {
  const root = el('div')
  let onCloseCurrent: (() => void) | null = null

  const closeAll = () => {
    clear(root)
    const cb = onCloseCurrent
    onCloseCurrent = null
    cb?.()
  }

  const open = (title: string, build: (body: HTMLElement) => void, onClose?: () => void) => {
    closeAll()
    onCloseCurrent = onClose ?? null
    const backdrop = el('div', 'modal-backdrop')
    const modal = el('div', 'modal')
    const head = el('div', 'modal-head')
    head.appendChild(el('h2', '', title))
    head.appendChild(button('modal-close', '閉じる', closeAll))
    const body = el('div', 'modal-body')
    build(body)
    modal.appendChild(head)
    modal.appendChild(body)
    backdrop.appendChild(modal)
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeAll()
    })
    root.appendChild(backdrop)
  }

  const openDocument = (doc: DocumentId) => {
    const entry = DOCUMENTS[doc]
    open('おぼえがき', (body) => {
      body.appendChild(el('div', 'doc-reader-title', `— ${entry.title} —`))
      body.appendChild(el('div', 'doc-reader', entry.body))
      const back = button('hint-more', 'いちらんへ戻る', () => openDocumentList())
      body.appendChild(back)
    })
  }

  const openDocumentList = () => {
    open('おぼえがき', (body) => {
      const docs = store.getState().documents
      if (docs.length === 0) {
        body.appendChild(el('div', 'doc-empty', 'まだ何も記されていない。屋敷を調べてみよう。'))
        return
      }
      const list = el('div', 'doc-list')
      for (const doc of docs) {
        list.appendChild(button('doc-card', DOCUMENTS[doc].title, () => openDocument(doc)))
      }
      body.appendChild(list)
    })
  }

  const openHints = () => {
    open('ヒント', (body) => {
      const state = store.getState()
      const hints = availableHints(state)
      if (hints.length === 0) {
        body.appendChild(el('div', 'doc-empty', 'いま案内できる謎はない。次の扉が待っている。'))
        return
      }
      body.appendChild(
        el('div', 'doc-empty', 'ヒントは三段階。三つ目はほとんど答えです。何度でも無料。'),
      )
      for (const hint of hints) {
        const item = el('div', 'hint-item')
        const head = button('', `※ ${hint.title}`, () => {
          item.classList.toggle('open')
        })
        const stages = el('div', 'hint-stages')
        const renderStages = () => {
          clear(stages)
          const seen = store.getState().seenHints
          const seenCount = ([0, 1, 2] as const).filter((s) =>
            seen.includes(`${hint.id}:${s}`),
          ).length
          const visible = Math.max(seenCount, 0)
          for (let s = 0; s < visible; s++) {
            const stage = el('div', 'hint-stage')
            stage.appendChild(el('span', 'label', `其の${['一', '二', '三'][s]}`))
            stage.appendChild(document.createTextNode(hint.stages[s as 0 | 1 | 2]))
            stages.appendChild(stage)
          }
          if (visible < 3) {
            stages.appendChild(
              button('hint-more', visible === 0 ? 'ヒントを見る' : 'もっと見る', () => {
                store.dispatch({ type: 'HINT_VIEW', puzzle: hint.id, stage: visible as 0 | 1 | 2 })
                renderStages()
              }),
            )
          }
        }
        renderStages()
        item.appendChild(head)
        item.appendChild(stages)
        body.appendChild(item)
      }
    })
  }

  const settingRow = (label: string, control: HTMLElement): HTMLElement => {
    const row = el('div', 'setting-row')
    row.appendChild(el('span', '', label))
    row.appendChild(control)
    return row
  }

  const openSettings = () => {
    open('設定', (body) => {
      const current = settings.get()
      const slider = (value: number, onInput: (v: number) => void) => {
        const input = el('input')
        input.type = 'range'
        input.min = '0'
        input.max = '1'
        input.step = '0.05'
        input.value = String(value)
        input.addEventListener('input', () => onInput(Number(input.value)))
        return input
      }
      body.appendChild(settingRow('音楽の音量', slider(current.bgm, (v) => settings.set({ bgm: v }))))
      body.appendChild(settingRow('効果音の音量', slider(current.sfx, (v) => settings.set({ sfx: v }))))

      const quality = el('select')
      for (const [value, label] of [
        ['high', '高(既定)'],
        ['mid', '中'],
        ['low', '低'],
      ] as const) {
        const option = el('option', '', label)
        option.value = value
        if (current.quality === value) option.selected = true
        quality.appendChild(option)
      }
      quality.addEventListener('change', () =>
        settings.set({ quality: quality.value as Settings['quality'] }),
      )
      body.appendChild(settingRow('画質', quality))

      const sens = el('input')
      sens.type = 'range'
      sens.min = '0.5'
      sens.max = '1.6'
      sens.step = '0.1'
      sens.value = String(current.sensitivity)
      sens.addEventListener('input', () => settings.set({ sensitivity: Number(sens.value) }))
      body.appendChild(settingRow('視点の速さ', sens))

      const markers = el('input')
      markers.type = 'checkbox'
      markers.checked = current.markers
      markers.addEventListener('change', () => settings.set({ markers: markers.checked }))
      body.appendChild(settingRow('調べられる場所に光を表示', markers))

      const speed = el('select')
      for (const [value, label] of [
        ['slow', 'ゆっくり'],
        ['normal', 'ふつう'],
        ['fast', 'はやい'],
      ] as const) {
        const option = el('option', '', label)
        option.value = value
        if (current.textSpeed === value) option.selected = true
        speed.appendChild(option)
      }
      speed.addEventListener('change', () =>
        settings.set({ textSpeed: speed.value as Settings['textSpeed'] }),
      )
      body.appendChild(settingRow('文字の速さ', speed))

      body.appendChild(
        button('danger-btn', 'はじめから(セーブデータを消す)', () => {
          confirmDialog('セーブデータを消して、最初からやり直しますか?', () => {
            store.dispatch({ type: 'RESTART' })
            closeAll()
          })
        }),
      )
    })
  }

  const openCredits = () => {
    open('この作品について', (body) => {
      const reader = el('div', 'doc-reader')
      reader.textContent = [
        '『久遠寺邸の一夜 〜大正浪漫脱出奇譚〜』',
        '',
        '大正十年、春の宵。',
        '亡き父の親友が遺した謎を解き、',
        '朝の庭へ辿り着く、ひと晩の物語。',
        '',
        '美術・音楽・仕掛け、すべて手続き生成。',
        '外部素材を使わずに描かれています。',
      ].join('\n')
      body.appendChild(reader)
    })
  }

  const confirmDialog = (text: string, onYes: () => void) => {
    open('確認', (body) => {
      body.appendChild(el('div', 'confirm-text', text))
      const actions = el('div', 'confirm-actions')
      actions.appendChild(button('', 'やめておく', closeAll))
      actions.appendChild(
        button('yes', 'はい', () => {
          closeAll()
          onYes()
        }),
      )
      body.appendChild(actions)
    })
  }

  return {
    root,
    openDocumentList,
    openDocument,
    openHints,
    openSettings,
    openCredits,
    confirm: confirmDialog,
    openCustom: open,
    closeAll,
    isOpen: () => root.childElementCount > 0,
  }
}
