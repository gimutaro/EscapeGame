import type * as THREE from 'three'
import { addGrain, paintTexture, seededRandom } from './base'

/** 木目(基準色を変えて使い回す) */
export const woodTexture = (base: string, dark: string, seed = 3): THREE.CanvasTexture =>
  paintTexture(
    512,
    512,
    (ctx, w, h) => {
      const rand = seededRandom(seed)
      ctx.fillStyle = base
      ctx.fillRect(0, 0, w, h)
      for (let i = 0; i < 90; i++) {
        const y = rand() * h
        const amplitude = 2 + rand() * 6
        const period = 80 + rand() * 200
        ctx.strokeStyle = dark
        ctx.globalAlpha = 0.05 + rand() * 0.12
        ctx.lineWidth = 0.6 + rand() * 2.2
        ctx.beginPath()
        for (let x = 0; x <= w; x += 8) {
          const yy = y + Math.sin((x / period) * Math.PI * 2 + rand() * 0.4) * amplitude
          if (x === 0) ctx.moveTo(x, yy)
          else ctx.lineTo(x, yy)
        }
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      addGrain(ctx, w, h, 0.05, seed + 1)
    },
    { repeat: [2, 2] },
  )

/** 寄木(ヘリンボーン)張りの床 */
export const herringboneTexture = (): THREE.CanvasTexture =>
  paintTexture(
    1024,
    1024,
    (ctx, w, h) => {
      const rand = seededRandom(11)
      ctx.fillStyle = '#5d4126'
      ctx.fillRect(0, 0, w, h)
      const plankW = 128
      const plankH = 32
      const palette = ['#6b4a2b', '#5f4224', '#755230', '#684628', '#71502e']
      for (let row = -2; row < h / plankH + 2; row++) {
        for (let col = -2; col < w / plankW + 2; col++) {
          const x = col * plankW + (row % 2) * (plankW / 2)
          const y = row * plankH
          ctx.save()
          ctx.translate(x + plankW / 2, y + plankH / 2)
          ctx.rotate(((row + col) % 2 === 0 ? 45 : -45) * (Math.PI / 180))
          const color = palette[Math.floor(rand() * palette.length)] ?? '#6b4a2b'
          ctx.fillStyle = color
          ctx.fillRect(-plankW / 2, -plankH / 2, plankW, plankH)
          ctx.strokeStyle = 'rgba(30,18,8,0.55)'
          ctx.lineWidth = 2
          ctx.strokeRect(-plankW / 2, -plankH / 2, plankW, plankH)
          // 板ごとの木目
          ctx.strokeStyle = 'rgba(40,24,10,0.35)'
          ctx.lineWidth = 1
          for (let i = 0; i < 3; i++) {
            const yy = -plankH / 2 + (i + 1) * (plankH / 4) + rand() * 3
            ctx.beginPath()
            ctx.moveTo(-plankW / 2, yy)
            ctx.lineTo(plankW / 2, yy + rand() * 4 - 2)
            ctx.stroke()
          }
          ctx.restore()
        }
      }
      addGrain(ctx, w, h, 0.05, 12)
    },
    { repeat: [3, 3] },
  )

/** ダマスク柄壁紙(腰壁より上)— 色味を部屋ごとに変える */
export const damaskTexture = (bg: string, motif: string, seed = 5): THREE.CanvasTexture =>
  paintTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)
      const cell = 128
      const drawMotif = (cx: number, cy: number, s: number) => {
        ctx.save()
        ctx.translate(cx, cy)
        ctx.scale(s, s)
        ctx.globalAlpha = 0.42
        ctx.fillStyle = motif
        // 中央の花芯
        ctx.beginPath()
        ctx.arc(0, 0, 7, 0, Math.PI * 2)
        ctx.fill()
        // 花弁(上下左右+斜め)
        for (let i = 0; i < 8; i++) {
          ctx.save()
          ctx.rotate((i * Math.PI) / 4)
          ctx.beginPath()
          ctx.ellipse(0, -20, 6, 14, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
        // 蔓
        ctx.strokeStyle = motif
        ctx.lineWidth = 2.4
        for (const dir of [1, -1]) {
          ctx.beginPath()
          ctx.moveTo(0, dir * 34)
          ctx.bezierCurveTo(dir * 22, dir * 46, dir * 30, dir * 58, 0, dir * 62)
          ctx.stroke()
        }
        // 周囲の小さな点飾り
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2 + Math.PI / 4
          ctx.beginPath()
          ctx.arc(Math.cos(a) * 46, Math.sin(a) * 46, 3.4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
        ctx.restore()
      }
      for (let ry = 0; ry <= h / cell; ry++) {
        for (let rx = 0; rx <= w / cell; rx++) {
          const offset = ry % 2 === 0 ? 0 : cell / 2
          drawMotif(rx * cell + offset, ry * cell + cell / 2, 0.92)
        }
      }
      addGrain(ctx, w, h, 0.04, seed)
    },
    { repeat: [4, 2] },
  )

/** ペルシャ絨毯 */
export const carpetTexture = (): THREE.CanvasTexture =>
  paintTexture(1024, 768, (ctx, w, h) => {
    const rand = seededRandom(21)
    ctx.fillStyle = '#7c2d3a'
    ctx.fillRect(0, 0, w, h)
    // 外周の帯
    const bands = [
      { inset: 18, width: 14, color: '#2f4145' },
      { inset: 44, width: 26, color: '#a8894f' },
      { inset: 84, width: 10, color: '#2f4145' },
    ]
    for (const band of bands) {
      ctx.strokeStyle = band.color
      ctx.lineWidth = band.width
      ctx.strokeRect(band.inset, band.inset, w - band.inset * 2, h - band.inset * 2)
    }
    // 帯の中の細かい刻み
    ctx.strokeStyle = '#e2d2a8'
    ctx.lineWidth = 2
    for (let x = 56; x < w - 56; x += 22) {
      ctx.strokeRect(x, 48, 10, 18)
      ctx.strokeRect(x, h - 66, 10, 18)
    }
    // 中央メダリオン
    const cx = w / 2
    const cy = h / 2
    for (const [r, color] of [
      [190, '#a8894f'],
      [160, '#31424a'],
      [120, '#a8894f'],
      [88, '#8f3b46'],
    ] as const) {
      ctx.fillStyle = color
      ctx.beginPath()
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2
        const rr = r * (i % 2 === 0 ? 1 : 0.82)
        const px = cx + Math.cos(angle) * rr
        const py = cy + Math.sin(angle) * rr * 0.72
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
    }
    // 小さな菱形の散らし
    ctx.fillStyle = '#d9c491'
    for (let i = 0; i < 60; i++) {
      const x = 120 + rand() * (w - 240)
      const y = 120 + rand() * (h - 240)
      if (Math.hypot(x - cx, (y - cy) / 0.72) < 210) continue
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(Math.PI / 4)
      ctx.globalAlpha = 0.75
      ctx.fillRect(-4, -4, 8, 8)
      ctx.restore()
    }
    ctx.globalAlpha = 1
    addGrain(ctx, w, h, 0.09, 22)
  })

/** 大理石(暖炉まわり) */
export const marbleTexture = (): THREE.CanvasTexture =>
  paintTexture(512, 512, (ctx, w, h) => {
    const rand = seededRandom(31)
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#e9e4da')
    grad.addColorStop(0.5, '#ded6c8')
    grad.addColorStop(1, '#e5dfd2')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 14; i++) {
      ctx.strokeStyle = `rgba(110,104,96,${0.12 + rand() * 0.2})`
      ctx.lineWidth = 0.8 + rand() * 1.6
      ctx.beginPath()
      let x = rand() * w
      let y = 0
      ctx.moveTo(x, y)
      while (y < h) {
        x += (rand() - 0.5) * 60
        y += 20 + rand() * 40
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    addGrain(ctx, w, h, 0.03, 32)
  })

/** 漆喰(天井) */
export const plasterTexture = (): THREE.CanvasTexture =>
  paintTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#d8d0bd'
      ctx.fillRect(0, 0, w, h)
      addGrain(ctx, w, h, 0.05, 41)
    },
    { repeat: [4, 4] },
  )

/** 金箔(屏風) */
export const goldLeafTexture = (): THREE.CanvasTexture =>
  paintTexture(512, 512, (ctx, w, h) => {
    const rand = seededRandom(51)
    ctx.fillStyle = '#c3a24b'
    ctx.fillRect(0, 0, w, h)
    const cell = 64
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        ctx.fillStyle = `rgba(${190 + Math.floor(rand() * 40)}, ${150 + Math.floor(rand() * 30)}, ${60 + Math.floor(rand() * 30)}, 0.5)`
        ctx.fillRect(x, y, cell, cell)
        ctx.strokeStyle = 'rgba(120,90,30,0.4)'
        ctx.lineWidth = 1
        ctx.strokeRect(x + 0.5, y + 0.5, cell, cell)
      }
    }
    addGrain(ctx, w, h, 0.05, 52)
  })
