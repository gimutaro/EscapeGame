import * as THREE from 'three'
import { MINCHO, paintTexture } from './base'

/** 0〜9 の数字が一周するダイヤルリング(宝石箱・金庫) */
export const digitRingTexture = (dark = false): THREE.CanvasTexture => {
  const texture = paintTexture(640, 64, (ctx, w, h) => {
    ctx.fillStyle = dark ? '#2e2a26' : '#4a3a22'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = dark ? '#d8d2c0' : '#e8d8a8'
    ctx.font = `bold 40px ${MINCHO}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const cell = w / 10
    for (let i = 0; i < 10; i++) {
      ctx.fillText(String(i), cell * i + cell / 2, h / 2)
      ctx.strokeStyle = 'rgba(255,240,200,0.35)'
      ctx.beginPath()
      ctx.moveTo(cell * i, 6)
      ctx.lineTo(cell * i, h - 6)
      ctx.stroke()
    }
  })
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

/** 花の彫刻アイコン(桜・梅・菊 — 形で判別できる) */
export const flowerIconTexture = (kind: 'sakura' | 'ume' | 'kiku'): THREE.CanvasTexture =>
  paintTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#3a2c18'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#c9a34e'
    ctx.lineWidth = 3
    ctx.strokeRect(4, 4, w - 8, h - 8)
    const cx = w / 2
    const cy = h / 2 - 6
    ctx.fillStyle = '#e8cf96'
    if (kind === 'sakura') {
      for (let i = 0; i < 5; i++) {
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate((i * Math.PI * 2) / 5)
        ctx.beginPath()
        ctx.moveTo(0, -8)
        ctx.bezierCurveTo(-14, -18, -9, -38, 0, -30)
        ctx.bezierCurveTo(9, -38, 14, -18, 0, -8)
        ctx.fill()
        ctx.restore()
      }
    } else if (kind === 'ume') {
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5
        ctx.beginPath()
        ctx.arc(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16, 13, 0, Math.PI * 2)
        ctx.fill()
      }
    } else {
      ctx.strokeStyle = '#e8cf96'
      ctx.lineWidth = 5
      ctx.lineCap = 'round'
      for (let i = 0; i < 14; i++) {
        const a = (i * Math.PI * 2) / 14
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7)
        ctx.lineTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30)
        ctx.stroke()
      }
    }
    // 花名
    ctx.fillStyle = '#c9a34e'
    ctx.font = `20px ${MINCHO}`
    ctx.textAlign = 'center'
    const label = kind === 'sakura' ? '桜' : kind === 'ume' ? '梅' : '菊'
    ctx.fillText(label, cx, h - 16)
  })
