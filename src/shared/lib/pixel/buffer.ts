/** RGBA 픽셀 버퍼 (곧은 알파, 한 픽셀에 4바이트) */
export interface PixelBuffer {
  readonly width: number
  readonly height: number
  readonly data: Uint8ClampedArray
}

/** [r, g, b, a] 0~255 */
export type Rgba = readonly [number, number, number, number]

export const TRANSPARENT: Rgba = [0, 0, 0, 0]

export function createBuffer(
  width: number,
  height: number,
  fill?: Rgba,
): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4)
  if (fill && fill[3] > 0) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = fill[0]
      data[i + 1] = fill[1]
      data[i + 2] = fill[2]
      data[i + 3] = fill[3]
    }
  }
  return { width, height, data }
}

export function cloneBuffer(buffer: PixelBuffer): PixelBuffer {
  return {
    width: buffer.width,
    height: buffer.height,
    data: new Uint8ClampedArray(buffer.data),
  }
}

export function inBounds(buffer: PixelBuffer, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < buffer.width && y < buffer.height
}

export function getPixel(buffer: PixelBuffer, x: number, y: number): Rgba {
  if (!inBounds(buffer, x, y)) return TRANSPARENT
  const i = (y * buffer.width + x) * 4
  const d = buffer.data
  return [d[i], d[i + 1], d[i + 2], d[i + 3]]
}

export function setPixel(
  buffer: PixelBuffer,
  x: number,
  y: number,
  color: Rgba,
): void {
  if (!inBounds(buffer, x, y)) return
  const i = (y * buffer.width + x) * 4
  const d = buffer.data
  d[i] = color[0]
  d[i + 1] = color[1]
  d[i + 2] = color[2]
  d[i + 3] = color[3]
}

/** 모든 픽셀이 완전히 투명하면 true */
export function isEmptyBuffer(data: Uint8ClampedArray): boolean {
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) return false
  }
  return true
}

export function sameColor(a: Rgba, b: Rgba): boolean {
  if (a[3] === 0 && b[3] === 0) return true
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]
}

/** '#rgb' 또는 '#rrggbb'를 불투명한 RGBA로 바꿉니다. */
export function hexToRgba(hex: string): Rgba {
  const value = hex.trim().replace(/^#/, '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value
  if (!/^[0-9a-f]{6}$/i.test(full)) {
    throw new Error(`색상 값 "${hex}"을(를) 읽을 수 없습니다.`)
  }
  const n = Number.parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]
}

export function rgbaToHex(color: Rgba): string {
  return `#${[color[0], color[1], color[2]]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`
}
