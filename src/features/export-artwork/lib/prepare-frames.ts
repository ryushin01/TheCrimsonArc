import {
  type Artwork,
  compositeFrame,
  frameDurationMs,
} from '@/entities/artwork'
import type { AnimationFrame } from '@/shared/lib/gif'
import {
  type Rgba,
  flattenOnto,
  hexToRgba,
  resizeNearest,
} from '@/shared/lib/pixel'

/** 내보낸 그림의 긴 변이 이 크기를 넘지 않게 배율을 고릅니다. */
export const MAX_EXPORT_SIZE = 1024
export const SCALE_OPTIONS = [1, 2, 4, 8] as const
export type ExportScale = (typeof SCALE_OPTIONS)[number]

export function availableScales(artwork: Artwork): ExportScale[] {
  const longest = Math.max(artwork.width, artwork.height)
  return SCALE_OPTIONS.filter(
    (scale) => scale === 1 || longest * scale <= MAX_EXPORT_SIZE,
  )
}

export interface PrepareOptions {
  scale: number
  /** '#rrggbb'. 없으면 투명 배경 */
  background?: string | null
  /** 이 프레임만 (PNG 한 장 내보내기) */
  frameIds?: readonly string[]
}

function toRgb(hex: string): readonly [number, number, number] {
  const [r, g, b] = hexToRgba(hex) as Rgba
  return [r, g, b]
}

/** 작품의 프레임들을 합성하고 배경을 깐 뒤 정수 배율로 키웁니다. 버퍼는 매번 새로 만듭니다. */
export function artworkToFrames(
  artwork: Artwork,
  { scale, background = null, frameIds }: PrepareOptions,
): { width: number; height: number; frames: AnimationFrame[] } {
  const width = artwork.width * scale
  const height = artwork.height * scale
  const ids = frameIds ?? artwork.frames.map((frame) => frame.id)
  const delayMs = frameDurationMs(artwork)
  const frames = ids.map((frameId) => {
    let rgba = compositeFrame(artwork, frameId)
    if (background) rgba = flattenOnto(rgba, toRgb(background))
    if (scale !== 1) {
      rgba = resizeNearest(
        { width: artwork.width, height: artwork.height, data: rgba },
        width,
        height,
      ).data
    }
    return { rgba, delayMs }
  })
  return { width, height, frames }
}

/** 모든 프레임을 가로로 이어 붙인 스프라이트 시트 */
export function artworkToSpriteSheet(
  artwork: Artwork,
  options: Omit<PrepareOptions, 'frameIds'>,
): { width: number; height: number; rgba: Uint8ClampedArray } {
  const { width, height, frames } = artworkToFrames(artwork, options)
  const sheetWidth = width * frames.length
  const rgba = new Uint8ClampedArray(sheetWidth * height * 4)
  frames.forEach((frame, index) => {
    for (let y = 0; y < height; y += 1) {
      const source = frame.rgba.subarray(y * width * 4, (y + 1) * width * 4)
      rgba.set(source, (y * sheetWidth + index * width) * 4)
    }
  })
  return { width: sheetWidth, height, rgba }
}
