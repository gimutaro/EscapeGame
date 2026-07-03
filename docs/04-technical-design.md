# 技術設計書 — 『久遠寺邸の一夜』

| 項目 | 内容 |
|---|---|
| 文書番号 | 04 |
| 版 | 1.0(初版・レビュー待ち) |
| 作成日 | 2026-07-03 |
| 前提 | 01(要件)・02(デザイン)・03(謎仕様)に準拠。特に 03 §9 詰み防止規則は実装の制約条件 |

---

## 1. 技術スタック

| 区分 | 採用 | 備考 |
|---|---|---|
| ビルド | Vite | 開発サーバ・バンドル |
| 言語 | TypeScript(strict) | `noUncheckedIndexedAccess` 等も有効化 |
| 描画 | Three.js 最新安定版 | WebGL2。ポストプロセスは three/addons の EffectComposer |
| 検証 | zod | セーブデータのスキーマ検証 |
| UI | 素の DOM + CSS | フレームワーク不使用。軽量・依存最小 |
| 音 | Web Audio API | 全 SE / BGM を合成(外部音源なし) |
| テスト | Vitest / Playwright | ユニット・統合 / E2E |
| 品質 | ESLint + Prettier | CI で強制 |

ランタイム依存は **three と zod のみ**。バンドル目標 500KB(gzip)以下、初回ロード 5 秒以内(NFR-04)。

## 2. アーキテクチャ

**「純粋ロジックの核」と「表示・入出力の殻」を分離**する。ゲームの正しさ(=絶対に脱出できること)はコア層だけでテスト可能にする。

```
        ┌───────────────────────────────────────────┐
        │  ui/(DOM: インベントリ・メッセージ・ヒント等)  │
        │  scene/(Three.js: 部屋・カメラ・ホットスポット)│
        │  audio/(WebAudio: SE・BGM)                 │
        └───────────────┬───────────▲───────────────┘
                dispatch(Action)     │ subscribe(GameState)
                        ▼           │
        ┌───────────────────────────┴───────────────┐
        │  core/  reduce(state, action) => newState  │  ← 純粋関数・不変データ
        │   - 全ギミック判定 / インベントリ / フラグ     │
        │   - 正規攻略手順データ(solution)             │
        └───────────────┬───────────────────────────┘
                        ▼
        │  save/  zod 検証付き localStorage 永続化      │
```

- 単方向データフロー: UI / シーンは Action を dispatch するだけ。状態変更は reducer のみが行い、購読者(scene / ui / audio / save)が新しい state を反映する。
- コア層は Three.js / DOM / WebAudio に一切依存しない(node 環境で高速にテスト可能)。
- ユーザーのコーディング規約に従い、**全レイヤーで不変データ**(スプレッドによる新オブジェクト生成)を徹底する。

## 3. ディレクトリ構成(多数の小さなファイル方針)

