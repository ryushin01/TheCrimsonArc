import {
  type Artwork,
  addFrame,
  addLayer,
  createArtwork,
  findFrameIndex,
  setCel,
} from '@/entities/artwork'
import { fitWithin, placeCentered, resizeArea } from '@/shared/lib/pixel'
import type { ImportedImage } from './read-image'

/** 연 이미지로 새 작품을 만듭니다. 움직이는 GIF는 프레임마다 한 장씩 들어갑니다. */
export function importedToArtwork(image: ImportedImage): Artwork {
  let artwork = createArtwork({
    width: image.width,
    height: image.height,
    fps: image.fps,
    layerName: image.name,
  })
  const layerId = artwork.layers[0].id
  const frameIds = [artwork.frames[0].id]
  for (let i = 1; i < image.frames.length; i += 1) {
    const result = addFrame(artwork)
    if (!result.frameId) break
    artwork = result.artwork
    frameIds.push(result.frameId)
  }
  frameIds.forEach((frameId, index) => {
    artwork = setCel(artwork, layerId, frameId, image.frames[index])
  })
  return artwork
}

/**
 * 연 이미지를 지금 작품의 새 레이어로 놓습니다. (가운데 정렬, 크면 줄여 맞춤)
 * 움직이는 GIF는 startFrameId부터 차례로 한 프레임씩 놓습니다.
 */
export function placeImageAsLayer(
  artwork: Artwork,
  image: ImportedImage,
  startFrameId: string,
): { artwork: Artwork; layerId: string | null; placedFrames: number } {
  const fit = fitWithin(
    image.width,
    image.height,
    artwork.width,
    artwork.height,
  )
  const startIndex = Math.max(0, findFrameIndex(artwork, startFrameId))
  const count = Math.min(
    image.frames.length,
    artwork.frames.length - startIndex,
  )
  const cels: Record<string, Uint8ClampedArray> = {}
  for (let i = 0; i < count; i += 1) {
    let buffer = {
      width: image.width,
      height: image.height,
      data: image.frames[i],
    }
    if (fit.width !== image.width || fit.height !== image.height) {
      buffer = resizeArea(buffer, fit.width, fit.height)
    }
    cels[artwork.frames[startIndex + i].id] = placeCentered(
      buffer,
      artwork.width,
      artwork.height,
    ).data
  }
  const result = addLayer(artwork, { name: image.name, cels })
  return { ...result, placedFrames: result.layerId ? count : 0 }
}
