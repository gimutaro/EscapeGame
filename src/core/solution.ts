import type { Action } from './actions'
import { CLOCK_ANSWER, JEWELRY_ANSWER, MELODY, SAFE_ANSWER } from './constants'

/**
 * 完全攻略チャート(docs/03-puzzle-design.md §8)を Action 列にしたもの。
 * 自動全行程クリアテスト・E2E と共有する単一情報源。
 * この列を初期状態から順に適用すると、必ず脱出(リザルト)に到達する。
 */
export const SOLUTION_STEPS: readonly Action[] = [
  { type: 'NEW_GAME' },
  { type: 'PROLOGUE_DONE' },
  // 1. 子爵の手紙を読む
  { type: 'EXAMINE', target: 'lowTable' },
  // 2. ソファのクッション → 真鍮の小鍵
  { type: 'EXAMINE', target: 'sofa' },
  // 3. 飾り棚を開ける → マッチ箱・オルゴール発見
  { type: 'USE_ITEM', item: 'brassKey', target: 'cabinet' },
  // 4. 傾いた絵画 → 白紙の便箋
  { type: 'EXAMINE', target: 'painting' },
  // 5. 暖炉に点火し、便箋をあぶる → 「四時十分」
  { type: 'USE_ITEM', item: 'matchbox', target: 'fireplace' },
  { type: 'USE_ITEM', item: 'blankLetter', target: 'fireplace' },
  // 6. 柱時計を4時10分に → 寝室の鍵
  { type: 'SET_CLOCK', hour: CLOCK_ANSWER.hour, minute: CLOCK_ANSWER.minute },
  // 7. 寝室を開けて移動
  { type: 'USE_ITEM', item: 'bedroomKey', target: 'doorBedroom' },
  { type: 'MOVE_TO_ROOM', room: 'bedroom' },
  // 8. 日記を読む(本の色順の知識)
  { type: 'EXAMINE', target: 'sideTable' },
  // 9. 鏡台 → 屏風の鏡文字
  { type: 'EXAMINE', target: 'vanity' },
  // 10. 箪笥の着物 → 花を数える
  { type: 'EXAMINE', target: 'wardrobe' },
  { type: 'EXAMINE', target: 'kimono' },
  // 11. 宝石箱(桜・梅・菊)→ ねじ巻き・写真(右)
  { type: 'SET_JEWELRY_DIAL', index: 0, value: JEWELRY_ANSWER[0] },
  { type: 'SET_JEWELRY_DIAL', index: 1, value: JEWELRY_ANSWER[1] },
  { type: 'SET_JEWELRY_DIAL', index: 2, value: JEWELRY_ANSWER[2] },
  { type: 'OPEN_JEWELRY' },
  // 12. リビングに戻り、オルゴールにねじ巻き → 旋律
  { type: 'MOVE_TO_ROOM', room: 'living' },
  { type: 'USE_ITEM', item: 'windingKey', target: 'musicBox' },
  // 13. ピアノで旋律を再現 → 書斎の鍵
  ...MELODY.map((note): Action => ({ type: 'PIANO_PRESS', note })),
  // 14. 書斎を開けて移動
  { type: 'USE_ITEM', item: 'studyKey', target: 'doorStudy' },
  { type: 'MOVE_TO_ROOM', room: 'study' },
  // 15. 机の引き出し → 写真(左)。写真を結合(任意)
  { type: 'EXAMINE', target: 'desk' },
  { type: 'COMBINE_ITEMS', a: 'photoLeft', b: 'photoRight' },
  // 16. 消灯 → 夜光の文字 → 点灯に戻す
  { type: 'TOGGLE_STUDY_LIGHT' },
  { type: 'TOGGLE_STUDY_LIGHT' },
  // 17. 地球儀で日本を正面に → 覚書
  { type: 'ROTATE_GLOBE', yaw: 0 },
  { type: 'OPEN_GLOBE' },
  // 18. 本棚を 茜・山吹・若竹・瑠璃 に → 金庫の鍵
  //     初期 [若竹, 茜, 瑠璃, 山吹] → 3回の入れ替えで正解へ
  { type: 'SWAP_BOOKS', a: 0, b: 1 },
  { type: 'SWAP_BOOKS', a: 1, b: 3 },
  { type: 'SWAP_BOOKS', a: 2, b: 3 },
  // 19. 肖像画 → 金庫(鍵+4・5・4)→ 玄関の鍵
  { type: 'EXAMINE', target: 'portrait' },
  { type: 'USE_ITEM', item: 'safeKey', target: 'safe' },
  { type: 'SET_SAFE_DIAL', index: 0, value: SAFE_ANSWER[0] },
  { type: 'SET_SAFE_DIAL', index: 1, value: SAFE_ANSWER[1] },
  { type: 'SET_SAFE_DIAL', index: 2, value: SAFE_ANSWER[2] },
  { type: 'OPEN_SAFE' },
  // 20. 玄関を開けて脱出
  { type: 'MOVE_TO_ROOM', room: 'living' },
  { type: 'USE_ITEM', item: 'entranceKey', target: 'entranceDoor' },
  { type: 'ENDING_DONE' },
]
