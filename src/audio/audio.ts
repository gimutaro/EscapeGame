import { MELODY } from '../core/constants'
import type { SfxId } from '../core/events'
import type { GameState } from '../core/state'
import type { Note } from '../core/types'

/** 音名 → 周波数(A4=440) */
const freqOf = (name: string): number => {
  const match = /^([A-G])(#?)(-?\d)$/.exec(name)
  if (!match) return 440
  const semitones: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  const base = semitones[match[1] ?? 'A'] ?? 9
  const sharp = match[2] === '#' ? 1 : 0
  const octave = Number(match[3])
  const midi = (octave + 1) * 12 + base + sharp
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/** オルゴール風ワルツ(3/4・ヨナ抜き音階)— [旋律3拍, 低音] × 16小節 */
const WALTZ: ReadonlyArray<readonly [string | null, string | null, string | null, string]> = [
  ['E5', null, 'D5', 'C3'],
  ['C5', null, 'A4', 'A2'],
  ['G4', null, 'A4', 'F3'],
  ['C5', null, null, 'C3'],
  ['A4', null, 'C5', 'F3'],
  ['D5', null, 'E5', 'G3'],
  ['G5', null, 'E5', 'C3'],
  ['D5', null, null, 'G2'],
  ['E5', null, 'G5', 'C3'],
  ['A5', null, 'G5', 'F3'],
  ['E5', null, 'D5', 'A2'],
  ['C5', null, null, 'C3'],
  ['A4', null, 'C5', 'F3'],
  ['D5', null, 'C5', 'G3'],
  ['A4', null, 'G4', 'G2'],
  ['C5', null, null, 'C3'],
]

export type BgmMode = 'off' | 'explore' | 'ending'

export interface AudioSystem {
  resume(): void
  setVolumes(bgm: number, sfx: number): void
  playSfx(id: SfxId): void
  playNote(note: Note): void
  playMelody(): void
  setBgm(mode: BgmMode): void
  syncAmbience(state: GameState): void
}

export const createAudioSystem = (): AudioSystem => {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let bgmGain: GainNode | null = null
  let sfxGain: GainNode | null = null
  let ambGain: GainNode | null = null
  let delaySend: GainNode | null = null
  let noiseBuffer: AudioBuffer | null = null
  let volumes = { bgm: 0.5, sfx: 0.7 }

  const ensure = (): AudioContext | null => {
    if (ctx) return ctx
    try {
      ctx = new AudioContext()
    } catch (error) {
      console.warn('AudioContext を生成できません(無音で続行):', error)
      return null
    }
    master = ctx.createGain()
    master.gain.value = 0.9
    master.connect(ctx.destination)
    bgmGain = ctx.createGain()
    bgmGain.gain.value = volumes.bgm * 0.5
    bgmGain.connect(master)
    sfxGain = ctx.createGain()
    sfxGain.gain.value = volumes.sfx
    sfxGain.connect(master)
    ambGain = ctx.createGain()
    ambGain.gain.value = volumes.sfx * 0.5
    ambGain.connect(master)
    // オルゴールの残響(フィードバックディレイ)
    const delay = ctx.createDelay(1)
    delay.delayTime.value = 0.27
    const feedback = ctx.createGain()
    feedback.gain.value = 0.3
    const wet = ctx.createGain()
    wet.gain.value = 0.22
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wet)
    wet.connect(master)
    delaySend = ctx.createGain()
    delaySend.gain.value = 1
    delaySend.connect(delay)
    // ノイズバッファ
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    return ctx
  }

  /** オルゴールのベル音(FM合成) */
  const bell = (freq: number, at: number, dur = 1.6, gain = 0.22, toBgm = false) => {
    const audio = ensure()
    if (!audio || !sfxGain || !bgmGain || !delaySend) return
    const carrier = audio.createOscillator()
    carrier.frequency.value = freq
    const modulator = audio.createOscillator()
    modulator.frequency.value = freq * 3.01
    const modGain = audio.createGain()
    modGain.gain.setValueAtTime(freq * 1.8, at)
    modGain.gain.exponentialRampToValueAtTime(freq * 0.02, at + dur * 0.7)
    modulator.connect(modGain)
    modGain.connect(carrier.frequency)
    const env = audio.createGain()
    env.gain.setValueAtTime(0, at)
    env.gain.linearRampToValueAtTime(gain, at + 0.008)
    env.gain.exponentialRampToValueAtTime(0.0004, at + dur)
    carrier.connect(env)
    env.connect(toBgm ? bgmGain : sfxGain)
    env.connect(delaySend)
    carrier.start(at)
    carrier.stop(at + dur + 0.1)
    modulator.start(at)
    modulator.stop(at + dur + 0.1)
  }

  /** ピアノ風(倍音の重ね) */
  const pianoVoice = (freq: number, at: number, gain = 0.2) => {
    const audio = ensure()
    if (!audio || !sfxGain) return
    const env = audio.createGain()
    env.gain.setValueAtTime(0, at)
    env.gain.linearRampToValueAtTime(gain, at + 0.012)
    env.gain.exponentialRampToValueAtTime(0.0005, at + 1.5)
    const filter = audio.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 2600
    env.connect(filter)
    filter.connect(sfxGain)
    const partials: Array<[number, number, OscillatorType]> = [
      [1, 1, 'triangle'],
      [2.001, 0.4, 'sine'],
      [3.004, 0.16, 'sine'],
    ]
    for (const [ratio, amp, type] of partials) {
      const osc = audio.createOscillator()
      osc.type = type
      osc.frequency.value = freq * ratio
      const oscGain = audio.createGain()
      oscGain.gain.value = amp
      osc.connect(oscGain)
      oscGain.connect(env)
      osc.start(at)
      osc.stop(at + 1.6)
    }
  }

  /** 整形ノイズ(かちゃ・ごとん・しゅっ等の素材) */
  const noise = (
    at: number,
    dur: number,
    gain: number,
    filterType: BiquadFilterType,
    freq: number,
    q = 1,
  ) => {
    const audio = ensure()
    if (!audio || !sfxGain || !noiseBuffer) return
    const source = audio.createBufferSource()
    source.buffer = noiseBuffer
    source.loop = true
    const filter = audio.createBiquadFilter()
    filter.type = filterType
    filter.frequency.value = freq
    filter.Q.value = q
    const env = audio.createGain()
    env.gain.setValueAtTime(0, at)
    env.gain.linearRampToValueAtTime(gain, at + 0.006)
    env.gain.exponentialRampToValueAtTime(0.0004, at + dur)
    source.connect(filter)
    filter.connect(env)
    env.connect(sfxGain)
    source.start(at, Math.random() * 0.5)
    source.stop(at + dur + 0.05)
  }

  const thump = (at: number, freq: number, gain = 0.3, dur = 0.3) => {
    const audio = ensure()
    if (!audio || !sfxGain) return
    const osc = audio.createOscillator()
    osc.frequency.setValueAtTime(freq, at)
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.4), at + dur)
    const env = audio.createGain()
    env.gain.setValueAtTime(0, at)
    env.gain.linearRampToValueAtTime(gain, at + 0.008)
    env.gain.exponentialRampToValueAtTime(0.0005, at + dur)
    osc.connect(env)
    env.connect(sfxGain)
    osc.start(at)
    osc.stop(at + dur + 0.05)
  }

  const playSfx = (id: SfxId) => {
    const audio = ensure()
    if (!audio) return
    const t = audio.currentTime + 0.01
    switch (id) {
      case 'tap':
        noise(t, 0.05, 0.08, 'highpass', 2500)
        break
      case 'itemGet':
        bell(freqOf('E6'), t, 0.5, 0.14)
        bell(freqOf('A6'), t + 0.09, 0.8, 0.12)
        break
      case 'lockedRattle':
        thump(t, 130, 0.16, 0.09)
        thump(t + 0.11, 110, 0.14, 0.09)
        break
      case 'unlock':
        noise(t, 0.06, 0.2, 'bandpass', 1800, 3)
        bell(freqOf('B5'), t + 0.05, 0.5, 0.1)
        break
      case 'drawer':
        noise(t, 0.28, 0.14, 'bandpass', 500, 1.5)
        thump(t + 0.24, 90, 0.12, 0.12)
        break
      case 'doorOpen':
        noise(t, 0.4, 0.12, 'lowpass', 400)
        thump(t + 0.05, 70, 0.18, 0.25)
        break
      case 'matchStrike':
        noise(t, 0.12, 0.24, 'highpass', 3000)
        noise(t + 0.1, 0.5, 0.1, 'bandpass', 900, 0.8)
        break
      case 'fireIgnite':
        thump(t, 55, 0.26, 0.5)
        noise(t, 0.7, 0.12, 'lowpass', 500)
        break
      case 'chime': {
        for (let i = 0; i < 4; i++) {
          bell(freqOf('G3'), t + i * 0.85, 2.4, 0.3)
          bell(freqOf('G4'), t + i * 0.85, 1.4, 0.08)
        }
        break
      }
      case 'dissonance':
        pianoVoice(freqOf('D#4'), t, 0.1)
        pianoVoice(freqOf('E4'), t, 0.1)
        break
      case 'dialClick':
        noise(t, 0.035, 0.14, 'highpass', 2000)
        thump(t, 300, 0.05, 0.03)
        break
      case 'safeThunk':
        thump(t, 60, 0.4, 0.5)
        noise(t + 0.05, 0.3, 0.1, 'lowpass', 300)
        break
      case 'paper':
        noise(t, 0.16, 0.1, 'bandpass', 2600, 0.7)
        break
      case 'sparkle':
        bell(freqOf('C6'), t, 0.5, 0.1)
        bell(freqOf('E6'), t + 0.08, 0.5, 0.1)
        bell(freqOf('G6'), t + 0.16, 0.9, 0.1)
        break
      case 'bookSlide':
        noise(t, 0.18, 0.12, 'bandpass', 700, 1)
        break
      case 'switch':
        noise(t, 0.03, 0.16, 'highpass', 1500)
        thump(t + 0.02, 400, 0.06, 0.03)
        break
      case 'combine':
        noise(t, 0.14, 0.08, 'bandpass', 2400, 0.8)
        bell(freqOf('A5'), t + 0.1, 0.7, 0.1)
        break
    }
  }

  // ---- BGM(ステップシーケンサ) ----
  let bgmMode: BgmMode = 'off'
  let bgmTimer: ReturnType<typeof setInterval> | null = null
  let nextBeatTime = 0
  let beatIndex = 0
  const BEAT = 60 / 84

  const scheduleBgm = () => {
    const audio = ensure()
    if (!audio || bgmMode === 'off') return
    while (nextBeatTime < audio.currentTime + 0.35) {
      const bar = Math.floor(beatIndex / 3) % WALTZ.length
      const beat = beatIndex % 3
      const line = WALTZ[bar]
      if (line) {
        const melodyNote = line[beat]
        const shift = bgmMode === 'ending' ? 4 / 3 : 1 // エンディングは長三度上で明るく
        if (melodyNote) {
          bell(freqOf(melodyNote) * shift, nextBeatTime, 1.8, 0.1, true)
        }
        if (beat === 0 && line[3]) {
          bell(freqOf(line[3]) * shift, nextBeatTime, 2.0, 0.07, true)
        }
      }
      nextBeatTime += BEAT
      beatIndex++
    }
  }

  const setBgm = (mode: BgmMode) => {
    if (mode === bgmMode) return
    bgmMode = mode
    if (mode === 'off') {
      if (bgmTimer) clearInterval(bgmTimer)
      bgmTimer = null
      return
    }
    const audio = ensure()
    if (!audio) return
    beatIndex = 0
    nextBeatTime = audio.currentTime + 0.15
    if (!bgmTimer) bgmTimer = setInterval(scheduleBgm, 120)
  }

  // ---- 環境音 ----
  const ambience = { fire: false, crickets: false, pendulum: false }
  let ambTimer: ReturnType<typeof setInterval> | null = null
  let pendulumPhase = 0

  const ambientTick = () => {
    const audio = ensure()
    if (!audio || !ambGain || !noiseBuffer) return
    const t = audio.currentTime
    if (ambience.fire && Math.random() < 0.75) {
      // 薪の爆ぜる音
      const pops = 1 + Math.floor(Math.random() * 3)
      for (let i = 0; i < pops; i++) {
        const at = t + Math.random() * 0.24
        const source = audio.createBufferSource()
        source.buffer = noiseBuffer
        const filter = audio.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.value = 1200 + Math.random() * 2400
        filter.Q.value = 4
        const env = audio.createGain()
        env.gain.setValueAtTime(0.05 + Math.random() * 0.06, at)
        env.gain.exponentialRampToValueAtTime(0.0005, at + 0.05)
        source.connect(filter)
        filter.connect(env)
        env.connect(ambGain)
        source.start(at, Math.random())
        source.stop(at + 0.08)
      }
    }
    if (ambience.crickets && Math.random() < 0.4) {
      const at = t + Math.random() * 0.2
      for (let i = 0; i < 2; i++) {
        const osc = audio.createOscillator()
        osc.frequency.value = 4200 + Math.random() * 300
        const env = audio.createGain()
        env.gain.setValueAtTime(0, at + i * 0.09)
        env.gain.linearRampToValueAtTime(0.016, at + i * 0.09 + 0.02)
        env.gain.exponentialRampToValueAtTime(0.0004, at + i * 0.09 + 0.07)
        osc.connect(env)
        env.connect(ambGain)
        osc.start(at + i * 0.09)
        osc.stop(at + i * 0.09 + 0.1)
      }
    }
    if (ambience.pendulum) {
      pendulumPhase++
      if (pendulumPhase % 4 === 0) {
        const osc = audio.createOscillator()
        osc.frequency.value = pendulumPhase % 8 === 0 ? 820 : 700
        const env = audio.createGain()
        env.gain.setValueAtTime(0.03, t)
        env.gain.exponentialRampToValueAtTime(0.0004, t + 0.06)
        osc.connect(env)
        env.connect(ambGain)
        osc.start(t)
        osc.stop(t + 0.08)
      }
    }
  }

  return {
    resume() {
      const audio = ensure()
      if (audio && audio.state === 'suspended') void audio.resume()
      if (!ambTimer) ambTimer = setInterval(ambientTick, 250)
    },
    setVolumes(bgm, sfx) {
      volumes = { bgm, sfx }
      if (bgmGain) bgmGain.gain.value = bgm * 0.5
      if (sfxGain) sfxGain.gain.value = sfx
      if (ambGain) ambGain.gain.value = sfx * 0.5
    },
    playSfx,
    playNote(note: Note) {
      const audio = ensure()
      if (!audio) return
      pianoVoice(freqOf(note), audio.currentTime + 0.005)
    },
    playMelody() {
      const audio = ensure()
      if (!audio) return
      const start = audio.currentTime + 0.2
      MELODY.forEach((note, i) => {
        bell(freqOf(note), start + i * 0.72, 1.7, 0.24)
      })
    },
    setBgm,
    syncAmbience(state) {
      ambience.fire = state.phase === 'playing' && state.flags.fireplaceLit && state.currentRoom === 'living'
      ambience.crickets = state.phase === 'playing'
      ambience.pendulum =
        state.phase === 'playing' && state.flags.clockSolved && state.currentRoom === 'living'
    },
  }
}
