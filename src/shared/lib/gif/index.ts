export {
  type AnimationFrame,
  type EncodeAnimationInput,
  type EncodeAnimationResult,
  type GifFrameOptions,
  type GifWriterOptions,
  GifWriter,
  encodeAnimation,
  toDelayCs,
} from './encode'
export {
  type DecodeOptions,
  type DecodedGif,
  type GifFrameVisit,
  type GifInfo,
  GifDecodeError,
  decodeGif,
  fromDelayCs,
  interlaceRowMap,
  visitGifFrames,
} from './decode'
export { lzwDecode, lzwEncode } from './lzw'
export {
  ALPHA_THRESHOLD,
  type PaletteResult,
  buildPalette,
  createNearestColor,
  mapToIndices,
} from './quantize'