```
src/
  main.ts                     // 起動・配線のみ
  core/
    state.ts                  // GameState 型・初期状態
    actions.ts                // Action 型(判別可能ユニオン)
    reducer.ts                // ルートリデューサ(各ギミックへ委譲)
    store.ts                  // dispatch / subscribe(薄い実装)
    constants.ts              // 正解値の単一情報源(時刻 4:10、花 5-3-7、旋律、色順、金庫 4-5-4)
    items.ts                  // アイテム定義(03 §5 準拠)
    hints.ts                  // 全ヒント文(03 §4 準拠)
    texts.ts                  // 手掛かり・調査フレーバー文(03 §6 準拠)
    solution.ts               // 正規攻略 Action 列(03 §8 準拠・テストと共有)
    puzzles/
      clock.ts  piano.ts  jewelryBox.ts  bookshelf.ts
      globe.ts  safe.ts  fireplace.ts  lightSwitch.ts  doors.ts
  scene/
    engine.ts                 // renderer・ループ・リサイズ
    postprocessing.ts         // Bloom / Vignette / Grain
    cameraRig.ts              // 定点+ドラッグ見回し・注視ビュー遷移
    interaction.ts            // Raycaster・ホットスポット管理・カーソル
    rooms/
      living/                 // 部屋ビルダー(家具ごとに1ファイル)
        index.ts fireplace.ts clock.ts cabinet.ts piano.ts sofa.ts door.ts ...
      bedroom/  study/        // 同様
    materials/                // 共有マテリアル(木・真鍮・布・ガラス)
    textures/                 // Canvas 手続き生成(wood.ts wallpaper.ts carpet.ts kimono.ts ...)
    effects/                  // 火の粒子・微粒子・あぶり出しシェーダ
  ui/
    inventory.ts  message.ts  hintPanel.ts  documents.ts(おぼえがき)
    itemViewer.ts(3D拡大)  settings.ts  title.ts  ending.ts  result.ts
    layout.css  theme.css     // 大正風スキン(明朝体・生成り紙・真鍮罫線)
  audio/
    context.ts  sfx.ts  musicBox.ts  piano.ts  bgm.ts  ambience.ts
  save/
    schema.ts(zod)  storage.ts(load/save/migrate)
tests/
  unit/                       // core の網羅テスト
  integration/
    autoClear.test.ts         // ★ 自動全行程クリアテスト
    noSoftlock.test.ts        // ★ 詰み防止プロパティテスト
  e2e/
    escape.spec.ts            // Playwright: 実 UI での全行程
```

1ファイル 200〜400 行を目安に分割し、800 行を超えない。

## 4. コア型定義(骨子)

```ts
// core/state.ts(抜粋・すべて readonly)
type RoomId = 'living' | 'bedroom' | 'study'
type Phase = 'title' | 'prologue' | 'playing' | 'ending' | 'result'

interface GameState {
  readonly phase: Phase
  readonly currentRoom: RoomId
  readonly inventory: readonly ItemId[]
  readonly selectedItem: ItemId | null
  readonly flags: GameFlags            // 進行フラグ(すべて boolean・後退しない)
  readonly clockTime: { readonly hour: number; readonly minute: number }
  readonly jewelryDials: readonly [number, number, number]
  readonly safeDials: readonly [number, number, number]
  readonly bookOrder: readonly BookColor[]
  readonly pianoInput: readonly Note[]
  readonly documents: readonly DocumentId[]   // おぼえがき
  readonly hintsUsed: number
  readonly startedAt: number
  readonly escaped: boolean
}

// core/actions.ts(抜粋)
type Action =
  | { type: 'EXAMINE'; target: HotspotId }
  | { type: 'TAKE_ITEM'; item: ItemId }
  | { type: 'SELECT_ITEM'; item: ItemId | null }
  | { type: 'USE_ITEM'; item: ItemId; target: HotspotId }
  | { type: 'COMBINE_ITEMS'; a: ItemId; b: ItemId }
  | { type: 'SET_CLOCK'; hour: number; minute: number }
  | { type: 'PIANO_PRESS'; note: Note }
  | { type: 'SET_JEWELRY_DIAL'; index: 0 | 1 | 2; value: number }
  | { type: 'SET_SAFE_DIAL'; index: 0 | 1 | 2; value: number }
  | { type: 'SWAP_BOOKS'; from: number; to: number }
  | { type: 'ROTATE_GLOBE'; yawDeg: number }
  | { type: 'TOGGLE_STUDY_LIGHT' } | { type: 'OPEN_DOOR'; door: DoorId } | ...
```

- 正解値はすべて `core/constants.ts` に一元定義し、ロジック・3D 表示(着物の花の数等)・テストが同じ定数を参照する。**美術と正解が食い違う事故を型レベルで防ぐ。**
- `reduce` は純粋関数。ギミックごとのサブリデューサ(`puzzles/*.ts`)に委譲し、各ファイルを小さく保つ。

