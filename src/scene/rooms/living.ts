import * as THREE from 'three'
import type { GameEvent } from '../../core/events'
import type { GameState } from '../../core/state'
import type { Tweens } from '../../utils/tween'
import { createDust } from '../effects'
import { getQualityTier } from '../quality'
import type { Materials } from '../materials'
import { boxMesh, cylinderMesh, hitbox, meshOf } from '../materials'
import { buildCeiling, buildFloor, buildWall, buildWindow } from '../roomShell'
import { damaskTexture } from '../textures/surfaces'
import { carpetTexture } from '../textures/surfaces'
import { stainedGlassTexture } from '../textures/art'
import { paperTexture } from '../textures/small'
import type { Interactable, RoomModule, ViewDef } from '../types'
import { buildCabinet, buildClock, buildFireplace, buildPiano } from './livingDevices'
import type { DevicePart } from './livingDevices'

const W = 8
const D = 6
const H = 3.8

/** リビング(応接間)— 火と時間の間 */
export const buildLiving = (materials: Materials, tweens: Tweens): RoomModule => {
  const group = new THREE.Group()
  const paper = new THREE.MeshStandardMaterial({
    map: damaskTexture('#c9b393', '#8e5a5e', 5),
    roughness: 0.85,
  })

  // 床・天井・壁
  group.add(buildFloor(W, D, materials.floorWood))
  group.add(buildCeiling(W, D, H, materials))
  const north = buildWall(W, H, materials, paper)
  north.position.set(0, 0, -D / 2)
  group.add(north)
  const south = buildWall(W, H, materials, paper, [
    { center: 0, width: 2.0, height: 3.44 }, // 扉+欄間ステンドグラスの分
    { center: -2.55, width: 1.2, height: 1.8, bottom: 0.85 },
    { center: 2.55, width: 1.2, height: 1.8, bottom: 0.85 },
  ])
  south.rotation.y = Math.PI
  south.position.set(0, 0, D / 2)
  group.add(south)

  // 南側の窓(臙脂のカーテン)— 壁からのオフセットは枠の前面が壁面と同一平面にならない値にする(Zファイティング防止)
  for (const x of [-2.55, 2.55]) {
    const window = buildWindow(1.14, 1.76, materials, { curtainColor: '#6e2836', seed: 82 + x })
    window.rotation.y = Math.PI
    window.position.set(x, 0.85, D / 2 - 0.035)
    group.add(window)
  }

  // 玄関(両開き)— 部屋側(-z)を正面にするため全体を回す
  const entrance = new THREE.Group()
  entrance.position.set(0, 0, D / 2 - 0.04)
  entrance.rotation.y = Math.PI
  const doorPanels: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group()
    hinge.position.set(side * 0.95, 0, 0)
    const panel = new THREE.Group()
    const door = boxMesh(0.92, 2.6, 0.08, materials.woodRed, -side * 0.46, 1.3, 0)
    panel.add(door)
    for (const [py, ph] of [
      [0.75, 1.0],
      [1.95, 0.9],
    ] as const) {
      panel.add(boxMesh(0.66, ph, 0.02, materials.woodDark, -side * 0.46, py, 0.05))
    }
    const handle = cylinderMesh(0.02, 0.02, 0.24, materials.brass, 10)
    handle.position.set(-side * 0.75, 1.25, 0.08)
    panel.add(handle)
    hinge.add(panel)
    entrance.add(hinge)
    doorPanels.push(hinge)
  }
  // 欄間のステンドグラス(夜の光が透ける)
  const transom = meshOf(
    new THREE.PlaneGeometry(1.9, 0.72),
    new THREE.MeshBasicMaterial({ map: stainedGlassTexture(), side: THREE.DoubleSide }),
    false,
    false,
  )
  transom.position.set(0, 3.06, 0)
  entrance.add(transom)
  const transomFrame = boxMesh(2.0, 0.09, 0.14, materials.woodDark, 0, 2.66, 0)
  entrance.add(transomFrame)
  group.add(entrance)

  // 絨毯・ソファ・ローテーブル
  const carpet = meshOf(
    new THREE.PlaneGeometry(3.7, 2.7),
    new THREE.MeshStandardMaterial({ map: carpetTexture(), color: '#c9beb2', roughness: 0.96 }),
    false,
    true,
  )
  carpet.rotation.x = -Math.PI / 2
  carpet.position.set(0, 0.006, 0.35)
  group.add(carpet)

  const sofa = new THREE.Group()
  sofa.position.set(0, 0, 1.45)
  sofa.add(boxMesh(2.0, 0.34, 0.85, materials.velvetRed, 0, 0.3, 0))
  // 座クッション
  sofa.add(boxMesh(0.92, 0.14, 0.72, materials.velvetRed, -0.49, 0.52, 0.03))
  sofa.add(boxMesh(0.92, 0.14, 0.72, materials.velvetRed, 0.49, 0.52, 0.03))
  // 背もたれ・肘掛け
  sofa.add(boxMesh(2.0, 0.62, 0.22, materials.velvetRed, 0, 0.75, 0.4))
  sofa.add(boxMesh(0.24, 0.36, 0.8, materials.velvetRed, -1.06, 0.62, 0))
  sofa.add(boxMesh(0.24, 0.36, 0.8, materials.velvetRed, 1.06, 0.62, 0))
  // 木枠と脚
  sofa.add(boxMesh(2.24, 0.08, 0.9, materials.woodDark, 0, 0.12, 0))
  for (const [lx, lz] of [
    [-1.0, -0.36],
    [1.0, -0.36],
    [-1.0, 0.36],
    [1.0, 0.36],
  ] as const) {
    const leg = cylinderMesh(0.035, 0.05, 0.14, materials.woodDark, 10)
    leg.position.set(lx, 0.06, lz)
    sofa.add(leg)
  }
  group.add(sofa)

  // カメラ位置(z=0.55)の真下に来て気づきにくかったため、暖炉寄り(-z側)へ動かす
  const table = new THREE.Group()
  table.position.set(0, 0, -0.5)
  table.add(boxMesh(1.15, 0.05, 0.62, materials.woodRed, 0, 0.44, 0))
  table.add(boxMesh(1.0, 0.04, 0.5, materials.woodDark, 0, 0.24, 0))
  for (const [lx, lz] of [
    [-0.5, -0.24],
    [0.5, -0.24],
    [-0.5, 0.24],
    [0.5, 0.24],
  ] as const) {
    const leg = cylinderMesh(0.028, 0.04, 0.42, materials.woodDark, 10)
    leg.position.set(lx, 0.22, lz)
    table.add(leg)
  }
  // 子爵の手紙と紅茶
  const letter = meshOf(
    new THREE.PlaneGeometry(0.2, 0.28),
    new THREE.MeshStandardMaterial({ map: paperTexture('letter'), color: '#cfc7b4', roughness: 1 }),
    false,
    false,
  )
  letter.rotation.x = -Math.PI / 2
  letter.rotation.z = 0.3
  letter.position.set(-0.15, 0.47, 0.05)
  table.add(letter)
  const teacup = cylinderMesh(0.045, 0.032, 0.05, new THREE.MeshStandardMaterial({ color: '#e8e2d4', roughness: 0.35 }), 14)
  teacup.position.set(0.3, 0.5, -0.08)
  table.add(teacup)
  const saucer = cylinderMesh(0.07, 0.075, 0.012, new THREE.MeshStandardMaterial({ color: '#e8e2d4', roughness: 0.35 }), 16)
  saucer.position.set(0.3, 0.475, -0.08)
  table.add(saucer)
  group.add(table)

  // 蓄音機(ラッパはソファ方向を向く。gramophone→sofa のベクトルとラッパの向きの
  // 内積が最大になる回転を数値計算で求めた結果、回転なしが最適だった)
  const gramophone = new THREE.Group()
  gramophone.position.set(3.5, 0, 1.6)
  gramophone.add(boxMesh(0.6, 0.72, 0.5, materials.woodRed, 0, 0.36, 0))
  gramophone.add(boxMesh(0.5, 0.14, 0.42, materials.woodDark, 0, 0.79, 0))
  const hornPoints: THREE.Vector2[] = []
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    hornPoints.push(new THREE.Vector2(0.02 + Math.pow(t, 2.2) * 0.26, t * 0.42))
  }
  // 片面(外側)しか生成されない形状のため、向きを変えると内側の非表示面が
  // カメラを向いてしまう。両面描画にして、どちら向きでも見えるようにする
  const horn = meshOf(
    new THREE.LatheGeometry(hornPoints, 20),
    new THREE.MeshStandardMaterial({ color: materials.brass.color, metalness: 0.88, roughness: 0.32, side: THREE.DoubleSide }),
  )
  horn.rotation.z = 0.9
  horn.rotation.x = 0.2
  horn.position.set(0.05, 0.95, 0)
  gramophone.add(horn)
  const crank = cylinderMesh(0.012, 0.012, 0.16, materials.brassDark, 8)
  crank.rotation.z = Math.PI / 2
  crank.position.set(-0.34, 0.6, 0)
  gramophone.add(crank)
  group.add(gramophone)

  // シャンデリア
  const chandelier = new THREE.Group()
  chandelier.position.set(0, H, 0.2)
  const stem = cylinderMesh(0.015, 0.015, 0.6, materials.brassDark, 8)
  stem.position.y = -0.3
  chandelier.add(stem)
  const ring = meshOf(new THREE.TorusGeometry(0.34, 0.02, 10, 28), materials.brass)
  ring.rotation.x = Math.PI / 2
  ring.position.y = -0.66
  chandelier.add(ring)
  const bulbMaterial = new THREE.MeshStandardMaterial({
    color: '#fff2d8',
    emissive: '#ffc978',
    emissiveIntensity: 2.4,
  })
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const arm = cylinderMesh(0.008, 0.008, 0.16, materials.brassDark, 6)
    arm.position.set(Math.cos(angle) * 0.34, -0.58, Math.sin(angle) * 0.34)
    chandelier.add(arm)
    const bulb = meshOf(new THREE.SphereGeometry(0.035, 12, 10), bulbMaterial, false, false)
    bulb.position.set(Math.cos(angle) * 0.34, -0.48, Math.sin(angle) * 0.34)
    chandelier.add(bulb)
  }
  group.add(chandelier)

  // 主照明
  const mainLight = new THREE.PointLight('#ffc98a', 40, 0, 2)
  mainLight.position.set(0, 2.95, 0.2)
  mainLight.castShadow = true
  const shadowMapSize = getQualityTier().shadowMapSize
  mainLight.shadow.mapSize.set(shadowMapSize, shadowMapSize)
  mainLight.shadow.bias = -0.004
  group.add(mainLight)
  const ambient = new THREE.PointLight('#8a7a9a', 6, 0, 2)
  ambient.position.set(0, 1.8, 1.6)
  group.add(ambient)

  // 塵
  const dust = createDust(new THREE.Vector3(0, 1.6, 0), new THREE.Vector3(5, 2.4, 4), 60)
  group.add(dust.points)

  // 装置(暖炉・時計・棚・ピアノ)
  const devices: DevicePart[] = [
    buildFireplace(materials, tweens),
    buildClock(materials, tweens),
    buildCabinet(materials, tweens),
    buildPiano(materials, tweens),
  ]
  for (const device of devices) group.add(device.group)

  // 当たり判定
  const sofaHit = hitbox(2.3, 1.1, 1.1, 0, 0.55, 1.45)
  const tableHit = hitbox(1.3, 0.5, 0.8, 0, 0.35, -0.5)
  const gramophoneHit = hitbox(0.9, 1.5, 0.8, 3.5, 0.7, 1.6)
  const entranceHit = hitbox(2.1, 2.7, 0.5, 0, 1.3, D / 2 - 0.1)
  const windowHit = hitbox(1.3, 1.9, 0.4, -2.55, 1.75, D / 2 - 0.15)
  group.add(sofaHit, tableHit, gramophoneHit, entranceHit, windowHit)

  const interactables: Interactable[] = [
    { id: 'sofa', object: sofaHit, context: 'room', rooms: ['living'], markerAt: new THREE.Vector3(0, 0.62, 1.0) },
    {
      id: 'lowTable',
      object: tableHit,
      context: 'room',
      rooms: ['living'],
      view: 'fv-table',
      markerAt: new THREE.Vector3(-0.15, 0.55, -0.55),
    },
    { id: 'lowTable', object: cloneHit(tableHit, group), context: 'fv-table' },
    { id: 'sofa', object: cloneHit(sofaHit, group), context: 'fv-table' },
    {
      id: 'gramophone',
      object: gramophoneHit,
      context: 'room',
      rooms: ['living'],
      markerAt: new THREE.Vector3(3.4, 1.0, 1.55),
    },
    {
      id: 'entranceDoor',
      object: entranceHit,
      context: 'room',
      rooms: ['living'],
      markerAt: new THREE.Vector3(0, 1.25, 2.75),
    },
    {
      id: 'livingWindow',
      object: windowHit,
      context: 'room',
      rooms: ['living'],
      markerAt: new THREE.Vector3(-2.55, 1.7, 2.7),
    },
    ...devices.flatMap((device) => device.interactables),
  ]

  const views: ViewDef[] = [
    {
      id: 'fv-table',
      room: 'living',
      position: new THREE.Vector3(0, 1.45, 0.45),
      lookAt: new THREE.Vector3(-0.05, 0.48, -0.58),
    },
    ...devices.flatMap((device) => device.views),
  ]

  return {
    group,
    interactables,
    views,
    sync(state: GameState) {
      for (const device of devices) device.sync(state)
      // 脱出後は玄関が開いている
      const open = state.flags.entranceUnlocked
      doorPanels[0]!.rotation.y = open ? 1.7 : 0
      doorPanels[1]!.rotation.y = open ? -1.7 : 0
    },
    onEvent(event: GameEvent, state: GameState) {
      for (const device of devices) device.onEvent(event, state)
      if (event.kind === 'effect' && event.effect === 'escape') {
        tweens.add(1.6, (t) => {
          doorPanels[0]!.rotation.y = 1.7 * t
          doorPanels[1]!.rotation.y = -1.7 * t
        })
      }
    },
    update(dt: number, time: number) {
      for (const device of devices) device.update(dt, time)
      dust.update(time)
    },
  }
}

const cloneHit = (source: THREE.Mesh, parent: THREE.Group): THREE.Mesh => {
  const clone = source.clone()
  parent.add(clone)
  return clone
}
