import { z } from 'zod'
import type { GameState } from '../core/state'
import { BOOK_COLORS, DOC_IDS, FLAG_IDS, ITEM_IDS, NOTES, PHASES, ROOM_IDS } from '../core/types'

const flagsShape = Object.fromEntries(FLAG_IDS.map((id) => [id, z.boolean()])) as Record<
  (typeof FLAG_IDS)[number],
  z.ZodBoolean
>

const dial = z.number().int().min(0).max(9)
const dialTuple = z.tuple([dial, dial, dial])
const bookColor = z.enum(BOOK_COLORS)

/**
 * 形だけでなくゲームの不変条件も検査する
 * (改竄セーブが詰み状態を持ち込まないように: docs/03 R-8)。
 */
export const GameStateSchema = z.object({
  phase: z.enum(PHASES),
  currentRoom: z.enum(ROOM_IDS),
  inventory: z
    .array(z.enum(ITEM_IDS))
    .max(8)
    .refine((items) => new Set(items).size === items.length, '所持品が重複しています'),
  selectedItem: z.enum(ITEM_IDS).nullable(),
  flags: z.object(flagsShape),
  studyLightOn: z.boolean(),
  clock: z.object({ hour: z.number().int().min(1).max(12), minute: z.number().int().min(0).max(59) }),
  jewelryDials: dialTuple,
  safeDials: dialTuple,
  bookOrder: z
    .tuple([bookColor, bookColor, bookColor, bookColor])
    .refine((order) => new Set(order).size === 4, '本の並びは4色の順列である必要があります'),
  pianoInput: z.array(z.enum(NOTES)).max(8),
  globeYaw: z.number().finite(),
  documents: z.array(z.enum(DOC_IDS)),
  seenHints: z.array(z.string().max(16)).max(64),
  hintsUsed: z.number().int().min(0),
  startedAt: z.number(),
  escapedAt: z.number().nullable(),
}) satisfies z.ZodType<GameState>

export const SaveFileSchema = z.object({
  version: z.literal(1),
  savedAt: z.number(),
  state: GameStateSchema,
})

export type SaveFile = z.infer<typeof SaveFileSchema>
