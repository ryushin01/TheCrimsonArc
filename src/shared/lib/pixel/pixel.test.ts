import {
  type Rgba,
  blendOver,
  createBuffer,
  fitWithin,
  floodFill,
  getPixel,
  hexToRgba,
  isEmptyBuffer,
  line,
  placeCentered,
  resizeArea,
  resizeNearest,
  rgbaToHex,
  setPixel,
  stamp,
  tint,
} from '.'

const RED: Rgba = [255, 0, 0, 255]
const BLUE: Rgba = [0, 0, 255, 255]

function painted(buffer: ReturnType<typeof createBuffer>) {
  const points: string[] = []
  for (let y = 0; y < buffer.height; y += 1) {
    for (let x = 0; x < buffer.width; x += 1) {
      if (getPixel(buffer, x, y)[3] > 0) points.push(`${x},${y}`)
    }
  }
  return points
}

describe('색상 변환', () => {
  it('hex와 RGBA를 오간다', () => {
    expect(hexToRgba('#b3203a')).toEqual([179, 32, 58, 255])
    expect(hexToRgba('#fff')).toEqual([255, 255, 255, 255])
    expect(rgbaToHex([179, 32, 58, 255])).toBe('#b3203a')
    expect(() => hexToRgba('crimson')).toThrow()
  })
})

describe('그리기', () => {
  it('붓은 범위 밖을 자르고 찍는다', () => {
    const buffer = createBuffer(4, 4)
    stamp(buffer, 0, 0, 3, RED)
    expect(painted(buffer)).toEqual(['0,0', '1,0', '0,1', '1,1'])
  })

  it('브레젠험 선은 끝점을 모두 지난다', () => {
    const buffer = createBuffer(5, 5)
    line(buffer, 0, 0, 4, 2, 1, RED)
    const points = painted(buffer)
    expect(points).toContain('0,0')
    expect(points).toContain('4,2')
    expect(points).toHaveLength(5)
  })

  it('채우기는 같은 색으로 이어진 영역만 채운다', () => {
    const buffer = createBuffer(5, 5)
    // 가운데 세로 벽
    for (let y = 0; y < 5; y += 1) setPixel(buffer, 2, y, BLUE)
    expect(floodFill(buffer, 0, 0, RED)).toBe(true)
    expect(getPixel(buffer, 1, 4)).toEqual(RED)
    expect(getPixel(buffer, 2, 2)).toEqual(BLUE)
    expect(getPixel(buffer, 3, 0)[3]).toBe(0)
    // 같은 색으로 다시 채우면 바뀌는 것이 없다
    expect(floodFill(buffer, 0, 0, RED)).toBe(false)
  })

  it('채우기는 오목한 모양도 빠짐없이 채운다', () => {
    const buffer = createBuffer(6, 6)
    // U자 벽
    for (let y = 1; y < 6; y += 1) {
      setPixel(buffer, 1, y, BLUE)
      setPixel(buffer, 4, y, BLUE)
    }
    for (let x = 1; x < 5; x += 1) setPixel(buffer, x, 5, BLUE)
    floodFill(buffer, 2, 4, RED)
    expect(getPixel(buffer, 3, 1)).toEqual(RED)
    expect(getPixel(buffer, 0, 0)).toEqual(RED)
    expect(getPixel(buffer, 5, 5)).toEqual(RED)
  })
})

describe('합성', () => {
  it('불투명한 위 레이어가 아래를 덮는다', () => {
    const dst = new Uint8ClampedArray([0, 0, 255, 255])
    blendOver(dst, new Uint8ClampedArray([255, 0, 0, 255]))
    expect([...dst]).toEqual([255, 0, 0, 255])
  })

  it('레이어 불투명도 50%는 색을 반씩 섞는다', () => {
    const dst = new Uint8ClampedArray([0, 0, 255, 255])
    blendOver(dst, new Uint8ClampedArray([255, 0, 0, 255]), 0.5)
    expect(dst[0]).toBeGreaterThanOrEqual(127)
    expect(dst[0]).toBeLessThanOrEqual(128)
    expect(dst[2]).toBeGreaterThanOrEqual(127)
    expect(dst[3]).toBe(255)
  })

  it('투명한 바탕에 반투명을 올리면 알파가 남는다', () => {
    const dst = new Uint8ClampedArray(4)
    blendOver(dst, new Uint8ClampedArray([10, 20, 30, 255]), 0.4)
    expect([...dst]).toEqual([10, 20, 30, 102])
  })

  it('tint는 알파를 지키고 색만 바꾼다', () => {
    const out = tint(
      new Uint8ClampedArray([1, 2, 3, 77, 0, 0, 0, 0]),
      [9, 8, 7],
    )
    expect([...out]).toEqual([9, 8, 7, 77, 0, 0, 0, 0])
    expect(isEmptyBuffer(new Uint8ClampedArray(8))).toBe(true)
  })
})

describe('크기 조절', () => {
  it('최근접 이웃 확대는 픽셀을 그대로 늘린다', () => {
    const src = createBuffer(2, 1)
    setPixel(src, 0, 0, RED)
    setPixel(src, 1, 0, BLUE)
    const out = resizeNearest(src, 4, 2)
    expect(getPixel(out, 1, 1)).toEqual(RED)
    expect(getPixel(out, 2, 0)).toEqual(BLUE)
  })

  it('영역 평균 축소는 색과 알파를 평균한다', () => {
    const src = createBuffer(2, 2)
    setPixel(src, 0, 0, RED)
    setPixel(src, 1, 0, RED)
    const out = resizeArea(src, 1, 1)
    expect(getPixel(out, 0, 0)).toEqual([255, 0, 0, 128])
  })

  it('fitWithin은 비율을 지키며 키우지 않는다', () => {
    expect(fitWithin(512, 256, 128, 128)).toEqual({ width: 128, height: 64 })
    expect(fitWithin(20, 10, 128, 128)).toEqual({ width: 20, height: 10 })
  })

  it('placeCentered는 가운데에 놓고 넘치면 자른다', () => {
    const src = createBuffer(2, 2, RED)
    const out = placeCentered(src, 4, 4)
    expect(painted(out)).toEqual(['1,1', '2,1', '1,2', '2,2'])
    expect(painted(placeCentered(createBuffer(6, 6, RED), 2, 2))).toHaveLength(
      4,
    )
  })
})
