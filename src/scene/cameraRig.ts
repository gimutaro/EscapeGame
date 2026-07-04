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
  update(dt: number): void
  /** タイトル画面用のゆっくりした揺れ */
  setIdleSway(enabled: boolean): void
}

const ROOM_FOV = 62
const FOCUS_FOV = 46
/** FOV は横長画面(16:10 以上)を基準に設計されている。
 *  それより縦長の画面(スマホ縦持ちなど)では水平視野を保つよう垂直 FOV を広げる
 *  (フィッシュアイ防止の上限つき) */
const DESIGN_ASPECT = 16 / 10
const MAX_FOV = 92

export const createCameraRig = (camera: THREE.PerspectiveCamera): CameraRig => {
  const views = new Map<ViewId, ViewDef>()
  let room: RoomId = 'living'
  let yaw = ROOM_PIVOTS.living.yaw
  let pitch = 0
  let yawVelocity = 0
  let pitchVelocity = 0
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

  // 設計値の FOV(16:9 基準)。実際の camera.fov は画面比率で補正して適用する
  let baseFov = ROOM_FOV

  const adjustFov = (designFov: number): number => {
    if (camera.aspect >= DESIGN_ASPECT) return designFov
    const halfH = Math.atan(Math.tan(THREE.MathUtils.degToRad(designFov / 2)) * DESIGN_ASPECT)
    const fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(halfH) / camera.aspect))
    return Math.min(fov, MAX_FOV)
  }

  const applyFov = () => {
    const target = adjustFov(baseFov)
    if (Math.abs(camera.fov - target) > 0.01) {
      camera.fov = target
      camera.updateProjectionMatrix()
    }
  }

  const startTransition = (
    toPos: THREE.Vector3,
    toLook: THREE.Vector3,
    toFovDesign: number,
    after: RigMode,
    afterView: ViewId | null,
    duration = 0.65,
  ) => {
    // Object3D.lookAt は +Z を向けてしまうため、カメラ(-Z 基準)をダミーに使う
    const dummy = new THREE.PerspectiveCamera()
    dummy.position.copy(toPos)
    dummy.lookAt(toLook)
    // 遷移開始時点で最終表示値まで解決してから補間する(from/to をそれぞれの
    // design fov のまま補間して毎フレーム adjustFov し直すと、丸め誤差で
    // 画角がわずかに揺れることがあるため)
    const toFovResolved = adjustFov(toFovDesign)
    baseFov = toFovDesign
    transition = {
      fromPos: camera.position.clone(),
      fromQuat: camera.quaternion.clone(),
      fromFov: camera.fov,
      toPos: toPos.clone(),
      toQuat: dummy.quaternion.clone(),
      toFov: toFovResolved,
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
        baseFov = ROOM_FOV
        applyFov()
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
      yawVelocity = -dx * 0.0032
      pitchVelocity = -dy * 0.0026
      yaw += yawVelocity
      pitch = THREE.MathUtils.clamp(pitch + pitchVelocity, -0.72, 0.72)
    },
    update(dt) {
      if (transition) {
        transition.t += dt / transition.duration
        const t = easeInOutCubic(Math.min(1, transition.t))
        camera.position.lerpVectors(transition.fromPos, transition.toPos, t)
        camera.quaternion.slerpQuaternions(transition.fromQuat, transition.toQuat, t)
        // from/to は遷移開始時点で最終表示値まで解決済みなので、そのまま補間する
        camera.fov = THREE.MathUtils.lerp(transition.fromFov, transition.toFov, t)
        camera.updateProjectionMatrix()
        if (transition.t >= 1) {
          mode = transition.after
          currentView = transition.afterView
          transition = null
        }
        return
      }
      // 静止中も画面回転(アスペクト変化)に追随する
      applyFov()
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
