import * as THREE from 'three'
import { MELODY, NOTE_LABELS } from '../../core/constants'
import type { GameEvent } from '../../core/events'
import type { GameState } from '../../core/state'
import { NOTES } from '../../core/types'
import type { Note } from '../../core/types'
import type { Tweens } from '../../utils/tween'
import type { Fire } from '../effects'
import { createFire } from '../effects'
import type { Materials } from '../materials'
import { boxMesh, cylinderMesh, hitbox, meshOf } from '../materials'
import { landscapeTexture } from '../textures/art'
import { clockFaceTexture } from '../textures/props'
import { matchboxTexture, noteLabelsTexture, paperTexture } from '../textures/small'
import type { Interactable, ViewDef } from '../types'

export interface DevicePart {
  group: THREE.Group
  interactables: Interactable[]
  views: ViewDef[]
  lights?: THREE.Light[]
  sync(state: GameState): void
  onEvent(event: GameEvent, state: GameState): void
  update(dt: number, time: number): void
}

/** 暖炉と傾いた絵画 */
export const buildFireplace = (materials: Materials, tweens: Tweens): DevicePart => {
  const group = new THREE.Group()
  // 煙突胸壁
  group.add(boxMesh(2.0, 3.8, 0.34, materials.woodMid, 0, 1.9, -2.93))
  // 大理石の囲い
  group.add(boxMesh(0.24, 1.16, 0.4, materials.marble, -0.72, 0.58, -2.76))
  group.add(boxMesh(0.24, 1.16, 0.4, materials.marble, 0.72, 0.58, -2.76))
  group.add(boxMesh(1.86, 0.14, 0.5, materials.marble, 0, 1.22, -2.72))
  // 火床(照明の影響を受けない煤の闇)
  group.add(boxMesh(1.18, 1.02, 0.04, new THREE.MeshBasicMaterial({ color: '#170e08' }), 0, 0.55, -2.74))
  group.add(boxMesh(1.3, 0.05, 0.5, materials.marble, 0, 0.03, -2.68))
  // 薪
  const logMaterial = materials.woodDark
  for (const [x, y, rz] of [
    [-0.16, 0.12, 0.5],
    [0.14, 0.12, -0.4],
    [0, 0.22, 0.1],
  ] as const) {
    const log = cylinderMesh(0.05, 0.05, 0.5, logMaterial, 8)
    log.rotation.z = Math.PI / 2
    log.rotation.y = rz
    log.position.set(x, y, -2.66)
    group.add(log)
  }
  // 炎
  const fire: Fire = createFire(new THREE.Vector3(0, 0.1, -2.64))
  group.add(fire.group)
  group.add(fire.light)
  // 絵画(初期はわずかに傾いている)
  const paintingGroup = new THREE.Group()
  paintingGroup.position.set(0, 2.1, -2.72)
  const frameMat = materials.brassDark
  paintingGroup.add(boxMesh(1.36, 0.96, 0.05, frameMat, 0, 0, -0.02))
  const art = meshOf(
    new THREE.PlaneGeometry(1.22, 0.82),
    new THREE.MeshStandardMaterial({ map: landscapeTexture(), roughness: 0.85 }),
    false,
    false,
  )
  art.position.z = 0.011
  paintingGroup.add(art)
  paintingGroup.rotation.z = 0.055
  group.add(paintingGroup)
  // 落ちる便箋(演出用・普段は非表示)
  const fallingLetter = meshOf(
    new THREE.PlaneGeometry(0.18, 0.26),
    new THREE.MeshStandardMaterial({ map: paperTexture('blank'), side: THREE.DoubleSide }),
    false,
    false,
  )
  fallingLetter.visible = false
  group.add(fallingLetter)

  const fireplaceHit = hitbox(1.7, 1.3, 0.7, 0, 0.6, -2.7)
  const paintingHit = hitbox(1.5, 1.1, 0.3, 0, 2.1, -2.75)
  group.add(fireplaceHit, paintingHit)

  return {
    group,
    interactables: [
      {
        id: 'fireplace',
        object: fireplaceHit,
        context: 'room',
        rooms: ['living'],
        view: 'fv-fireplace',
        markerAt: new THREE.Vector3(0, 0.75, -2.62),
      },
      {
        id: 'painting',
        object: paintingHit,
        context: 'room',
        rooms: ['living'],
        markerAt: new THREE.Vector3(0.5, 2.0, -2.66),
      },
      { id: 'fireplace', object: hitboxClone(fireplaceHit, group), context: 'fv-fireplace' },
      { id: 'painting', object: hitboxClone(paintingHit, group), context: 'fv-fireplace' },
    ],
    views: [
      {
        id: 'fv-fireplace',
        room: 'living',
        position: new THREE.Vector3(0, 1.4, -1.0),
        lookAt: new THREE.Vector3(0, 0.85, -2.8),
        fov: 52,
      },
    ],
    lights: [],
    sync(state) {
      fire.setLit(state.flags.fireplaceLit)
      paintingGroup.rotation.z = state.flags.paintingMoved ? 0 : 0.055
    },
    onEvent(event) {
      if (event.kind === 'effect' && event.effect === 'paintingDrop') {
        tweens.add(0.5, (t) => {
          paintingGroup.rotation.z = 0.055 * (1 - t)
        })
        fallingLetter.visible = true
        fallingLetter.position.set(0.28, 1.7, -2.6)
        fallingLetter.rotation.set(0, 0.4, 0.2)
        tweens.add(
          0.7,
          (t) => {
            fallingLetter.position.y = 1.7 - t * 1.55
            fallingLetter.rotation.z = 0.2 + t * 1.1
            fallingLetter.rotation.x = -t * 1.2
          },
          () => {
            fallingLetter.visible = false
          },
        )
      }
      if (event.kind === 'effect' && event.effect === 'fireplaceLight') {
        fire.setLit(true)
      }
    },
    update(dt, time) {
      fire.update(dt, time)
    },
  }
}

