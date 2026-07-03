import * as THREE from 'three'
import type { RoomId } from '../core/types'
import { easeInOutCubic } from '../utils/tween'
import type { ViewDef, ViewId } from './types'
import { ROOM_PIVOTS } from './types'

export type RigMode = 'room' | 'focus' | 'transition'

/**
 * カメラ制御: 部屋の定点から360°見回し+注視ビューへのなめらかな遷移。
 */
export interface CameraRig {
  readonly mode: () => RigMode
  readonly currentView: () => ViewId | null
  registerViews(views: readonly ViewDef[]): void
  setRoom(room: RoomId, immediate?: boolean): void
  focus(view: ViewId): void
  backToRoom(): void
  drag(dx: number, dy: number): void
  setSensitivity(value: number): void
  update(dt: number): void
  /** タイトル画面用のゆっくりした揺れ */
  setIdleSway(enabled: boolean): void
}

const ROOM_FOV = 62
const FOCUS_FOV = 46

export const createCameraRig = (camera: THREE.PerspectiveCamera): CameraRig => {
  const views = new Map<ViewId, ViewDef>()
  let room: RoomId = 'living'
  let yaw = ROOM_PIVOTS.living.yaw
  let pitch = 0
  let yawVelocity = 0
  let pitchVelocity = 0
  let sensitivity = 1
  let mode: RigMode = 'room'
  let currentView: ViewId | null = null
  let idleSway = false
  let swayTime = 0

  // 遷移用
  let transition: {
    fromPos: THREE.Vector3
    fromQuat: THREE.Quaternion
    fromFov: number
    toPos: THREE.Vector3
    toQuat: THREE.Quaternion
    toFov: number
    t: number
    duration: number
    after: RigMode
    afterView: ViewId | null
  } | null = null

  const pivotPosition = (): THREE.Vector3 => {
    const p = ROOM_PIVOTS[room].position
    return new THREE.Vector3(p[0], p[1], p[2])
  }

  const roomQuaternion = (): THREE.Quaternion => {
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ')
    return new THREE.Quaternion().setFromEuler(euler)
  }

  const applyRoomCamera = () => {
    camera.position.copy(pivotPosition())
    camera.quaternion.copy(roomQuaternion())
  }

  const startTransition = (
    toPos: THREE.Vector3,
    toLook: THREE.Vector3,
    toFov: number,
    after: RigMode,
    afterView: ViewId | null,
    duration = 0.65,
  ) => {
    // Object3D.lookAt は +Z を向けてしまうため、カメラ(-Z 基準)をダミーに使う
    const dummy = new THREE.PerspectiveCamera()
    dummy.position.copy(toPos)
    dummy.lookAt(toLook)
    transition = {
      fromPos: camera.position.clone(),
      fromQuat: camera.quaternion.clone(),
      fromFov: camera.fov,
      toPos: toPos.clone(),
      toQuat: dummy.quaternion.clone(),
      toFov: toFov,
      t: 0,
      duration,
      after,
      afterView,
    }
    mode = 'transition'
  }

  return {
    mode: () => mode,
    currentView: () => currentView,
    registerViews(defs) {
      for (const def of defs) views.set(def.id, def)
    },
    setRoom(next, immediate = true) {
      room = next
      yaw = ROOM_PIVOTS[next].yaw
      pitch = 0
      currentView = null
      if (immediate) {
        mode = 'room'
        camera.fov = ROOM_FOV
        camera.updateProjectionMatrix()
        applyRoomCamera()
      }
    },
    focus(viewId) {
      const def = views.get(viewId)
      if (!def) return
      // 遷移中でも、現在のカメラ位置から新しい遷移を始められる(連打に強い)
      currentView = viewId
      startTransition(def.position, def.lookAt, def.fov ?? FOCUS_FOV, 'focus', viewId)
    },
    backToRoom() {
      currentView = null
      const dummy = new THREE.Object3D()
      dummy.position.copy(pivotPosition())
      dummy.quaternion.copy(roomQuaternion())
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(dummy.quaternion)
      startTransition(
        pivotPosition(),
        pivotPosition().add(forward),
        ROOM_FOV,
        'room',
        null,
        0.55,
      )
    },
    drag(dx, dy) {
      if (mode !== 'room') return
      yawVelocity = -dx * 0.0032 * sensitivity
      pitchVelocity = -dy * 0.0026 * sensitivity
      yaw += yawVelocity
      pitch = THREE.MathUtils.clamp(pitch + pitchVelocity, -0.72, 0.72)
    },
    setSensitivity(value) {
      sensitivity = value
    },
    update(dt) {
      if (transition) {
        transition.t += dt / transition.duration
        const t = easeInOutCubic(Math.min(1, transition.t))
        camera.position.lerpVectors(transition.fromPos, transition.toPos, t)
        camera.quaternion.slerpQuaternions(transition.fromQuat, transition.toQuat, t)
        camera.fov = THREE.MathUtils.lerp(transition.fromFov, transition.toFov, t)
        camera.updateProjectionMatrix()
        if (transition.t >= 1) {
          mode = transition.after
          currentView = transition.afterView
          transition = null
        }
        return
      }
      if (mode === 'room') {
        // 慣性
        yawVelocity *= Math.pow(0.0005, dt)
        pitchVelocity *= Math.pow(0.0005, dt)
        yaw += yawVelocity * dt * 60 * 0.016
        pitch = THREE.MathUtils.clamp(pitch + pitchVelocity * dt * 60 * 0.016, -0.72, 0.72)
        if (idleSway) {
          swayTime += dt
          yaw += Math.sin(swayTime * 0.11) * 0.00022
          pitch += Math.sin(swayTime * 0.07) * 0.00006
        }
        applyRoomCamera()
      }
    },
    setIdleSway(enabled) {
      idleSway = enabled
    },
  }
}
