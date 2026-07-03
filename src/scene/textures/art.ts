import type * as THREE from 'three'
import { MINCHO, addGrain, paintTexture, seededRandom } from './base'

/** 山あいの湖の油彩(リビングの傾いた絵) */
export const landscapeTexture = (): THREE.CanvasTexture =>
  paintTexture(512, 384, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55)
    sky.addColorStop(0, '#dfb98a')
    sky.addColorStop(1, '#c9a06b')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h * 0.6)
    // 遠山
    ctx.fillStyle = '#6d6a58'
    ctx.beginPath()
    ctx.moveTo(0, h * 0.5)
    ctx.lineTo(w * 0.3, h * 0.24)
    ctx.lineTo(w * 0.55, h * 0.48)
    ctx.lineTo(w * 0.78, h * 0.3)
    ctx.lineTo(w, h * 0.5)
    ctx.lineTo(w, h * 0.62)
    ctx.lineTo(0, h * 0.62)
    ctx.fill()
    // 湖
    const lake = ctx.createLinearGradient(0, h * 0.55, 0, h)
    lake.addColorStop(0, '#a8916b')
    lake.addColorStop(1, '#5e5844')
    ctx.fillStyle = lake
    ctx.fillRect(0, h * 0.55, w, h * 0.45)
    // 岸辺の木々
    const rand = seededRandom(61)
    ctx.fillStyle = '#3f4a33'
    for (let i = 0; i < 14; i++) {
      const x = rand() * w
      const y = h * 0.52 + rand() * 12
      const s = 14 + rand() * 26
      ctx.beginPath()
      ctx.ellipse(x, y, s * 0.5, s, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    // 筆致
    for (let i = 0; i < 260; i++) {
      ctx.strokeStyle = `rgba(255,244,220,${rand() * 0.06})`
      ctx.lineWidth = 1 + rand() * 2
      const x = rand() * w
      const y = rand() * h
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + 8 + rand() * 18, y + (rand() - 0.5) * 4)
      ctx.stroke()
    }
    addGrain(ctx, w, h, 0.05, 62)
  })

