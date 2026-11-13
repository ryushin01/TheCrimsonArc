import { LIMITS } from '@/shared/config'
import { type Rgba, blendOver, isEmptyBuffer } from '@/shared/lib/pixel'
import type { Artwork, Frame, Layer } from './types'

let idCounter = 0
/** 문서 안에서 겹치지 않는 아이디 */
export function createId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function celKey(layerId: string, frameId: string): string {
  return `${layerId}/${frameId}`
}

export function createArtwork({
  width,
  height,
  fps = 12,
  layerName = '레이어 1',
}: {
  width: number
  height: number
  fps?: number
  layerName?: string
}): Artwork {
  return {
    width,
    height,
    fps,
    layers: [
      { id: createId('layer'), name: layerName, visible: true, opacity: 1 },
    ],
    frames: [{ id: createId('frame') }],
    cels: {},
  }
}

export function getCel(
  artwork: Artwork,
  layerId: string,
  frameId: string,
): Uint8ClampedArray | undefined {
  return artwork.cels[celKey(layerId, frameId)]
}

/** 셀을 바꿔 끼운 새 작품. 비어 있는 그림이면 셀을 지웁니다. */
export function setCel(
  artwork: Artwork,
  layerId: string,
  frameId: string,
  data: Uint8ClampedArray | undefined,
): Artwork {
  const key = celKey(layerId, frameId)
  const cels = { ...artwork.cels }
  if (!data || isEmptyBuffer(data)) delete cels[key]
  else cels[key] = data
  return { ...artwork, cels }
}

export function findLayerIndex(artwork: Artwork, layerId: string): number {
  return artwork.layers.findIndex((layer) => layer.id === layerId)
}

export function findFrameIndex(artwork: Artwork, frameId: string): number {
  return artwork.frames.findIndex((frame) => frame.id === frameId)
}

export function nextLayerName(artwork: Artwork): string {
  let n = artwork.layers.length + 1
  const names = new Set(artwork.layers.map((layer) => layer.name))
  while (names.has(`레이어 ${n}`)) n += 1
  return `레이어 ${n}`
}

export function canAddLayer(artwork: Artwork): boolean {
  return artwork.layers.length < LIMITS.maxLayers
}

export function canAddFrame(artwork: Artwork): boolean {
  return artwork.frames.length < LIMITS.maxFrames
}

/** index 위치(기본: 맨 위)에 레이어를 더합니다. 한도를 넘으면 그대로 돌려줍니다. */
export function addLayer(
  artwork: Artwork,
  {
    name = nextLayerName(artwork),
    index = artwork.layers.length,
    cels,
  }: {
    name?: string
    index?: number
    /** frameId → 그림 */
    cels?: Readonly<Record<string, Uint8ClampedArray>>
  } = {},
): { artwork: Artwork; layerId: string | null } {
  if (!canAddLayer(artwork)) return { artwork, layerId: null }
  const layer: Layer = {
    id: createId('layer'),
    name,
    visible: true,
    opacity: 1,
  }
  const layers = [...artwork.layers]
  layers.splice(Math.max(0, Math.min(index, layers.length)), 0, layer)
  let next: Artwork = { ...artwork, layers }
  if (cels) {
    for (const [frameId, data] of Object.entries(cels)) {
      next = setCel(next, layer.id, frameId, data)
    }
  }
  return { artwork: next, layerId: layer.id }
}

export function duplicateLayer(
  artwork: Artwork,
  layerId: string,
): { artwork: Artwork; layerId: string | null } {
  const index = findLayerIndex(artwork, layerId)
  if (index === -1) return { artwork, layerId: null }
  const source = artwork.layers[index]
  const cels: Record<string, Uint8ClampedArray> = {}
  for (const frame of artwork.frames) {
    const data = getCel(artwork, layerId, frame.id)
    // 셀은 불변이므로 버퍼를 함께 써도 됩니다.
    if (data) cels[frame.id] = data
  }
  const result = addLayer(artwork, {
    name: `${source.name} 사본`,
    index: index + 1,
    cels,
  })
  if (!result.layerId) return result
  return {
    artwork: updateLayer(result.artwork, result.layerId, {
      visible: source.visible,
      opacity: source.opacity,
    }),
    layerId: result.layerId,
  }
}

/** 레이어를 지웁니다. 마지막 하나는 지우지 않습니다. */
export function removeLayer(artwork: Artwork, layerId: string): Artwork {
  if (artwork.layers.length <= 1) return artwork
  const cels = { ...artwork.cels }
  for (const frame of artwork.frames) delete cels[celKey(layerId, frame.id)]
  return {
    ...artwork,
    layers: artwork.layers.filter((layer) => layer.id !== layerId),
    cels,
  }
}

