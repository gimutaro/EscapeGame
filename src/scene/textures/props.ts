import type * as THREE from 'three'
import { BOOK_COLOR_INFO, KIMONO_FLOWERS } from '../../core/constants'
import type { BookColor } from '../../core/types'
import { MINCHO, addGrain, drawVerticalText, paintTexture, seededRandom } from './base'

/** 柱時計の文字盤(針は3Dメッシュ) */
export const clockFaceTexture = (): THREE.CanvasTexture =>
  paintTexture(512, 512, (ctx, w, h) => {
    const cx = w / 2
    const cy = h / 2
    ctx.fillStyle = '#efe6d2'
    ctx.beginPath()
    ctx.arc(cx, cy, 240, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#7a5c2e'
    ctx.lineWidth = 10
    ctx.stroke()
    const numerals = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
    ctx.fillStyle = '#332818'
    ctx.font = `44px ${MINCHO}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    numerals.forEach((numeral, i) => {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
      ctx.fillText(numeral, cx + Math.cos(angle) * 185, cy + Math.sin(angle) * 185)
    })
    // 分目盛り
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2
      const isMajor = i % 5 === 0
      ctx.strokeStyle = '#4a3a20'
      ctx.lineWidth = isMajor ? 4 : 1.6
      const r1 = isMajor ? 218 : 226
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1)
      ctx.lineTo(cx + Math.cos(angle) * 236, cy + Math.sin(angle) * 236)
      ctx.stroke()
    }
    ctx.font = `22px ${MINCHO}`
    ctx.fillStyle = '#6a5636'
    ctx.fillText('久遠寺時計店', cx, cy + 90)
    addGrain(ctx, w, h, 0.03, 91)
  })

/**
 * 咲子の訪問着。花の数は constants.ts から参照する
 * (桜=角の割れた五弁 / 梅=丸い五弁 / 菊=細い多弁 — 形でも判別できる)。
 * withFlowers=false は袖用(数える花を重複させないため花を描かない)。
 */
export const kimonoTexture = (withFlowers = true): THREE.CanvasTexture =>
  paintTexture(512, 1024, (ctx, w, h) => {
    const rand = seededRandom(101)
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#2c2440')
    grad.addColorStop(1, '#43305c')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    // 裾の流水文様
    ctx.strokeStyle = 'rgba(200,190,230,0.35)'
    ctx.lineWidth = 3
    for (let i = 0; i < 6; i++) {
      ctx.beginPath()
      for (let x = 0; x <= w; x += 16) {
        const y = h * 0.78 + i * 26 + Math.sin(x / 46 + i) * 10
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    const sakura = (x: number, y: number, s: number) => {
      ctx.save()
      ctx.translate(x, y)
      for (let i = 0; i < 5; i++) {
        ctx.save()
        ctx.rotate((i * Math.PI * 2) / 5)
        ctx.fillStyle = '#f2c4d0'
        ctx.beginPath()
        // 桜: 先端に切れ込みのある花弁
        ctx.moveTo(0, -s * 0.2)
        ctx.bezierCurveTo(-s * 0.5, -s * 0.5, -s * 0.3, -s * 1.1, 0, -s * 0.86)
        ctx.bezierCurveTo(s * 0.3, -s * 1.1, s * 0.5, -s * 0.5, 0, -s * 0.2)
        ctx.fill()
        ctx.restore()
      }
      ctx.fillStyle = '#d98a9e'
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    const ume = (x: number, y: number, s: number) => {
      ctx.save()
      ctx.translate(x, y)
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5
        ctx.fillStyle = '#d8535f'
        ctx.beginPath()
        ctx.arc(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5, s * 0.42, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#f4e6b8'
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    const kiku = (x: number, y: number, s: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.strokeStyle = '#e8d27a'
      ctx.lineWidth = s * 0.16
      ctx.lineCap = 'round'
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI * 2) / 16
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * s * 0.2, Math.sin(a) * s * 0.2)
        ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s)
        ctx.stroke()
      }
      ctx.fillStyle = '#c9a23c'
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    // 枝
    ctx.strokeStyle = 'rgba(160,140,110,0.5)'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(w * 0.1, h * 0.16)
    ctx.bezierCurveTo(w * 0.5, h * 0.3, w * 0.4, h * 0.56, w * 0.85, h * 0.7)
    ctx.stroke()
    // 花の配置(重ならないよう手置き)— 個数は正解値と同期
    const sakuraSpots: Array<[number, number, number]> = [
      [w * 0.24, h * 0.14, 34],
      [w * 0.62, h * 0.24, 30],
      [w * 0.4, h * 0.38, 36],
      [w * 0.74, h * 0.5, 30],
      [w * 0.3, h * 0.6, 32],
      [w * 0.58, h * 0.7, 28],
      [w * 0.18, h * 0.84, 30],
    ]
    const umeSpots: Array<[number, number, number]> = [
      [w * 0.82, h * 0.12, 22],
      [w * 0.14, h * 0.32, 24],
      [w * 0.55, h * 0.5, 22],
      [w * 0.84, h * 0.86, 24],
      [w * 0.42, h * 0.9, 22],
    ]
    const kikuSpots: Array<[number, number, number]> = [
      [w * 0.44, h * 0.1, 26],
      [w * 0.8, h * 0.34, 28],
      [w * 0.16, h * 0.5, 26],
      [w * 0.66, h * 0.6, 24],
      [w * 0.24, h * 0.72, 26],
      [w * 0.5, h * 0.8, 24],
      [w * 0.7, h * 0.92, 26],
      [w * 0.9, h * 0.62, 24],
    ]
    if (withFlowers) {
      sakuraSpots.slice(0, KIMONO_FLOWERS.sakura).forEach(([x, y, s]) => sakura(x, y, s))
      umeSpots.slice(0, KIMONO_FLOWERS.ume).forEach(([x, y, s]) => ume(x, y, s))
      kikuSpots.slice(0, KIMONO_FLOWERS.kiku).forEach(([x, y, s]) => kiku(x, y, s))
    }
    // 金糸のきらめき
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(220,190,120,${rand() * 0.35})`
      ctx.fillRect(rand() * w, rand() * h, 2, 2)
    }
    addGrain(ctx, w, h, 0.04, 102)
  })

