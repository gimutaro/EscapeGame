import { BOOK_INITIAL, CLOCK_INITIAL, GLOBE_INITIAL_YAW } from './constants'
import type {
  BookColor,
  DocumentId,
  FlagId,
  ItemId,
  Note,
  Phase,
  RoomId,
} from './types'
import { FLAG_IDS } from './types'

export interface ClockTime {
  readonly hour: number
  readonly minute: number
}

export interface GameState {
  readonly phase: Phase
  readonly currentRoom: RoomId
  readonly inventory: readonly ItemId[]
  readonly selectedItem: ItemId | null
  readonly flags: Readonly<Record<FlagId, boolean>>
  /** 書斎の照明(トグル可能: 進行フラグではない) */
  readonly studyLightOn: boolean
  readonly clock: ClockTime
  readonly jewelryDials: readonly [number, number, number]
  readonly safeDials: readonly [number, number, number]
  readonly bookOrder: readonly [BookColor, BookColor, BookColor, BookColor]
  readonly pianoInput: readonly Note[]
  readonly globeYaw: number
  readonly documents: readonly DocumentId[]
  readonly seenHints: readonly string[]
  readonly hintsUsed: number
  readonly startedAt: number
  readonly escapedAt: number | null
}

const initialFlags = (): Readonly<Record<FlagId, boolean>> => {
  const entries = FLAG_IDS.map((id) => [id, false] as const)
  return Object.fromEntries(entries) as Record<FlagId, boolean>
}

export const createInitialState = (): GameState => ({
  phase: 'title',
  currentRoom: 'living',
  inventory: [],
  selectedItem: null,
  flags: initialFlags(),
  studyLightOn: true,
  clock: CLOCK_INITIAL,
  jewelryDials: [0, 0, 0],
  safeDials: [0, 0, 0],
  bookOrder: BOOK_INITIAL,
  pianoInput: [],
  globeYaw: GLOBE_INITIAL_YAW,
  documents: [],
  seenHints: [],
  hintsUsed: 0,
  startedAt: 0,
  escapedAt: null,
})
