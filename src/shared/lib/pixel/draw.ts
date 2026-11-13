import { type PixelBuffer, type Rgba, inBounds, setPixel } from './buffer'

/**
 * size×size 정사각 붓을 (x, y)에 찍습니다.
 * 홀수 크기는 가운데를, 짝수 크기는 오른쪽 아래로 한 칸 치우친 곳을 채웁니다.
 */
export function stamp(
  buffer: PixelBuffer,
  x: number,
  y: number,
  size: number,
  color: Rgba,
): void {
  const half = Math.floor((size - 1) / 2)
  const x0 = x - half
  const y0 = y - half
  for (let dy = 0; dy < size; dy += 1) {
    for (let dx = 0; dx < size; dx += 1) {
      setPixel(buffer, x0 + dx, y0 + dy, color)
    }
  }
}

/** 두 점을 브레젠험 알고리즘으로 잇고, 지나는 픽셀마다 붓을 찍습니다. */
export function line(
  buffer: PixelBuffer,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  size: number,
  color: Rgba,
): void {
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  let x = x0
  let y = y0
  for (;;) {
    stamp(buffer, x, y, size, color)
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x += sx
    }
    if (e2 <= dx) {
      err += dx
      y += sy
    }
  }
}

/**
 * (x, y)와 같은 색으로 상하좌우가 이어진 영역을 color로 채웁니다. (스캔라인 방식)
 * 완전히 투명한 픽셀은 RGB 값과 상관없이 같은 색으로 봅니다.
 * 바뀐 픽셀이 있으면 true를 돌려줍니다.
 */
export function floodFill(
  buffer: PixelBuffer,
  x: number,
  y: number,
  color: Rgba,
): boolean {
  if (!inBounds(buffer, x, y)) return false
  const { width, height, data } = buffer
  const start = (y * width + x) * 4
  const tr = data[start]
  const tg = data[start + 1]
  const tb = data[start + 2]
  const ta = data[start + 3]

  const targetIsTransparent = ta === 0
  if (targetIsTransparent && color[3] === 0) return false
  if (
    !targetIsTransparent &&
    tr === color[0] &&
    tg === color[1] &&
    tb === color[2] &&
    ta === color[3]
  ) {
    return false
  }

  const matches = (i: number) =>
    targetIsTransparent
      ? data[i + 3] === 0
      : data[i] === tr &&
        data[i + 1] === tg &&
        data[i + 2] === tb &&
        data[i + 3] === ta

  const paint = (i: number) => {
    data[i] = color[0]
    data[i + 1] = color[1]
    data[i + 2] = color[2]
    data[i + 3] = color[3]
  }

  const stack: number[] = [x, y]
  while (stack.length > 0) {
    const sy = stack.pop() as number
    const sx = stack.pop() as number
    const row = sy * width
    if (!matches((row + sx) * 4)) continue

    let left = sx
    while (left > 0 && matches((row + left - 1) * 4)) left -= 1
    let right = sx
    while (right < width - 1 && matches((row + right + 1) * 4)) right += 1

    for (let i = left; i <= right; i += 1) paint((row + i) * 4)

    for (const ny of [sy - 1, sy + 1]) {
      if (ny < 0 || ny >= height) continue
      const nrow = ny * width
      let inRun = false
      for (let i = left; i <= right; i += 1) {
        if (matches((nrow + i) * 4)) {
          if (!inRun) {
            stack.push(i, ny)
            inRun = true
          }
        } else {
          inRun = false
        }
      }
    }
  }
  return true
}
