import type * as THREE from 'three'
import { MINCHO, addGrain, paintTexture, seededRandom } from './base'

/** セピアの古写真(左半分・右半分・復元後) */
export const photoTexture = (part: 'left' | 'right' | 'full'): THREE.CanvasTexture =>
  paintTexture(part === 'full' ? 512 : 256, 384, (ctx, w, h) => {
    const fullW = part === 'full' ? w : w * 2
    const offsetX = part === 'right' ? -fullW / 2 : 0
    ctx.save()
    ctx.translate(offsetX, 0)
    // 背景(屋敷の前)
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#cbb89a')
    sky.addColorStop(1, '#8a7658')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, fullW, h)
    // 洋館のシルエット
    ctx.fillStyle = '#6e5c42'
    ctx.fillRect(fullW * 0.1, h * 0.24, fullW * 0.8, h * 0.42)
    ctx.beginPath()
    ctx.moveTo(fullW * 0.06, h * 0.26)
    ctx.lineTo(fullW * 0.5, h * 0.08)
    ctx.lineTo(fullW * 0.94, h * 0.26)
    ctx.fill()
    ctx.fillStyle = '#584a34'
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(fullW * (0.16 + i * 0.19), h * 0.32, fullW * 0.09, h * 0.16)
    }
    // 地面
    ctx.fillStyle = '#9a8663'
    ctx.fillRect(0, h * 0.66, fullW, h * 0.34)
    // 二人の紳士(左=父・右=子爵)
    const figure = (x: number, hat: boolean) => {
      ctx.fillStyle = '#3a3026'
      ctx.fillRect(x - 16, h * 0.5, 32, h * 0.34) // 体
      ctx.beginPath()
      ctx.arc(x, h * 0.47, 13, 0, Math.PI * 2) // 顔
      ctx.fillStyle = '#c2a582'
      ctx.fill()
      ctx.fillStyle = '#2c241c'
      if (hat) ctx.fillRect(x - 15, h * 0.4, 30, 7)
      ctx.beginPath()
      ctx.ellipse(x, h * 0.41, hat ? 10 : 14, 6, 0, Math.PI, Math.PI * 2)
      ctx.fill()
    }
    figure(fullW * 0.42, false)
    figure(fullW * 0.58, true)
    ctx.restore()
    // セピアのむら・退色
    addGrain(ctx, w, h, 0.1, 141, '#5c4a30', '#e8dcc0')
    ctx.strokeStyle = '#efe6d2'
    ctx.lineWidth = 10
    ctx.strokeRect(0, 0, w, h)
    // 破れ目
    if (part !== 'full') {
      const rand = seededRandom(142)
      ctx.fillStyle = '#efe6d2'
      const edge = part === 'left' ? w : 0
      ctx.beginPath()
      ctx.moveTo(edge, 0)
      for (let y = 0; y <= h; y += 24) {
        ctx.lineTo(edge + (part === 'left' ? -1 : 1) * rand() * 14, y)
      }
      ctx.lineTo(edge, h)
      ctx.closePath()
      ctx.fill()
    }
  })

/** 手紙・便箋(白紙 or 罫線入り) */
export const paperTexture = (kind: 'blank' | 'letter' | 'diary'): THREE.CanvasTexture =>
  paintTexture(256, 384, (ctx, w, h) => {
    ctx.fillStyle = kind === 'diary' ? '#4a3328' : '#f0e8d4'
    ctx.fillRect(0, 0, w, h)
    if (kind === 'diary') {
      ctx.strokeStyle = '#c9a34e'
      ctx.lineWidth = 3
      ctx.strokeRect(14, 14, w - 28, h - 28)
      ctx.fillStyle = '#e8dcc0'
      ctx.font = `34px ${MINCHO}`
      ctx.textAlign = 'center'
      ctx.fillText('日', w / 2, h * 0.42)
      ctx.fillText('記', w / 2, h * 0.54)
    } else if (kind === 'letter') {
      ctx.strokeStyle = 'rgba(140,60,60,0.5)'
      ctx.lineWidth = 1.4
      for (let x = 36; x < w - 20; x += 26) {
        ctx.beginPath()
        ctx.moveTo(x, 26)
        ctx.lineTo(x, h - 26)
        ctx.stroke()
      }
    }
    addGrain(ctx, w, h, 0.05, 151)
  })

