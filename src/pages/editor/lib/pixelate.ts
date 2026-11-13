import {
  buildPalette,
  createNearestColor,
  mapToIndices,
} from '@/shared/lib/gif'
import { fitWithin, resizeArea } from '@/shared/lib/pixel'

export interface PixelArt {
  width: number
  height: number
  frames: Uint8ClampedArray[]
  colorCount: number
}

/**
 * 이미지를 긴 변 longSide 픽셀로 줄이고 colors 색 팔레트로 바꿔 픽셀 아트처럼 만듭니다.
 * 움직이는 이미지는 모든 프레임이 같은 팔레트를 씁니다.
 */
export function pixelate(
  image: {
    width: number
    height: number
    frames: readonly Uint8ClampedArray[]
  },
  longSide: number,
  colors: number,
): PixelArt {
  const size = fitWithin(image.width, image.height, longSide, longSide)
  const small = image.frames.map(
    (data) =>
      resizeArea(
        { width: image.width, height: image.height, data },
        size.width,
        size.height,
      ).data,
  )
  const palette = buildPalette(small, colors)
  const nearest = createNearestColor(palette.colors, Math.max(1, palette.count))
  const frames = small.map((data) => {
    const indices = mapToIndices(data, {
      width: size.width,
      height: size.height,
      nearest,
      colors: palette.colors,
      transparentIndex: -1,
    })
    const out = new Uint8ClampedArray(data.length)
    for (let p = 0; p < indices.length; p += 1) {
      const i = p * 4
      // 반투명 이하는 투명하게, 나머지는 팔레트 색으로 (픽셀 아트처럼 알파도 둘 중 하나)
      if (data[i + 3] < 128) continue
      const c = indices[p] * 3
      out[i] = palette.colors[c]
      out[i + 1] = palette.colors[c + 1]
      out[i + 2] = palette.colors[c + 2]
      out[i + 3] = 255
    }
    return out
  })
  return {
    width: size.width,
    height: size.height,
    frames,
    colorCount: palette.count,
  }
}
