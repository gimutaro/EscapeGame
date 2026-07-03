import type { DocumentId, ItemId, Note, Phase, RoomId } from './types'

/** 演出・音のための識別子(docs/02 §9 の EV に対応) */
export type EffectId =
  | 'cabinetOpen'
  | 'paintingDrop'
  | 'fireplaceLight'
  | 'revealLetter'
  | 'clockSolved'
  | 'doorOpenBedroom'
  | 'doorOpenStudy'
  | 'wardrobeOpen'
  | 'jewelryOpen'
  | 'pianoDrawer'
  | 'globeOpen'
  | 'bookshelfSecret'
  | 'portraitOpen'
  | 'safeKeyIn'
  | 'safeOpen'
  | 'lightsOff'
  | 'lightsOn'
  | 'escape'

export type SfxId =
  | 'tap'
  | 'itemGet'
  | 'lockedRattle'
  | 'unlock'
  | 'drawer'
  | 'doorOpen'
  | 'matchStrike'
  | 'fireIgnite'
  | 'chime'
  | 'dissonance'
  | 'dialClick'
  | 'safeThunk'
  | 'paper'
  | 'sparkle'
  | 'bookSlide'
  | 'switch'
  | 'combine'

/**
 * リデューサが返す副作用イベント。
 * 状態(state)が最終的な見た目の真実であり、イベントは過渡演出・音にのみ使う。
 */
export type GameEvent =
  | { readonly kind: 'message'; readonly text: string }
  | { readonly kind: 'sfx'; readonly sfx: SfxId }
  | { readonly kind: 'note'; readonly note: Note }
  | { readonly kind: 'acquire'; readonly item: ItemId }
  | { readonly kind: 'document'; readonly doc: DocumentId }
  | { readonly kind: 'effect'; readonly effect: EffectId }
  | { readonly kind: 'melody' }
  | { readonly kind: 'roomChanged'; readonly room: RoomId }
  | { readonly kind: 'phaseChanged'; readonly phase: Phase }
