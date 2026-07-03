import * as THREE from 'three'
import { GLOBE_ANSWER_YAW } from '../../core/constants'
import { BOOK_COLORS } from '../../core/types'
import type { BookColor } from '../../core/types'
import type { Tweens } from '../../utils/tween'
import type { Materials } from '../materials'
import { boxMesh, cylinderMesh, hitbox, meshOf } from '../materials'
import { portraitTexture } from '../textures/art'
import { digitRingTexture } from '../textures/dials'
import { bookRowTexture, bookSpineTexture, globeTexture } from '../textures/props'
import { memoTexture, paperTexture } from '../textures/small'
import type { DevicePart } from './livingDevices'
import type { Interactable } from '../types'

/** 両袖机(引き出し・バンカーズランプ) */
export const buildDesk = (materials: Materials, tweens: Tweens): DevicePart => {
  const group = new THREE.Group()
  group.position.set(-7.1, 0, -1.45)
  group.add(boxMesh(1.6, 0.06, 0.78, materials.woodRed, 0, 0.78, 0))
  for (const side of [-1, 1]) {
    group.add(boxMesh(0.42, 0.72, 0.7, materials.woodMid, side * 0.56, 0.39, 0))
    for (let i = 0; i < 3; i++) {
      group.add(boxMesh(0.34, 0.16, 0.02, materials.woodDark, side * 0.56, 0.18 + i * 0.22, 0.36))
      const knob = meshOf(new THREE.SphereGeometry(0.014, 8, 6), materials.brass)
      knob.position.set(side * 0.56, 0.18 + i * 0.22, 0.38)
      group.add(knob)
    }
  }
  // 中央の引き出し(開く)
  const drawer = new THREE.Group()
  drawer.position.set(0, 0.68, 0)
  drawer.add(boxMesh(0.6, 0.14, 0.66, materials.woodMid, 0, 0, 0))
  const drawerKnob = meshOf(new THREE.SphereGeometry(0.016, 8, 6), materials.brass)
  drawerKnob.position.set(0, 0, 0.34)
  drawer.add(drawerKnob)
  const draftPaper = meshOf(
    new THREE.PlaneGeometry(0.22, 0.3),
    new THREE.MeshStandardMaterial({ map: paperTexture('letter'), roughness: 0.9 }),
    false,
    false,
  )
  draftPaper.rotation.x = -Math.PI / 2
  draftPaper.rotation.z = -0.2
  draftPaper.position.set(-0.06, 0.075, 0.1)
  drawer.add(draftPaper)
  group.add(drawer)
  // 吸い取り紙と文具
  group.add(boxMesh(0.52, 0.012, 0.36, new THREE.MeshStandardMaterial({ color: '#3e5443', roughness: 1 }), 0.06, 0.82, 0.05))
  const inkwell = cylinderMesh(0.035, 0.045, 0.07, new THREE.MeshPhysicalMaterial({ color: '#182028', roughness: 0.15 }), 12)
  inkwell.position.set(0.5, 0.85, -0.2)
  group.add(inkwell)
  const pen = cylinderMesh(0.006, 0.008, 0.2, materials.brassDark, 8)
  pen.rotation.z = Math.PI / 2.4
  pen.rotation.y = 0.5
  pen.position.set(0.3, 0.83, 0.12)
  group.add(pen)
  // バンカーズランプ
  const lamp = new THREE.Group()
  lamp.position.set(-0.52, 0.81, -0.18)
  const base = cylinderMesh(0.07, 0.09, 0.03, materials.brass, 14)
  lamp.add(base)
  const stem = cylinderMesh(0.012, 0.012, 0.24, materials.brass, 8)
  stem.position.y = 0.13
  lamp.add(stem)
  const shade = meshOf(
    new THREE.CylinderGeometry(0.09, 0.13, 0.11, 16, 1, true, 0, Math.PI),
    new THREE.MeshPhysicalMaterial({
      color: '#1d5c40',
      emissive: '#2f9868',
      emissiveIntensity: 0.9,
      side: THREE.DoubleSide,
      roughness: 0.3,
    }),
    false,
    false,
  )
  shade.rotation.y = Math.PI / 2
  shade.position.y = 0.28
  lamp.add(shade)
  const bulbGlow = meshOf(
    new THREE.SphereGeometry(0.028, 10, 8),
    new THREE.MeshStandardMaterial({ color: '#fff4d8', emissive: '#ffd9a0', emissiveIntensity: 2.6 }),
    false,
    false,
  )
  bulbGlow.position.y = 0.25
  lamp.add(bulbGlow)
  group.add(lamp)
  const lampLight = new THREE.PointLight('#ffe2b0', 7, 5, 2)
  lampLight.position.set(-7.62, 1.12, -1.63)

  const deskHit = hitbox(1.8, 1.1, 1.1, 0, 0.55, 0.1)
  group.add(deskHit)

  return {
    group,
    interactables: [
      {
        id: 'desk',
        object: deskHit,
        context: 'room',
        rooms: ['study'],
        view: 'fv-desk',
        markerAt: new THREE.Vector3(-7.1, 0.9, -1.2),
      },
      { id: 'desk', object: cloneInto(deskHit, group), context: 'fv-desk' },
    ],
    views: [
      {
        id: 'fv-desk',
        room: 'study',
        position: new THREE.Vector3(-7.1, 1.42, -0.3),
        lookAt: new THREE.Vector3(-7.1, 0.72, -1.45),
      },
    ],
    lights: [lampLight],
    sync(state) {
      drawer.position.z = state.flags.deskOpened ? 0.4 : 0
      const on = state.studyLightOn
      lampLight.intensity = on ? 7 : 0
      ;(shade.material as THREE.MeshPhysicalMaterial).emissiveIntensity = on ? 0.9 : 0.04
      ;(bulbGlow.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 2.6 : 0.05
    },
    onEvent(event) {
      if (event.kind === 'sfx' && event.sfx === 'drawer') {
        tweens.add(0.6, (t) => {
          drawer.position.z = 0.4 * t
        })
      }
    },
    update() {},
  }
}

/** 地球儀(回転・日本を正面に) */
export const buildGlobe = (materials: Materials, tweens: Tweens): DevicePart => {
  const group = new THREE.Group()
  group.position.set(-5.85, 0, -1.5)
  // 三脚スタンド
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2
    const leg = cylinderMesh(0.02, 0.028, 0.62, materials.woodDark, 8)
    leg.position.set(Math.cos(a) * 0.16, 0.31, Math.sin(a) * 0.16)
    leg.rotation.z = Math.cos(a) * 0.22
    leg.rotation.x = -Math.sin(a) * 0.22
    group.add(leg)
  }
  const collar = meshOf(new THREE.TorusGeometry(0.2, 0.02, 10, 24), materials.woodDark)
  collar.rotation.x = Math.PI / 2
  collar.position.y = 0.58
  group.add(collar)
  // 赤道の飾り環(視界を遮らない細い帯)
  const equator = meshOf(new THREE.TorusGeometry(0.325, 0.008, 8, 48), materials.brassDark)
  equator.rotation.x = Math.PI / 2
  equator.position.y = 1.0
  group.add(equator)
  // 球体(下半球+開く上半球)
  const globeMaterial = new THREE.MeshStandardMaterial({ map: globeTexture(), roughness: 0.6 })
  const sphere = new THREE.Group()
  sphere.position.y = 1.0
  const lower = meshOf(new THREE.SphereGeometry(0.32, 40, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), globeMaterial)
  sphere.add(lower)
  const upperHinge = new THREE.Group()
  upperHinge.position.set(0, 0, -0.3)
  const upper = meshOf(new THREE.SphereGeometry(0.32, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), globeMaterial)
  upper.position.set(0, 0, 0.3)
  upperHinge.add(upper)
  sphere.add(upperHinge)
  // 中の覚書
  const memo = meshOf(
    new THREE.PlaneGeometry(0.2, 0.26),
    new THREE.MeshStandardMaterial({ map: memoTexture(), roughness: 0.9, side: THREE.DoubleSide }),
    false,
    false,
  )
  memo.rotation.x = -0.5
  memo.position.set(0, 0.1, 0.02)
  memo.visible = false
  sphere.add(memo)
  // 留め金
  const latch = boxMesh(0.03, 0.05, 0.02, materials.brass, 0, 0, 0.325)
  sphere.add(latch)
  group.add(sphere)

  const globeHit = hitbox(0.75, 0.8, 0.75, 0, 1.0, 0)
  const latchHit = hitbox(0.16, 0.16, 0.16, 0, 1.0, 0.36)
  group.add(globeHit, latchHit)

  return {
    group,
    interactables: [
      {
        id: 'globe',
        object: globeHit,
        context: 'room',
        rooms: ['study'],
        view: 'fv-globe',
        markerAt: new THREE.Vector3(-5.85, 1.15, -1.5),
      },
      { id: 'globe', object: cloneInto(globeHit, group), context: 'fv-globe' },
      { id: 'globeLatch', object: latchHit, context: 'fv-globe' },
    ],
    views: [
      {
        id: 'fv-globe',
        room: 'study',
        position: new THREE.Vector3(-5.85, 1.25, 0.05),
        lookAt: new THREE.Vector3(-5.85, 0.92, -1.5),
        fov: 46,
      },
    ],
    sync(state) {
      sphere.rotation.y = THREE.MathUtils.degToRad(-90 + state.globeYaw - GLOBE_ANSWER_YAW)
      upperHinge.rotation.x = state.flags.globeSolved ? -1.45 : 0
      memo.visible = state.flags.globeSolved
    },
    onEvent(event) {
      if (event.kind === 'effect' && event.effect === 'globeOpen') {
        memo.visible = true
        tweens.add(0.9, (t) => {
          upperHinge.rotation.x = -1.45 * t
        })
      }
    },
    update() {},
  }
}