/** 当たり判定の複製(注視ビュー用に同じ位置へ) */
const hitboxClone = (source: THREE.Mesh, parent: THREE.Group): THREE.Mesh => {
  const clone = source.clone()
  parent.add(clone)
  return clone
}

/** 柱時計(針合わせ) */
export const buildClock = (materials: Materials, tweens: Tweens): DevicePart => {
  const group = new THREE.Group()
  const baseX = 2.68
  const baseZ = -2.7
  // 筐体
  group.add(boxMesh(0.6, 2.4, 0.38, materials.woodRed, baseX, 1.2, baseZ))
  group.add(boxMesh(0.7, 0.12, 0.46, materials.woodDark, baseX, 2.42, baseZ))
  group.add(boxMesh(0.7, 0.12, 0.46, materials.woodDark, baseX, 0.06, baseZ))
  // 文字盤(部屋側 +z を向く円盤)
  const face = meshOf(
    new THREE.CircleGeometry(0.23, 40),
    new THREE.MeshStandardMaterial({ map: clockFaceTexture(), roughness: 0.5 }),
    false,
    false,
  )
  face.position.set(baseX, 1.82, baseZ + 0.206)
  group.add(face)
  const bezel = meshOf(new THREE.TorusGeometry(0.235, 0.02, 10, 40), materials.brass)
  bezel.position.set(baseX, 1.82, baseZ + 0.21)
  group.add(bezel)
  // 針(z+ 方向に向けて配置)
  const handMaterial = new THREE.MeshStandardMaterial({ color: '#26180c', roughness: 0.4 })
  const hourHand = boxMesh(0.02, 0.12, 0.008, handMaterial)
  hourHand.geometry.translate(0, 0.055, 0)
  hourHand.position.set(baseX, 1.82, baseZ + 0.225)
  const minuteHand = boxMesh(0.014, 0.18, 0.008, handMaterial)
  minuteHand.geometry.translate(0, 0.08, 0)
  minuteHand.position.set(baseX, 1.82, baseZ + 0.232)
  group.add(hourHand, minuteHand)
  const pin = meshOf(new THREE.SphereGeometry(0.015, 10, 8), materials.brass)
  pin.position.set(baseX, 1.82, baseZ + 0.235)
  group.add(pin)
  // 振り子窓(躯体より手前に、闇→振り子→ガラスの順で重ねる)
  group.add(boxMesh(0.42, 1.14, 0.015, new THREE.MeshBasicMaterial({ color: '#120a06' }), baseX, 0.95, baseZ + 0.196))
  group.add(boxMesh(0.4, 1.1, 0.01, materials.glass, baseX, 0.95, baseZ + 0.235))
  const pendulum = new THREE.Group()
  pendulum.position.set(baseX, 1.45, baseZ + 0.215)
  const rod = boxMesh(0.012, 0.72, 0.01, materials.brassDark, 0, -0.36, 0)
  const bob = meshOf(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 20), materials.brass)
  bob.rotation.x = Math.PI / 2
  bob.position.set(0, -0.72, 0)
  pendulum.add(rod, bob)
  group.add(pendulum)
  // 台座の小扉(寝室の鍵の出所)
  const hatchHinge = new THREE.Group()
  hatchHinge.position.set(baseX - 0.14, 0.3, baseZ + 0.19)
  const hatch = boxMesh(0.28, 0.3, 0.02, materials.woodDark, 0.14, 0, 0)
  hatchHinge.add(hatch)
  group.add(hatchHinge)

  const clockHit = hitbox(0.8, 2.5, 0.6, baseX, 1.2, baseZ)
  group.add(clockHit)

  let swinging = false

  return {
    group,
    interactables: [
      {
        id: 'clock',
        object: clockHit,
        context: 'room',
        rooms: ['living'],
        view: 'fv-clock',
        markerAt: new THREE.Vector3(baseX, 1.7, baseZ + 0.3),
      },
    ],
    views: [
      {
        id: 'fv-clock',
        room: 'living',
        position: new THREE.Vector3(baseX, 1.7, baseZ + 1.6),
        lookAt: new THREE.Vector3(baseX, 1.58, baseZ),
        fov: 46,
      },
    ],
    sync(state) {
      const { hour, minute } = state.clock
      hourHand.rotation.z = -((hour % 12) / 12 + minute / 720) * Math.PI * 2
      minuteHand.rotation.z = -(minute / 60) * Math.PI * 2
      swinging = state.flags.clockSolved
      hatchHinge.rotation.y = state.flags.clockSolved ? -1.8 : 0
    },
    onEvent(event) {
      if (event.kind === 'effect' && event.effect === 'clockSolved') {
        swinging = true
        hatchHinge.rotation.y = 0
        tweens.add(0.9, (t) => {
          hatchHinge.rotation.y = -1.8 * t
        })
      }
    },
    update(_dt, time) {
      pendulum.rotation.z = swinging ? Math.sin(time * 2.6) * 0.16 : 0
    },
  }
}

