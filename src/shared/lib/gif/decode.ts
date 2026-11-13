import { lzwDecode } from './lzw'

export interface GifInfo {
  width: number
  height: number
  /** 0이면 무한 반복, null이면 반복 정보 없음 */
  loopCount: number | null
  frameCount: number
}

export interface GifFrameVisit {
  /** 이 프레임까지 합성한 화면 (다음 프레임에서 재사용되므로 보관하려면 복사하세요) */
  rgba: Uint8ClampedArray
  delayMs: number
  index: number
}

export interface DecodeOptions {
  /** 이 수만큼 프레임을 읽으면 멈춥니다. */
  maxFrames?: number
  /** 가로·세로 최대 크기. 넘으면 오류를 냅니다. */
  maxDimension?: number
}

export class GifDecodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GifDecodeError'
  }
}

/** GIF 표시 지연(1/100초)을 브라우저처럼 해석합니다. 0~1은 0.1초로 봅니다. */
export function fromDelayCs(delayCs: number): number {
  return delayCs <= 1 ? 100 : delayCs * 10
}

const INTERLACE_PASSES: ReadonlyArray<readonly [number, number]> = [
  [0, 8],
  [4, 8],
  [2, 4],
  [1, 2],
]

/** 인터레이스된 줄 순서를 실제 줄 번호로 바꾸는 표 */
export function interlaceRowMap(height: number): Uint32Array {
  const map = new Uint32Array(height)
  let row = 0
  for (const [start, step] of INTERLACE_PASSES) {
    for (let y = start; y < height; y += step) {
      map[row] = y
      row += 1
    }
  }
  return map
}

/**
 * GIF를 프레임 단위로 풀어 합성 결과를 차례로 visit에 넘깁니다.
 * 처리 방식(disposal) 1·2·3과 투명색, 지역 색표, 인터레이스를 지원합니다.
 * visit이 false를 돌려주면 멈춥니다.
 */
