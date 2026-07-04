/** ゲーム全体で使う識別子の定義(単一情報源) */

export const ROOM_IDS = ['living', 'bedroom', 'study'] as const
export type RoomId = (typeof ROOM_IDS)[number]

export const PHASES = ['title', 'prologue', 'playing', 'ending', 'result'] as const
export type Phase = (typeof PHASES)[number]

export const ITEM_IDS = [
  'brassKey',
  'matchbox',
  'blankLetter',
  'bedroomKey',
  'windingKey',
  'photoRight',
  'studyKey',
  'photoLeft',
  'memoryPhoto',
  'safeKey',
  'entranceKey',
  'pocketWatch',
] as const
export type ItemId = (typeof ITEM_IDS)[number]

export const DOC_IDS = [
  'viscountLetter',
  'revealedLetter',
  'mirrorText',
  'diary',
  'melodyNote',
  'memorandum',
  'draftLetter',
  'photoBack',
  'finalLetter',
] as const
export type DocumentId = (typeof DOC_IDS)[number]

export const FLAG_IDS = [
  'letterRead',
  'sofaSearched',
  'cabinetUnlocked',
  'paintingMoved',
  'fireplaceLit',
  'letterRevealed',
  'clockSolved',
  'bedroomUnlocked',
  'wardrobeOpen',
  'mirrorSeen',
  'kimonoSeen',
  'jewelrySolved',
  'diaryRead',
  'musicBoxWound',
  'pianoSolved',
  'studyUnlocked',
  'deskOpened',
  'photosCombined',
  'glowSeen',
  'globeSolved',
  'bookshelfSolved',
  'portraitOpen',
  'safeKeyInserted',
  'safeSolved',
  'entranceUnlocked',
] as const
export type FlagId = (typeof FLAG_IDS)[number]

export const NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] as const
export type Note = (typeof NOTES)[number]

export const BOOK_COLORS = ['akane', 'yamabuki', 'wakatake', 'ruri'] as const
export type BookColor = (typeof BOOK_COLORS)[number]

export type PianoKeyHotspot = `pianoKey_${Note}`
export type JewelryDialHotspot = `jewelryDial_${0 | 1 | 2}`
export type SafeDialHotspot = `safeDial_${0 | 1 | 2}`
export type BookSlotHotspot = `bookSlot_${0 | 1 | 2 | 3}`

/** クリック可能な調査対象 */
export type HotspotId =
  // リビング
  | 'sofa'
  | 'lowTable'
  | 'cabinet'
  | 'musicBox'
  | 'fireplace'
  | 'painting'
  | 'clock'
  | 'piano'
  | 'gramophone'
  | 'entranceDoor'
  | 'doorStudy'
  | 'doorBedroom'
  | 'livingWindow'
  | PianoKeyHotspot
  // 寝室
  | 'bed'
  | 'vanity'
  | 'byobu'
  | 'wardrobe'
  | 'kimono'
  | 'jewelryBox'
  | 'jewelryLatch'
  | 'sideTable'
  | 'bedroomWindow'
  | JewelryDialHotspot
  // 書斎
  | 'desk'
  | 'globe'
  | 'globeLatch'
  | 'bookshelf'
  | 'portrait'
  | 'safe'
  | 'safeKeyhole'
  | 'safeLatch'
  | 'lightSwitch'
  | 'armchair'
  | 'studyWindow'
  | SafeDialHotspot
  | BookSlotHotspot

export const PUZZLE_IDS = [
  'L1',
  'L2',
  'L3',
  'L4',
  'L5',
  'B1',
  'B2',
  'B3',
  'L6',
  'L7',
  'S1',
  'S2',
  'S3',
  'S4',
  'S5',
  'S6',
  'S7',
  'L8',
] as const
export type PuzzleId = (typeof PUZZLE_IDS)[number]

export type HintStage = 0 | 1 | 2