## 5. シーン層の設計

### 5.1 カメラと操作

- 各部屋の中央に定点(pivot)。ドラッグ / スワイプで yaw±180°・pitch±45° の見回し(慣性付き・感度は設定値)。
- 注視ビュー(FV-01〜16)は「カメラ位置+注視点+FOV」のプリセットへ 0.6 秒のイージング遷移。「もどる」で復帰。
- 部屋移動は扉クリック → 短いフェード+カメラ移動。

### 5.2 インタラクション

- Raycaster によるホットスポット判定。ホットスポットは `HotspotId` を持つ透明メッシュ(当たり判定は見た目より大きめ=ピクセルハント防止)。
- ホバーで発光(emissive 加算)+カーソル変化。設定 ON 時は常時マーカー(小さな光点スプライト)。
- クリック → `EXAMINE` / `USE_ITEM` 等を dispatch。**シーン層は正誤判定を持たない**(コアに委譲)。

### 5.3 手続きアセット方針

- ジオメトリ: Box / Cylinder / Lathe(壺・ランプ・時計の飾り)/ Extrude(額縁・モールディング)/ Shape の組み合わせ。家具1点=1ビルダー関数。
- テクスチャ: Canvas 2D で生成し `CanvasTexture` 化 — 木目(ノイズ+曲線)、ダマスク柄壁紙(パターン反復)、絨毯、着物(花の刺繍柄は `constants.ts` の輪数から描画)、本の背表紙(色+色名文字)。
- 鏡(B-1): three/addons の `Reflector` を小面積で使用(実反射)。屏風の文字は鏡文字でテクスチャに描いておく → 反射内で正しく読める。低画質設定では事前反転テクスチャの擬似反射に自動フォールバック。
- 火: 加算合成のスプライト粒子+点光源の揺らぎ。あぶり出し: 文字テクスチャのアルファをシェーダで徐々に立ち上げる。
- 夜光文字: emissive マテリアルを消灯状態と連動してフェード。

### 5.4 品質設定

| プリセット | 影 | ポストプロセス | 反射 |
|---|---|---|---|
| 高 | 2048px | 全て | Reflector |
| 中 | 1024px | Bloom+Vignette | Reflector |
| 低 | なし | Vignette のみ | 擬似 |

## 6. オーディオ合成設計

- `AudioContext` は初回ユーザー操作で resume(自動再生制限対応)。マスター → BGM / SE の GainNode 2 系統(設定と連動)。
- オルゴール: FM 合成(キャリア+モジュレータ、急速減衰)+フィーダバックディレイ+コンボリューションなしの簡易リバーブ。ピアノ: 倍音加算+減衰エンベロープ。
- チャイム・不協和音・かちゃり等は周波数・エンベロープ定義のデータ駆動(`sfx.ts` に一覧)。
- BGM はステップシーケンサ(3/4 拍子・テンポ 80)で `musicBox.ts` の音色を演奏。曲データは音名配列。
- `AudioProvider` インターフェイスで抽象化し、将来サンプル音源への差し替えを可能にする。

## 7. セーブ設計

```ts
// save/schema.ts(骨子)
const SaveSchemaV1 = z.object({
  version: z.literal(1),
  savedAt: z.number(),
  state: GameStateSchema,        // GameState と同形(zod で全域検証)
})
```

- 状態変化のたびにデバウンス(500ms)して localStorage へ保存。
- ロード時に zod 検証 → 失敗したら「セーブデータが読めません。最初から始めます」と案内して初期化(R-8)。
- `version` によるマイグレーション余地を確保。

## 8. テスト戦略(NFR-01 / AC-01〜03 の実現)

