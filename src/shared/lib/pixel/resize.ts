import { type PixelBuffer, createBuffer } from './buffer'

/** 최근접 이웃으로 크기를 바꿉니다. 픽셀 아트를 키울 때 씁니다. */
export function resizeNearest(
  src: PixelBuffer,
  width: number,
  height: number,
): PixelBuffer {
  const out = createBuffer(width, height)
  const sd = src.data
  const od = out.data
  for (let y = 0; y < height; y += 1) {
    const sy = Math.min(src.height - 1, Math.floor((y * src.height) / height))
    for (let x = 0; x < width; x += 1) {
      const sx = Math.min(src.width - 1, Math.floor((x * src.width) / width))
      const si = (sy * src.width + sx) * 4
      const oi = (y * width + x) * 4
      od[oi] = sd[si]
      od[oi + 1] = sd[si + 1]
      od[oi + 2] = sd[si + 2]
      od[oi + 3] = sd[si + 3]
    }
  }
  return out
}

/**
 * 영역 평균으로 줄입니다. 사진을 픽셀 아트 크기로 줄일 때 계단 현상이 덜합니다.
 * 투명한 픽셀의 색이 섞여 가장자리가 어두워지지 않도록 알파를 곱해서 평균합니다.
 * 키울 때는 최근접 이웃을 씁니다.
 */
export function resizeArea(
  src: PixelBuffer,
  width: number,
  height: number,
): PixelBuffer {
  if (width >= src.width && height >= src.height) {
    return resizeNearest(src, width, height)
  }
  const count = width * height
  const sumR = new Float64Array(count)
  const sumG = new Float64Array(count)
  const sumB = new Float64Array(count)
  const sumA = new Float64Array(count)
  const hits = new Uint32Array(count)
  const sd = src.data
  for (let y = 0; y < src.height; y += 1) {
    const oy = Math.min(height - 1, Math.floor((y * height) / src.height))
    for (let x = 0; x < src.width; x += 1) {
      const ox = Math.min(width - 1, Math.floor((x * width) / src.width))
      const o = oy * width + ox
      const si = (y * src.width + x) * 4
      const a = sd[si + 3]
      sumR[o] += sd[si] * a
      sumG[o] += sd[si + 1] * a
      sumB[o] += sd[si + 2] * a
      sumA[o] += a
      hits[o] += 1
    }
  }
  const out = createBuffer(width, height)
  const od = out.data
  for (let o = 0; o < count; o += 1) {
    const a = sumA[o]
    if (a === 0 || hits[o] === 0) continue
    const i = o * 4
    od[i] = sumR[o] / a
    od[i + 1] = sumG[o] / a
    od[i + 2] = sumB[o] / a
    od[i + 3] = a / hits[o]
  }
  return out
}

/** 비율을 지키면서 최대 크기 안에 들어가는 크기 (키우지는 않습니다) */
export function fitWithin(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(1, maxWidth / width, maxHeight / height)
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

/** 새 크기의 투명한 버퍼 가운데에 src를 놓습니다. 넘치는 부분은 잘립니다. */
export function placeCentered(
  src: PixelBuffer,
  width: number,
  height: number,
): PixelBuffer {
  const out = createBuffer(width, height)
  const offsetX = Math.floor((width - src.width) / 2)
  const offsetY = Math.floor((height - src.height) / 2)
  for (let y = 0; y < src.height; y += 1) {
    const ty = y + offsetY
    if (ty < 0 || ty >= height) continue
    for (let x = 0; x < src.width; x += 1) {
      const tx = x + offsetX
      if (tx < 0 || tx >= width) continue
      const si = (y * src.width + x) * 4
      const oi = (ty * width + tx) * 4
      out.data[oi] = src.data[si]
      out.data[oi + 1] = src.data[si + 1]
      out.data[oi + 2] = src.data[si + 2]
      out.data[oi + 3] = src.data[si + 3]
    }
  }
  return out
}
