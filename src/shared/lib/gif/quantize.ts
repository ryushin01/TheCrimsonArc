/** 알파가 이 값보다 작으면 투명으로 봅니다. */
export const ALPHA_THRESHOLD = 128

export interface PaletteResult {
  /** rgb 3바이트씩 */
  colors: Uint8Array
  count: number
  /** 색 수가 한도 안이라 원래 색을 그대로 쓴 경우 true */
  exact: boolean
}

const HISTOGRAM_BITS = 5
const HISTOGRAM_SIZE = 1 << (HISTOGRAM_BITS * 3)

interface Box {
  start: number
  end: number
  population: number
  rMin: number
  rMax: number
  gMin: number
  gMax: number
  bMin: number
  bMax: number
}

/**
 * 여러 프레임이 함께 쓸 팔레트를 만듭니다.
 * 불투명한 색이 maxColors 이하면 그대로 쓰고, 넘으면 메디안 컷으로 줄입니다.
 */
export function buildPalette(
  frames: readonly Uint8ClampedArray[],
  maxColors: number,
  alphaThreshold = ALPHA_THRESHOLD,
): PaletteResult {
  const limit = Math.max(1, Math.min(256, Math.floor(maxColors)))
  const exactColors = new Map<number, number>()
  let overflow = false

  const counts = new Uint32Array(HISTOGRAM_SIZE)
  const sumR = new Float64Array(HISTOGRAM_SIZE)
  const sumG = new Float64Array(HISTOGRAM_SIZE)
  const sumB = new Float64Array(HISTOGRAM_SIZE)
  const shift = 8 - HISTOGRAM_BITS

  for (const rgba of frames) {
    for (let i = 0; i < rgba.length; i += 4) {
      if (rgba[i + 3] < alphaThreshold) continue
      const r = rgba[i]
      const g = rgba[i + 1]
      const b = rgba[i + 2]
      if (!overflow) {
        const key = (r << 16) | (g << 8) | b
        if (!exactColors.has(key)) {
          if (exactColors.size >= limit) overflow = true
          else exactColors.set(key, exactColors.size)
        }
      }
      const bin =
        ((r >> shift) << (HISTOGRAM_BITS * 2)) |
        ((g >> shift) << HISTOGRAM_BITS) |
        (b >> shift)
      counts[bin] += 1
      sumR[bin] += r
      sumG[bin] += g
      sumB[bin] += b
    }
  }

  if (!overflow) {
    const colors = new Uint8Array(exactColors.size * 3)
    for (const [key, index] of exactColors) {
      colors[index * 3] = (key >> 16) & 255
      colors[index * 3 + 1] = (key >> 8) & 255
      colors[index * 3 + 2] = key & 255
    }
    return { colors, count: exactColors.size, exact: true }
  }

  return medianCut(counts, sumR, sumG, sumB, limit)
}

function medianCut(
  counts: Uint32Array,
  sumR: Float64Array,
  sumG: Float64Array,
  sumB: Float64Array,
  limit: number,
): PaletteResult {
  const mask = (1 << HISTOGRAM_BITS) - 1
  const occupied: number[] = []
  for (let bin = 0; bin < HISTOGRAM_SIZE; bin += 1) {
    if (counts[bin] > 0) occupied.push(bin)
  }
  const bins = Int32Array.from(occupied)
  const channel = (bin: number, c: 0 | 1 | 2) =>
    (bin >> (HISTOGRAM_BITS * (2 - c))) & mask

  const makeBox = (start: number, end: number): Box => {
    const box: Box = {
      start,
      end,
      population: 0,
      rMin: mask,
      rMax: 0,
      gMin: mask,
      gMax: 0,
      bMin: mask,
      bMax: 0,
    }
    for (let i = start; i < end; i += 1) {
      const bin = bins[i]
      const r = channel(bin, 0)
      const g = channel(bin, 1)
      const b = channel(bin, 2)
      box.population += counts[bin]
      box.rMin = Math.min(box.rMin, r)
      box.rMax = Math.max(box.rMax, r)
      box.gMin = Math.min(box.gMin, g)
      box.gMax = Math.max(box.gMax, g)
      box.bMin = Math.min(box.bMin, b)
      box.bMax = Math.max(box.bMax, b)
    }
    return box
  }

  const volume = (box: Box) =>
    (box.rMax - box.rMin + 1) *
    (box.gMax - box.gMin + 1) *
    (box.bMax - box.bMin + 1)

  const boxes: Box[] = [makeBox(0, bins.length)]
  // 처음 절반은 많이 쓰인 상자부터, 나머지는 넓고 많이 쓰인 상자부터 나눕니다. (MMCQ 방식)
  const populationPhase = Math.floor(limit * 0.5)

  while (boxes.length < limit) {
    const byVolume = boxes.length >= populationPhase
    let pick = -1
    let best = -1
    for (let i = 0; i < boxes.length; i += 1) {
      const box = boxes[i]
      if (box.end - box.start < 2) continue
      const score = byVolume ? box.population * volume(box) : box.population
      if (score > best) {
        best = score
        pick = i
      }
    }
    if (pick === -1) break

    const box = boxes[pick]
    const ranges = [
      box.rMax - box.rMin,
      // 사람 눈은 초록에 민감하므로 초록 범위를 조금 크게 셉니다.
      (box.gMax - box.gMin) * 1.2,
      box.bMax - box.bMin,
    ]
    const axis = (
      ranges[1] >= ranges[0] && ranges[1] >= ranges[2]
        ? 1
        : ranges[0] >= ranges[2]
          ? 0
          : 2
    ) as 0 | 1 | 2

    const slice = Array.from(bins.subarray(box.start, box.end))
    slice.sort((a, b) => channel(a, axis) - channel(b, axis))
    bins.set(slice, box.start)

    const half = box.population / 2
    let running = 0
    let split = box.start + 1
    for (let i = box.start; i < box.end - 1; i += 1) {
      running += counts[bins[i]]
      split = i + 1
      if (running >= half) break
    }
    boxes.splice(pick, 1, makeBox(box.start, split), makeBox(split, box.end))
  }

  const colors = new Uint8Array(boxes.length * 3)
  boxes.forEach((box, index) => {
    let r = 0
    let g = 0
    let b = 0
    let n = 0
    for (let i = box.start; i < box.end; i += 1) {
      const bin = bins[i]
      r += sumR[bin]
      g += sumG[bin]
      b += sumB[bin]
      n += counts[bin]
    }
    colors[index * 3] = Math.round(r / n)
    colors[index * 3 + 1] = Math.round(g / n)
    colors[index * 3 + 2] = Math.round(b / n)
  })
  return { colors, count: boxes.length, exact: false }
}

