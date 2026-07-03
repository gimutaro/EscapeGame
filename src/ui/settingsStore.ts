import { z } from 'zod'

const SettingsSchema = z.object({
  bgm: z.number().min(0).max(1),
  sfx: z.number().min(0).max(1),
  quality: z.enum(['high', 'mid', 'low']),
  sensitivity: z.number().min(0.5).max(1.6),
  markers: z.boolean(),
  textSpeed: z.enum(['slow', 'normal', 'fast']),
})

export type Settings = z.infer<typeof SettingsSchema>

const DEFAULTS: Settings = {
  bgm: 0.5,
  sfx: 0.7,
  quality: 'high',
  sensitivity: 1,
  markers: true,
  textSpeed: 'normal',
}

const KEY = 'kuonji.settings.v1'

export interface SettingsStore {
  get(): Settings
  set(partial: Partial<Settings>): void
  subscribe(listener: (settings: Settings) => void): void
}

export const createSettingsStore = (storage: Pick<Storage, 'getItem' | 'setItem'>): SettingsStore => {
  let current = DEFAULTS
  try {
    const raw = storage.getItem(KEY)
    if (raw !== null) {
      const parsed = SettingsSchema.safeParse(JSON.parse(raw))
      if (parsed.success) current = parsed.data
    }
  } catch (error) {
    console.warn('設定の読み込みに失敗しました(既定値で続行):', error)
  }
  const listeners = new Set<(s: Settings) => void>()
  return {
    get: () => current,
    set(partial) {
      current = { ...current, ...partial }
      try {
        storage.setItem(KEY, JSON.stringify(current))
      } catch (error) {
        console.warn('設定の保存に失敗しました:', error)
      }
      for (const listener of listeners) listener(current)
    },
    subscribe(listener) {
      listeners.add(listener)
      listener(current)
    },
  }
}
