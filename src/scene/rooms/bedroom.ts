import * as THREE from 'three'
import { Reflector } from 'three/addons/objects/Reflector.js'
import type { GameEvent } from '../../core/events'
import type { GameState } from '../../core/state'
import type { Tweens } from '../../utils/tween'
import { getQualityTier } from '../quality'
import type { Materials } from '../materials'
import { boxMesh, cylinderMesh, hitbox, meshOf } from '../materials'
import { buildCeiling, buildFloor, buildWall, buildWindow } from '../roomShell'
import { laceTexture } from '../textures/art'
import { carpetTexture, damaskTexture } from '../textures/surfaces'
import { brassPlateTexture, digitRingTexture, flowerIconTexture } from '../textures/dials'
import { byobuTexture, kimonoTexture } from '../textures/props'
import { paperTexture } from '../textures/small'
import type { Interactable, RoomModule, ViewDef } from '../types'

const CX = 7
const W = 6
const D = 5
const H = 3.4

/** 寝室 — 鏡と想い出の間 */
export const buildBedroom = (materials: Materials, tweens: Tweens): RoomModule => {
  const group = new THREE.Group()
  const paper = new THREE.MeshStandardMaterial({
    map: damaskTexture('#b9aec2', '#6e5a78', 6),
    roughness: 0.88,
  })

  group.add(buildFloor(W, D, materials.floorWood, CX, 0))
  group.add(buildCeiling(W, D, H, materials, CX, 0))
  // 北壁(窓)
  const north = buildWall(W, H, materials, paper, [
    { center: 0, width: 1.5, height: 1.7, bottom: 0.9 },
  ])
  north.position.set(CX, 0, -D / 2)
  group.add(north)
  // 南壁・東壁
  const south = buildWall(W, H, materials, paper)
  south.rotation.y = Math.PI
  south.position.set(CX, 0, D / 2)
  group.add(south)
  const east = buildWall(D, H, materials, paper)
  east.rotation.y = Math.PI / 2
  east.position.set(CX + W / 2, 0, 0)
  group.add(east)

  // 夜空の見える窓 — 壁からのオフセットは枠の前面が壁面と同一平面にならない値にする(Zファイティング防止)
  const window = buildWindow(1.44, 1.66, materials, { moon: false, lace: laceTexture(), seed: 83 })
  window.position.set(CX, 0.9, -D / 2 + 0.035)
  group.add(window)

  // 敷物(寝台の脇)
  const rug = meshOf(
    new THREE.PlaneGeometry(2.4, 1.7),
    new THREE.MeshStandardMaterial({ map: carpetTexture(), color: '#b9a8c2', roughness: 0.96 }),
    false,
    true,
  )
  rug.rotation.x = -Math.PI / 2
  rug.rotation.z = Math.PI / 2
  rug.position.set(CX + 0.9, 0.006, 0.2)
  group.add(rug)

  // 真鍮のベッド
  const bed = new THREE.Group()
  bed.position.set(CX + 1.6, 0, -1.25)
  const mattress = boxMesh(1.4, 0.28, 2.05, new THREE.MeshStandardMaterial({ color: '#e5ddca', roughness: 0.9 }), 0, 0.42, 0)
  bed.add(mattress)
  const blanket = boxMesh(1.42, 0.1, 1.3, materials.velvetRed, 0, 0.56, 0.32)
  bed.add(blanket)
  const pillow = boxMesh(0.6, 0.12, 0.36, new THREE.MeshStandardMaterial({ color: '#f0ead8', roughness: 0.95 }), 0, 0.56, -0.75)
  pillow.rotation.x = -0.12
  bed.add(pillow)
  bed.add(boxMesh(1.44, 0.16, 2.1, materials.woodDark, 0, 0.24, 0))
  for (const [px, pz, tall] of [
    [-0.68, -1.0, 1],
    [0.68, -1.0, 1],
    [-0.68, 1.0, 0],
    [0.68, 1.0, 0],
  ] as const) {
    const post = cylinderMesh(0.025, 0.025, tall ? 1.15 : 0.85, materials.brass, 10)
    post.position.set(px, (tall ? 1.15 : 0.85) / 2, pz)
    bed.add(post)
    const finial = meshOf(new THREE.SphereGeometry(0.045, 12, 10), materials.brass)
    finial.position.set(px, tall ? 1.18 : 0.88, pz)
    bed.add(finial)
  }
  for (const [pz, py, tall] of [
    [-1.0, 0.95, 1],
    [1.0, 0.7, 0],
  ] as const) {
    void tall
    const rail = cylinderMesh(0.018, 0.018, 1.36, materials.brass, 8)
    rail.rotation.z = Math.PI / 2
    rail.position.set(0, py, pz)
    bed.add(rail)
  }
  group.add(bed)

  // サイドテーブル(日記・ランプ)
  const sideTable = new THREE.Group()
  sideTable.position.set(CX + 0.35, 0, -2.05)
  sideTable.add(boxMesh(0.5, 0.05, 0.42, materials.woodRed, 0, 0.62, 0))
  sideTable.add(boxMesh(0.42, 0.56, 0.34, materials.woodMid, 0, 0.32, 0))
  const diary = boxMesh(0.2, 0.035, 0.27, new THREE.MeshStandardMaterial({ map: paperTexture('diary'), roughness: 0.7 }), -0.08, 0.66, 0.02)
  diary.rotation.y = 0.25
  sideTable.add(diary)
  // 小さなランプ(丸い傘の置きランプ、花瓶型の真鍮支柱)
  const lamp = new THREE.Group()
  lamp.position.set(0.13, 0.645, -0.06)
  const stemPts = [
    new THREE.Vector2(0.055, 0),
    new THREE.Vector2(0.055, 0.012),
    new THREE.Vector2(0.028, 0.022),
    new THREE.Vector2(0.017, 0.1),
    new THREE.Vector2(0.026, 0.13),
    new THREE.Vector2(0.022, 0.14),
  ]
  const lampStem = meshOf(new THREE.LatheGeometry(stemPts, 20), materials.brass)
  lamp.add(lampStem)
  const lampFootRing = meshOf(new THREE.TorusGeometry(0.055, 0.004, 8, 24), materials.brassDark)
  lampFootRing.rotation.x = Math.PI / 2
  lampFootRing.position.y = 0.012
  lamp.add(lampFootRing)

  const domeRadius = 0.095
  const domeThetaLength = Math.PI * 0.48
  const sphereCenterY = 0.14 - domeRadius * Math.cos(domeThetaLength)
  const lampShade = meshOf(
    new THREE.SphereGeometry(domeRadius, 20, 12, 0, Math.PI * 2, 0, domeThetaLength),
    new THREE.MeshStandardMaterial({
      color: '#f2e2bd',
      roughness: 0.6,
      side: THREE.DoubleSide,
    }),
    false,
    false,
  )
  lampShade.position.y = sphereCenterY
  lamp.add(lampShade)
  const lampShadeTrim = meshOf(new THREE.TorusGeometry(domeRadius, 0.005, 8, 28), materials.brass)
  lampShadeTrim.rotation.x = Math.PI / 2
  lampShadeTrim.position.y = 0.14
  lamp.add(lampShadeTrim)

  const lampFinial = meshOf(new THREE.SphereGeometry(0.013, 12, 10), materials.brass)
  lampFinial.position.y = sphereCenterY + domeRadius + 0.01
  lamp.add(lampFinial)

  sideTable.add(lamp)
  group.add(sideTable)

  // 鏡台(東壁・鏡は西向き=屏風を映す)
  const vanity = new THREE.Group()
  vanity.position.set(CX + 2.82, 0, 0.9)
  // 天板は南側(宝石箱側)へ少し伸ばし、鏡の枠を避けつつ箱が余裕を持って乗る広さにする。
  // 土台(引き出し部)も同じだけ伸ばし、天板が宙に浮いて見えないようにする
  vanity.add(boxMesh(0.44, 0.06, 1.1, materials.woodRed, 0, 0.72, 0.05))
  vanity.add(boxMesh(0.4, 0.68, 1.0, materials.woodMid, 0, 0.36, 0.05))
  // 鏡(実反射)
  const mirror = new Reflector(new THREE.PlaneGeometry(0.52, 0.9), {
    textureWidth: 512,
    textureHeight: 512,
    color: 0xa8b0b8,
    clipBias: 0.003,
  })
  mirror.rotation.y = -Math.PI / 2
  mirror.position.set(-0.21, 1.32, -0.1)
  vanity.add(mirror)
  const mirrorFrame = boxMesh(0.05, 1.04, 0.66, materials.woodRed, -0.17, 1.32, -0.1)
  vanity.add(mirrorFrame)
  group.add(vanity)

  // 宝石箱(花のダイヤル×3)— 鏡台の天板の南端(鏡の枠と天板の縁の間)に収める
  // 天板は世界Z [0.4, 1.5]、鏡の枠は世界Z [0.47, 1.13] まで。箱の奥行き0.28の
  // 半分(0.14)を引いても両方に余裕を残せる位置に JEWEL_Z を置く
  const JEWEL_Z = 1.3
  const jewelry = new THREE.Group()
  jewelry.position.set(CX + 2.82, 0.75, JEWEL_Z)
  jewelry.rotation.y = -Math.PI / 2
  jewelry.add(boxMesh(0.28, 0.16, 0.22, materials.woodRed, 0, 0.08, 0))
  const jewelLidHinge = new THREE.Group()
  jewelLidHinge.position.set(0, 0.16, -0.11)
  jewelLidHinge.add(boxMesh(0.28, 0.03, 0.22, materials.woodDark, 0, 0.015, 0.11))
  jewelry.add(jewelLidHinge)
  // 内張り
  jewelry.add(boxMesh(0.24, 0.02, 0.18, new THREE.MeshStandardMaterial({ color: '#5e2536', roughness: 1 }), 0, 0.155, 0))
  const ringTexture = digitRingTexture()
  const jewelryDials: THREE.Mesh[] = []
  const flowerKinds = ['sakura', 'ume', 'kiku'] as const
  // 前面の構成(下から): 数字窓付きダイヤル → 花の彫刻 → 蓋の留め金「開ける」
  flowerKinds.forEach((kind, i) => {
    const x = (i - 1) * 0.1
    const dial = meshOf(
      new THREE.CylinderGeometry(0.032, 0.032, 0.028, 20, 1, false),
      // 覆いの影の中でも数字が読めるよう、ごく弱い自発光を入れる
      new THREE.MeshStandardMaterial({
        map: ringTexture.clone(),
        roughness: 0.5,
        metalness: 0.35,
        emissive: '#8a744a',
        emissiveMap: ringTexture.clone(),
        emissiveIntensity: 0.5,
      }),
    )
    dial.rotation.z = Math.PI / 2
    dial.position.set(x, 0.058, 0.115)
    jewelry.add(dial)
    jewelryDials.push(dial)
    const icon = meshOf(
      new THREE.PlaneGeometry(0.046, 0.046),
      new THREE.MeshStandardMaterial({ map: flowerIconTexture(kind), roughness: 0.6 }),
      false,
      false,
    )
    icon.position.set(x, 0.118, 0.112)
    jewelry.add(icon)
    // 数字窓(オドメーター式の覆い)— 正面の1桁だけが見え、合わせる位置が分かる
    jewelry.add(boxMesh(0.05, 0.022, 0.008, materials.brassDark, x, 0.082, 0.152))
    jewelry.add(boxMesh(0.05, 0.022, 0.008, materials.brassDark, x, 0.034, 0.152))
    jewelry.add(boxMesh(0.006, 0.07, 0.008, materials.brass, x - 0.022, 0.058, 0.152))
    jewelry.add(boxMesh(0.006, 0.07, 0.008, materials.brass, x + 0.022, 0.058, 0.152))
  })
  // 決定ボタン(「開ける」の留め金)— 実物の宝石箱と同じく、蓋の継ぎ目の前面中央に置く
  const latch = boxMesh(0.11, 0.032, 0.03, materials.brass, 0, 0.166, 0.124)
  jewelry.add(latch)
  const latchLabel = meshOf(
    new THREE.PlaneGeometry(0.104, 0.028),
    new THREE.MeshStandardMaterial({ map: brassPlateTexture('開 け る'), roughness: 0.45, metalness: 0.4 }),
    false,
    false,
  )
  latchLabel.position.set(0, 0.166, 0.1395)
  jewelry.add(latchLabel)
  group.add(jewelry)

  // 洋箪笥(観音開き・着物)
  const wardrobe = new THREE.Group()
  wardrobe.position.set(CX - 0.4, 0, 2.15)
  wardrobe.rotation.y = Math.PI
  // 躯体は前面のない箱(背板+側板+天地)— 開けると中が見える
  wardrobe.add(boxMesh(1.6, 2.2, 0.05, materials.woodRed, 0, 1.1, -0.285))
  wardrobe.add(boxMesh(0.06, 2.2, 0.62, materials.woodRed, -0.77, 1.1, 0))
  wardrobe.add(boxMesh(0.06, 2.2, 0.62, materials.woodRed, 0.77, 1.1, 0))
  wardrobe.add(boxMesh(1.6, 0.06, 0.62, materials.woodRed, 0, 2.17, 0))
  wardrobe.add(boxMesh(1.6, 0.14, 0.62, materials.woodRed, 0, 0.07, 0))
  wardrobe.add(boxMesh(1.7, 0.1, 0.68, materials.woodDark, 0, 2.22, 0))
  // 内側(照明に影響されない暗がり+着物)
  wardrobe.add(boxMesh(1.44, 1.95, 0.03, new THREE.MeshBasicMaterial({ color: '#150d08' }), 0, 1.08, -0.25))
  const kimono = meshOf(
    new THREE.PlaneGeometry(0.66, 1.32),
    new THREE.MeshStandardMaterial({ map: kimonoTexture(), roughness: 0.8, side: THREE.DoubleSide }),
    false,
    false,
  )
  kimono.position.set(0, 1.02, -0.14)
  wardrobe.add(kimono)
  // 袖(花は描かない: 数える花は身頃だけにする)
  const sleeve = meshOf(
    new THREE.PlaneGeometry(1.1, 0.42),
    new THREE.MeshStandardMaterial({ map: kimonoTexture(false), roughness: 0.8, side: THREE.DoubleSide }),
    false,
    false,
  )
  sleeve.position.set(0, 1.45, -0.15)
  wardrobe.add(sleeve)
  const rod = cylinderMesh(0.015, 0.015, 1.4, materials.brassDark, 8)
  rod.rotation.z = Math.PI / 2
  rod.position.set(0, 1.78, -0.14)
  wardrobe.add(rod)
  // 扉(蝶番は外側)
  const wardrobeDoors: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group()
    hinge.position.set(side * 0.8, 1.1, 0.31)
    const door = new THREE.Group()
    door.add(boxMesh(0.78, 2.1, 0.05, materials.woodRed, -side * 0.39, 0, 0))
    door.add(boxMesh(0.56, 1.8, 0.015, materials.woodDark, -side * 0.39, 0, 0.03))
    const knob = meshOf(new THREE.SphereGeometry(0.025, 10, 8), materials.brass)
    knob.position.set(-side * 0.72, 0, 0.05)
    door.add(knob)
    hinge.add(door)
    wardrobe.add(hinge)
    wardrobeDoors.push(hinge)
  }
  group.add(wardrobe)

  // 屏風(鏡文字・鏡台の正面=西側)
  const byobu = new THREE.Group()
  byobu.position.set(CX - 2.72, 0, 0.85)
  const byobuTex = byobuTexture()
  for (let i = 0; i < 4; i++) {
    const texture = byobuTex.clone()
    texture.repeat.set(0.25, 1)
    // パネルの u+ は北向きのため、南から北へ連続するようスライスを逆順に割り当てる
    texture.offset.set((3 - i) / 4, 0)
    const panel = meshOf(
      new THREE.PlaneGeometry(0.56, 1.72),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.55, metalness: 0.25, side: THREE.DoubleSide }),
      true,
      false,
    )
    const zigzag = i % 2 === 0 ? 0.18 : -0.18
    panel.rotation.y = Math.PI / 2 + zigzag
    panel.position.set(Math.abs(zigzag) * 0.3, 0.92, -0.84 + i * 0.56)
    byobu.add(panel)
    const foot = boxMesh(0.08, 0.05, 0.5, materials.woodDark, 0.02, 0.03, -0.84 + i * 0.56)
    byobu.add(foot)
  }
  group.add(byobu)

  // 照明
  const shadowMapSize = getQualityTier().shadowMapSize
  const pendant = new THREE.PointLight('#ffc490', 17, 0, 2)
  pendant.position.set(CX, 2.7, 0)
  pendant.castShadow = true
  pendant.shadow.mapSize.set(shadowMapSize, shadowMapSize)
  pendant.shadow.bias = -0.004
  group.add(pendant)
  const pendantShade = meshOf(
    new THREE.SphereGeometry(0.14, 16, 12),
    new THREE.MeshStandardMaterial({ color: '#f7ead2', emissive: '#ffcf90', emissiveIntensity: 1.7 }),
    false,
    false,
  )
  pendantShade.position.set(CX, 2.78, 0)
  group.add(pendantShade)
  const pendantStem = cylinderMesh(0.01, 0.01, 0.55, materials.brassDark, 8)
  pendantStem.position.set(CX, 3.13, 0)
  group.add(pendantStem)
  // 月光(窓から差し込む)
  const moon = new THREE.SpotLight('#9db4ff', 24, 11, 0.55, 0.65, 2)
  moon.position.set(CX, 2.6, -3.6)
  moon.target.position.set(CX, 0.3, 0.9)
  moon.castShadow = true
  moon.shadow.mapSize.set(shadowMapSize, shadowMapSize)
  moon.shadow.bias = -0.004
  group.add(moon, moon.target)

  // 当たり判定
  const bedHit = hitbox(1.7, 1.3, 2.3, CX + 1.6, 0.6, -1.25)
  const sideHit = hitbox(0.7, 1.1, 0.65, CX + 0.35, 0.5, -2.05)
  const vanityHit = hitbox(0.7, 1.9, 0.9, CX + 2.8, 0.95, 0.75)
  const jewelryHit = hitbox(0.36, 0.4, 0.5, CX + 2.78, 0.9, JEWEL_Z)
  const wardrobeHit = hitbox(1.8, 2.3, 1.0, CX - 0.4, 1.1, 2.1)
  const kimonoHit = hitbox(0.9, 1.5, 0.4, CX - 0.4, 1.05, 2.28)
  const byobuHit = hitbox(0.5, 1.9, 2.4, CX - 2.7, 0.95, 0.85)
  const windowHit = hitbox(1.7, 1.9, 0.4, CX, 1.7, -D / 2 + 0.1)
  group.add(bedHit, sideHit, vanityHit, jewelryHit, wardrobeHit, kimonoHit, byobuHit, windowHit)

  // ダイヤルの当たり判定(ローカル +x → ワールド +z の対応に合わせる)
  // 「開ける」の留め金は蓋の継ぎ目(上段)にあり、ダイヤル(下段)とは視線がかすらない
  const jewelryDialHits: THREE.Mesh[] = []
  flowerKinds.forEach((_, i) => {
    const hit = hitbox(0.08, 0.075, 0.095)
    hit.position.set(CX + 2.82 - 0.14, 0.808, JEWEL_Z + (i - 1) * 0.1)
    group.add(hit)
    jewelryDialHits.push(hit)
  })
  const latchHit = hitbox(0.12, 0.06, 0.2, CX + 2.82 - 0.14, 0.916, JEWEL_Z)
  group.add(latchHit)

  const interactables: Interactable[] = [
    { id: 'bed', object: bedHit, context: 'room', rooms: ['bedroom'], markerAt: new THREE.Vector3(CX + 1.6, 0.75, -0.6) },
    {
      id: 'sideTable',
      object: sideHit,
      context: 'room',
      rooms: ['bedroom'],
      view: 'fv-sidetable',
      markerAt: new THREE.Vector3(CX + 0.3, 0.8, -1.95),
    },
    { id: 'sideTable', object: cloneHit(sideHit, group), context: 'fv-sidetable' },
    {
      id: 'vanity',
      object: vanityHit,
      context: 'room',
      rooms: ['bedroom'],
      view: 'fv-vanity',
      markerAt: new THREE.Vector3(CX + 2.7, 1.35, 0.9),
    },
    { id: 'vanity', object: cloneHit(vanityHit, group), context: 'fv-vanity' },
    {
      id: 'jewelryBox',
      object: jewelryHit,
      context: 'room',
      rooms: ['bedroom'],
      view: 'fv-jewelry',
      markerAt: new THREE.Vector3(CX + 2.72, 0.95, JEWEL_Z),
    },
    { id: 'jewelryBox', object: cloneHit(jewelryHit, group), context: 'fv-jewelry' },
    {
      id: 'wardrobe',
      object: wardrobeHit,
      context: 'room',
      rooms: ['bedroom'],
      view: 'fv-wardrobe',
      markerAt: new THREE.Vector3(CX - 0.4, 1.2, 1.75),
    },
    { id: 'wardrobe', object: cloneHit(wardrobeHit, group), context: 'fv-wardrobe' },
    { id: 'kimono', object: kimonoHit, context: 'fv-wardrobe' },
    {
      id: 'byobu',
      object: byobuHit,
      context: 'room',
      rooms: ['bedroom'],
      view: 'fv-byobu',
      markerAt: new THREE.Vector3(CX - 2.55, 1.1, 0.85),
    },
    { id: 'byobu', object: cloneHit(byobuHit, group), context: 'fv-byobu' },
    {
      id: 'bedroomWindow',
      object: windowHit,
      context: 'room',
      rooms: ['bedroom'],
      markerAt: new THREE.Vector3(CX, 1.6, -2.3),
    },
    ...jewelryDialHits.map(
      (hit, i): Interactable => ({
        id: `jewelryDial_${i as 0 | 1 | 2}` as const,
        object: hit,
        context: 'fv-jewelry',
      }),
    ),
    { id: 'jewelryLatch', object: latchHit, context: 'fv-jewelry' },
  ]

  const views: ViewDef[] = [
    {
      id: 'fv-sidetable',
      room: 'bedroom',
      position: new THREE.Vector3(CX + 0.35, 1.3, -1.25),
      lookAt: new THREE.Vector3(CX + 0.35, 0.62, -2.1),
    },
    {
      id: 'fv-vanity',
      room: 'bedroom',
      position: new THREE.Vector3(CX + 1.7, 1.4, 0.9),
      lookAt: new THREE.Vector3(CX + 2.62, 1.3, 0.9),
      fov: 42,
    },
    {
      id: 'fv-jewelry',
      room: 'bedroom',
      position: new THREE.Vector3(CX + 2.0, 1.14, JEWEL_Z + 0.42),
      lookAt: new THREE.Vector3(CX + 2.82, 0.78, JEWEL_Z + 0.02),
      fov: 42,
    },
    {
      id: 'fv-wardrobe',
      room: 'bedroom',
      position: new THREE.Vector3(CX - 0.4, 1.32, 0.2),
      lookAt: new THREE.Vector3(CX - 0.4, 1.12, 2.2),
      fov: 54,
    },
    {
      id: 'fv-byobu',
      room: 'bedroom',
      position: new THREE.Vector3(CX - 0.6, 1.3, 0.85),
      lookAt: new THREE.Vector3(CX - 2.72, 1.0, 0.85),
      fov: 50,
    },
  ]

  return {
    group,
    interactables,
    views,
    sync(state: GameState) {
      const open = state.flags.wardrobeOpen
      // 扉は部屋側(手前)へ開く
      wardrobeDoors[0]!.rotation.y = open ? -1.9 : 0
      wardrobeDoors[1]!.rotation.y = open ? 1.9 : 0
      jewelLidHinge.rotation.x = state.flags.jewelrySolved ? -1.75 : 0
      state.jewelryDials.forEach((value, i) => {
        const dial = jewelryDials[i]
        // 数字窓の正面に現在値が来る位相。Euler 順序 XYZ では z(横倒し)が先に
        // 適用されるため、x 回転がドラムを自軸で回す。+1 は窓位置の較正
        if (dial) dial.rotation.x = ((value + 1) / 10) * Math.PI * 2 + 0.02
      })
      mirror.visible = state.currentRoom === 'bedroom'
    },
    onEvent(event: GameEvent) {
      if (event.kind === 'effect' && event.effect === 'wardrobeOpen') {
        tweens.add(0.9, (t) => {
          wardrobeDoors[0]!.rotation.y = -1.9 * t
          wardrobeDoors[1]!.rotation.y = 1.9 * t
        })
      }
      if (event.kind === 'effect' && event.effect === 'jewelryOpen') {
        tweens.add(0.7, (t) => {
          jewelLidHinge.rotation.x = -1.75 * t
        })
      }
    },
  }
}

const cloneHit = (source: THREE.Mesh, parent: THREE.Group): THREE.Mesh => {
  const clone = source.clone()
  parent.add(clone)
  return clone
}
