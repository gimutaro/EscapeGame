import './ui/style.css'
import * as THREE from 'three'
import type { Action } from './core/actions'
import type { GameEvent } from './core/events'
import type { GameState } from './core/state'
import { createInitialState } from './core/state'
import { createStore } from './core/store'
import { ITEM_IDS } from './core/types'
import { PROLOGUE_PAGES, endingPages } from './core/texts'
import { createAudioSystem } from './audio/audio'
import { clearSave, createDebouncedSaver, loadGame } from './save/storage'
import { createCameraRig } from './scene/cameraRig'
import { createEngine } from './scene/engine'
import { createInteraction } from './scene/interaction'
import { generateItemIcons } from './scene/items'
import { createWorld } from './scene/sceneRoot'
import { createTweens } from './utils/tween'
import { createRouter } from './game/router'
import { el } from './ui/dom'
import { createHud } from './ui/hud'
import { createItemViewer } from './ui/itemViewer'
import { createMelodyNotes, createMessages, createToasts } from './ui/messages'
import { createModals } from './ui/modals'
import {
  createFade,
  createResultScreen,
  createStoryScreen,
  createTitleScreen,
  showWebglFallback,
} from './ui/screens'
import { createSettingsStore } from './ui/settingsStore'

declare global {
  interface Window {
    __game?: {
      dispatch: (action: Action) => void
      getState: () => GameState
      focus?: (view: string) => void
      back?: () => void
      camera?: () => { position: number[]; mode: string; view: string | null }
      project?: (x: number, y: number, z: number) => { x: number; y: number }
    }
  }
}

