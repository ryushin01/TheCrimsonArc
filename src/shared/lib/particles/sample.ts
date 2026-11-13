export interface SampleOptions {
  /** 몇 픽셀마다 하나씩 볼지 */
  step?: number
  /** 이 알파 값(0~255) 이상인 픽셀만 고릅니다. */
  threshold?: number
  /** 이 밝기(0~255) 이상인 픽셀만 고릅니다. 사진에서 밝은 윤곽만 남길 때 씁니다. */
  minLuminance?: number
}

/** 알파 채널이 threshold 이상인 픽셀을 step 간격으로 골라 [x0, y0, x1, y1, …]로 돌려줍니다. */
export function samplePoints(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  { step = 4, threshold = 128, minLuminance = 0 }: SampleOptions = {},
): Float32Array {
  const points: number[] = []
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4
      if (data[i + 3]! < threshold) continue
      if (minLuminance > 0) {
        const luminance =
          0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!
        if (luminance < minLuminance) continue
      }
      points.push(x, y)
    }
  }
  return Float32Array.from(points)
}

/**
 * 점 목록에서 count개의 목표점을 고릅니다.
 * 점이 넉넉하면 겹치지 않게 무작위로 고르고, 모자라면 돌려 쓰되 jitter만큼 흩뜨립니다.
 */
export function pickTargets(
  points: Float32Array,
  count: number,
  { jitter = 1.5, random = Math.random } = {},
): Float32Array {
  const available = points.length / 2
  const out = new Float32Array(count * 2)
  if (available === 0) return out
  if (available >= count) {
    const order = Array.from({ length: available }, (_, index) => index)
    for (let i = 0; i < count; i += 1) {
      const j = i + Math.floor(random() * (available - i))
      const picked = order[j]!
      order[j] = order[i]!
      out[i * 2] = points[picked * 2]!
      out[i * 2 + 1] = points[picked * 2 + 1]!
    }
    return out
  }
  for (let i = 0; i < count; i += 1) {
    const source = i % available
    const extra = i >= available ? 1 : 0
    out[i * 2] = points[source * 2]! + (random() - 0.5) * jitter * 2 * extra
    out[i * 2 + 1] =
      points[source * 2 + 1]! + (random() - 0.5) * jitter * 2 * extra
  }
  return out
}

type DrawShape = (
  context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  width: number,
  height: number,
) => void

/** 화면 밖 캔버스에 모양을 그려 점으로 바꿉니다. 그릴 수 없는 환경(jsdom 등)에서는 빈 목록입니다. */
export function shapePoints(
  width: number,
  height: number,
  draw: DrawShape,
  options?: SampleOptions,
): Float32Array {
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))
  const canvas: OffscreenCanvas | HTMLCanvasElement =
    typeof OffscreenCanvas === 'function'
      ? new OffscreenCanvas(w, h)
      : Object.assign(document.createElement('canvas'), { width: w, height: h })
  const context = canvas.getContext('2d', { willReadFrequently: true }) as
    OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null
  if (!context) return new Float32Array(0)
  draw(context, w, h)
  return samplePoints(context.getImageData(0, 0, w, h).data, w, h, options)
}
