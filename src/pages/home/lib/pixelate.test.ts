import { pixelate } from './pixelate'

describe('pixelate', () => {
  it('긴 변을 맞춰 줄이고 팔레트 색 수를 지킨다', () => {
    const width = 120
    const height = 60
    const data = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        data.set([x * 2, y * 4, (x + y) % 256, 255], (y * width + x) * 4)
      }
    }
    const art = pixelate({ width, height, frames: [data] }, 32, 8)
    expect(art.width).toBe(32)
    expect(art.height).toBe(16)
    expect(art.colorCount).toBeLessThanOrEqual(8)
    const colors = new Set<string>()
    for (let i = 0; i < art.frames[0].length; i += 4) {
      colors.add(art.frames[0].subarray(i, i + 4).join(','))
    }
    expect(colors.size).toBeLessThanOrEqual(8)
  })

  it('투명한 곳은 투명하게 둔다', () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 0])
    const art = pixelate({ width: 2, height: 1, frames: [data] }, 2, 4)
    expect(Array.from(art.frames[0])).toEqual([255, 0, 0, 255, 0, 0, 0, 0])
  })
})
