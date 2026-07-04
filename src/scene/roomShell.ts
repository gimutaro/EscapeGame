import * as THREE from 'three'
import type { Materials } from './materials'
import { boxMesh, meshOf } from './materials'
import { nightWindowTexture } from './textures/art'

export interface WallOpening {
  /** 壁の中心からのオフセット(壁の長さ方向) */
  center: number
  width: number
  height: number
  bottom?: number
}

const WAINSCOT_H = 1.02
const RAIL_H = 0.07
const BASE_H = 0.12
const THICK = 0.14

/**
 * 腰壁(木)+壁紙+モールディングの複合壁。
 * X軸方向に長さ length、原点は壁の中心・床レベル。開口部は矩形でくり抜く。
 */
export const buildWall = (
  length: number,
  height: number,
  materials: Materials,
  paperMaterial: THREE.Material,
  openings: readonly WallOpening[] = [],
): THREE.Group => {
  const group = new THREE.Group()

  // 壁紙はセグメント幅に応じてリピート数を変える(柄が潰れないように)
  const paperCache = new Map<string, THREE.Material>()
  const paperFor = (w: number, h: number): THREE.Material => {
    const base = paperMaterial as THREE.MeshStandardMaterial
    if (!base.map) return paperMaterial
    const key = `${w.toFixed(1)}x${h.toFixed(1)}`
    const cached = paperCache.get(key)
    if (cached) return cached
    const material = base.clone()
    const map = base.map.clone()
    map.repeat.set(Math.max(0.5, w / 2.3), Math.max(0.5, h / 2.3))
    material.map = map
    paperCache.set(key, material)
    return material
  }

  const addSegment = (x0: number, x1: number, y0: number, y1: number) => {
    const w = x1 - x0
    const h = y1 - y0
    if (w <= 0.01 || h <= 0.01) return
    const cx = (x0 + x1) / 2
    // 縦の帯を、腰壁・見切り・壁紙に分けて積む
    const bands: Array<{ y0: number; y1: number; material: THREE.Material | 'paper'; depth: number }> = [
      { y0: 0, y1: BASE_H, material: materials.woodDark, depth: THICK + 0.03 },
      { y0: BASE_H, y1: WAINSCOT_H, material: materials.woodMid, depth: THICK + 0.015 },
      { y0: WAINSCOT_H, y1: WAINSCOT_H + RAIL_H, material: materials.woodDark, depth: THICK + 0.03 },
      { y0: WAINSCOT_H + RAIL_H, y1: height - 0.1, material: 'paper', depth: THICK },
      { y0: height - 0.1, y1: height, material: materials.woodDark, depth: THICK + 0.02 },
    ]
    for (const band of bands) {
      const by0 = Math.max(y0, band.y0)
      const by1 = Math.min(y1, band.y1)
      if (by1 - by0 <= 0.005) continue
      const material =
        band.material === 'paper' ? paperFor(w, by1 - by0) : band.material
      const mesh = boxMesh(w, by1 - by0, band.depth, material, cx, (by0 + by1) / 2, 0)
      mesh.castShadow = false
      group.add(mesh)
    }
  }

  // 開口部で壁を縦に分割する
  const sorted = [...openings].sort((a, b) => a.center - b.center)
  let cursor = -length / 2
  for (const opening of sorted) {
    const left = opening.center - opening.width / 2
    const right = opening.center + opening.width / 2
    addSegment(cursor, left, 0, height)
    const bottom = opening.bottom ?? 0
    // まぐさ(開口部の上)
    addSegment(left, right, bottom + opening.height, height)
    // 窓下(腰)
    if (bottom > 0.01) addSegment(left, right, 0, bottom)
    cursor = right
  }
  addSegment(cursor, length / 2, 0, height)
  return group
}

