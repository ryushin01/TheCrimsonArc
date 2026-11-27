import { ANCHOR_COUNT, anchorStore } from './anchors'

describe('anchorStore', () => {
  it('지시선 점을 기록하고 모두 숨긴다', () => {
    anchorStore.set(1, 40, 80, true)
    expect(anchorStore.get(1)).toEqual({ x: 40, y: 80, visible: true })
    anchorStore.hideAll()
    expect(anchorStore.get(1).visible).toBe(false)
  })

  it('없는 번호는 무시한다', () => {
    expect(() => anchorStore.set(ANCHOR_COUNT, 1, 1, true)).not.toThrow()
  })
})
