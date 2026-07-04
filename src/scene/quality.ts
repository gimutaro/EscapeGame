import * as THREE from 'three'

/** 描画負荷の調整値(モバイル/PC で切り替え) */
export interface QualityTier {
  readonly pixelRatioCap: number
  readonly antialias: boolean
  readonly shadowMapType: THREE.ShadowMapType
  readonly shadowMapSize: number
}

const isCoarsePointerDevice = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true

/**
 * タッチ主体の端末(スマホ・タブレット)を検出し軽量プリセットを返す。
 * ポイントライトの立方体シャドウはモバイル GPU に重いため、解像度と
 * フィルタ品質を下げ、antialias/pixelRatio も抑える。
 */
export const getQualityTier = (): QualityTier => {
  if (isCoarsePointerDevice()) {
    return {
      pixelRatioCap: 1.5,
      antialias: false,
      shadowMapType: THREE.PCFShadowMap,
      shadowMapSize: 512,
    }
  }
  return {
    pixelRatioCap: 2,
    antialias: true,
    shadowMapType: THREE.PCFSoftShadowMap,
    shadowMapSize: 1024,
  }
}