/** 窓(枠+ガラス+夜景+カーテン)。壁開口部にはめる。 */
export const buildWindow = (
  width: number,
  height: number,
  materials: Materials,
  options: { moon?: boolean; lace?: THREE.Texture; curtainColor?: string; seed?: number } = {},
): THREE.Group => {
  const group = new THREE.Group()
  const frameD = 0.1
  const frame = materials.woodDark
  // 枠 — 上下の枠と左右の柱が四隅で重なるため、柱側をわずかに薄くしてZファイティングを防ぐ
  group.add(boxMesh(width + 0.12, 0.07, frameD, frame, 0, height + 0.035, 0))
  group.add(boxMesh(width + 0.12, 0.09, frameD, frame, 0, -0.045, 0))
  group.add(boxMesh(0.07, height + 0.14, frameD * 0.94, frame, -width / 2 - 0.035, height / 2, 0))
  group.add(boxMesh(0.07, height + 0.14, frameD * 0.94, frame, width / 2 + 0.035, height / 2, 0))
  // 桟(十字)— 交差部分の面が同一平面にならないよう、縦桟をわずかに薄くしてZファイティングを防ぐ
  group.add(boxMesh(width, 0.045, frameD * 0.7, frame, 0, height / 2, 0))
  group.add(boxMesh(0.045, height, frameD * 0.66, frame, 0, height / 2, 0))
  // ガラス
  const glass = boxMesh(width, height, 0.01, materials.glass, 0, height / 2, 0)
  glass.castShadow = false
  group.add(glass)
  // 夜景(発光する外の景色)
  const night = new THREE.MeshBasicMaterial({
    map: nightWindowTexture(options.moon ?? false, options.seed ?? 81),
  })
  const nightPlane = meshOf(new THREE.PlaneGeometry(width * 1.5, height * 1.5), night, false, false)
  nightPlane.position.set(0, height / 2, -0.22)
  group.add(nightPlane)
  // レースまたは布カーテン
  if (options.lace) {
    const laceMaterial = new THREE.MeshStandardMaterial({
      map: options.lace,
      transparent: true,
      side: THREE.DoubleSide,
      roughness: 0.9,
    })
    const lace = meshOf(
      new THREE.PlaneGeometry(width * 0.96, height * 0.98, 12, 1),
      laceMaterial,
      false,
      false,
    )
    const positionAttr = lace.geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < positionAttr.count; i++) {
      positionAttr.setZ(i, Math.sin((positionAttr.getX(i) / width) * Math.PI * 5) * 0.03)
    }
    lace.position.set(0, height / 2, 0.09)
    group.add(lace)
  }
  if (options.curtainColor) {
    const curtainMaterial = new THREE.MeshStandardMaterial({
      color: options.curtainColor,
      roughness: 0.95,
      side: THREE.DoubleSide,
    })
    for (const side of [-1, 1]) {
      const curtain = meshOf(
        new THREE.PlaneGeometry(width * 0.36, height * 1.12, 10, 1),
        curtainMaterial,
        false,
        true,
      )
      const positionAttr = curtain.geometry.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < positionAttr.count; i++) {
        positionAttr.setZ(i, Math.sin((positionAttr.getX(i) / width) * Math.PI * 9) * 0.05)
      }
      curtain.position.set(side * (width / 2 - width * 0.1), height / 2 + 0.03, 0.13)
      group.add(curtain)
      // カーテンレール
    }
    const rod = meshOf(
      new THREE.CylinderGeometry(0.018, 0.018, width + 0.3, 8),
      new THREE.MeshStandardMaterial({ color: '#8a6d33', metalness: 0.8, roughness: 0.4 }),
    )
    rod.rotation.z = Math.PI / 2
    rod.position.set(0, height + 0.1, 0.13)
    group.add(rod)
  }
  return group
}

/** 床(部屋ごと) */
export const buildFloor = (
  w: number,
  d: number,
  material: THREE.Material,
  x = 0,
  z = 0,
): THREE.Mesh => {
  const floor = meshOf(new THREE.PlaneGeometry(w, d), material, false, true)
  floor.rotation.x = -Math.PI / 2
  floor.position.set(x, 0, z)
  return floor
}

/** 天井(中央に飾り縁) */
export const buildCeiling = (
  w: number,
  d: number,
  height: number,
  materials: Materials,
  x = 0,
  z = 0,
): THREE.Group => {
  const group = new THREE.Group()
  const ceiling = meshOf(new THREE.PlaneGeometry(w, d), materials.plaster, false, true)
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.set(x, height, z)
  group.add(ceiling)
  const medallion = meshOf(new THREE.CylinderGeometry(0.5, 0.56, 0.05, 24), materials.plaster, false, false)
  medallion.position.set(x, height - 0.02, z)
  group.add(medallion)
  return group
}
