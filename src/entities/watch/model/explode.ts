import { smoothstep } from '@/shared/lib/math'

/** 분해 장면에서 부품이 얼마나 떨어지는지 (mm, explode=1 기준) */
export type WatchPart =
  | 'crystal'
  | 'bezel'
  | 'hands'
  | 'dial'
  | 'chapter'
  | 'bridges'
  | 'arcBridge'
  | 'gears'
  | 'balance'
  | 'plate'
  | 'rotor'
  | 'case'
  | 'crown'
  | 'caseback'
  | 'strap'

// 앞쪽 부품은 크리스털 방향(+Z)으로, 무브먼트는 케이스 뒤(-Z)로 차례로 빠져나옵니다.
export const EXPLODE_OFFSETS: Record<
  WatchPart,
  { x?: number; y?: number; z?: number }
> = {
  crystal: { z: 30 },
  bezel: { z: 22 },
  hands: { z: 16 },
  chapter: { z: 11 },
  dial: { z: 9 },
  plate: { z: -21.6 },
  gears: { z: -28.7 },
  bridges: { z: -34.1 },
  arcBridge: { z: -39.4 },
  balance: { z: -38.8, x: 5 },
  rotor: { z: -41.8 },
  case: {},
  crown: { x: 10 },
  caseback: { z: -48 },
  strap: { z: -4 },
}

/** 분해할 때 줄이 위·아래로 벌어지는 거리 (mm) */
export const STRAP_SPREAD = 9

/** 완전히 분해했을 때 앞뒤 부품 묶음의 가운데가 원점에 오도록 미는 거리 (mm) */
export const EXPLODE_CENTER_SHIFT = 13

/** 부드럽게 들어갔다 나오는 분해 곡선을 적용한 부품 위치 */
export function explodeOffset(
  part: WatchPart,
  explode: number,
): { x: number; y: number; z: number } {
  const eased = smoothstep(0, 1, explode)
  const offset = EXPLODE_OFFSETS[part]
  return {
    x: (offset.x ?? 0) * eased,
    y: (offset.y ?? 0) * eased,
    z: (offset.z ?? 0) * eased,
  }
}
