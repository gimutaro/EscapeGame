import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export type Quality = 'high' | 'mid' | 'low'

/** ビネット+フィルムグレイン(大正写真の質感・ごく薄く) */
const FilmShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    grain: { value: 0.045 },
    vignette: { value: 0.42 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float grain;
    uniform float vignette;
    varying vec2 vUv;
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7)) + time * 13.0) * 43758.5453);
    }
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float n = (hash(vUv * vec2(1920.0, 1080.0)) - 0.5) * grain;
      color.rgb += n;
      vec2 d = vUv - 0.5;
      float vig = 1.0 - smoothstep(0.35, 0.95, length(d) * (1.0 + vignette));
      color.rgb *= mix(0.72, 1.0, vig);
      // ほんのり暖色へ
      color.rgb *= vec3(1.02, 0.99, 0.95);
      gl_FragColor = color;
    }
  `,
}

export interface Engine {
  readonly renderer: THREE.WebGLRenderer
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly canvas: HTMLCanvasElement
  setQuality(quality: Quality): void
  render(dt: number): void
  onFrame(callback: (dt: number, time: number) => void): void
  start(): void
}

export const createEngine = (container: HTMLElement): Engine => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#06070c')

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.05, 60)
  camera.position.set(0, 1.5, 0.5)

  // 金属の映り込み用の環境
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.22

  // ポストプロセス
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.32,
    0.7,
    0.86,
  )
  composer.addPass(bloom)
  composer.addPass(new OutputPass())
  const film = new ShaderPass(FilmShader)
  composer.addPass(film)

  let quality: Quality = 'high'
  let time = 0
  const frameCallbacks: Array<(dt: number, t: number) => void> = []

  const resize = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
    composer.setSize(w, h)
  }
  window.addEventListener('resize', resize)

  const setQuality = (q: Quality) => {
    quality = q
    renderer.shadowMap.enabled = q !== 'low'
    bloom.enabled = q !== 'low'
    film.enabled = q === 'high'
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, q === 'low' ? 1.25 : 2))
    // 影の解像度は各ライト側で参照する
    scene.traverse((obj) => {
      const light = obj as THREE.Light
      if (light.isLight === true && 'shadow' in light && light.shadow) {
        const size = q === 'high' ? 2048 : q === 'mid' ? 1024 : 512
        const shadow = light.shadow as THREE.LightShadow
        shadow.mapSize.set(size, size)
        if (shadow.map) {
          shadow.map.dispose()
          shadow.map = null
        }
      }
    })
    resize()
  }

  const clock = new THREE.Clock()

  const engine: Engine = {
    renderer,
    scene,
    camera,
    canvas: renderer.domElement,
    setQuality,
    render(dt) {
      time += dt
      const timeUniform = film.uniforms['time']
      if (timeUniform) timeUniform.value = time % 100
      if (quality === 'low') {
        renderer.render(scene, camera)
      } else {
        composer.render()
      }
    },
    onFrame(callback) {
      frameCallbacks.push(callback)
    },
    start() {
      renderer.setAnimationLoop(() => {
        const dt = Math.min(clock.getDelta(), 0.05)
        for (const callback of frameCallbacks) callback(dt, time)
        engine.render(dt)
      })
    },
  }
  return engine
}
