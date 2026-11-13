import { createArtwork, getCel, setCel } from '@/entities/artwork'
import { LIMITS } from '@/shared/config'
import { createStudioStore } from './studio-store'

function setup() {
  const artwork = createArtwork({ width: 2, height: 2 })
  return createStudioStore(artwork)
}

describe('스튜디오 상태', () => {
  it('그리기를 되돌리고 다시 한다', () => {
    const store = setup()
    const { artwork, activeLayerId, activeFrameId } = store.get()
    const drawn = setCel(
      artwork,
      activeLayerId,
      activeFrameId,
      new Uint8ClampedArray(16).fill(255),
    )
    store.commit(drawn, { message: '선을 그렸습니다.' })
    expect(store.get().past).toHaveLength(1)
    expect(store.get().dirty).toBe(true)

    store.undo()
    expect(store.get().artwork).toBe(artwork)
    expect(store.get().message).toBe('되돌렸습니다.')
    store.redo()
    expect(
      getCel(store.get().artwork, activeLayerId, activeFrameId),
    ).toBeDefined()
  })

  it('되돌리기는 50단계까지 기억한다', () => {
    const store = setup()
    for (let i = 0; i < 60; i += 1) store.setFps(i % 2 ? 6 : 12) // 서로 합쳐지므로 1단계
    expect(store.get().past.length).toBe(1)
    for (let i = 0; i < 60; i += 1) store.addFrame()
    expect(store.get().past.length).toBeLessThanOrEqual(LIMITS.historyDepth)
  })

  it('같은 키로 이어진 변경은 되돌리기 한 번으로 묶인다', () => {
    const store = setup()
    const layerId = store.get().activeLayerId
    store.updateLayer(layerId, { opacity: 0.9 }, `opacity-${layerId}`)
    store.updateLayer(layerId, { opacity: 0.5 }, `opacity-${layerId}`)
    store.updateLayer(layerId, { opacity: 0.2 }, `opacity-${layerId}`)
    expect(store.get().past).toHaveLength(1)
    store.undo()
    expect(store.get().artwork.layers[0].opacity).toBe(1)
  })

  it('레이어를 더하면 새 레이어를 고르고, 지우면 가까운 레이어로 옮긴다', () => {
    const store = setup()
    const first = store.get().activeLayerId
    store.addLayer()
    const second = store.get().activeLayerId
    expect(second).not.toBe(first)
    expect(store.get().message).toContain('레이어를 더했습니다')
    store.removeLayer()
    expect(store.get().activeLayerId).toBe(first)
    store.removeLayer()
    expect(store.get().message).toBe('마지막 레이어는 지울 수 없습니다.')
  })

  it('프레임을 앞뒤로 넘기면 처음과 끝이 이어진다', () => {
    const store = setup()
    store.addFrame()
    store.addFrame()
    const ids = store.get().artwork.frames.map((frame) => frame.id)
    store.selectFrame(ids[0])
    store.stepFrame(-1)
    expect(store.get().activeFrameId).toBe(ids[2])
    store.stepFrame(1)
    expect(store.get().activeFrameId).toBe(ids[0])
  })

  it('되돌린 뒤 사라진 프레임을 고르고 있었다면 남은 프레임으로 옮긴다', () => {
    const store = setup()
    store.addFrame()
    const added = store.get().activeFrameId
    store.undo()
    expect(store.get().activeFrameId).not.toBe(added)
    expect(store.get().artwork.frames.map((frame) => frame.id)).toContain(
      store.get().activeFrameId,
    )
  })

  it('새 작품으로 바꿔도 되돌리기로 이전 작품을 되찾는다', () => {
    const store = setup()
    const before = store.get().artwork
    store.replaceArtwork(
      createArtwork({ width: 8, height: 8 }),
      '새 작품을 만들었습니다.',
    )
    expect(store.get().artwork.width).toBe(8)
    store.undo()
    expect(store.get().artwork).toBe(before)
  })
})
