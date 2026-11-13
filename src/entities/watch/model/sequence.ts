/** 스크롤 시퀀스: 앞 프레임은 한 바퀴 돌고, 뒤 프레임은 3/4 각도로 돌며 분해됩니다. */
export const SEQUENCE_FRAMES = 96
export const TURN_FRAMES = 60

/** 화면에 그릴 크기와 기기 배율에 맞춰 고르는 프레임 한 변의 길이(px) */
export const SEQUENCE_SIZES = { sm: 540, lg: 960 } as const
export type SequenceSize = keyof typeof SEQUENCE_SIZES
export type SequenceFormat = 'avif' | 'webp'

/** i번째 프레임 파일 주소 (public/sequence/{크기}/{번호}.{형식}) */
export function sequenceFrameUrl(
  index: number,
  size: SequenceSize,
  format: SequenceFormat,
  base: string = import.meta.env.BASE_URL,
): string {
  return `${base}sequence/${size}/${String(index).padStart(3, '0')}.${format}`
}

/** 화면에 그릴 길이(CSS px)와 기기 배율로 프레임 크기를 고릅니다. */
export function pickSequenceSize(cssSize: number, dpr: number): SequenceSize {
  return cssSize * Math.min(dpr, 2) > SEQUENCE_SIZES.sm * 1.15 ? 'lg' : 'sm'
}

export interface FrameState {
  rotationX: number
  rotationY: number
  explode: number
}

const ease = (t: number) => t * t * (3 - 2 * t)

export function frameState(
  index: number,
  total = SEQUENCE_FRAMES,
  turn = TURN_FRAMES,
): FrameState {
  if (index < turn) {
    return {
      rotationX: -0.12,
      rotationY: (index / turn) * Math.PI * 2,
      explode: 0,
    }
  }
  const t = ease((index - turn) / Math.max(1, total - turn - 1))
  return {
    rotationX: -0.12 + t * 0.34,
    rotationY: -t * 0.95,
    explode: t,
  }
}