/** 飾り棚とオルゴール */
export const buildCabinet = (materials: Materials, tweens: Tweens): DevicePart => {
  const group = new THREE.Group()
  const bx = -2.7
  const bz = -2.7
  // 筐体は前面のない箱(硝子戸越しに中が見える)+棚板
  group.add(boxMesh(1.3, 1.9, 0.05, materials.woodRed, bx, 0.95, bz - 0.175))
  group.add(boxMesh(0.07, 1.9, 0.4, materials.woodRed, bx - 0.615, 0.95, bz))
  group.add(boxMesh(0.07, 1.9, 0.4, materials.woodRed, bx + 0.615, 0.95, bz))
  group.add(boxMesh(1.3, 0.07, 0.4, materials.woodRed, bx, 1.865, bz))
  group.add(boxMesh(1.3, 0.5, 0.4, materials.woodRed, bx, 0.25, bz))
  group.add(boxMesh(1.16, 0.03, 0.32, materials.woodDark, bx, 1.06, bz + 0.02))
  group.add(boxMesh(1.16, 0.03, 0.32, materials.woodDark, bx, 0.52, bz + 0.02))
  // 内側をくり抜いた見た目(照明に影響されない暗がり)
  const innerShadow = boxMesh(1.16, 1.3, 0.01, new THREE.MeshBasicMaterial({ color: '#170d07' }), bx, 1.24, bz - 0.15)
  innerShadow.castShadow = false
  group.add(innerShadow)
  // ガラス扉(框組み+ガラス。中のオルゴールが透けて見える)
  const buildGlassDoor = (mirror: 1 | -1): THREE.Group => {
    const door = new THREE.Group()
    const cx = mirror * 0.29
    door.add(boxMesh(0.58, 0.07, 0.03, materials.woodRed, cx, 0.635, 0))
    door.add(boxMesh(0.58, 0.07, 0.03, materials.woodRed, cx, -0.635, 0))
    door.add(boxMesh(0.06, 1.34, 0.03, materials.woodRed, cx - mirror * 0.26, 0, 0))
    door.add(boxMesh(0.06, 1.34, 0.03, materials.woodRed, cx + mirror * 0.26, 0, 0))
    const glass = boxMesh(0.47, 1.22, 0.012, materials.glass, cx, 0, 0)
    glass.castShadow = false
    door.add(glass)
    return door
  }
  const leftHinge = new THREE.Group()
  leftHinge.position.set(bx - 0.62, 1.24, bz + 0.2)
  leftHinge.add(buildGlassDoor(1))
  const rightHinge = new THREE.Group()
  rightHinge.position.set(bx + 0.62, 1.24, bz + 0.2)
  const rightDoorGroup = buildGlassDoor(-1)
  rightHinge.add(rightDoorGroup)
  group.add(leftHinge, rightHinge)
  // 鍵穴の飾り(右扉の内側の框に付く)
  const keyholePlate = meshOf(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 12), materials.brass)
  keyholePlate.rotation.x = Math.PI / 2
  keyholePlate.position.set(-0.03, -0.14, 0.025)
  rightDoorGroup.add(keyholePlate)
  // マッチ箱(開けると取得済みになるので非表示化)
  const matchbox = boxMesh(
    0.16,
    0.05,
    0.1,
    new THREE.MeshStandardMaterial({ map: matchboxTexture(), roughness: 0.7 }),
    bx - 0.3,
    0.575,
    bz + 0.05,
  )
  matchbox.rotation.y = 0.4
  group.add(matchbox)
  // オルゴール
  const musicBox = new THREE.Group()
  musicBox.position.set(bx + 0.18, 1.075, bz + 0.02)
  musicBox.add(boxMesh(0.3, 0.12, 0.2, materials.woodMid, 0, 0.06, 0))
  const lidHinge = new THREE.Group()
  lidHinge.position.set(0, 0.12, -0.1)
  const lid = boxMesh(0.3, 0.02, 0.2, materials.woodDark, 0, 0.01, 0.1)
  lidHinge.add(lid)
  musicBox.add(lidHinge)
  // 中のシリンダー(蓋が開くと見える)
  const cylinder = cylinderMesh(0.035, 0.035, 0.2, materials.brass, 14)
  cylinder.rotation.z = Math.PI / 2
  cylinder.position.set(0, 0.09, -0.03)
  musicBox.add(cylinder)
  const windSocket = meshOf(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 10), materials.brassDark)
  windSocket.rotation.x = Math.PI / 2
  windSocket.position.set(0, 0.06, 0.11)
  musicBox.add(windSocket)
  group.add(musicBox)

  const cabinetHit = hitbox(1.5, 2.0, 0.7, bx, 1.0, bz)
  const musicBoxHit = hitbox(0.45, 0.3, 0.4, bx + 0.18, 1.15, bz + 0.02)
  group.add(cabinetHit, musicBoxHit)

  let melodyTimer = 0

  return {
    group,
    interactables: [
      {
        id: 'cabinet',
        object: cabinetHit,
        context: 'room',
        rooms: ['living'],
        view: 'fv-cabinet',
        markerAt: new THREE.Vector3(bx, 1.15, bz + 0.35),
      },
      { id: 'musicBox', object: musicBoxHit, context: 'fv-cabinet' },
      { id: 'cabinet', object: hitboxClone(cabinetHit, group), context: 'fv-cabinet' },
    ],
    views: [
      {
        id: 'fv-cabinet',
        room: 'living',
        position: new THREE.Vector3(bx, 1.32, bz + 1.65),
        lookAt: new THREE.Vector3(bx, 1.0, bz),
        fov: 48,
      },
    ],
    sync(state) {
      const open = state.flags.cabinetUnlocked
      leftHinge.rotation.y = open ? -2.35 : 0
      rightHinge.rotation.y = open ? 2.35 : 0
      matchbox.visible = !open
      lidHinge.rotation.x = state.flags.musicBoxWound ? -1.9 : 0
    },
    onEvent(event, state) {
      if (event.kind === 'effect' && event.effect === 'cabinetOpen') {
        tweens.add(0.9, (t) => {
          leftHinge.rotation.y = -2.35 * t
          rightHinge.rotation.y = 2.35 * t
        })
        matchbox.visible = false
      }
      if (event.kind === 'melody') {
        if (!state.flags.musicBoxWound) return
        lidHinge.rotation.x = -1.9
        melodyTimer = MELODY.length * 0.72 + 0.8
      }
    },
    update(dt) {
      if (melodyTimer > 0) {
        melodyTimer -= dt
        cylinder.rotation.x += dt * 2.4
      }
    },
  }
}