/** 팔레트에서 가장 가까운 색 번호를 찾는 함수를 만듭니다. (결과를 기억해 다시 계산하지 않음) */
export function createNearestColor(
  colors: Uint8Array,
  count: number,
): (r: number, g: number, b: number) => number {
  const cache = new Map<number, number>()
  return (r, g, b) => {
    const key = (r << 16) | (g << 8) | b
    const cached = cache.get(key)
    if (cached !== undefined) return cached
    let best = 0
    let bestDistance = Infinity
    for (let i = 0; i < count; i += 1) {
      const dr = colors[i * 3] - r
      const dg = colors[i * 3 + 1] - g
      const db = colors[i * 3 + 2] - b
      const distance = dr * dr * 2 + dg * dg * 4 + db * db * 3
      if (distance < bestDistance) {
        bestDistance = distance
        best = i
        if (distance === 0) break
      }
    }
    cache.set(key, best)
    return best
  }
}

export interface MapOptions {
  width: number
  height: number
  nearest: (r: number, g: number, b: number) => number
  colors: Uint8Array
  /** 투명 픽셀에 쓸 색 번호. 없으면 -1 */
  transparentIndex: number
  alphaThreshold?: number
  /** 플로이드–스타인버그 오차 확산 */
  dither?: boolean
}

/** RGBA 픽셀을 팔레트 색 번호 배열로 바꿉니다. */
export function mapToIndices(
  rgba: Uint8ClampedArray,
  options: MapOptions,
): Uint8Array {
  const {
    width,
    height,
    nearest,
    colors,
    transparentIndex,
    alphaThreshold = ALPHA_THRESHOLD,
    dither = false,
  } = options
  const pixelCount = width * height
  const indices = new Uint8Array(pixelCount)

  if (!dither) {
    for (let p = 0; p < pixelCount; p += 1) {
      const i = p * 4
      if (rgba[i + 3] < alphaThreshold && transparentIndex >= 0) {
        indices[p] = transparentIndex
      } else {
        indices[p] = nearest(rgba[i], rgba[i + 1], rgba[i + 2])
      }
    }
    return indices
  }

  // 오차를 다음 픽셀들에 나눠 주며 색을 고릅니다.
  const error = new Float32Array(pixelCount * 3)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = y * width + x
      const i = p * 4
      if (rgba[i + 3] < alphaThreshold && transparentIndex >= 0) {
        indices[p] = transparentIndex
        continue
      }
      const r = clampByte(rgba[i] + error[p * 3])
      const g = clampByte(rgba[i + 1] + error[p * 3 + 1])
      const b = clampByte(rgba[i + 2] + error[p * 3 + 2])
      const index = nearest(r, g, b)
      indices[p] = index
      const er = r - colors[index * 3]
      const eg = g - colors[index * 3 + 1]
      const eb = b - colors[index * 3 + 2]
      const spread = (dx: number, dy: number, weight: number) => {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || nx >= width || ny >= height) return
        const q = (ny * width + nx) * 3
        error[q] += er * weight
        error[q + 1] += eg * weight
        error[q + 2] += eb * weight
      }
      spread(1, 0, 7 / 16)
      spread(-1, 1, 3 / 16)
      spread(0, 1, 5 / 16)
      spread(1, 1, 1 / 16)
    }
  }
  return indices
}

function clampByte(value: number): number {
  return value < 0 ? 0 : value > 255 ? 255 : Math.round(value)
}