/** 色布の本の背表紙(色名を印字: 色覚バリアフリー) */
export const bookSpineTexture = (color: BookColor): THREE.CanvasTexture => {
  const info = BOOK_COLOR_INFO[color]
  return paintTexture(128, 512, (ctx, w, h) => {
    ctx.fillStyle = info.hex
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.fillRect(0, 0, 10, h)
    ctx.fillRect(w - 10, 0, 10, h)
    // 金の帯
    ctx.fillStyle = '#d8b64d'
    ctx.fillRect(14, 36, w - 28, 10)
    ctx.fillRect(14, h - 60, w - 28, 10)
    // 色名(縦書き)
    ctx.fillStyle = '#f4ecd8'
    ctx.font = `52px ${MINCHO}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    drawVerticalText(ctx, info.label, w / 2, h * 0.32, 62)
    addGrain(ctx, w, h, 0.06, 111)
  })
}

/** 本棚の埋め草の一列(様々な背表紙) */
export const bookRowTexture = (seed: number): THREE.CanvasTexture =>
  paintTexture(1024, 256, (ctx, w, h) => {
    const rand = seededRandom(seed)
    const palette = ['#5a4632', '#6e3b30', '#3c4a41', '#4a3b55', '#71563a', '#37455e', '#7c6242']
    let x = 0
    while (x < w) {
      const bw = 26 + rand() * 34
      const bh = h * (0.82 + rand() * 0.16)
      const color = palette[Math.floor(rand() * palette.length)] ?? '#5a4632'
      ctx.fillStyle = color
      ctx.fillRect(x, h - bh, bw - 3, bh)
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(x, h - bh, 4, bh)
      ctx.fillStyle = 'rgba(216,182,77,0.8)'
      if (rand() < 0.7) ctx.fillRect(x + 6, h - bh + 14, bw - 15, 4)
      if (rand() < 0.5) ctx.fillRect(x + 6, h - 30, bw - 15, 4)
      x += bw
    }
    ctx.fillStyle = 'rgba(20,12,6,0.5)'
    ctx.fillRect(0, 0, w, 8)
    addGrain(ctx, w, h, 0.06, seed + 1)
  })

/** 地球儀(古地図風・日本を赤で強調。日本は u=0.5 = 正面基準) */
export const globeTexture = (): THREE.CanvasTexture =>
  paintTexture(1024, 512, (ctx, w, h) => {
    // 海
    const sea = ctx.createLinearGradient(0, 0, 0, h)
    sea.addColorStop(0, '#c8b183')
    sea.addColorStop(0.5, '#c2a878')
    sea.addColorStop(1, '#c8b183')
    ctx.fillStyle = sea
    ctx.fillRect(0, 0, w, h)
    // 経緯線
    ctx.strokeStyle = 'rgba(90,70,40,0.4)'
    ctx.lineWidth = 1.5
    for (let i = 0; i <= 12; i++) {
      ctx.beginPath()
      ctx.moveTo((i * w) / 12, 0)
      ctx.lineTo((i * w) / 12, h)
      ctx.stroke()
    }
    for (let i = 0; i <= 6; i++) {
      ctx.beginPath()
      ctx.moveTo(0, (i * h) / 6)
      ctx.lineTo(w, (i * h) / 6)
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(120,60,40,0.55)'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    ctx.moveTo(0, h / 2)
    ctx.lineTo(w, h / 2)
    ctx.stroke()
    const land = (points: Array<[number, number]>) => {
      ctx.fillStyle = '#93713d'
      ctx.strokeStyle = '#5e4826'
      ctx.lineWidth = 3
      ctx.beginPath()
      points.forEach(([px, py], i) => {
        const x = (px / 100) * w
        const y = (py / 100) * h
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
    // 大まかな大陸(日本が画像中央 u=0.5 に来る配置)
    // ユーラシア(左半分に大きく)
    land([
      [2, 20], [14, 14], [30, 12], [42, 16], [47, 24], [44, 30], [38, 34],
      [40, 42], [34, 52], [26, 56], [18, 46], [8, 44], [2, 34],
    ])
    // インド亜大陸・東南アジア
    land([
      [30, 40], [36, 42], [37, 52], [32, 56], [29, 48],
    ])
    // アフリカ
    land([
      [4, 40], [12, 42], [16, 52], [12, 70], [6, 74], [1, 58], [1, 46],
    ])
    // 南北アメリカ(右側)
    land([
      [70, 12], [84, 16], [92, 22], [90, 34], [82, 40], [80, 52], [86, 62],
      [84, 78], [78, 82], [74, 64], [72, 46], [66, 30], [66, 18],
    ])
    // 豪州
    land([
      [48, 60], [58, 58], [62, 68], [54, 74], [46, 68],
    ])
    // 南極の縁
    ctx.fillStyle = '#d8cba8'
    ctx.fillRect(0, h * 0.93, w, h * 0.07)
    // 日本列島(u=0.5 中央・赤で強調)
    ctx.fillStyle = '#b03030'
    ctx.strokeStyle = '#7c1f1f'
    ctx.lineWidth = 2
    const japanArc: Array<[number, number, number]> = [
      [48.6, 28.5, -0.9],
      [49.6, 31, -0.7],
      [50.4, 34, -0.5],
      [49.8, 37, -0.3],
      [48.6, 39, -0.2],
    ]
    for (const [px, py, rot] of japanArc) {
      ctx.beginPath()
      ctx.ellipse((px / 100) * w, (py / 100) * h, 12, 6, rot, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    // 日の丸と「日本」ラベル
    ctx.beginPath()
    ctx.arc(w * 0.5, h * 0.24, 11, 0, Math.PI * 2)
    ctx.fillStyle = '#c22'
    ctx.fill()
    ctx.strokeStyle = '#f4e6c8'
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.fillStyle = '#3c2810'
    ctx.font = `bold 34px ${MINCHO}`
    ctx.textAlign = 'center'
    ctx.fillText('日 本', w * 0.5, h * 0.17)
    addGrain(ctx, w, h, 0.05, 121)
  })

/** 屏風(金地+鏡文字。鏡に映すと正しく読める) */
export const byobuTexture = (): THREE.CanvasTexture =>
  paintTexture(1024, 640, (ctx, w, h) => {
    const rand = seededRandom(131)
    ctx.fillStyle = '#c3a24b'
    ctx.fillRect(0, 0, w, h)
    const cell = 64
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        ctx.fillStyle = `rgba(${185 + Math.floor(rand() * 45)}, ${148 + Math.floor(rand() * 34)}, ${58 + Math.floor(rand() * 30)}, 0.5)`
        ctx.fillRect(x, y, cell, cell)
      }
    }
    // 松の意匠
    ctx.fillStyle = 'rgba(58,84,58,0.85)'
    for (const [px, py, s] of [
      [0.16, 0.72, 90],
      [0.3, 0.8, 70],
      [0.84, 0.66, 100],
    ] as const) {
      ctx.beginPath()
      ctx.ellipse(w * px, h * py, s, s * 0.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(80,52,30,0.9)'
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.moveTo(w * px, h * py + s * 0.4)
      ctx.lineTo(w * px + 12, h)
      ctx.stroke()
    }
    // 鏡文字(左右反転で描画 → 鏡の中で正しい語順・字形で読める)
    ctx.save()
    ctx.translate(w / 2, 0)
    ctx.scale(-1, 1)
    ctx.fillStyle = 'rgba(52,36,20,0.9)'
    ctx.font = `54px ${MINCHO}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    drawVerticalText(ctx, 'たんすの', w * 0.21, h * 0.16, 58)
    drawVerticalText(ctx, 'きものの', w * 0.07, h * 0.16, 58)
    drawVerticalText(ctx, 'はなを', -w * 0.07, h * 0.16, 58)
    drawVerticalText(ctx, 'かぞえよ', -w * 0.21, h * 0.16, 58)
    ctx.restore()
    addGrain(ctx, w, h, 0.05, 132)
  })

/** 夜光塗料の文字(書斎・消灯時に光る) */
export const glowTextTexture = (): THREE.CanvasTexture =>
  paintTexture(1024, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#9fe8b0'
    ctx.shadowColor = '#7fd898'
    ctx.shadowBlur = 18
    ctx.font = `58px ${MINCHO}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('地球儀を回せ', w / 2, h * 0.3)
    ctx.fillText('日出づる国を正面に', w / 2, h * 0.7)
  })
