import type * as THREE from 'three'
import type { GameEvent } from '../core/events'
import type { GameState } from '../core/state'
import type { HotspotId, RoomId } from '../core/types'

/** 注視ビュー(ギミックへのズームイン)の識別子 */
export type ViewId =
  | 'fv-table'
  | 'fv-fireplace'
  | 'fv-clock'
  | 'fv-cabinet'
  | 'fv-piano'
  | 'fv-entrance'
  | 'fv-gramophone'
  | 'fv-vanity'
  | 'fv-wardrobe'
  | 'fv-jewelry'
  | 'fv-sidetable'
  | 'fv-byobu'
  | 'fv-desk'
  | 'fv-bookshelf'
  | 'fv-globe'
  | 'fv-safe'

export type InteractionContext = 'room' | ViewId

export interface ViewDef {
  readonly id: ViewId
  readonly room: RoomId
  readonly position: THREE.Vector3
  readonly lookAt: THREE.Vector3
  readonly fov?: number
}

export interface Interactable {
  readonly id: HotspotId
  readonly object: THREE.Object3D
  /** このホットスポットが反応するビュー(既定は部屋ビュー) */
  readonly context: InteractionContext
  /** 部屋ビューで反応する部屋(context='room' のとき必須。扉は両側の部屋に属する) */
  readonly rooms?: readonly RoomId[]
  /** クリックで開く注視ビュー(あれば) */
  readonly view?: ViewId
  /** マーカー表示位置(未指定なら object の中心) */
  readonly markerAt?: THREE.Vector3
  /** マーカーを出すかどうかの条件(未指定なら常に) */
  readonly markerWhen?: (state: GameState) => boolean
}

export interface RoomModule {
  readonly group: THREE.Group
  readonly interactables: readonly Interactable[]
  readonly views: readonly ViewDef[]
  /** 状態 → 見た目の反映(冪等・セーブ復帰でも正しい姿になる) */
  sync(state: GameState): void
  /** 過渡演出(アニメーション)のトリガ */
  onEvent?(event: GameEvent, state: GameState): void
  update?(dt: number, time: number): void
}

/** 部屋ごとの視点(定点)の基準位置。yaw はその部屋の見せ場を向く */
export const ROOM_PIVOTS: Readonly<Record<RoomId, { position: [number, number, number]; yaw: number }>> = {
  living: { position: [0, 1.5, 0.55], yaw: 0 }, // 北: 暖炉・柱時計・飾り棚
  bedroom: { position: [7, 1.48, 0.35], yaw: -1.15 }, // 東北東: 寝台・窓・鏡台
  study: { position: [-6.9, 1.48, 0.25], yaw: Math.PI / 2 }, // 西: 本棚・机
}