export function visitGifFrames(
  bytes: Uint8Array,
  visit: (frame: GifFrameVisit) => void | false,
  options: DecodeOptions = {},
): GifInfo {
  const { maxFrames = Infinity, maxDimension = 4096 } = options
  let pos = 0
  const need = (n: number) => {
    if (pos + n > bytes.length) {
      throw new GifDecodeError('GIF 파일이 중간에 끊겨 있습니다.')
    }
  }
  const u8 = () => {
    need(1)
    const v = bytes[pos]
    pos += 1
    return v
  }
  const u16 = () => {
    need(2)
    const v = bytes[pos] | (bytes[pos + 1] << 8)
    pos += 2
    return v
  }
  const readSubBlocks = (): Uint8Array => {
    const chunks: Uint8Array[] = []
    let total = 0
    for (;;) {
      if (pos >= bytes.length) break
      const size = u8()
      if (size === 0) break
      need(size)
      chunks.push(bytes.subarray(pos, pos + size))
      total += size
      pos += size
    }
    const out = new Uint8Array(total)
    let at = 0
    for (const chunk of chunks) {
      out.set(chunk, at)
      at += chunk.length
    }
    return out
  }
  const skipSubBlocks = () => {
    for (;;) {
      if (pos >= bytes.length) return
      const size = u8()
      if (size === 0) return
      pos += size
    }
  }

  need(6)
  const signature = String.fromCharCode(...bytes.subarray(0, 6))
  if (signature !== 'GIF87a' && signature !== 'GIF89a') {
    throw new GifDecodeError('GIF 파일이 아닙니다.')
  }
  pos = 6
  const width = u16()
  const height = u16()
  if (width === 0 || height === 0)
    throw new GifDecodeError('GIF 크기가 0입니다.')
  if (width > maxDimension || height > maxDimension) {
    throw new GifDecodeError(
      `GIF가 너무 큽니다. 가로·세로 ${maxDimension}픽셀 이하만 열 수 있습니다.`,
    )
  }
  const screenFlags = u8()
  u8() // 배경색 번호 (브라우저처럼 투명으로 처리)
  u8() // 화소 비율
  let globalTable: Uint8Array | null = null
  if (screenFlags & 0x80) {
    const size = 3 * (1 << ((screenFlags & 7) + 1))
    need(size)
    globalTable = bytes.subarray(pos, pos + size)
    pos += size
  }

  const screen = new Uint8ClampedArray(width * height * 4)
  let loopCount: number | null = null
  let frameCount = 0

  let gceDisposal = 0
  let gceDelayCs = 0
  let gceTransparent = -1

  let previousDisposal = 0
  let previousRect: [number, number, number, number] | null = null
  let restoreSnapshot: Uint8ClampedArray | null = null

  while (pos < bytes.length && frameCount < maxFrames) {
    const block = u8()
    if (block === 0x3b) break

    if (block === 0x21) {
      const label = u8()
      if (label === 0xf9) {
        const size = u8()
        need(size)
        const flags = bytes[pos]
        gceDisposal = (flags >> 2) & 7
        gceDelayCs = bytes[pos + 1] | (bytes[pos + 2] << 8)
        gceTransparent = flags & 1 ? bytes[pos + 3] : -1
        pos += size
        skipSubBlocks()
      } else if (label === 0xff) {
        const size = u8()
        need(size)
        const id = String.fromCharCode(...bytes.subarray(pos, pos + size))
        pos += size
        const data = readSubBlocks()
        if ((id === 'NETSCAPE2.0' || id === 'ANIMEXTS1.0') && data[0] === 1) {
          loopCount = data[1] | (data[2] << 8)
        }
      } else {
        skipSubBlocks()
      }
      continue
    }

    if (block !== 0x2c) {
      throw new GifDecodeError('GIF 블록 구조를 읽을 수 없습니다.')
    }

    const left = u16()
    const top = u16()
    const w = u16()
    const h = u16()
    const flags = u8()
    let table = globalTable
    if (flags & 0x80) {
      const size = 3 * (1 << ((flags & 7) + 1))
      need(size)
      table = bytes.subarray(pos, pos + size)
      pos += size
    }
    const minCodeSize = u8()
    if (minCodeSize < 2 || minCodeSize > 11) {
      throw new GifDecodeError('GIF 압축 정보가 잘못되었습니다.')
    }
    const data = readSubBlocks()
    if (!table) throw new GifDecodeError('GIF에 색표가 없습니다.')
    if (w === 0 || h === 0) {
      gceDisposal = 0
      gceDelayCs = 0
      gceTransparent = -1
      continue
    }

    // 앞 프레임의 처리 방식을 적용합니다.
    if (previousDisposal === 2 && previousRect) {
      const [px, py, pw, ph] = previousRect
      for (let y = Math.max(0, py); y < Math.min(height, py + ph); y += 1) {
        const start = (y * width + Math.max(0, px)) * 4
        const end = (y * width + Math.min(width, px + pw)) * 4
        screen.fill(0, start, end)
      }
    } else if (previousDisposal === 3 && restoreSnapshot) {
      screen.set(restoreSnapshot)
    }
    restoreSnapshot = gceDisposal === 3 ? screen.slice() : null

    const indices = lzwDecode(data, minCodeSize, w * h)
    const rowMap = flags & 0x40 ? interlaceRowMap(h) : null
    const colorCount = table.length / 3
    for (let row = 0; row < h; row += 1) {
      const y = top + (rowMap ? rowMap[row] : row)
      if (y < 0 || y >= height) continue
      for (let x = 0; x < w; x += 1) {
        const sx = left + x
        if (sx >= width) break
        const index = indices[row * w + x]
        if (index === gceTransparent || index >= colorCount) continue
        const o = (y * width + sx) * 4
        screen[o] = table[index * 3]
        screen[o + 1] = table[index * 3 + 1]
        screen[o + 2] = table[index * 3 + 2]
        screen[o + 3] = 255
      }
    }

    const keepGoing = visit({
      rgba: screen,
      delayMs: fromDelayCs(gceDelayCs),
      index: frameCount,
    })
    frameCount += 1
    previousDisposal = gceDisposal
    previousRect = [left, top, w, h]
    gceDisposal = 0
    gceDelayCs = 0
    gceTransparent = -1
    if (keepGoing === false) break
  }

  if (frameCount === 0) throw new GifDecodeError('GIF에 그림이 없습니다.')
  return { width, height, loopCount, frameCount }
}

export interface DecodedGif extends GifInfo {
  frames: { rgba: Uint8ClampedArray; delayMs: number }[]
}

/** GIF의 모든 프레임을 합성된 RGBA로 풉니다. */
export function decodeGif(
  bytes: Uint8Array,
  options: DecodeOptions = {},
): DecodedGif {
  const frames: DecodedGif['frames'] = []
  const info = visitGifFrames(
    bytes,
    ({ rgba, delayMs }) => {
      frames.push({ rgba: rgba.slice(), delayMs })
    },
    options,
  )
  return { ...info, frames }
}
