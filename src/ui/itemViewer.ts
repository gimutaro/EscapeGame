import * as THREE from 'three'
import type { Store } from '../core/store'
import { ITEMS } from '../core/texts'
import type { ItemId } from '../core/types'
import { buildItemMesh } from '../scene/items'
import { button, el } from './dom'
import type { Modals } from './modals'

/** アイテムの3D拡大ビュー(回転可能)+結合ボタン */
export interface ItemViewer {
  open(item: ItemId): void
}

const COMBINABLE: Partial<Record<ItemId, ItemId>> = {
  photoLeft: 'photoRight',
  photoRight: 'photoLeft',
}

export const createItemViewer = (store: Store, modals: Modals): ItemViewer => {
  let renderer: THREE.WebGLRenderer | null = null
  let raf: number | null = null
  let cleanup: (() => void) | null = null

  const stop = () => {
    if (raf !== null) cancelAnimationFrame(raf)
    raf = null
    cleanup?.()
    cleanup = null
    renderer?.dispose()
    renderer = null
  }

  const open = (item: ItemId) => {
    modals.openCustom(
      '持ち物',
      (body) => {
        const wrap = el('div', 'item-viewer')
        const size = Math.min(320, window.innerWidth - 100)
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(size, size)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        wrap.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 10)
        const key = new THREE.DirectionalLight('#fff2dc', 3)
        key.position.set(1, 2, 2)
        const fill = new THREE.DirectionalLight('#aab4ff', 1.1)
        fill.position.set(-2, -0.5, 1)
        scene.add(key, fill, new THREE.AmbientLight('#8a7c66', 1.5))
        const mesh = buildItemMesh(item)
        const bounds = new THREE.Box3().setFromObject(mesh)
        const sphere = bounds.getBoundingSphere(new THREE.Sphere())
        mesh.position.sub(sphere.center)
        const pivot = new THREE.Group()
        pivot.add(mesh)
        scene.add(pivot)
        camera.position.set(0, 0, sphere.radius / Math.tan((camera.fov * Math.PI) / 360) + sphere.radius * 0.5)

        let dragging = false
        let autoRotate = true
        let lastX = 0
        let lastY = 0
        // 閉じるときに一括解除できるようにする(リスナー・GPUリソースのリーク防止)
        const controller = new AbortController()
        renderer.domElement.addEventListener(
          'pointerdown',
          (e) => {
            dragging = true
            autoRotate = false
            lastX = e.clientX
            lastY = e.clientY
          },
          { signal: controller.signal },
        )
        window.addEventListener(
          'pointermove',
          (e) => {
            if (!dragging) return
            pivot.rotation.y += (e.clientX - lastX) * 0.012
            pivot.rotation.x += (e.clientY - lastY) * 0.008
            lastX = e.clientX
            lastY = e.clientY
          },
          { signal: controller.signal },
        )
        window.addEventListener('pointerup', () => (dragging = false), {
          signal: controller.signal,
        })
        cleanup = () => {
          controller.abort()
          mesh.traverse((obj) => {
            const asMesh = obj as THREE.Mesh
            if (asMesh.isMesh) {
              asMesh.geometry.dispose()
              const materials = Array.isArray(asMesh.material) ? asMesh.material : [asMesh.material]
              for (const material of materials) {
                const std = material as THREE.MeshStandardMaterial
                std.map?.dispose()
                material.dispose()
              }
            }
          })
        }

        const tick = () => {
          if (!renderer) return
          if (autoRotate) pivot.rotation.y += 0.006
          renderer.render(scene, camera)
          raf = requestAnimationFrame(tick)
        }
        tick()

        wrap.appendChild(el('div', 'item-name', ITEMS[item].name))
        wrap.appendChild(el('div', 'item-desc', ITEMS[item].desc))

        const partner = COMBINABLE[item]
        if (partner && store.getState().inventory.includes(partner)) {
          wrap.appendChild(
            button('combine-btn', `「${ITEMS[partner].name}」と組み合わせる`, () => {
              store.dispatch({ type: 'COMBINE_ITEMS', a: item, b: partner })
              modals.closeAll()
            }),
          )
        }
        body.appendChild(wrap)
      },
      stop,
    )
  }

  return { open }
}
