export type { Artwork, Frame, Layer } from './model/types'
export {
  type CompositeOptions,
  addFrame,
  addLayer,
  canAddFrame,
  canAddLayer,
  celKey,
  compositeFrame,
  createArtwork,
  createId,
  duplicateFrame,
  duplicateLayer,
  findFrameIndex,
  findLayerIndex,
  frameDurationMs,
  getCel,
  moveFrame,
  moveLayer,
  nextLayerName,
  removeFrame,
  removeLayer,
  setCel,
  setFps,
  updateLayer,
} from './model/artwork'
export { getFrameComposite } from './model/composite-cache'
export { SAMPLE_FRAMES, SAMPLE_SIZE, createSampleArtwork } from './model/sample'
export { FrameThumbnail, type FrameThumbnailProps } from './ui/FrameThumbnail'
export { PixelCanvas, type PixelCanvasProps } from './ui/PixelCanvas'