const boot = (): void => {
  const app = document.getElementById('app')
  if (!app) throw new Error('#app が見つかりません')

  // WebGL2 チェック(NFR-09)
  const probe = document.createElement('canvas')
  if (!probe.getContext('webgl2')) {
    showWebglFallback(app)
    return
  }

  // --- 基盤 ---
  const store = createStore(createInitialState())
  const settings = createSettingsStore(localStorage)
  const tweens = createTweens()
  const engine = createEngine(app)
  const world = createWorld(engine, tweens)
  const rig = createCameraRig(engine.camera)
  rig.registerViews(world.views)
  const audio = createAudioSystem()
  const saver = createDebouncedSaver(localStorage)
  let savedState = loadGame(localStorage)

  // --- UI ---
  const ui = el('div')
  ui.id = 'ui'
  app.appendChild(ui)
  const messages = createMessages()
  const toasts = createToasts()
  const melodyNotes = createMelodyNotes()
  const modals = createModals(store, settings)
  const fade = createFade()
  const itemViewer = createItemViewer(store, modals)
  const hud = createHud(store, {
    onDocuments: () => modals.openDocumentList(),
    onHints: () => modals.openHints(),
    onSettings: () => modals.openSettings(),
    onBack: () => router.backToRoom(),
  })
  hud.onZoomItem = (item) => itemViewer.open(item)

  const title = createTitleScreen({
    onNewGame: () => {
      audio.resume()
      store.dispatch({ type: 'NEW_GAME' })
    },
    onContinue: () => {
      if (!savedState) return
      audio.resume()
      store.dispatch({ type: 'LOAD', state: savedState })
    },
    onSettings: () => modals.openSettings(),
    onCredits: () => modals.openCredits(),
  })
  const story = createStoryScreen()
  const result = createResultScreen({
    onReplay: () => {
      audio.resume()
      result.hide()
      store.dispatch({ type: 'NEW_GAME' })
    },
    onTitle: () => {
      result.hide()
      store.dispatch({ type: 'RESTART' })
    },
  })

  ui.appendChild(messages.root)
  ui.appendChild(toasts.root)
  ui.appendChild(melodyNotes.root)
  ui.appendChild(hud.root)
  ui.appendChild(title.root)
  ui.appendChild(story.root)
  ui.appendChild(result.root)
  ui.appendChild(modals.root)
  ui.appendChild(fade.root)

  // --- 操作 ---
  const interaction = createInteraction(engine.canvas, engine.camera, engine.scene, {
    onHotspotClick: (id) => router.handleClick(id),
    onDrag: (dx, dy) => rig.drag(dx, dy),
    onDragOnHotspotArea: (id, dx, dy) => router.handleDragOnHotspot(id, dx, dy),
    onBackgroundClick: () => messages.dismiss(),
  })
  interaction.register(world.interactables)
  const router = createRouter(store, rig, interaction, world, fade, hud)

  // --- アイテムアイコン ---
  const icons = generateItemIcons(ITEM_IDS)
  hud.setIcons(icons)

  // --- 設定の反映 ---
  settings.subscribe((value) => {
    audio.setVolumes(value.bgm, value.sfx)
  })

  // --- フェーズ遷移 ---
  const onPhaseChanged = (phase: GameState['phase']) => {
    const state = store.getState()
    switch (phase) {
      case 'title': {
        messages.clear()
        modals.closeAll()
        story.hide()
        result.hide()
        audio.setBgm('off')
        rig.setRoom('living')
        rig.setIdleSway(true)
        interaction.setEnabled(false)
        savedState = loadGame(localStorage)
        title.show(savedState !== null)
        break
      }
      case 'prologue': {
        title.hide()
        audio.setBgm('explore')
        story.play(PROLOGUE_PAGES, { dawn: false }, () => {
          store.dispatch({ type: 'PROLOGUE_DONE' })
        })
        break
      }
      case 'playing': {
        title.hide()
        story.hide()
        result.hide()
        audio.resume()
        audio.setBgm('explore')
        rig.setIdleSway(false)
        rig.setRoom(state.currentRoom)
        interaction.setRoom(state.currentRoom)
        interaction.setContext('room')
        interaction.setEnabled(true)
        hud.setInFocusView(null)
        break
      }
      case 'ending': {
        interaction.setEnabled(false)
        messages.clear()
        modals.closeAll()
        audio.setBgm('ending')
        void fade.whiteSlow().then(() => {
          story.play(endingPages(state.flags.photosCombined), { dawn: true, withPetals: true }, () => {
            store.dispatch({ type: 'ENDING_DONE' })
          })
          fade.clearFade()
        })
        break
      }
      case 'result': {
        saver.cancel() // 予約済みの保存が clearSave の後に走らないように
        clearSave(localStorage) // 完走したのでセーブは役目を終える
        savedState = null
        result.show(state)
        break
      }
    }
  }

  const onEvent = (event: GameEvent, state: GameState) => {
    world.onEvent(event, state)
    switch (event.kind) {
      case 'message':
        messages.push(event.text)
        break
      case 'sfx':
        audio.playSfx(event.sfx)
        break
      case 'note':
        audio.playNote(event.note)
        break
      case 'melody':
        audio.playMelody()
        melodyNotes.play()
        break
      case 'acquire':
        audio.playSfx('itemGet')
        toasts.acquire(event.item, icons[event.item])
        break
      case 'document':
        audio.playSfx('paper')
        modals.openDocument(event.doc)
        break
      case 'roomChanged':
        rig.setRoom(event.room)
        interaction.setRoom(event.room)
        interaction.setContext('room')
        hud.setInFocusView(null)
        break
      case 'phaseChanged':
        onPhaseChanged(event.phase)
        break
      case 'effect':
        break
    }
  }

  store.subscribe((state, events, _action) => {
    world.sync(state)
    interaction.syncMarkers(state)
    hud.sync(state)
    audio.syncAmbience(state)
    saver(state)
    for (const event of events) onEvent(event, state)
  })

  // --- フレームループ ---
  engine.onFrame((dt, time) => {
    tweens.update(dt)
    rig.update(dt)
    interaction.update(dt)
    world.update(dt, time)
  })

  // --- 起動 ---
  world.sync(store.getState())
  hud.sync(store.getState())
  rig.setRoom('living')
  rig.setIdleSway(true)
  interaction.setEnabled(false)
  title.show(savedState !== null)
  engine.start()

  // E2E・デバッグ用フック
  window.__game = {
    dispatch: store.dispatch,
    getState: store.getState,
    focus: (view) => router.focusView(view as never),
    back: () => router.backToRoom(),
    camera: () => ({
      position: engine.camera.position.toArray(),
      mode: rig.mode(),
      view: rig.currentView(),
      fov: engine.camera.fov,
      aspect: engine.camera.aspect,
      quaternion: engine.camera.quaternion.toArray(),
    }),
    project: (x, y, z) => {
      const v = new THREE.Vector3(x, y, z).project(engine.camera)
      return {
        x: ((v.x + 1) / 2) * window.innerWidth,
        y: ((1 - v.y) / 2) * window.innerHeight,
      }
    },
  }
}

try {
  boot()
} catch (error) {
  console.error('起動に失敗しました:', error)
  const app = document.getElementById('app')
  if (app) showWebglFallback(app)
}
