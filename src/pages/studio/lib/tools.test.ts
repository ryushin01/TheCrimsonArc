import { createBuffer, getPixel } from '@/shared/lib/pixel'
import { applyTool, pickColor } from './tools'

describe('applyTool', () => {
  it('펜은 앞 점과 선으로 잇고, 지우개는 투명하게 한다', () => {
    const buffer = createBuffer(4, 1)
    applyTool(buffer, 'pen', '#ff0000', 1, { x: 3, y: 0 }, { x: 0, y: 0 })
    expect(getPixel(buffer, 1, 0)).toEqual([255, 0, 0, 255])
    applyTool(buffer, 'eraser', '#ff0000', 1, { x: 1, y: 0 }, null)
    expect(getPixel(buffer, 1, 0)[3]).toBe(0)
  })

  it('채우기는 이어진 영역을 칠하고 스포이트는 그리지 않는다', () => {
    const buffer = createBuffer(3, 3)
    expect(applyTool(buffer, 'fill', '#00ff00', 1, { x: 1, y: 1 }, null)).toBe(
      true,
    )
    expect(getPixel(buffer, 2, 2)).toEqual([0, 255, 0, 255])
    expect(
      applyTool(buffer, 'picker', '#000000', 1, { x: 0, y: 0 }, null),
    ).toBe(false)
  })

  it('pickColor는 투명한 곳에서 null을 돌려준다', () => {
    const data = new Uint8ClampedArray([10, 20, 30, 255, 0, 0, 0, 0])
    expect(pickColor(data, 2, 1, { x: 0, y: 0 })).toBe('#0a141e')
    expect(pickColor(data, 2, 1, { x: 1, y: 0 })).toBeNull()
    expect(pickColor(data, 2, 1, { x: 5, y: 0 })).toBeNull()
  })
})