/** スロット0..3 が部屋から見て左→右(南→北=+z→−z)に並ぶ */
const SLOT_Z = [0.275, 0.09, -0.095, -0.28] as const

export type BookshelfDevice = DevicePart & { setSelectedSlot(slot: number | null): void }

/** 壁一面の本棚(色順の謎+隠し棚) */
export const buildBookshelf = (materials: Materials, tweens: Tweens): BookshelfDevice => {
  const group = new THREE.Group()
  // 骨組み: 背板+外枠+縦仕切り(奥行きが見えるように)
  group.add(boxMesh(0.06, 2.72, 4.56, materials.woodDark, -9.9, 1.36, 0))
  group.add(boxMesh(0.46, 0.12, 4.56, materials.woodRed, -9.7, 2.72, 0))
  group.add(boxMesh(0.48, 0.26, 4.56, materials.woodRed, -9.7, 0.13, 0))
  for (const side of [-2.24, 2.24]) {
    group.add(boxMesh(0.46, 2.72, 0.12, materials.woodRed, -9.7, 1.36, side))
  }
  for (const divider of [-0.74, 0.74]) {
    group.add(boxMesh(0.42, 2.5, 0.05, materials.woodRed, -9.72, 1.4, divider))
  }
  // 棚板と本の列(棚板の前縁が見える)
  const rows = [0.35, 0.82, 1.78, 2.24]
  rows.forEach((y, i) => {
    group.add(boxMesh(0.4, 0.045, 4.32, materials.woodDark, -9.7, y - 0.03, 0))
    for (const seg of [-1.48, 0, 1.48]) {
      const row = meshOf(
        new THREE.PlaneGeometry(1.4, 0.38),
        new THREE.MeshStandardMaterial({ map: bookRowTexture(200 + i * 3 + seg), roughness: 0.85 }),
        false,
        false,
      )
      row.rotation.y = Math.PI / 2
      row.position.set(-9.62, y + 0.17, seg)
      group.add(row)
    }
  })
  // 特別な段(目の高さ・4冊の色布の本)
  group.add(boxMesh(0.4, 0.045, 4.32, materials.woodDark, -9.7, 1.26, 0))
  const nicheBack = boxMesh(0.02, 0.5, 1.44, new THREE.MeshBasicMaterial({ color: '#100904' }), -9.84, 1.51, 0)
  group.add(nicheBack)
  // 両脇の飾り(小物)
  for (const seg of [-1.48, 1.48]) {
    const row = meshOf(
      new THREE.PlaneGeometry(1.4, 0.4),
      new THREE.MeshStandardMaterial({ map: bookRowTexture(300 + seg), roughness: 0.85 }),
      false,
      false,
    )
    row.rotation.y = Math.PI / 2
    row.position.set(-9.62, 1.48, seg)
    group.add(row)
  }
  // 4冊の本(色ごとにメッシュを作り、状態の並び順で配置)
  const bookMeshes = new Map<BookColor, THREE.Group>()
  for (const color of BOOK_COLORS) {
    const book = new THREE.Group()
    const body = boxMesh(0.24, 0.4, 0.13, materials.paper)
    const spine = meshOf(
      new THREE.PlaneGeometry(0.13, 0.4),
      new THREE.MeshStandardMaterial({ map: bookSpineTexture(color), roughness: 0.75 }),
      false,
      false,
    )
    spine.rotation.y = Math.PI / 2
    spine.position.x = 0.121
    book.add(body, spine)
    group.add(book)
    bookMeshes.set(color, book)
  }
  // 隠し棚(特別な段の下の小さな跳ね戸)
  const hatchHinge = new THREE.Group()
  hatchHinge.position.set(-9.49, 0.94, 0)
  const hatch = boxMesh(0.03, 0.22, 0.5, materials.woodRed, 0, 0.11, 0)
  hatchHinge.add(hatch)
  group.add(hatchHinge)
  const hatchNiche = boxMesh(0.24, 0.24, 0.52, new THREE.MeshBasicMaterial({ color: '#0f0803' }), -9.63, 1.05, 0)
  group.add(hatchNiche)

  const shelfHit = hitbox(0.7, 2.7, 4.4, -9.5, 1.35, 0)
  group.add(shelfHit)
  const slotHits: THREE.Mesh[] = SLOT_Z.map((z) => {
    const hit = hitbox(0.4, 0.48, 0.17, -9.45, 1.5, z)
    group.add(hit)
    return hit
  })

  let selectedSlot: number | null = null

  const layoutBooks = (order: readonly BookColor[], solved: boolean) => {
    order.forEach((color, i) => {
      const book = bookMeshes.get(color)
      const z = SLOT_Z[i]
      if (!book || z === undefined) return
      const pulled = !solved && selectedSlot === i
      book.position.set(-9.66 + (pulled ? 0.1 : 0), 1.5, z)
    })
  }

  const part: BookshelfDevice = {
    group,
    interactables: [
      {
        id: 'bookshelf',
        object: shelfHit,
        context: 'room',
        rooms: ['study'],
        view: 'fv-bookshelf',
        markerAt: new THREE.Vector3(-9.35, 1.5, 0),
      },
      ...slotHits.map(
        (hit, i): Interactable => ({
          id: `bookSlot_${i as 0 | 1 | 2 | 3}` as const,
          object: hit,
          context: 'fv-bookshelf',
        }),
      ),
    ],
    views: [
      {
        id: 'fv-bookshelf',
        room: 'study',
        position: new THREE.Vector3(-8.05, 1.46, 0),
        lookAt: new THREE.Vector3(-9.6, 1.38, 0),
        fov: 46,
      },
    ],
    sync(state) {
      layoutBooks(state.bookOrder, state.flags.bookshelfSolved)
      hatchHinge.rotation.z = state.flags.bookshelfSolved ? -1.5 : 0
    },
    onEvent(event, state) {
      if (event.kind === 'effect' && event.effect === 'bookshelfSecret') {
        selectedSlot = null
        layoutBooks(state.bookOrder, true)
        tweens.add(0.8, (t) => {
          hatchHinge.rotation.z = -1.5 * t
        })
      }
    },
    update() {},
    setSelectedSlot(slot) {
      selectedSlot = slot
    },
  }
  return part
}

