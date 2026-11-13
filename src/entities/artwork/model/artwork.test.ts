import { LIMITS } from '@/shared/config'
import {
  addFrame,
  addLayer,
  celKey,
  compositeFrame,
  createArtwork,
  duplicateFrame,
  duplicateLayer,
  getCel,
  moveFrame,
  moveLayer,
  removeFrame,
  removeLayer,
  setCel,
  setFps,
  updateLayer,
} from './artwork'
import { getFrameComposite } from './composite-cache'
import { SAMPLE_FRAMES, createSampleArtwork } from './sample'

function solid(width: number, height: number, rgba: number[]) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) data.set(rgba, i)
  return data
}

describe('작품 모델', () => {
  it('레이어를 더하고 옮기고 지운다', () => {
    let art = createArtwork({ width: 2, height: 2 })
    const first = art.layers[0].id
    const added = addLayer(art, { name: '선화' })
    art = added.artwork
    expect(art.layers.map((layer) => layer.name)).toEqual(['레이어 1', '선화'])

    art = moveLayer(art, added.layerId as string, -1)
    expect(art.layers[0].name).toBe('선화')
    // 맨 아래에서 더 내리면 그대로
    expect(moveLayer(art, added.layerId as string, -1)).toBe(art)

    art = removeLayer(art, added.layerId as string)
    expect(art.layers.map((layer) => layer.id)).toEqual([first])
    // 마지막 레이어는 지우지 않는다
    expect(removeLayer(art, first)).toBe(art)
  })

  it('레이어 한도를 넘지 않는다', () => {
    let art = createArtwork({ width: 1, height: 1 })
    for (let i = 0; i < 20; i += 1) art = addLayer(art).artwork
    expect(art.layers).toHaveLength(LIMITS.maxLayers)
    expect(addLayer(art).layerId).toBeNull()
  })

  it('프레임을 복제하면 모든 레이어 그림이 따라오고, 지우면 셀도 사라진다', () => {
    let art = createArtwork({ width: 2, height: 2 })
    const layerId = art.layers[0].id
    const frameId = art.frames[0].id
    art = setCel(art, layerId, frameId, solid(2, 2, [255, 0, 0, 255]))
    const copy = duplicateFrame(art, frameId)
    art = copy.artwork
    expect(art.frames).toHaveLength(2)
    expect(getCel(art, layerId, copy.frameId as string)).toBe(
      getCel(art, layerId, frameId),
    )

    art = moveFrame(art, copy.frameId as string, -1)
    expect(art.frames[0].id).toBe(copy.frameId)

    art = removeFrame(art, copy.frameId as string)
    expect(art.frames).toHaveLength(1)
    expect(Object.keys(art.cels)).toEqual([celKey(layerId, frameId)])
  })

  it('빈 그림을 넣으면 셀을 지운다', () => {
    const art = createArtwork({ width: 1, height: 1 })
    const next = setCel(
      art,
      art.layers[0].id,
      art.frames[0].id,
      new Uint8ClampedArray(4),
    )
    expect(next.cels).toEqual({})
  })

  it('프레임을 맨 끝이나 지정한 프레임 뒤에 더한다', () => {
    let art = createArtwork({ width: 1, height: 1 })
    const first = art.frames[0].id
    const second = addFrame(art)
    art = second.artwork
    const between = addFrame(art, first)
    expect(between.artwork.frames.map((frame) => frame.id)).toEqual([
      first,
      between.frameId,
      second.frameId,
    ])
  })

  it('레이어 복제는 설정과 그림을 함께 복사한다', () => {
    let art = createArtwork({ width: 1, height: 1 })
    const layerId = art.layers[0].id
    art = setCel(art, layerId, art.frames[0].id, solid(1, 1, [1, 2, 3, 255]))
    art = updateLayer(art, layerId, { opacity: 0.5, visible: false })
    const copy = duplicateLayer(art, layerId)
    const layer = copy.artwork.layers[1]
    expect(layer.name).toBe('레이어 1 사본')
    expect(layer.opacity).toBe(0.5)
    expect(layer.visible).toBe(false)
    expect(getCel(copy.artwork, layer.id, art.frames[0].id)).toEqual(
      getCel(art, layerId, art.frames[0].id),
    )
  })

  it('합성은 숨긴 레이어를 빼고 불투명도를 적용한다', () => {
    let art = createArtwork({ width: 1, height: 1 })
    const bottom = art.layers[0].id
    const frameId = art.frames[0].id
    const top = addLayer(art)
    art = top.artwork
    art = setCel(art, bottom, frameId, solid(1, 1, [0, 0, 255, 255]))
    art = setCel(
      art,
      top.layerId as string,
      frameId,
      solid(1, 1, [255, 0, 0, 255]),
    )
    expect([...compositeFrame(art, frameId)]).toEqual([255, 0, 0, 255])

    const half = updateLayer(art, top.layerId as string, { opacity: 0.5 })
    expect(compositeFrame(half, frameId)[0]).toBeGreaterThan(120)
    expect(compositeFrame(half, frameId)[2]).toBeGreaterThan(120)

    const hidden = updateLayer(art, top.layerId as string, { visible: false })
    expect([...compositeFrame(hidden, frameId)]).toEqual([0, 0, 255, 255])
    expect([
      ...compositeFrame(hidden, frameId, { includeHidden: true }),
    ]).toEqual([255, 0, 0, 255])
  })

  it('합성 캐시는 셀이 같으면 같은 결과를 재사용한다', () => {
    let art = createArtwork({ width: 1, height: 1 })
    const layerId = art.layers[0].id
    const frameId = art.frames[0].id
    art = setCel(art, layerId, frameId, solid(1, 1, [9, 9, 9, 255]))
    const first = getFrameComposite(art, frameId)
    // 다른 레이어를 더해도 그림이 같으면 캐시를 씁니다.
    const withEmptyLayer = addLayer(art).artwork
    expect(getFrameComposite(withEmptyLayer, frameId)).not.toBe(first)
    expect(getFrameComposite({ ...art }, frameId)).toBe(first)
  })

  it('FPS는 1~24로 자른다', () => {
    const art = createArtwork({ width: 1, height: 1 })
    expect(setFps(art, 100).fps).toBe(24)
    expect(setFps(art, 0).fps).toBe(1)
  })
})

describe('샘플 작품', () => {
  it('레이어 3개와 프레임 12장으로 이루어지고, 혜성이 프레임마다 움직인다', () => {
    const art = createSampleArtwork()
    expect(art.layers.map((layer) => layer.name)).toEqual([
      '배경',
      '아치',
      '혜성',
    ])
    expect(art.frames).toHaveLength(SAMPLE_FRAMES)
    const comet = art.layers[2].id
    const first = getCel(art, comet, art.frames[0].id)
    const last = getCel(art, comet, art.frames[11].id)
    expect(first).toBeDefined()
    expect(first).not.toEqual(last)
    // 아치 그림은 모든 프레임이 같은 버퍼를 공유
    const arc = art.layers[1].id
    expect(getCel(art, arc, art.frames[0].id)).toBe(
      getCel(art, arc, art.frames[5].id),
    )
  })
})