/** 久遠寺子爵の肖像画(書斎・金庫の隠し扉) */
export const portraitTexture = (): THREE.CanvasTexture =>
  paintTexture(512, 640, (ctx, w, h) => {
    const bg = ctx.createRadialGradient(w / 2, h * 0.35, 60, w / 2, h * 0.5, w * 0.9)
    bg.addColorStop(0, '#5a4a38')
    bg.addColorStop(1, '#241a12')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    const cx = w / 2
    // 肩と羽織(洋装の上に羽織)
    ctx.fillStyle = '#1d1a20'
    ctx.beginPath()
    ctx.moveTo(cx - 150, h)
    ctx.bezierCurveTo(cx - 150, h * 0.62, cx - 90, h * 0.5, cx, h * 0.5)
    ctx.bezierCurveTo(cx + 90, h * 0.5, cx + 150, h * 0.62, cx + 150, h)
    ctx.fill()
    // 白いシャツと蝶ネクタイ
    ctx.fillStyle = '#d8d2c2'
    ctx.beginPath()
    ctx.moveTo(cx - 26, h * 0.52)
    ctx.lineTo(cx + 26, h * 0.52)
    ctx.lineTo(cx + 12, h * 0.72)
    ctx.lineTo(cx - 12, h * 0.72)
    ctx.fill()
    ctx.fillStyle = '#3d2f4f'
    ctx.beginPath()
    ctx.ellipse(cx, h * 0.545, 20, 8, 0, 0, Math.PI * 2)
    ctx.fill()
    // 顔
    ctx.fillStyle = '#c9a180'
    ctx.beginPath()
    ctx.ellipse(cx, h * 0.36, 62, 78, 0, 0, Math.PI * 2)
    ctx.fill()
    // 陰影
    ctx.fillStyle = 'rgba(120,70,40,0.25)'
    ctx.beginPath()
    ctx.ellipse(cx + 24, h * 0.38, 40, 66, 0, -Math.PI / 2, Math.PI / 2)
    ctx.fill()
    // 髪(七三)
    ctx.fillStyle = '#2b2320'
    ctx.beginPath()
    ctx.ellipse(cx, h * 0.285, 64, 40, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    // 丸眼鏡
    ctx.strokeStyle = '#8f7a3f'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(cx - 24, h * 0.355, 17, 0, Math.PI * 2)
    ctx.moveTo(cx + 41, h * 0.355)
    ctx.arc(cx + 24, h * 0.355, 17, 0, Math.PI * 2)
    ctx.moveTo(cx - 7, h * 0.355)
    ctx.lineTo(cx + 7, h * 0.355)
    ctx.stroke()
    // 瞳と口髭
    ctx.fillStyle = '#241a12'
    ctx.beginPath()
    ctx.arc(cx - 24, h * 0.358, 4, 0, Math.PI * 2)
    ctx.arc(cx + 24, h * 0.358, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#33261c'
    ctx.beginPath()
    ctx.ellipse(cx, h * 0.45, 26, 7, 0, 0, Math.PI * 2)
    ctx.fill()
    // 穏やかな口元
    ctx.strokeStyle = '#7a4a35'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    ctx.arc(cx, h * 0.465, 16, 0.25 * Math.PI, 0.75 * Math.PI)
    ctx.stroke()
    // 金の銘板
    ctx.fillStyle = '#93783c'
    ctx.fillRect(cx - 92, h - 58, 184, 34)
    ctx.fillStyle = '#241a0e'
    ctx.font = `22px ${MINCHO}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('久遠寺子爵', cx, h - 40)
    // 油彩の筆致
    const rand = seededRandom(71)
    for (let i = 0; i < 300; i++) {
      ctx.strokeStyle = `rgba(255,240,210,${rand() * 0.045})`
      ctx.lineWidth = 1 + rand() * 2
      const x = rand() * w
      const y = rand() * h
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + 6 + rand() * 14, y + (rand() - 0.5) * 6)
      ctx.stroke()
    }
    addGrain(ctx, w, h, 0.05, 72)
  })

/** ステンドグラス欄間(玄関上) */
export const stainedGlassTexture = (): THREE.CanvasTexture =>
  paintTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#0e0c0a'
    ctx.fillRect(0, 0, w, h)
    const panes: Array<{ x: number; y: number; rw: number; rh: number; color: string }> = []
    const colors = ['#c25450', '#c9973f', '#4d7a52', '#3f5d8c', '#b8a276', '#8c5f7d']
    const cols = 8
    const rows = 3
    for (let r = 0; r < rows; r++) {
      for (const c of Array.from({ length: cols }, (_, i) => i)) {
        panes.push({
          x: (c * w) / cols,
          y: (r * h) / rows,
          rw: w / cols,
          rh: h / rows,
          color: colors[(r * cols + c * 3) % colors.length] ?? '#b8a276',
        })
      }
    }
    for (const pane of panes) {
      const grad = ctx.createLinearGradient(pane.x, pane.y, pane.x + pane.rw, pane.y + pane.rh)
      grad.addColorStop(0, pane.color)
      grad.addColorStop(1, '#e8dcc0')
      ctx.fillStyle = grad
      ctx.globalAlpha = 0.92
      ctx.fillRect(pane.x + 3, pane.y + 3, pane.rw - 6, pane.rh - 6)
    }
    ctx.globalAlpha = 1
    // 中央の日輪モチーフ
    ctx.fillStyle = '#d8b64d'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#141210'
    ctx.lineWidth = 6
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(w / 2 + Math.cos(a) * 44, h / 2 + Math.sin(a) * 44)
      ctx.lineTo(w / 2 + Math.cos(a) * 70, h / 2 + Math.sin(a) * 70)
      ctx.stroke()
    }
    // 鉛線
    ctx.strokeStyle = '#141210'
    ctx.lineWidth = 6
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath()
      ctx.moveTo((c * w) / cols, 0)
      ctx.lineTo((c * w) / cols, h)
      ctx.stroke()
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath()
      ctx.moveTo(0, (r * h) / rows)
      ctx.lineTo(w, (r * h) / rows)
      ctx.stroke()
    }
    ctx.strokeRect(3, 3, w - 6, h - 6)
  })

/** 夜の窓外(月の有無を選べる) */
export const nightWindowTexture = (withMoon: boolean, seed = 81): THREE.CanvasTexture =>
  paintTexture(512, 512, (ctx, w, h) => {
    const rand = seededRandom(seed)
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#101a33')
    sky.addColorStop(0.7, '#1a2440')
    sky.addColorStop(1, '#232c42')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)
    // 星
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(220,230,255,${0.2 + rand() * 0.6})`
      const size = rand() < 0.9 ? 1 : 2
      ctx.fillRect(rand() * w, rand() * h * 0.7, size, size)
    }
    if (withMoon) {
      const mx = w * 0.68
      const my = h * 0.26
      const glow = ctx.createRadialGradient(mx, my, 10, mx, my, 120)
      glow.addColorStop(0, 'rgba(235,240,255,0.9)')
      glow.addColorStop(0.25, 'rgba(200,215,255,0.35)')
      glow.addColorStop(1, 'rgba(200,215,255,0)')
      ctx.fillStyle = glow
      ctx.fillRect(mx - 130, my - 130, 260, 260)
      ctx.fillStyle = '#eef0e6'
      ctx.beginPath()
      ctx.arc(mx, my, 34, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(180,180,170,0.35)'
      ctx.beginPath()
      ctx.arc(mx - 10, my + 6, 8, 0, Math.PI * 2)
      ctx.arc(mx + 12, my - 8, 6, 0, Math.PI * 2)
      ctx.fill()
    }
    // 桜と木々のシルエット
    ctx.fillStyle = '#0a0f1e'
    for (let i = 0; i < 6; i++) {
      const x = rand() * w
      const y = h * 0.8 + rand() * h * 0.1
      const s = 40 + rand() * 70
      ctx.beginPath()
      ctx.ellipse(x, y, s, s * 0.7, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    // ほの白い桜
    ctx.fillStyle = 'rgba(232,205,215,0.16)'
    for (let i = 0; i < 4; i++) {
      const x = rand() * w
      const y = h * 0.72 + rand() * h * 0.12
      ctx.beginPath()
      ctx.ellipse(x, y, 46, 30, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#05070f'
    ctx.fillRect(0, h * 0.9, w, h * 0.1)
  })

/** レースのカーテン(透過) */
export const laceTexture = (): THREE.CanvasTexture =>
  paintTexture(256, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(240,238,230,0.55)'
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'destination-out'
    for (let y = 20; y < h; y += 36) {
      for (let x = 10 + (y % 72 === 20 ? 0 : 18); x < w; x += 36) {
        ctx.beginPath()
        ctx.arc(x, y, 7, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = 'rgba(250,248,240,0.7)'
    for (let x = 0; x < w; x += 12) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
  })
