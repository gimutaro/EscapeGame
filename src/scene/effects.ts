import * as THREE from 'three'
import { softCircleTexture } from './textures/small'

/** 暖炉の炎(スプライト粒子+揺らめく光) */
export interface Fire {
  group: THREE.Group
  light: THREE.PointLight
  setLit(lit: boolean): void
  update(dt: number, time: number): void
}

export const createFire = (position: THREE.Vector3): Fire => {
  const group = new THREE.Group()
  group.position.copy(position)
  const flameTexture = softCircleTexture('rgba(255,190,80,1)', 'rgba(255,80,10,0)')
  const emberTexture = softCircleTexture('rgba(255,120,40,1)', 'rgba(120,20,0,0)')

  interface Particle {
    sprite: THREE.Sprite
    life: number
    maxLife: number
    vx: number
    vy: number
    vz: number
    size: number
  }
  const particles: Particle[] = []
  for (let i = 0; i < 26; i++) {
    const material = new THREE.SpriteMaterial({
      map: i % 3 === 0 ? emberTexture : flameTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0,
    })
    const sprite = new THREE.Sprite(material)
    group.add(sprite)
    particles.push({ sprite, life: Math.random(), maxLife: 0.9, vx: 0, vy: 0, vz: 0, size: 0.2 })
  }
  // 熾火の光る土台
  const bedMaterial = new THREE.SpriteMaterial({
    map: emberTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0,
  })
  const bed = new THREE.Sprite(bedMaterial)
  bed.scale.set(0.7, 0.28, 1)
  bed.position.y = 0.05
  group.add(bed)

  const light = new THREE.PointLight('#ff8c3f', 0, 7, 2)
  light.position.copy(position).add(new THREE.Vector3(0, 0.45, 0.25))

  let lit = false
  const respawn = (p: Particle) => {
    p.life = 0
    p.maxLife = 0.5 + Math.random() * 0.7
    p.sprite.position.set((Math.random() - 0.5) * 0.5, Math.random() * 0.08, (Math.random() - 0.5) * 0.16)
    p.vx = (Math.random() - 0.5) * 0.12
    p.vy = 0.45 + Math.random() * 0.5
    p.vz = (Math.random() - 0.5) * 0.06
    p.size = 0.1 + Math.random() * 0.22
  }

  return {
    group,
    light,
    setLit(value) {
      lit = value
      bed.material.opacity = value ? 0.75 : 0
      if (!value) {
        for (const p of particles) p.sprite.material.opacity = 0
        light.intensity = 0
      }
    },
    update(dt, time) {
      if (!lit) return
      light.intensity = 16 + Math.sin(time * 9.3) * 2.2 + Math.sin(time * 23.7) * 1.4
      for (const p of particles) {
        p.life += dt
        if (p.life >= p.maxLife) respawn(p)
        const t = p.life / p.maxLife
        p.sprite.position.x += p.vx * dt
        p.sprite.position.y += p.vy * dt
        p.sprite.position.z += p.vz * dt
        const flicker = 0.85 + Math.sin(time * 31 + p.size * 60) * 0.15
        p.sprite.material.opacity = Math.sin(t * Math.PI) * 0.85 * flicker
        const s = p.size * (1 - t * 0.4)
        p.sprite.scale.set(s, s * 1.6, s)
      }
    },
  }
}

/** 開錠時などの金色のきらめき */
export interface Sparkles {
  group: THREE.Group
  burst(at: THREE.Vector3): void
  update(dt: number): void
}

export const createSparkles = (): Sparkles => {
  const group = new THREE.Group()
  const texture = softCircleTexture('rgba(255,235,170,1)', 'rgba(255,200,90,0)')
  interface Spark {
    sprite: THREE.Sprite
    velocity: THREE.Vector3
    life: number
  }
  const sparks: Spark[] = []

  return {
    group,
    burst(at) {
      for (let i = 0; i < 18; i++) {
        const material = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
        const sprite = new THREE.Sprite(material)
        sprite.position.copy(at)
        sprite.scale.setScalar(0.05 + Math.random() * 0.06)
        group.add(sprite)
        const angle = Math.random() * Math.PI * 2
        sparks.push({
          sprite,
          velocity: new THREE.Vector3(
            Math.cos(angle) * (0.3 + Math.random() * 0.5),
            0.5 + Math.random() * 0.8,
            Math.sin(angle) * (0.3 + Math.random() * 0.5),
          ),
          life: 0.9 + Math.random() * 0.4,
        })
      }
    },
    update(dt) {
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i]
        if (!spark) continue
        spark.life -= dt
        spark.velocity.y -= 1.6 * dt
        spark.sprite.position.addScaledVector(spark.velocity, dt)
        spark.sprite.material.opacity = Math.max(0, spark.life)
        if (spark.life <= 0) {
          group.remove(spark.sprite)
          spark.sprite.material.dispose()
          sparks.splice(i, 1)
        }
      }
    },
  }
}

/** 空気中の塵(光の帯の中でゆっくり漂う) */
export const createDust = (center: THREE.Vector3, spread: THREE.Vector3, count = 50): {
  points: THREE.Points
  update(time: number): void
} => {
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = center.x + (Math.random() - 0.5) * spread.x
    positions[i * 3 + 1] = center.y + (Math.random() - 0.5) * spread.y
    positions[i * 3 + 2] = center.z + (Math.random() - 0.5) * spread.z
    seeds[i] = Math.random() * 100
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    color: '#ffe8c0',
    size: 0.02,
    map: softCircleTexture('rgba(255,240,210,1)', 'rgba(255,240,210,0)'),
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const points = new THREE.Points(geometry, material)
  const base = positions.slice()
  return {
    points,
    update(time) {
      const attr = geometry.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < count; i++) {
        const s = seeds[i] ?? 0
        attr.setX(i, (base[i * 3] ?? 0) + Math.sin(time * 0.12 + s) * 0.12)
        attr.setY(i, (base[i * 3 + 1] ?? 0) + Math.sin(time * 0.07 + s * 2) * 0.1)
        attr.setZ(i, (base[i * 3 + 2] ?? 0) + Math.cos(time * 0.09 + s) * 0.12)
      }
      attr.needsUpdate = true
    },
  }
}
