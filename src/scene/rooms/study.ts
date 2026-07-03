import * as THREE from 'three'
import type { GameEvent } from '../../core/events'
import type { GameState } from '../../core/state'
import type { Tweens } from '../../utils/tween'
import type { Materials } from '../materials'
import { boxMesh, cylinderMesh, hitbox, meshOf } from '../materials'
import { buildCeiling, buildFloor, buildWall } from '../roomShell'
import { nightWindowTexture } from '../textures/art'
import { carpetTexture, damaskTexture } from '../textures/surfaces'
import { glowTextTexture } from '../textures/props'
import type { Interactable, RoomModule, ViewDef } from '../types'
import { buildBookshelf, buildDesk, buildGlobe, buildPortraitSafe } from './studyDevices'
import type { DevicePart } from './livingDevices'

const CX = -7
const W = 6
const D = 5
const H = 3.4

/** 書斎 — 知と仕掛けの間 */
export const buildStudy = (materials: Materials, tweens: Tweens): RoomModule & {
  setBookSelection(slot: number | null): void
} => {
  const group = new THREE.Group()
  const paper = new THREE.MeshStandardMaterial({
    map: damaskTexture('#a8b39a', '#5a7055', 7),
    roughness: 0.88,
  })

  group.add(buildFloor(W, D, materials.floorWood, CX, 0))
  group.add(buildCeiling(W, D, H, materials, CX, 0))
  const north = buildWall(W, H, materials, paper, [
    { center: -1.3, width: 1.3, height: 1.6, bottom: 0.95 },
  ])
  north.position.set(CX, 0, -D / 2)
  group.add(north)
  const south = buildWall(W, H, materials, paper)
  south.rotation.y = Math.PI
  south.position.set(CX, 0, D / 2)
  group.add(south)
  const west = buildWall(D, H, materials, paper)
  west.rotation.y = -Math.PI / 2
  west.position.set(CX - W / 2, 0, 0)
  group.add(west)

  // 鎧戸の窓(細い月光)
  const windowGroup = new THREE.Group()
  windowGroup.position.set(CX - 1.3, 0.95, -D / 2 + 0.02)
  const night = meshOf(
    new THREE.PlaneGeometry(1.5, 1.9),
    new THREE.MeshBasicMaterial({ map: nightWindowTexture(false, 85) }),
    false,
    false,
  )
  night.position.set(0, 0.8, -0.18)
  windowGroup.add(night)
  for (let i = 0; i < 9; i++) {
    const slat = boxMesh(1.26, 0.07, 0.03, materials.woodDark, 0, 0.12 + i * 0.17, 0.02)
    slat.rotation.x = 0.5
    windowGroup.add(slat)
  }
  windowGroup.add(boxMesh(1.36, 0.06, 0.08, materials.woodDark, 0, 1.62, 0))
  windowGroup.add(boxMesh(1.36, 0.06, 0.08, materials.woodDark, 0, 0.0, 0))
  windowGroup.add(boxMesh(0.06, 1.68, 0.08, materials.woodDark, -0.65, 0.81, 0))
  windowGroup.add(boxMesh(0.06, 1.68, 0.08, materials.woodDark, 0.65, 0.81, 0))
  group.add(windowGroup)

  // 敷物(机と椅子のあいだ)
  const rug = meshOf(
    new THREE.PlaneGeometry(2.6, 1.9),
    new THREE.MeshStandardMaterial({ map: carpetTexture(), color: '#9cb0a0', roughness: 0.96 }),
    false,
    true,
  )
  rug.rotation.x = -Math.PI / 2
  rug.position.set(CX, 0.006, 0.3)
  group.add(rug)

  // 夜光の文字(消灯時に現れる)
  const glowMaterial = new THREE.MeshBasicMaterial({
    map: glowTextTexture(),
    transparent: true,
    opacity: 0.03,
    depthWrite: false,
  })
  const glow = meshOf(new THREE.PlaneGeometry(1.7, 0.44), glowMaterial, false, false)
  glow.position.set(CX - 0.1, 1.98, -D / 2 + 0.09)
  group.add(glow)

  // 安楽椅子と本
  const armchair = new THREE.Group()
  armchair.position.set(CX + 1.7, 0, 1.35)
  armchair.rotation.y = -0.7
  armchair.add(boxMesh(0.62, 0.3, 0.6, materials.velvetGreen, 0, 0.32, 0))
  armchair.add(boxMesh(0.62, 0.66, 0.18, materials.velvetGreen, 0, 0.72, 0.32))
  armchair.add(boxMesh(0.14, 0.28, 0.6, materials.velvetGreen, -0.38, 0.6, 0))
  armchair.add(boxMesh(0.14, 0.28, 0.6, materials.velvetGreen, 0.38, 0.6, 0))
  for (const [lx, lz] of [
    [-0.26, -0.24],
    [0.26, -0.24],
    [-0.26, 0.24],
    [0.26, 0.24],
  ] as const) {
    const leg = cylinderMesh(0.03, 0.04, 0.18, materials.woodDark, 8)
    leg.position.set(lx, 0.09, lz)
    armchair.add(leg)
  }
  const restingBook = boxMesh(0.2, 0.04, 0.14, materials.velvetRed, -0.38, 0.76, 0)
  restingBook.rotation.z = 0.1
  armchair.add(restingBook)
  group.add(armchair)

  // 照明スイッチ(入口脇の真鍮プレート)
  const switchPlate = new THREE.Group()
  switchPlate.position.set(-4.09, 1.28, 0.35)
  const plate = boxMesh(0.02, 0.16, 0.09, materials.brass, 0, 0, 0)
  switchPlate.add(plate)
  const lever = boxMesh(0.035, 0.05, 0.02, materials.brassDark, -0.02, 0, 0)
  switchPlate.add(lever)
  group.add(switchPlate)

  // 照明
  const pendant = new THREE.PointLight('#ffcf9a', 15, 0, 2)
  pendant.position.set(CX, 2.7, 0.35)
  pendant.castShadow = true
  pendant.shadow.mapSize.set(1024, 1024)
  pendant.shadow.bias = -0.004
  group.add(pendant)
  const pendantShade = meshOf(
    new THREE.CylinderGeometry(0.16, 0.22, 0.14, 18, 1, true),
    new THREE.MeshStandardMaterial({
      color: '#3e5443',
      emissive: '#ffcf90',
      emissiveIntensity: 1.1,
      side: THREE.DoubleSide,
    }),
    false,
    false,
  )
  pendantShade.position.set(CX, 2.82, 0.35)
  group.add(pendantShade)
  const pendantStem = cylinderMesh(0.01, 0.01, 0.5, materials.brassDark, 8)
  pendantStem.position.set(CX, 3.15, 0.35)
  group.add(pendantStem)
  // 月光(消灯時に頼りになる)
  const moon = new THREE.SpotLight('#9db4ff', 6, 12, 0.5, 0.7, 2)
  moon.position.set(CX - 1.3, 2.5, -3.4)
  moon.target.position.set(CX - 0.6, 0.3, 0.6)
  group.add(moon, moon.target)
  // 扉からの漏れ光
  const doorSpill = new THREE.PointLight('#ffc98a', 2.2, 5, 2)
  doorSpill.position.set(-4.4, 1.7, -0.9)
  group.add(doorSpill)

  // 装置
  const desk = buildDesk(materials, tweens)
  const globe = buildGlobe(materials, tweens)
  const bookshelf = buildBookshelf(materials, tweens)
  const portraitSafe = buildPortraitSafe(materials, tweens)
  const devices: DevicePart[] = [desk, globe, bookshelf, portraitSafe]
  for (const device of devices) {
    group.add(device.group)
    for (const light of device.lights ?? []) group.add(light)
  }

  // 当たり判定
  const switchHit = hitbox(0.3, 0.4, 0.3, -4.12, 1.28, 0.35)
  const armchairHit = hitbox(1.0, 1.2, 1.0, CX + 1.7, 0.6, 1.35)
  const windowHit = hitbox(1.5, 1.9, 0.4, CX - 1.3, 1.7, -D / 2 + 0.12)
  group.add(switchHit, armchairHit, windowHit)

  const interactables: Interactable[] = [
    {
      id: 'lightSwitch',
      object: switchHit,
      context: 'room',
      rooms: ['study'],
      markerAt: new THREE.Vector3(-4.16, 1.28, 0.35),
    },
    {
      id: 'armchair',
      object: armchairHit,
      context: 'room',
      rooms: ['study'],
      markerAt: new THREE.Vector3(CX + 1.7, 0.8, 1.3),
    },
    {
      id: 'studyWindow',
      object: windowHit,
      context: 'room',
      rooms: ['study'],
      markerAt: new THREE.Vector3(CX - 1.3, 1.6, -2.3),
    },
    ...devices.flatMap((device) => device.interactables),
  ]

  const views: ViewDef[] = devices.flatMap((device) => device.views)

  let glowTarget = 0.03

  return {
    group,
    interactables,
    views,
    sync(state: GameState) {
      for (const device of devices) device.sync(state)
      const on = state.studyLightOn
      pendant.intensity = on ? 15 : 0
      ;(pendantShade.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 1.1 : 0.03
      moon.intensity = on ? 6 : 15
      lever.rotation.z = on ? 0.5 : -0.5
      glowTarget = on ? 0.03 : 0.95
    },
    onEvent(event: GameEvent, state: GameState) {
      for (const device of devices) device.onEvent(event, state)
    },
    update(dt: number, time: number) {
      for (const device of devices) device.update(dt, time)
      // 夜光文字はふわっと現れる
      glowMaterial.opacity += (glowTarget - glowMaterial.opacity) * Math.min(1, dt * 3)
    },
    setBookSelection(slot: number | null) {
      bookshelf.setSelectedSlot(slot)
    },
  }
}
