import * as THREE from 'three'
import type { GameState } from '../../core/state'
import type { GameEvent } from '../../core/events'
import type { Materials } from '../materials'
import { boxMesh, hitbox, meshOf } from '../materials'
import { buildWall } from '../roomShell'
import { doorPlateTexture } from '../textures/small'
import type { Interactable, RoomModule } from '../types'
import type { Tweens } from '../../utils/tween'

const DOOR_Z = -0.9
const DOOR_W = 1.0
const DOOR_H = 2.2

/**
 * リビングと寝室・書斎を隔てる共有壁と扉(常に表示)。
 * 扉は開錠フラグに応じて開いた姿を保つ(R-1)。
 */
export const buildBoundaries = (
  materials: Materials,
  paperLiving: THREE.Material,
  tweens: Tweens,
): RoomModule => {
  const group = new THREE.Group()

  const buildBoundary = (x: number, plateLabel: string, openInto: 1 | -1) => {
    const wall = buildWall(6, 3.8, materials, paperLiving, [
      { center: DOOR_Z, width: DOOR_W + 0.12, height: DOOR_H + 0.08 },
    ])
    wall.rotation.y = -Math.PI / 2
    wall.position.set(x, 0, 0)
    group.add(wall)

    // 扉枠
    const frame = new THREE.Group()
    frame.position.set(x, 0, DOOR_Z)
    const frameMaterial = materials.woodDark
    frame.add(boxMesh(0.16, DOOR_H + 0.1, 0.09, frameMaterial, 0, (DOOR_H + 0.1) / 2, -(DOOR_W / 2 + 0.045)))
    frame.add(boxMesh(0.16, DOOR_H + 0.1, 0.09, frameMaterial, 0, (DOOR_H + 0.1) / 2, DOOR_W / 2 + 0.045))
    frame.add(boxMesh(0.16, 0.1, DOOR_W + 0.18, frameMaterial, 0, DOOR_H + 0.05, 0))
    group.add(frame)

    // 扉本体(蝶番は奥側)
    const hinge = new THREE.Group()
    hinge.position.set(x, 0, DOOR_Z - DOOR_W / 2)
    const panel = new THREE.Group()
    const door = boxMesh(0.06, DOOR_H, DOOR_W - 0.04, materials.woodRed, 0, DOOR_H / 2, (DOOR_W - 0.04) / 2 + 0.02)
    panel.add(door)
    // 鏡板(パネル)の彫り
    for (const [py, ph] of [
      [0.62, 0.82],
      [1.62, 0.82],
    ] as const) {
      panel.add(boxMesh(0.02, ph, DOOR_W - 0.3, materials.woodDark, openInto * 0.04, py + 0.1, DOOR_W / 2))
    }
    // 取っ手(両面)
    for (const side of [1, -1]) {
      const knob = meshOf(new THREE.SphereGeometry(0.035, 12, 10), materials.brass)
      knob.position.set(side * 0.07, 1.02, DOOR_W - 0.14)
      panel.add(knob)
    }
    // 部屋札(リビング側)
    const plate = meshOf(
      new THREE.PlaneGeometry(0.09, 0.17),
      new THREE.MeshStandardMaterial({ map: doorPlateTexture(plateLabel), roughness: 0.6 }),
      false,
      false,
    )
    plate.rotation.y = openInto > 0 ? -Math.PI / 2 : Math.PI / 2
    plate.position.set(openInto * -0.035, 1.6, DOOR_W / 2)
    panel.add(plate)
    hinge.add(panel)
    group.add(hinge)
    return hinge
  }

  // 書斎(x=-4)はリビングから見て奥(-x)へ、寝室(x=+4)は(+x)へ開く
  const studyHinge = buildBoundary(-4, '書斎', -1)
  const bedroomHinge = buildBoundary(4, '寝室', 1)

  const doorAngle = (into: 1 | -1): number => into * -1.62

  // 当たり判定
  const studyHit = hitbox(0.5, 2.2, 1.2, -4, 1.1, DOOR_Z)
  const bedroomHit = hitbox(0.5, 2.2, 1.2, 4, 1.1, DOOR_Z)
  group.add(studyHit, bedroomHit)

  const interactables: Interactable[] = [
    {
      id: 'doorStudy',
      object: studyHit,
      context: 'room',
      rooms: ['living', 'study'],
      markerAt: new THREE.Vector3(-3.95, 1.1, DOOR_Z),
      markerWhen: (s: GameState) => !s.flags.studyUnlocked || true,
    },
    {
      id: 'doorBedroom',
      object: bedroomHit,
      context: 'room',
      rooms: ['living', 'bedroom'],
      markerAt: new THREE.Vector3(3.95, 1.1, DOOR_Z),
    },
  ]

  let studyOpen = false
  let bedroomOpen = false

  const sync = (state: GameState) => {
    const wantStudy = state.flags.studyUnlocked
    const wantBedroom = state.flags.bedroomUnlocked
    if (wantStudy !== studyOpen) {
      studyOpen = wantStudy
      studyHinge.rotation.y = wantStudy ? doorAngle(-1) : 0
    }
    if (wantBedroom !== bedroomOpen) {
      bedroomOpen = wantBedroom
      bedroomHinge.rotation.y = wantBedroom ? doorAngle(1) : 0
    }
  }

  const onEvent = (event: GameEvent) => {
    if (event.kind !== 'effect') return
    if (event.effect === 'doorOpenStudy') {
      studyOpen = true
      const from = studyHinge.rotation.y
      tweens.add(1.1, (t) => {
        studyHinge.rotation.y = from + (doorAngle(-1) - from) * t
      })
    }
    if (event.effect === 'doorOpenBedroom') {
      bedroomOpen = true
      const from = bedroomHinge.rotation.y
      tweens.add(1.1, (t) => {
        bedroomHinge.rotation.y = from + (doorAngle(1) - from) * t
      })
    }
  }

  return { group, interactables, views: [], sync, onEvent }
}