| 層 | 対象 | ツール | ゲート |
|---|---|---|---|
| ユニット | 各ギミックのリデューサ(正解・不正解・境界)、items / hints の網羅性 | Vitest | カバレッジ 80% 以上(core/) |
| 統合① | **自動全行程クリアテスト**: `solution.ts` の Action 列を初期状態から畳み込み、`escaped === true` と各中間フラグを検証 | Vitest | CI 必須(落ちたらマージ不可) |
| 統合② | **詰み防止プロパティテスト**: 誤使用でアイテムが消えない(R-3)/ 開いた扉が閉じない(R-1)/ ランダムな合法 Action 列を挟んでも solution が完走できる(R-5) | Vitest(fast-check 併用可) | CI 必須 |
| 統合③ | セーブ往復同値・破損データ投入(R-8) | Vitest | CI 必須 |
| E2E | 実ブラウザでタイトル → 全謎 → 脱出。テストビルドでは `window.__game.dispatch` を公開し、UI 起点の主要操作+dispatch 併用で全行程を走らせる。ミュート実行(R-9)含む | Playwright(Chromium / WebKit) | リリース前必須 |
| 性能 | 起動時間・fps 計測のスモーク(手動+計測スクリプト) | 手動 | P6 で AC-05 判定 |

- 開発は TDD で進める: 各ギミックは「reducer のテスト(RED)→ 実装(GREEN)→ リファクタ」の順。3D 表現(見た目)はユニットテスト対象外とし、E2E と目視レビューで担保する。
- `solution.ts` は攻略チャート(03 §8)と 1:1 対応させ、仕様変更時はテストが先に壊れる構造にする。

## 9. パフォーマンス予算

| 指標 | 予算 |
|---|---|
| ドローコール | ≤ 250 / フレーム |
| 三角形数 | ≤ 25万(全室合計。非表示部屋は `visible=false`) |
| 動的ライト | ≤ 6(影付きは 1〜2) |
| テクスチャメモリ | ≤ 64MB(手続き生成は 1024px 上限) |
| バンドル | ≤ 500KB gzip |
| 初回ロード | ≤ 5 秒(4G 相当) |

## 10. エラー処理・フォールバック

- WebGL2 非対応 / コンテキスト生成失敗: 描画を開始せず、対応ブラウザの案内画面を表示。
- WebGL コンテキストロスト: `webglcontextlost` を捕捉 → 再取得を試み、状態はコアにあるため復元は再描画のみで済む。
- セーブ破損: §7 の通り検出・案内・初期化。例外は握りつぶさずユーザー向けメッセージ+開発ログ(専用 logger 経由。`console.log` 直書き禁止)。
- AudioContext 生成失敗: 無音モードで続行(R-9 により進行に支障なし)。

## 11. 実装フェーズ計画(01 文書 §12 の詳細)

| フェーズ | 主な作業 | DoD |
|---|---|---|
| P1 | プロジェクト雛形(Vite+TS+ESLint+Vitest+Playwright)/ core 全実装(state・reducer・全ギミック・hints・texts・solution)/ save | ユニット+統合①〜③ green、core カバレッジ 80%+ |
| P2 | engine・cameraRig・interaction・材質 / テクスチャ基盤 / リビングの環境モデリング | リビングを見回し・調査できる(仮 UI) |
| P3 | UI 一式(インベントリ・メッセージ・ヒント・おぼえがき・設定・タイトル)/ リビング5ギミック結線 / SE 基盤 | Phase 1 を通しプレイ可 |
| P4 | 寝室の環境+4ギミック(Reflector 含む)/ BGM | Phase 2 を通しプレイ可 |
| P5 | 書斎の環境+6ギミック / プロローグ・エンディング・リザルト | 手動で全行程クリア可 |
| P6 | 演出磨き(EV-01〜09)・音の追い込み・モバイル最適化・画質プリセット・難度文言調整・E2E 整備 | AC-01〜07 全充足 |

各フェーズ完了時に 01 文書の受け入れ基準と照合し、コードレビュー(不変性・ファイルサイズ・エラー処理・console.log 不在)を通す。
