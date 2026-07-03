import * as THREE from 'three'
import { herringboneTexture, marbleTexture, plasterTexture, woodTexture } from './textures/surfaces'

/** 共有マテリアル一式(一度だけ生成して使い回す) */
export interface Materials {
  floorWood: THREE.MeshStandardMaterial
  woodDark: THREE.MeshStandardMaterial
  woodMid: THREE.MeshStandardMaterial
  woodRed: THREE.MeshStandardMaterial
  brass: THREE.MeshStandardMaterial
  brassDark: THREE.MeshStandardMaterial
  silver: THREE.MeshStandardMaterial
  velvetRed: THREE.MeshPhysicalMaterial
  velvetGreen: THREE.MeshPhysicalMaterial
  clothDark: THREE.MeshStandardMaterial
  marble: THREE.MeshStandardMaterial
  plaster: THREE.MeshStandardMaterial
  glass: THREE.MeshPhysicalMaterial
  paper: THREE.MeshStandardMaterial
  ironDark: THREE.MeshStandardMaterial
}

export const createMaterials = (): Materials => {
  const woodDarkTex = woodTexture('#4a3626', '#2c1e12', 3)
  const woodMidTex = woodTexture('#7a5733', '#4a3320', 4)
  const woodRedTex = woodTexture('#5e3a28', '#38200f', 5)

  return {
    floorWood: new THREE.MeshStandardMaterial({
      map: herringboneTexture(),
      roughness: 0.55,
      metalness: 0.06,
    }),
    woodDark: new THREE.MeshStandardMaterial({ map: woodDarkTex, roughness: 0.62 }),
    woodMid: new THREE.MeshStandardMaterial({ map: woodMidTex, roughness: 0.66 }),
    woodRed: new THREE.MeshStandardMaterial({ map: woodRedTex, roughness: 0.5 }),
    brass: new THREE.MeshStandardMaterial({
      color: '#c9a34e',
      metalness: 0.88,
      roughness: 0.32,
      envMapIntensity: 0.9,
    }),
    brassDark: new THREE.MeshStandardMaterial({
      color: '#8a6d33',
      metalness: 0.85,
      roughness: 0.42,
      envMapIntensity: 0.7,
    }),
    silver: new THREE.MeshStandardMaterial({
      color: '#b8bcc2',
      metalness: 0.9,
      roughness: 0.3,
      envMapIntensity: 0.9,
    }),
    velvetRed: new THREE.MeshPhysicalMaterial({
      color: '#4c1a24',
      roughness: 0.97,
      sheen: 0.32,
      sheenColor: new THREE.Color('#6e3540'),
      sheenRoughness: 0.85,
    }),
    velvetGreen: new THREE.MeshPhysicalMaterial({
      color: '#26402f',
      roughness: 0.96,
      sheen: 0.35,
      sheenColor: new THREE.Color('#4a7058'),
      sheenRoughness: 0.85,
    }),
    clothDark: new THREE.MeshStandardMaterial({ color: '#3a3245', roughness: 0.95 }),
    marble: new THREE.MeshStandardMaterial({ map: marbleTexture(), color: '#cfc8ba', roughness: 0.38 }),
    plaster: new THREE.MeshStandardMaterial({ map: plasterTexture(), roughness: 0.9 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#cfe0e8',
      transparent: true,
      opacity: 0.18,
      roughness: 0.08,
      metalness: 0.1,
    }),
    paper: new THREE.MeshStandardMaterial({ color: '#efe6d2', roughness: 0.9 }),
    ironDark: new THREE.MeshStandardMaterial({
      color: '#3c3a38',
      metalness: 0.75,
      roughness: 0.45,
    }),
  }
}

/** 影の設定込みでメッシュを作る補助 */
export const meshOf = (
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  castShadow = true,
  receiveShadow = true,
): THREE.Mesh => {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = castShadow
  mesh.receiveShadow = receiveShadow
  return mesh
}

export const boxMesh = (
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh => {
  const mesh = meshOf(new THREE.BoxGeometry(w, h, d), material)
  mesh.position.set(x, y, z)
  return mesh
}

export const cylinderMesh = (
  rTop: number,
  rBottom: number,
  h: number,
  material: THREE.Material,
  segments = 20,
): THREE.Mesh => meshOf(new THREE.CylinderGeometry(rTop, rBottom, h, segments), material)

/** 当たり判定用の不可視ボックス(レイキャスト対象) */
export const hitboxMaterial = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
})

export const hitbox = (w: number, h: number, d: number, x = 0, y = 0, z = 0): THREE.Mesh => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitboxMaterial)
  mesh.position.set(x, y, z)
  return mesh
}
