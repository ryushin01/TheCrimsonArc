import { compositeFrame, getCel } from './artwork'
import type { Artwork } from './types'

const bufferIds = new WeakMap<Uint8ClampedArray, number>()
let nextBufferId = 1

function bufferId(data: Uint8ClampedArray | undefined): number {
  if (!data) return 0
  let id = bufferIds.get(data)
  if (id === undefined) {
    id = nextBufferId
    nextBufferId += 1
    bufferIds.set(data, id)
  }
  return id
}

const MAX_ENTRIES = 240
const cache = new Map<string, Uint8ClampedArray>()

/**
 * 프레임 합성 결과를 기억해 둡니다.
 * 셀은 바뀔 때마다 새 버퍼가 되므로, 셀 버퍼와 레이어 설정이 같으면 같은 결과입니다.
 * (편집할 때마다 모든 프레임 미리보기를 다시 합성하지 않으려는 것)
 */
export function getFrameComposite(
  artwork: Artwork,
  frameId: string,
): Uint8ClampedArray {
  let signature = `${artwork.width}x${artwork.height}`
  for (const layer of artwork.layers) {
    if (!layer.visible) continue
    signature += `|${bufferId(getCel(artwork, layer.id, frameId))}@${layer.opacity}`
  }
  const cached = cache.get(signature)
  if (cached) {
    // 최근에 쓴 것을 뒤로 옮겨 오래된 것부터 버립니다.
    cache.delete(signature)
    cache.set(signature, cached)
    return cached
  }
  const data = compositeFrame(artwork, frameId)
  cache.set(signature, data)
  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  return data
}
