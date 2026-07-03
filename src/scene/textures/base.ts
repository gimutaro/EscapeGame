import * as THREE from 'three'

export type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

/** 2D キャンバスに描いて CanvasTexture 化する(全テクスチャの共通基盤) */
export const paintTexture = (
  width: number,
  height: number,
  painter: Painter,
  options: { repeat?: [number, number]; srgb?: boolean } = {},
): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('CanvasRenderingContext2D を取得できません')
  painter(ctx, width, height)
  const texture = new THREE.CanvasTexture(canvas)
  if (options.srgb !== false) texture.colorSpace = THREE.SRGBColorSpace
  if (options.repeat) {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(options.repeat[0], options.repeat[1])
  }
  texture.anisotropy = 4
  return texture
}

/** 再現可能な擬似乱数(テクスチャの模様を決定的にする) */
export const seededRandom = (seed: number): (() => number) => {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

/** うっすらとした紙・布のむら(ノイズ)を重ねる */
export const addGrain = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha: number,
  seed = 7,
  dark = '#000000',
  light = '#ffffff',
): void => {
  const rand = seededRandom(seed)
  const count = Math.floor((w * h) / 90)
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = rand() < 0.5 ? dark : light
    ctx.globalAlpha = alpha * rand()
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2)
  }
  ctx.globalAlpha = 1
}

/** 縦書き風に1文字ずつ文字を描く */
export const drawVerticalText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  lineHeight: number,
): void => {
  ;[...text].forEach((ch, i) => {
    ctx.fillText(ch, x, y + i * lineHeight)
  })
}

export const MINCHO = '"Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif'
