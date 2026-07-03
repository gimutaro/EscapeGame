import * as THREE from 'three'
import type { ItemId } from '../core/types'
import { boxMesh, cylinderMesh, meshOf } from './materials'
import { matchboxTexture, paperTexture, photoTexture } from './textures/small'

const brass = new THREE.MeshStandardMaterial({ color: '#c9a34e', metalness: 0.85, roughness: 0.3 })
const silver = new THREE.MeshStandardMaterial({ color: '#c0c4ca', metalness: 0.9, roughness: 0.25 })
const iron = new THREE.MeshStandardMaterial({ color: '#5a5a58', metalness: 0.8, roughness: 0.45 })
const gold = new THREE.MeshStandardMaterial({ color: '#d8b64d', metalness: 0.92, roughness: 0.22 })

/** 鍵(サイズ・材質・飾りを変えて使い回す) */
const buildKey = (
  material: THREE.Material,
  length: number,
  ornate = false,
): THREE.Group => {
  const group = new THREE.Group()
  const bow = meshOf(new THREE.TorusGeometry(length * 0.22, length * 0.05, 10, 20), material)
  bow.position.y = length * 0.5
  group.add(bow)
  if (ornate) {
    const inner = meshOf(new THREE.TorusGeometry(length * 0.1, length * 0.03, 8, 16), material)
    inner.position.y = length * 0.5
    group.add(inner)
  }
  const stem = cylinderMesh(length * 0.045, length * 0.045, length * 0.72, material, 10)
  stem.position.y = -length * 0.08
  group.add(stem)
  const tooth1 = boxMesh(length * 0.16, length * 0.08, length * 0.05, material, length * 0.1, -length * 0.36, 0)
  const tooth2 = boxMesh(length * 0.1, length * 0.08, length * 0.05, material, length * 0.08, -length * 0.24, 0)
  group.add(tooth1, tooth2)
  return group
}

const buildPaperItem = (map: THREE.Texture, w: number, h: number): THREE.Group => {
  const group = new THREE.Group()
  const paper = meshOf(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map, roughness: 0.9, side: THREE.DoubleSide }),
    false,
    false,
  )
  group.add(paper)
  return group
}

/** アイテムの3Dモデル(拡大ビュー・アイコン撮影に使用) */
export const buildItemMesh = (id: ItemId): THREE.Group => {
  switch (id) {
    case 'brassKey':
      return buildKey(brass, 0.5)
    case 'bedroomKey':
      return buildKey(brass, 0.62)
    case 'studyKey':
      return buildKey(silver, 0.62)
    case 'safeKey':
      return buildKey(iron, 0.55)
    case 'entranceKey':
      return buildKey(gold, 0.74, true)
    case 'matchbox': {
      const group = new THREE.Group()
      group.add(
        boxMesh(0.6, 0.18, 0.4, new THREE.MeshStandardMaterial({ map: matchboxTexture(), roughness: 0.7 })),
      )
      const stick = cylinderMesh(0.02, 0.02, 0.34, new THREE.MeshStandardMaterial({ color: '#d8c49a' }), 6)
      stick.rotation.z = Math.PI / 2
      stick.position.set(0.1, 0.14, 0)
      const head = meshOf(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: '#7c2828' }))
      head.position.set(-0.07, 0.14, 0)
      group.add(stick, head)
      return group
    }
    case 'blankLetter':
      return buildPaperItem(paperTexture('blank'), 0.5, 0.7)
    case 'windingKey': {
      const group = new THREE.Group()
      const stem = cylinderMesh(0.035, 0.035, 0.4, silver, 10)
      group.add(stem)
      const bar = cylinderMesh(0.03, 0.03, 0.34, silver, 10)
      bar.rotation.z = Math.PI / 2
      bar.position.y = 0.22
      group.add(bar)
      for (const side of [-1, 1]) {
        const knob = meshOf(new THREE.SphereGeometry(0.05, 10, 8), silver)
        knob.position.set(side * 0.17, 0.22, 0)
        group.add(knob)
      }
      const tip = cylinderMesh(0.05, 0.05, 0.1, silver, 12)
      tip.position.y = -0.25
      group.add(tip)
      return group
    }
    case 'photoRight':
      return buildPaperItem(photoTexture('right'), 0.42, 0.62)
    case 'photoLeft':
      return buildPaperItem(photoTexture('left'), 0.42, 0.62)
    case 'memoryPhoto':
      return buildPaperItem(photoTexture('full'), 0.82, 0.62)
    case 'pocketWatch': {
      const group = new THREE.Group()
      const body = cylinderMesh(0.3, 0.3, 0.09, gold, 28)
      body.rotation.x = Math.PI / 2
      group.add(body)
      const rim = meshOf(new THREE.TorusGeometry(0.3, 0.03, 12, 30), gold)
      group.add(rim)
      const crown = cylinderMesh(0.05, 0.05, 0.08, gold, 10)
      crown.position.y = 0.36
      group.add(crown)
      const loop = meshOf(new THREE.TorusGeometry(0.05, 0.018, 8, 14), gold)
      loop.position.y = 0.44
      group.add(loop)
      // 鎖
      for (let i = 0; i < 5; i++) {
        const link = meshOf(new THREE.TorusGeometry(0.035, 0.012, 6, 12), gold)
        link.position.set(0.08 + i * 0.055, 0.46 + Math.sin(i * 0.9) * 0.03, 0)
        link.rotation.y = i * 0.6
        group.add(link)
      }
      // 蓋の彫り
      const engraving = meshOf(new THREE.TorusGeometry(0.18, 0.008, 8, 24), gold)
      engraving.position.z = 0.05
      group.add(engraving)
      return group
    }
  }
}

/**
 * インベントリ用アイコンを一括生成(小型レンダラで撮影して dataURL 化)。
 */
export const generateItemIcons = (ids: readonly ItemId[]): Record<ItemId, string> => {
  const size = 128
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setSize(size, size)
  renderer.setPixelRatio(1)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 10)
  const key = new THREE.DirectionalLight('#fff2dc', 3)
  key.position.set(1, 2, 2)
  const fill = new THREE.DirectionalLight('#aab4ff', 1.2)
  fill.position.set(-2, -0.5, 1)
  const ambient = new THREE.AmbientLight('#887c66', 1.4)
  scene.add(key, fill, ambient)

  const icons = {} as Record<ItemId, string>
  for (const id of ids) {
    const mesh = buildItemMesh(id)
    scene.add(mesh)
    const bounds = new THREE.Box3().setFromObject(mesh)
    const sphere = bounds.getBoundingSphere(new THREE.Sphere())
    mesh.position.sub(sphere.center)
    mesh.rotation.set(0.15, -0.4, 0.06)
    const distance = sphere.radius / Math.tan((camera.fov * Math.PI) / 360) + sphere.radius * 0.4
    camera.position.set(0, 0, distance)
    camera.lookAt(0, 0, 0)
    renderer.render(scene, camera)
    icons[id] = renderer.domElement.toDataURL('image/png')
    scene.remove(mesh)
  }
  renderer.dispose()
  return icons
}