/** アップライトピアノ(旋律再現) */
export const buildPiano = (materials: Materials, tweens: Tweens): DevicePart => {
  const group = new THREE.Group()
  group.position.set(-3.58, 0, 1.4)
  group.rotation.y = Math.PI / 2 // 東(部屋の中央)を向く
  // 本体
  group.add(boxMesh(1.42, 1.24, 0.42, materials.woodRed, 0, 0.62, -0.13))
  group.add(boxMesh(1.42, 0.05, 0.34, materials.woodDark, 0, 1.26, -0.1))
  // 鍵盤棚
  group.add(boxMesh(1.3, 0.06, 0.3, materials.woodDark, 0, 0.74, 0.13))
  // 譜面台に置かれた音名札
  const labels = meshOf(
    new THREE.PlaneGeometry(0.72, 0.09),
    new THREE.MeshStandardMaterial({ map: noteLabelsTexture(NOTES.map((n) => NOTE_LABELS[n])) }),
    false,
    false,
  )
  labels.position.set(0, 1.06, 0.085)
  labels.rotation.x = -0.15
  group.add(labels)
  // 8つの鍵(ドレミファソラシド)
  const keyMeshes = new Map<Note, THREE.Mesh>()
  const keyMaterial = new THREE.MeshStandardMaterial({ color: '#eee7d8', roughness: 0.35 })
  const keyWidth = 0.088
  NOTES.forEach((note, i) => {
    const key = boxMesh(keyWidth - 0.008, 0.025, 0.22, keyMaterial.clone(), (i - 3.5) * keyWidth, 0.785, 0.16)
    group.add(key)
    keyMeshes.set(note, key)
  })
  // 両端の飾り鍵(黒)
  const blackMaterial = new THREE.MeshStandardMaterial({ color: '#181410', roughness: 0.3 })
  for (const i of [-4.5, 4.5]) {
    group.add(boxMesh(keyWidth - 0.01, 0.03, 0.2, blackMaterial, i * keyWidth, 0.79, 0.15))
  }
  // 隠し引き出し
  const drawer = new THREE.Group()
  drawer.position.set(0, 0.62, 0.1)
  drawer.add(boxMesh(0.5, 0.09, 0.24, materials.woodDark, 0, 0, 0))
  const felt = boxMesh(0.44, 0.02, 0.18, new THREE.MeshStandardMaterial({ color: '#2c4a3a', roughness: 1 }), 0, 0.04, 0)
  drawer.add(felt)
  group.add(drawer)
  // 椅子
  const stool = new THREE.Group()
  stool.position.set(0, 0, 0.62)
  stool.add(boxMesh(0.5, 0.06, 0.34, materials.velvetRed, 0, 0.46, 0))
  for (const [sx, sz] of [
    [-0.2, -0.12],
    [0.2, -0.12],
    [-0.2, 0.12],
    [0.2, 0.12],
  ] as const) {
    stool.add(boxMesh(0.05, 0.46, 0.05, materials.woodDark, sx, 0.23, sz))
  }
  group.add(stool)

  const pianoHit = hitbox(1.6, 1.5, 1.0, 0, 0.75, 0.2)
  group.add(pianoHit)

  const keyHits = new Map<Note, THREE.Mesh>()
  NOTES.forEach((note, i) => {
    const hit = hitbox(keyWidth, 0.1, 0.3, (i - 3.5) * keyWidth, 0.79, 0.16)
    group.add(hit)
    keyHits.set(note, hit)
  })

  const dips = new Map<Note, number>()

  return {
    group,
    interactables: [
      {
        id: 'piano',
        object: pianoHit,
        context: 'room',
        rooms: ['living'],
        view: 'fv-piano',
        markerAt: new THREE.Vector3(-3.5, 1.0, 1.4),
      },
      ...NOTES.map(
        (note): Interactable => ({
          id: `pianoKey_${note}` as const,
          object: keyHits.get(note) as THREE.Object3D,
          context: 'fv-piano',
        }),
      ),
    ],
    views: [
      {
        id: 'fv-piano',
        room: 'living',
        position: new THREE.Vector3(-2.62, 1.35, 1.4),
        lookAt: new THREE.Vector3(-3.55, 0.82, 1.4),
        fov: 44,
      },
    ],
    sync(state) {
      drawer.position.z = state.flags.pianoSolved ? 0.36 : 0.1
    },
    onEvent(event) {
      if (event.kind === 'note') {
        dips.set(event.note, 0.14)
      }
      if (event.kind === 'effect' && event.effect === 'pianoDrawer') {
        tweens.add(0.8, (t) => {
          drawer.position.z = 0.1 + 0.26 * t
        })
      }
    },
    update(dt) {
      for (const [note, remain] of dips) {
        const key = keyMeshes.get(note)
        if (!key) continue
        const next = remain - dt
        key.position.y = next > 0 ? 0.773 : 0.785
        if (next <= 0) dips.delete(note)
        else dips.set(note, next)
      }
    },
  }
}
