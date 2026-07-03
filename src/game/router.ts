import type { Store } from '../core/store'
import type { HotspotId, Note, RoomId } from '../core/types'
import type { CameraRig } from '../scene/cameraRig'
import type { Interaction } from '../scene/interaction'
import type { World } from '../scene/sceneRoot'
import type { ViewId } from '../scene/types'
import type { Fade } from '../ui/screens'
import type { Hud } from '../ui/hud'

/** 部屋ビューでクリックすると注視ビューを開くホットスポット */
const VIEW_OF: Partial<Record<HotspotId, ViewId>> = {
  lowTable: 'fv-table',
  fireplace: 'fv-fireplace',
  clock: 'fv-clock',
  cabinet: 'fv-cabinet',
  piano: 'fv-piano',
  vanity: 'fv-vanity',
  wardrobe: 'fv-wardrobe',
  jewelryBox: 'fv-jewelry',
  sideTable: 'fv-sidetable',
  byobu: 'fv-byobu',
  desk: 'fv-desk',
  bookshelf: 'fv-bookshelf',
  globe: 'fv-globe',
  safe: 'fv-safe',
}

/**
 * ホットスポットのクリック/ドラッグをゲームアクションへ変換する。
 * 正誤の判定は一切持たない(コアに委譲)。
 */
export interface Router {
  handleClick(id: HotspotId): void
  handleDragOnHotspot(id: HotspotId, dx: number, dy: number): boolean
  focusView(view: ViewId): void
  backToRoom(): void
}

export const createRouter = (
  store: Store,
  rig: CameraRig,
  interaction: Interaction,
  world: World,
  fade: Fade,
  hud: Hud,
): Router => {
  let pendingBookSlot: number | null = null
  let moving = false

  const clearBookSelection = () => {
    pendingBookSlot = null
    world.setBookSelection(null)
  }

  const focusView = (view: ViewId) => {
    rig.focus(view)
    interaction.setContext(view)
    hud.setInFocusView(view)
  }

  const backToRoom = () => {
    clearBookSelection()
    rig.backToRoom()
    interaction.setContext('room')
    hud.setInFocusView(null)
  }

  const moveThroughDoor = async (room: RoomId) => {
    if (moving) return
    moving = true
    interaction.setEnabled(false)
    await fade.black()
    store.dispatch({ type: 'MOVE_TO_ROOM', room })
    fade.clearFade()
    interaction.setEnabled(true)
    moving = false
  }

  const handleClick = (id: HotspotId) => {
    const state = store.getState()
    if (state.phase !== 'playing') return

    // アイテム使用が最優先(選択中に対象をクリック)
    if (state.selectedItem !== null) {
      store.dispatch({ type: 'USE_ITEM', item: state.selectedItem, target: id })
      return
    }

    // 注視ビュー内の操作部品
    if (id.startsWith('pianoKey_')) {
      store.dispatch({ type: 'PIANO_PRESS', note: id.slice('pianoKey_'.length) as Note })
      return
    }
    if (id.startsWith('jewelryDial_')) {
      const index = Number(id.slice('jewelryDial_'.length)) as 0 | 1 | 2
      const value = (store.getState().jewelryDials[index] + 1) % 10
      store.dispatch({ type: 'SET_JEWELRY_DIAL', index, value })
      return
    }
    if (id === 'jewelryLatch') {
      store.dispatch({ type: 'OPEN_JEWELRY' })
      return
    }
    if (id.startsWith('safeDial_')) {
      const index = Number(id.slice('safeDial_'.length)) as 0 | 1 | 2
      const value = (store.getState().safeDials[index] + 1) % 10
      store.dispatch({ type: 'SET_SAFE_DIAL', index, value })
      return
    }
    if (id === 'safeLatch') {
      store.dispatch({ type: 'OPEN_SAFE' })
      return
    }
    if (id === 'safeKeyhole') {
      store.dispatch({ type: 'EXAMINE', target: 'safe' })
      return
    }
    if (id === 'globeLatch') {
      store.dispatch({ type: 'OPEN_GLOBE' })
      return
    }
    if (id.startsWith('bookSlot_')) {
      const slot = Number(id.slice('bookSlot_'.length))
      if (store.getState().flags.bookshelfSolved) {
        store.dispatch({ type: 'EXAMINE', target: 'bookshelf' })
        return
      }
      if (pendingBookSlot === null) {
        // 1冊目を選択(見た目は少し引き出される)。2冊目のクリックで入れ替える
        pendingBookSlot = slot
        world.setBookSelection(slot)
        return
      }
      if (pendingBookSlot === slot) {
        clearBookSelection()
        return
      }
      const a = pendingBookSlot
      clearBookSelection()
      store.dispatch({ type: 'SWAP_BOOKS', a, b: slot })
      return
    }
    if (id === 'lightSwitch') {
      store.dispatch({ type: 'TOGGLE_STUDY_LIGHT' })
      return
    }

    // 扉(開いていれば移動・施錠中は調査=施錠メッセージ)
    if (id === 'doorBedroom') {
      if (state.flags.bedroomUnlocked) {
        void moveThroughDoor(state.currentRoom === 'bedroom' ? 'living' : 'bedroom')
      } else {
        store.dispatch({ type: 'EXAMINE', target: id })
      }
      return
    }
    if (id === 'doorStudy') {
      if (state.flags.studyUnlocked) {
        void moveThroughDoor(state.currentRoom === 'study' ? 'living' : 'study')
      } else {
        store.dispatch({ type: 'EXAMINE', target: id })
      }
      return
    }

    // 肖像画が開くまでは金庫より肖像画を優先
    const targetId: HotspotId = id === 'safe' && !state.flags.portraitOpen ? 'portrait' : id

    // 調査+(あれば)注視ビューへ
    store.dispatch({ type: 'EXAMINE', target: targetId })
    const view = VIEW_OF[targetId]
    if (view && rig.mode() === 'room' && rig.currentView() !== view) {
      focusView(view)
    }
  }

  const handleDragOnHotspot = (id: HotspotId, dx: number, _dy: number): boolean => {
    if (rig.currentView() !== 'fv-globe') return false
    if (id !== 'globe' && id !== 'globeLatch') return false
    const state = store.getState()
    if (state.flags.globeSolved) return true
    store.dispatch({ type: 'ROTATE_GLOBE', yaw: state.globeYaw + dx * 0.45 })
    return true
  }

  return { handleClick, handleDragOnHotspot, focusView, backToRoom }
}
