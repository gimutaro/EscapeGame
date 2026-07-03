import * as THREE from 'three'
import type { GameEvent } from '../core/events'
import type { GameState } from '../core/state'
import type { RoomId } from '../core/types'
import type { Tweens } from '../utils/tween'
import { createSparkles } from './effects'
import type { Engine } from './engine'
import { createMaterials } from './materials'
import { buildBedroom } from './rooms/bedroom'
import { buildBoundaries } from './rooms/boundaries'
import { buildLiving } from './rooms/living'
import { buildStudy } from './rooms/study'
import { damaskTexture } from './textures/surfaces'
import type { Interactable, RoomModule, ViewDef } from './types'

/** 開錠のきらめきを出す位置(EV-01) */
const SPARKLE_AT: Partial<Record<string, [number, number, number]>> = {
  cabinetOpen: [-2.7, 1.25, -2.4],
  clockSolved: [2.68, 0.5, -2.35],
  pianoDrawer: [-3.4, 0.68, 1.4],
  doorOpenBedroom: [3.95, 1.15, -0.9],
  doorOpenStudy: [-3.95, 1.15, -0.9],
  jewelryOpen: [9.7, 0.98, 1.62],
  wardrobeOpen: [7 - 0.4, 1.3, 2.0],
  bookshelfSecret: [-9.35, 1.12, 0],
  globeOpen: [-5.85, 1.35, -1.45],
  safeOpen: [-7.2, 1.5, 2.15],
  escape: [0, 1.5, 2.55],
}

export interface World {
  readonly interactables: readonly Interactable[]
  readonly views: readonly ViewDef[]
  sync(state: GameState): void
  onEvent(event: GameEvent, state: GameState): void
  update(dt: number, time: number): void
  setBookSelection(slot: number | null): void
}

export const createWorld = (engine: Engine, tweens: Tweens): World => {
  const materials = createMaterials()
  const living = buildLiving(materials, tweens)
  const bedroom = buildBedroom(materials, tweens)
  const study = buildStudy(materials, tweens)
  const boundaries = buildBoundaries(
    materials,
    new THREE.MeshStandardMaterial({ map: damaskTexture('#c9b393', '#8e5a5e', 5), roughness: 0.85 }),
    tweens,
  )
  const modules: Array<{ room: RoomId | null; module: RoomModule }> = [
    { room: 'living', module: living },
    { room: 'bedroom', module: bedroom },
    { room: 'study', module: study },
    { room: null, module: boundaries },
  ]
  for (const { module } of modules) engine.scene.add(module.group)

  // 屋敷全体のわずかな環境光
  const hemisphere = new THREE.HemisphereLight('#232842', '#120c08', 0.5)
  engine.scene.add(hemisphere)

  const sparkles = createSparkles()
  engine.scene.add(sparkles.group)

  let currentRoom: RoomId = 'living'

  const applyLightCulling = () => {
    for (const { room, module } of modules) {
      if (room === null) continue
      module.group.traverse((obj) => {
        const light = obj as THREE.Light
        if (light.isLight !== true) return
        if (light.userData.keepAlive === true) return
        light.visible = room === currentRoom
      })
    }
  }

  return {
    interactables: modules.flatMap(({ module }) => module.interactables),
    views: modules.flatMap(({ module }) => module.views),
    sync(state) {
      currentRoom = state.currentRoom
      for (const { module } of modules) module.sync(state)
      applyLightCulling()
    },
    onEvent(event, state) {
      for (const { module } of modules) module.onEvent?.(event, state)
      if (event.kind === 'effect') {
        const at = SPARKLE_AT[event.effect]
        if (at) sparkles.burst(new THREE.Vector3(at[0], at[1], at[2]))
      }
      if (event.kind === 'roomChanged') {
        currentRoom = event.room
        applyLightCulling()
      }
    },
    update(dt, time) {
      for (const { module } of modules) module.update?.(dt, time)
      sparkles.update(dt)
    },
    setBookSelection(slot) {
      study.setBookSelection(slot)
    },
  }
}