/** マッチ箱のラベル */
export const matchboxTexture = (): THREE.CanvasTexture =>
  paintTexture(256, 160, (ctx, w, h) => {
    ctx.fillStyle = '#27406b'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#d8b64d'
    ctx.lineWidth = 5
    ctx.strokeRect(10, 10, w - 20, h - 20)
    ctx.fillStyle = '#d8b64d'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 34, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#27406b'
    ctx.font = `28px ${MINCHO}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('燐', w / 2, h / 2)
    ctx.fillStyle = '#e8dcc0'
    ctx.font = `20px ${MINCHO}`
    ctx.fillText('久遠寺洋燐', w / 2, h - 28)
  })

/** 扉の札(「寝室」「書斎」) */
export const doorPlateTexture = (label: string): THREE.CanvasTexture =>
  paintTexture(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b99a55'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#7a5c2e'
    ctx.lineWidth = 6
    ctx.strokeRect(6, 6, w - 12, h - 12)
    ctx.fillStyle = '#2e2214'
    ctx.font = `44px ${MINCHO}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ;[...label].forEach((ch, i) => {
      ctx.fillText(ch, w / 2, h * 0.3 + i * 52)
    })
  })

/** ピアノの音名札 */
export const noteLabelsTexture = (labels: readonly string[]): THREE.CanvasTexture =>
  paintTexture(512, 64, (ctx, w, h) => {
    ctx.fillStyle = '#efe6d2'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#332818'
    ctx.font = `30px ${MINCHO}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const cell = w / labels.length
    labels.forEach((label, i) => {
      ctx.fillText(label, cell * i + cell / 2, h / 2)
      if (i > 0) {
        ctx.strokeStyle = 'rgba(50,40,24,0.4)'
        ctx.beginPath()
        ctx.moveTo(cell * i, 8)
        ctx.lineTo(cell * i, h - 8)
        ctx.stroke()
      }
    })
  })

/** やわらかい円(炎・光の粒・マーカー用スプライト) */
export const softCircleTexture = (inner: string, outer: string): THREE.CanvasTexture =>
  paintTexture(
    128,
    128,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h)
      const grad = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2)
      grad.addColorStop(0, inner)
      grad.addColorStop(1, outer)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
    },
    { srgb: false },
  )

/** ホットスポットマーカー(光の環) */
export const markerTexture = (): THREE.CanvasTexture =>
  paintTexture(
    128,
    128,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h)
      const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, 42)
      grad.addColorStop(0, 'rgba(255,220,150,0)')
      grad.addColorStop(0.7, 'rgba(255,222,160,0.85)')
      grad.addColorStop(1, 'rgba(255,220,150,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(255,236,190,0.95)'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, 7, 0, Math.PI * 2)
      ctx.fill()
    },
    { srgb: false },
  )

/** 覚書などの小さな紙片 */
export const memoTexture = (): THREE.CanvasTexture =>
  paintTexture(192, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ede2c8'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(70,50,30,0.75)'
    ctx.font = `18px ${MINCHO}`
    ctx.textAlign = 'center'
    ctx.fillText('覚書', w / 2, 36)
    ctx.strokeStyle = 'rgba(70,50,30,0.4)'
    for (let y = 64; y < h - 24; y += 24) {
      ctx.beginPath()
      ctx.moveTo(24, y)
      ctx.lineTo(w - 24, y)
      ctx.stroke()
    }
    addGrain(ctx, w, h, 0.06, 161)
  })
