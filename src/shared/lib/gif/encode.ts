import { ByteWriter } from './byte-writer'
import { lzwEncode } from './lzw'
import {
  ALPHA_THRESHOLD,
  buildPalette,
  createNearestColor,
  mapToIndices,
} from './quantize'

export interface GifWriterOptions {
  width: number
  height: number
  /** 전역 색표 (rgb 3바이트씩, 최대 256색) */
  palette: Uint8Array
  /** 0이면 무한 반복, 없으면 반복 확장 블록을 쓰지 않아 한 번만 재생됩니다. */
  loop?: number
}

export interface GifFrameOptions {
  /** 1/100초 단위 */
  delayCs: number
  transparentIndex?: number
  /** 0 미지정, 1 남겨 둠, 2 배경으로 지움, 3 이전 상태로 되돌림 */
  disposal?: 0 | 1 | 2 | 3
  /** indices가 이미 인터레이스 줄 순서일 때 true */
  interlaced?: boolean
}

function tableBits(colorCount: number): number {
  let bits = 1
  while (1 << bits < colorCount) bits += 1
  return bits
}

/** GIF89a 파일을 한 프레임씩 씁니다. */
export class GifWriter {
  private readonly out = new ByteWriter()
  private readonly width: number
  private readonly height: number
  private readonly minCodeSize: number
  private finished = false

  constructor(options: GifWriterOptions) {
    const { width, height, palette, loop } = options
    if (width < 1 || height < 1 || width > 65535 || height > 65535) {
      throw new Error('GIF 크기는 1~65535 픽셀이어야 합니다.')
    }
    const colorCount = Math.max(2, Math.floor(palette.length / 3))
    if (colorCount > 256) throw new Error('GIF 색표는 256색까지입니다.')
    const bits = tableBits(colorCount)
    this.width = width
    this.height = height
    this.minCodeSize = Math.max(2, bits)

    const out = this.out
    out.ascii('GIF89a')
    out.u16(width)
    out.u16(height)
    // 전역 색표 있음 | 색 깊이 8비트 | 색표 크기
    out.byte(0x80 | 0x70 | (bits - 1))
    out.byte(0)
    out.byte(0)
    const table = new Uint8Array((1 << bits) * 3)
    table.set(palette.subarray(0, Math.min(palette.length, table.length)))
    out.bytes(table)

    if (loop !== undefined) {
      out.bytes([0x21, 0xff, 0x0b])
      out.ascii('NETSCAPE2.0')
      out.bytes([0x03, 0x01])
      out.u16(loop)
      out.byte(0)
    }
  }

  addFrame(indices: Uint8Array, options: GifFrameOptions): void {
    if (this.finished)
      throw new Error('이미 끝난 GIF에는 프레임을 더할 수 없습니다.')
    if (indices.length !== this.width * this.height) {
      throw new Error('프레임 픽셀 수가 GIF 크기와 다릅니다.')
    }
    const {
      delayCs,
      transparentIndex,
      disposal = 0,
      interlaced = false,
    } = options
    const out = this.out
    const hasTransparency =
      transparentIndex !== undefined && transparentIndex >= 0

    out.bytes([0x21, 0xf9, 0x04])
    out.byte(((disposal & 7) << 2) | (hasTransparency ? 1 : 0))
    out.u16(Math.max(0, Math.min(65535, Math.round(delayCs))))
    out.byte(hasTransparency ? transparentIndex : 0)
    out.byte(0)

    out.byte(0x2c)
    out.u16(0)
    out.u16(0)
    out.u16(this.width)
    out.u16(this.height)
    out.byte(interlaced ? 0x40 : 0)

    out.byte(this.minCodeSize)
    const data = lzwEncode(indices, this.minCodeSize)
    for (let i = 0; i < data.length; i += 255) {
      const chunk = data.subarray(i, Math.min(i + 255, data.length))
      out.byte(chunk.length)
      out.bytes(chunk)
    }
    out.byte(0)
  }

  finish(): Uint8Array {
    if (!this.finished) {
      this.out.byte(0x3b)
      this.finished = true
    }
    return this.out.toBytes()
  }
}

export interface AnimationFrame {
  rgba: Uint8ClampedArray
  delayMs: number
}

export interface EncodeAnimationInput {
  width: number
  height: number
  frames: readonly AnimationFrame[]
  /** 0이면 무한 반복, 없으면 한 번만 재생 */
  loop?: number
  /** 팔레트 최대 색 수 (투명색 포함, 2~256) */
  maxColors?: number
  dither?: boolean
  onProgress?: (ratio: number) => void
}

export interface EncodeAnimationResult {
  bytes: Uint8Array
  /** 실제로 쓴 불투명 색 (rgb 3바이트씩) */
  palette: Uint8Array
  colorCount: number
  transparent: boolean
  exactColors: boolean
}

/** 1/100초 단위로 바꿉니다. 브라우저는 0.02초보다 짧은 지연을 0.1초로 늘리므로 최소 2로 둡니다. */
export function toDelayCs(delayMs: number): number {
  return Math.max(2, Math.round(delayMs / 10))
}

/** RGBA 프레임들을 하나의 팔레트로 줄여 움직이는 GIF로 만듭니다. */
export function encodeAnimation(
  input: EncodeAnimationInput,
): EncodeAnimationResult {
  const {
    width,
    height,
    frames,
    loop,
    maxColors = 256,
    dither = false,
    onProgress,
  } = input
  if (frames.length === 0) throw new Error('프레임이 하나 이상 있어야 합니다.')
  for (const frame of frames) {
    if (frame.rgba.length !== width * height * 4) {
      throw new Error('프레임 크기가 GIF 크기와 다릅니다.')
    }
  }

  const transparent = frames.some((frame) => {
    for (let i = 3; i < frame.rgba.length; i += 4) {
      if (frame.rgba[i] < ALPHA_THRESHOLD) return true
    }
    return false
  })
  const limit = Math.max(2, Math.min(256, Math.floor(maxColors)))
  const opaqueLimit = transparent ? limit - 1 : limit
  const { colors, count, exact } = buildPalette(
    frames.map((frame) => frame.rgba),
    opaqueLimit,
  )

  const transparentIndex = transparent ? count : -1
  const palette = new Uint8Array((count + (transparent ? 1 : 0)) * 3)
  palette.set(colors)

  const writer = new GifWriter({ width, height, palette, loop })
  const nearest = createNearestColor(colors, Math.max(1, count))
  frames.forEach((frame, index) => {
    const indices = mapToIndices(frame.rgba, {
      width,
      height,
      nearest,
      colors,
      transparentIndex,
      dither,
    })
    writer.addFrame(indices, {
      delayCs: toDelayCs(frame.delayMs),
      transparentIndex: transparent ? transparentIndex : undefined,
      // 투명한 곳에 이전 프레임이 비치지 않도록 지우고 그립니다.
      disposal: transparent ? 2 : 1,
    })
    onProgress?.((index + 1) / frames.length)
  })

  return {
    bytes: writer.finish(),
    palette: colors,
    colorCount: count,
    transparent,
    exactColors: exact,
  }
}
