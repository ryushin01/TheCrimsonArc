export interface Layer {
  id: string
  name: string
  visible: boolean
  /** 0~1 */
  opacity: number
}

export interface Frame {
  id: string
}

/**
 * 레이어 × 프레임으로 이루어진 픽셀 애니메이션.
 * 셀(cel)은 한 레이어의 한 프레임 그림이고, 바뀔 때마다 새 버퍼로 바꿔 끼웁니다. (불변)
 */
export interface Artwork {
  width: number
  height: number
  fps: number
  /** 0번이 맨 아래 */
  layers: readonly Layer[]
  frames: readonly Frame[]
  /** `${layerId}/${frameId}` → RGBA. 없으면 투명 */
  cels: Readonly<Record<string, Uint8ClampedArray>>
}
