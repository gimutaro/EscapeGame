import * as THREE from 'three'
import type { GameState } from '../core/state'
import type { HotspotId, RoomId } from '../core/types'
import { markerTexture } from './textures/small'
import type { Interactable, InteractionContext } from './types'

export interface InteractionEvents {
  onHotspotClick(id: HotspotId): void
  onDrag(dx: number, dy: number): void
  onDragOnHotspotArea?(id: HotspotId, dx: number, dy: number): boolean
  onBackgroundClick?(): void
}

export interface Interaction {
  register(items: readonly Interactable[]): void
  setContext(context: InteractionContext): void
  setRoom(room: RoomId): void
  syncMarkers(state: GameState): void
  update(dt: number): void
  setEnabled(enabled: boolean): void
}

/**
 * レイキャストによるホットスポット管理。
 * ドラッグ(見回し)とクリック(調査)を距離で判別する。
 */
export const createInteraction = (
  canvas: HTMLCanvasElement,
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
  events: InteractionEvents,
): Interaction => {
  const all: Interactable[] = []
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let context: InteractionContext = 'room'
  let currentRoom: RoomId = 'living'
  let enabled = true
  let hovered: Interactable | null = null
  let lastState: GameState | null = null

  // マーカー(光の環)スプライトのプール
  const markerMap = new Map<Interactable, THREE.Sprite>()
  const markerMaterial = new THREE.SpriteMaterial({
    map: markerTexture(),
    transparent: true,
    depthWrite: false,
    depthTest: true,
    opacity: 0.55,
  })
  const markerGroup = new THREE.Group()
  markerGroup.renderOrder = 5
  scene.add(markerGroup)

  const activeItems = (): Interactable[] =>
    context === 'room'
      ? all.filter(
          (i) => i.context === 'room' && (!i.rooms || i.rooms.includes(currentRoom)),
        )
      : all.filter((i) => i.context === context)

  const ownerOf = (object: THREE.Object3D, items: readonly Interactable[]): Interactable | null => {
    let obj: THREE.Object3D | null = object
    while (obj) {
      const found = items.find((i) => i.object === obj)
      if (found) return found
      obj = obj.parent
    }
    return null
  }

  const volumeOf = (object: THREE.Object3D): number => {
    const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3())
    return size.x * size.y * size.z
  }

  const pick = (clientX: number, clientY: number): Interactable | null => {
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const items = activeItems()
    const objects = items.map((i) => i.object)
    const hits = raycaster.intersectObjects(objects, true)
    const candidates: Interactable[] = []
    for (const hit of hits) {
      const owner = ownerOf(hit.object, items)
      if (owner && !candidates.includes(owner)) candidates.push(owner)
    }
    const nearest = candidates[0] ?? null
    if (!nearest || candidates.length === 1) return nearest
    // 部屋ビューは距離順(手前優先)。注視ビューでは装置全体の当たり判定が
    // ダイヤル等の小さな操作対象を包んでいるため、最小の当たり判定を優先する
    if (context === 'room') return nearest
    return candidates.reduce((best, c) => (volumeOf(c.object) < volumeOf(best.object) ? c : best))
  }

  // ポインタ操作(ドラッグ/クリック判別)
  let down = false
  let downX = 0
  let downY = 0
  let lastX = 0
  let lastY = 0
  let moved = 0
  let dragTarget: Interactable | null = null

  canvas.addEventListener('pointerdown', (e) => {
    if (!enabled) return
    down = true
    moved = 0
    downX = lastX = e.clientX
    downY = lastY = e.clientY
    dragTarget = pick(e.clientX, e.clientY)
    canvas.setPointerCapture(e.pointerId)
  })
  canvas.addEventListener('pointermove', (e) => {
    if (!enabled) return
    if (down) {
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      moved += Math.abs(dx) + Math.abs(dy)
      // ギミック上のドラッグ(地球儀)を優先し、消費されなければ視点を回す
      const consumed =
        dragTarget && events.onDragOnHotspotArea
          ? events.onDragOnHotspotArea(dragTarget.id, dx, dy)
          : false
      if (!consumed) events.onDrag(dx, dy)
    } else {
      const hit = pick(e.clientX, e.clientY)
      if (hit !== hovered) {
        hovered = hit
        canvas.style.cursor = hit ? 'pointer' : 'grab'
      }
    }
  })
  const endPointer = (e: PointerEvent) => {
    if (!enabled || !down) return
    down = false
    // 指はマウスよりぶれるので、タップ判定はタッチのとき緩める
    const isTouch = e.pointerType === 'touch'
    const totalMove = Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY)
    if (totalMove < (isTouch ? 16 : 8) && moved < (isTouch ? 44 : 24)) {
      const hit = pick(e.clientX, e.clientY)
      if (hit) events.onHotspotClick(hit.id)
      else events.onBackgroundClick?.()
    }
    dragTarget = null
  }
  canvas.addEventListener('pointerup', endPointer)
  canvas.addEventListener('pointercancel', () => {
    down = false
    dragTarget = null
  })

  let pulse = 0

  const rebuildMarkers = () => {
    markerGroup.clear()
    markerMap.clear()
    for (const item of activeItems()) {
      if (item.context !== 'room') continue
      // マテリアルは共有(clone しない: ビュー切替のたびに増えるのを防ぐ)
      const sprite = new THREE.Sprite(markerMaterial)
      const at =
        item.markerAt ?? new THREE.Box3().setFromObject(item.object).getCenter(new THREE.Vector3())
      sprite.position.copy(at)
      sprite.scale.setScalar(0.14)
      markerGroup.add(sprite)
      markerMap.set(item, sprite)
    }
    if (lastState) applyMarkerVisibility(lastState)
  }

  const applyMarkerVisibility = (state: GameState) => {
    for (const [item, sprite] of markerMap) {
      const show = item.markerWhen ? item.markerWhen(state) : true
      sprite.visible = show
    }
  }

  return {
    register(items) {
      all.push(...items)
    },
    setContext(next) {
      context = next
      hovered = null
      canvas.style.cursor = 'grab'
      rebuildMarkers()
    },
    setRoom(room) {
      currentRoom = room
      hovered = null
      rebuildMarkers()
    },
    syncMarkers(state) {
      lastState = state
      applyMarkerVisibility(state)
    },
    update(dt) {
      pulse += dt
      const scale = 0.13 + Math.sin(pulse * 2.4) * 0.02
      markerMaterial.opacity = 0.4 + (Math.sin(pulse * 2.4) + 1) * 0.14
      for (const sprite of markerMap.values()) {
        sprite.scale.setScalar(scale)
      }
    },
    setEnabled(value) {
      enabled = value
      if (!value) {
        down = false
        canvas.style.cursor = 'default'
      } else {
        canvas.style.cursor = 'grab'
      }
    },
  }
}