/** 肖像画と、その裏の金庫 */
export const buildPortraitSafe = (materials: Materials, tweens: Tweens): DevicePart => {
  const group = new THREE.Group()
  // ---- 金庫(南壁の窪み) ----
  const safeRoot = new THREE.Group()
  safeRoot.position.set(-7.2, 0, 2.52)
  safeRoot.rotation.y = Math.PI // 正面を部屋側(-z)へ
  const safeBodyMaterial = materials.ironDark
  // 前面のない箱(扉が開くと中の暗がりが見える)
  safeRoot.add(boxMesh(0.62, 0.62, 0.05, safeBodyMaterial, 0, 1.5, -0.2))
  safeRoot.add(boxMesh(0.05, 0.62, 0.34, safeBodyMaterial, -0.285, 1.5, -0.05))
  safeRoot.add(boxMesh(0.05, 0.62, 0.34, safeBodyMaterial, 0.285, 1.5, -0.05))
  safeRoot.add(boxMesh(0.62, 0.05, 0.34, safeBodyMaterial, 0, 1.785, -0.05))
  safeRoot.add(boxMesh(0.62, 0.05, 0.34, safeBodyMaterial, 0, 1.215, -0.05))
  const safeInner = boxMesh(0.5, 0.5, 0.02, new THREE.MeshBasicMaterial({ color: '#0b0805' }), 0, 1.5, -0.16)
  safeRoot.add(safeInner)
  // 中身の名残(空・ビロードの敷き)
  const innerCloth = boxMesh(0.4, 0.02, 0.2, materials.velvetRed, 0, 1.26, -0.06)
  safeRoot.add(innerCloth)
  // 扉
  const safeDoorHinge = new THREE.Group()
  safeDoorHinge.position.set(-0.28, 1.5, 0.12)
  const safeDoor = new THREE.Group()
  safeDoor.add(boxMesh(0.54, 0.54, 0.06, safeBodyMaterial, 0.28, 0, 0))
  // 3連ダイヤル
  const ringTexture = digitRingTexture(true)
  const safeDials: THREE.Mesh[] = []
  for (let i = 0; i < 3; i++) {
    const dial = meshOf(
      new THREE.CylinderGeometry(0.045, 0.045, 0.035, 24),
      new THREE.MeshStandardMaterial({ map: ringTexture.clone(), roughness: 0.4, metalness: 0.5 }),
    )
    dial.rotation.z = Math.PI / 2
    // 部屋側から見て i=0 が左に来る並び
    dial.position.set(0.28 - (i - 1) * 0.14, 0.1, 0.045)
    safeDoor.add(dial)
    safeDials.push(dial)
    // 正面の数字を指す刻み
    const pointer = boxMesh(0.008, 0.016, 0.012, materials.brass, 0.28 - (i - 1) * 0.14, 0.148, 0.085)
    safeDoor.add(pointer)
  }
  // 鍵穴と差さった鍵
  const keyPlate = meshOf(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 14), materials.brassDark)
  keyPlate.rotation.x = Math.PI / 2
  keyPlate.position.set(0.28, -0.12, 0.035)
  safeDoor.add(keyPlate)
  const insertedKey = new THREE.Group()
  const keyStem = cylinderMesh(0.008, 0.008, 0.07, materials.brass, 8)
  keyStem.rotation.x = Math.PI / 2
  keyStem.position.set(0.28, -0.12, 0.07)
  const keyBow = meshOf(new THREE.TorusGeometry(0.02, 0.007, 8, 16), materials.brass)
  keyBow.position.set(0.28, -0.12, 0.105)
  insertedKey.add(keyStem, keyBow)
  insertedKey.visible = false
  safeDoor.add(insertedKey)
  // 取っ手
  const handle = boxMesh(0.09, 0.02, 0.02, materials.brass, 0.44, -0.02, 0.05)
  safeDoor.add(handle)
  safeDoorHinge.add(safeDoor)
  safeRoot.add(safeDoorHinge)
  group.add(safeRoot)

  // ---- 肖像画(蝶番で開く) ----
  const portraitHinge = new THREE.Group()
  portraitHinge.position.set(-7.2 + 0.52, 0, 2.42)
  const portrait = new THREE.Group()
  portrait.add(boxMesh(1.04, 1.3, 0.05, materials.brassDark, -0.52, 1.52, 0))
  const canvas = meshOf(
    new THREE.PlaneGeometry(0.92, 1.18),
    new THREE.MeshStandardMaterial({ map: portraitTexture(), roughness: 0.8 }),
    false,
    false,
  )
  canvas.rotation.y = Math.PI
  canvas.position.set(-0.52, 1.52, -0.028)
  portrait.add(canvas)
  portraitHinge.add(portrait)
  group.add(portraitHinge)

  const portraitHit = hitbox(1.2, 1.5, 0.4, -7.2, 1.52, 2.35)
  const safeHit = hitbox(0.7, 0.7, 0.5, -7.2, 1.5, 2.3)
  const keyholeHit = hitbox(0.16, 0.16, 0.3, -7.2, 1.38, 2.36)
  group.add(portraitHit, safeHit, keyholeHit)
  const safeDialHits: THREE.Mesh[] = []
  for (let i = 0; i < 3; i++) {
    const hit = hitbox(0.13, 0.16, 0.24, -7.2 + (i - 1) * 0.14, 1.6, 2.38)
    group.add(hit)
    safeDialHits.push(hit)
  }
  // 取っ手(開ける操作)
  const safeLatchHit = hitbox(0.2, 0.14, 0.24, -7.36, 1.48, 2.38)
  group.add(safeLatchHit)

  return {
    group,
    interactables: [
      {
        id: 'portrait',
        object: portraitHit,
        context: 'room',
        rooms: ['study'],
        markerAt: new THREE.Vector3(-7.2, 1.52, 2.28),
      },
      {
        id: 'safe',
        object: safeHit,
        context: 'room',
        rooms: ['study'],
        view: 'fv-safe',
        markerAt: new THREE.Vector3(-7.2, 1.5, 2.25),
        markerWhen: (s) => s.flags.portraitOpen,
      },
      { id: 'safeKeyhole', object: keyholeHit, context: 'fv-safe' },
      { id: 'safeLatch', object: safeLatchHit, context: 'fv-safe' },
      { id: 'safe', object: cloneInto(safeHit, group), context: 'fv-safe' },
      ...safeDialHits.map(
        (hit, i): Interactable => ({
          id: `safeDial_${i as 0 | 1 | 2}` as const,
          object: hit,
          context: 'fv-safe',
        }),
      ),
    ],
    views: [
      {
        id: 'fv-safe',
        room: 'study',
        position: new THREE.Vector3(-7.2, 1.52, 1.38),
        lookAt: new THREE.Vector3(-7.2, 1.46, 2.45),
        fov: 40,
      },
    ],
    sync(state) {
      // 肖像画は部屋側(−z)へ開く
      portraitHinge.rotation.y = state.flags.portraitOpen ? -1.85 : -0.045
      state.safeDials.forEach((value, i) => {
        const dial = safeDials[i]
        // 正面(視点側)に現在値が来る位相(スクリーンショットで較正済み)
        if (dial) dial.rotation.x = (value / 10) * Math.PI * 2
      })
      insertedKey.visible = state.flags.safeKeyInserted
      safeDoorHinge.rotation.y = state.flags.safeSolved ? -1.9 : 0
    },
    onEvent(event) {
      if (event.kind === 'effect' && event.effect === 'portraitOpen') {
        tweens.add(1.0, (t) => {
          portraitHinge.rotation.y = -0.045 - (1.85 - 0.045) * t
        })
      }
      if (event.kind === 'effect' && event.effect === 'safeKeyIn') {
        insertedKey.visible = true
      }
      if (event.kind === 'effect' && event.effect === 'safeOpen') {
        tweens.add(1.2, (t) => {
          safeDoorHinge.rotation.y = -1.9 * t
        })
      }
    },
    update() {},
  }
}

const cloneInto = (source: THREE.Mesh, parent: THREE.Group): THREE.Mesh => {
  const clone = source.clone()
  parent.add(clone)
  return clone
}