/** delta가 1이면 한 칸 위로, -1이면 한 칸 아래로 */
export function moveLayer(
  artwork: Artwork,
  layerId: string,
  delta: 1 | -1,
): Artwork {
  const from = findLayerIndex(artwork, layerId)
  const to = from + delta
  if (from === -1 || to < 0 || to >= artwork.layers.length) return artwork
  const layers = [...artwork.layers]
  const [layer] = layers.splice(from, 1)
  layers.splice(to, 0, layer)
  return { ...artwork, layers }
}

export function updateLayer(
  artwork: Artwork,
  layerId: string,
  patch: Partial<Omit<Layer, 'id'>>,
): Artwork {
  return {
    ...artwork,
    layers: artwork.layers.map((layer) =>
      layer.id === layerId
        ? {
            ...layer,
            ...patch,
            opacity:
              patch.opacity === undefined
                ? layer.opacity
                : Math.min(1, Math.max(0, patch.opacity)),
          }
        : layer,
    ),
  }
}

/** afterFrameId 뒤(기본: 맨 끝)에 빈 프레임을 더합니다. */
export function addFrame(
  artwork: Artwork,
  afterFrameId?: string,
): { artwork: Artwork; frameId: string | null } {
  if (!canAddFrame(artwork)) return { artwork, frameId: null }
  const frame: Frame = { id: createId('frame') }
  const frames = [...artwork.frames]
  const at = afterFrameId
    ? findFrameIndex(artwork, afterFrameId) + 1
    : frames.length
  frames.splice(at <= 0 ? frames.length : at, 0, frame)
  return { artwork: { ...artwork, frames }, frameId: frame.id }
}

/** 모든 레이어의 그림을 복사한 프레임을 바로 뒤에 더합니다. */
export function duplicateFrame(
  artwork: Artwork,
  frameId: string,
): { artwork: Artwork; frameId: string | null } {
  const result = addFrame(artwork, frameId)
  if (!result.frameId) return result
  const cels = { ...result.artwork.cels }
  for (const layer of artwork.layers) {
    const data = getCel(artwork, layer.id, frameId)
    if (data) cels[celKey(layer.id, result.frameId)] = data
  }
  return { artwork: { ...result.artwork, cels }, frameId: result.frameId }
}

/** 프레임을 지웁니다. 마지막 하나는 지우지 않습니다. */
export function removeFrame(artwork: Artwork, frameId: string): Artwork {
  if (artwork.frames.length <= 1) return artwork
  const cels = { ...artwork.cels }
  for (const layer of artwork.layers) delete cels[celKey(layer.id, frameId)]
  return {
    ...artwork,
    frames: artwork.frames.filter((frame) => frame.id !== frameId),
    cels,
  }
}

/** delta가 1이면 뒤로, -1이면 앞으로 한 칸 */
export function moveFrame(
  artwork: Artwork,
  frameId: string,
  delta: 1 | -1,
): Artwork {
  const from = findFrameIndex(artwork, frameId)
  const to = from + delta
  if (from === -1 || to < 0 || to >= artwork.frames.length) return artwork
  const frames = [...artwork.frames]
  const [frame] = frames.splice(from, 1)
  frames.splice(to, 0, frame)
  return { ...artwork, frames }
}

export function setFps(artwork: Artwork, fps: number): Artwork {
  const next = Math.round(Math.min(LIMITS.maxFps, Math.max(LIMITS.minFps, fps)))
  return next === artwork.fps ? artwork : { ...artwork, fps: next }
}

export function frameDurationMs(artwork: Artwork): number {
  return 1000 / artwork.fps
}

export interface CompositeOptions {
  /** 숨긴 레이어도 넣을지 */
  includeHidden?: boolean
  /** 이 레이어들만 합성 */
  onlyLayerIds?: readonly string[]
  /** 투명한 곳을 칠할 배경색 */
  background?: Rgba
}

/** 한 프레임의 레이어들을 아래부터 차례로 겹친 RGBA */
export function compositeFrame(
  artwork: Artwork,
  frameId: string,
  { includeHidden = false, onlyLayerIds, background }: CompositeOptions = {},
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(artwork.width * artwork.height * 4)
  if (background && background[3] > 0) {
    for (let i = 0; i < out.length; i += 4) out.set(background, i)
  }
  for (const layer of artwork.layers) {
    if (!includeHidden && !layer.visible) continue
    if (onlyLayerIds && !onlyLayerIds.includes(layer.id)) continue
    const data = getCel(artwork, layer.id, frameId)
    if (data) blendOver(out, data, layer.opacity)
  }
  return out
}
