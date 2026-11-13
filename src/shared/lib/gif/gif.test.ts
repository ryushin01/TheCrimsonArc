import { GifReader, GifWriter as ReferenceWriter } from 'omggif'
import {
  GifWriter,
  buildPalette,
  decodeGif,
  encodeAnimation,
  interlaceRowMap,
  visitGifFrames,
} from '.'

function solidFrame(width: number, height: number, rgba: number[]) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) data.set(rgba, i)
  return data
}

/** 작은 그림: 위 절반 빨강, 아래 절반 파랑, 오른쪽 아래 한 칸 투명 */
function sampleFrame(width: number, height: number, shift = 0) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const top = (y + shift) % height < height / 2
      data.set(top ? [200, 30, 60, 255] : [20, 40, 220, 255], i)
    }
  }
  data.set([0, 0, 0, 0], data.length - 4)
  return data
}

function decodeWithReference(bytes: Uint8Array) {
  const reader = new GifReader(bytes)
  const frames: Uint8Array[] = []
  for (let i = 0; i < reader.numFrames(); i += 1) {
    const pixels = new Uint8Array(reader.width * reader.height * 4)
    reader.decodeAndBlitFrameRGBA(i, pixels)
    frames.push(pixels)
  }
  return { reader, frames }
}

describe('팔레트', () => {
  it('색이 한도 안이면 원래 색을 그대로 쓴다', () => {
    const result = buildPalette([sampleFrame(4, 4)], 255)
    expect(result.exact).toBe(true)
    expect(result.count).toBe(2)
  })

  it('색이 많으면 메디안 컷으로 한도 안에 맞춘다', () => {
    const width = 64
    const data = new Uint8ClampedArray(width * width * 4)
    for (let y = 0; y < width; y += 1) {
      for (let x = 0; x < width; x += 1) {
        data.set([x * 4, y * 4, (x + y) * 2, 255], (y * width + x) * 4)
      }
    }
    const result = buildPalette([data], 16)
    expect(result.exact).toBe(false)
    expect(result.count).toBeLessThanOrEqual(16)
    expect(result.count).toBeGreaterThan(8)
  })
})

describe('GIF 인코더', () => {
  it('독립 디코더(omggif)로 풀어도 픽셀·지연·반복이 같다', () => {
    const width = 6
    const height = 4
    const frames = [0, 1, 2].map((shift) => ({
      rgba: sampleFrame(width, height, shift),
      delayMs: 80,
    }))
    const result = encodeAnimation({ width, height, frames, loop: 0 })
    expect(result.transparent).toBe(true)
    expect(result.colorCount).toBe(2)

    const { reader, frames: decoded } = decodeWithReference(result.bytes)
    expect(reader.width).toBe(width)
    expect(reader.height).toBe(height)
    expect(reader.numFrames()).toBe(3)
    expect(reader.loopCount()).toBe(0)
    expect(reader.frameInfo(0).delay).toBe(8)
    expect(reader.frameInfo(0).disposal).toBe(2)
    decoded.forEach((pixels, index) => {
      expect(Array.from(pixels)).toEqual(Array.from(frames[index].rgba))
    })
  })

  it('우리 디코더로 되돌리면 같은 프레임이 나온다', () => {
    const width = 9
    const height = 7
    const frames = [0, 3].map((shift) => ({
      rgba: sampleFrame(width, height, shift),
      delayMs: 120,
    }))
    const { bytes } = encodeAnimation({ width, height, frames, loop: 0 })
    const decoded = decodeGif(bytes)
    expect(decoded.loopCount).toBe(0)
    expect(decoded.frames).toHaveLength(2)
    expect(decoded.frames[1].delayMs).toBe(120)
    decoded.frames.forEach((frame, index) => {
      expect(Array.from(frame.rgba)).toEqual(Array.from(frames[index].rgba))
    })
  })

  it('반복을 지정하지 않으면 반복 확장 블록을 쓰지 않는다', () => {
    const { bytes } = encodeAnimation({
      width: 2,
      height: 2,
      frames: [{ rgba: solidFrame(2, 2, [1, 2, 3, 255]), delayMs: 100 }],
    })
    expect(new TextDecoder().decode(bytes)).not.toContain('NETSCAPE2.0')
    expect(decodeGif(bytes).loopCount).toBeNull()
  })

  it('색이 많은 그림은 한도 안 팔레트로 줄이고 디더링도 할 수 있다', () => {
    const width = 32
    const height = 32
    const rgba = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < width * height; i += 1) {
      rgba.set([(i * 7) % 256, (i * 13) % 256, (i * 29) % 256, 255], i * 4)
    }
    for (const dither of [false, true]) {
      const result = encodeAnimation({
        width,
        height,
        frames: [{ rgba, delayMs: 100 }],
        maxColors: 32,
        dither,
      })
      expect(result.colorCount).toBeLessThanOrEqual(32)
      const { frames } = decodeWithReference(result.bytes)
      expect(frames[0]).toHaveLength(width * height * 4)
    }
  })

  it('잘못된 입력은 알아보기 쉬운 오류를 낸다', () => {
    expect(() => encodeAnimation({ width: 2, height: 2, frames: [] })).toThrow(
      '프레임',
    )
    expect(() =>
      encodeAnimation({
        width: 2,
        height: 2,
        frames: [{ rgba: new Uint8ClampedArray(4), delayMs: 0 }],
      }),
    ).toThrow('크기')
  })
})

describe('GIF 디코더', () => {
  it('omggif가 만든 부분 프레임과 처리 방식 2·3을 브라우저처럼 합성한다', () => {
    const width = 4
    const height = 4
    const buffer = new Uint8Array(4096)
    // 0 투명, 1 빨강, 2 초록, 3 파랑
    const writer = new ReferenceWriter(buffer, width, height, {
      palette: [0x000000, 0xff0000, 0x00ff00, 0x0000ff],
      loop: 0,
    })
    writer.addFrame(0, 0, 4, 4, new Array(16).fill(1), {
      delay: 10,
      disposal: 1,
    })
    // 가운데 2×2를 초록으로, 다음 프레임 전에 되돌림(3)
    writer.addFrame(1, 1, 2, 2, [2, 2, 2, 2], { delay: 10, disposal: 3 })
    // 왼쪽 위 한 칸을 파랑으로, 다음 프레임 전에 지움(2)
    writer.addFrame(0, 0, 1, 1, [3], { delay: 10, disposal: 2 })
    // 투명색(0)만 있는 빈 프레임
    writer.addFrame(3, 3, 1, 1, [0], { delay: 10, transparent: 0 })
    const bytes = buffer.slice(0, writer.end())

    const colors: string[][] = []
    visitGifFrames(bytes, ({ rgba }) => {
      const pick = (x: number, y: number) => {
        const i = (y * width + x) * 4
        return rgba[i + 3] === 0 ? '·' : rgba[i] ? 'R' : rgba[i + 1] ? 'G' : 'B'
      }
      colors.push([pick(0, 0), pick(1, 1), pick(3, 3)])
    })
    expect(colors).toEqual([
      ['R', 'R', 'R'],
      ['R', 'G', 'R'],
      // 처리 방식 3: 초록이 지워지고 빨강으로 돌아간 뒤 파랑을 그림
      ['B', 'R', 'R'],
      // 처리 방식 2: 파랑 자리가 투명해짐
      ['·', 'R', 'R'],
    ])
  })

  it('인터레이스 GIF의 줄 순서를 되돌린다', () => {
    const width = 3
    const height = 10
    const rowMap = interlaceRowMap(height)
    expect(Array.from(rowMap)).toEqual([0, 8, 4, 2, 6, 1, 3, 5, 7, 9])

    // 줄 번호 y를 색 번호 y % 4로 칠한 그림을 인터레이스 순서로 씁니다.
    const ordered = new Uint8Array(width * height)
    rowMap.forEach((y, row) =>
      ordered.fill(y % 4, row * width, row * width + width),
    )
    const palette = Uint8Array.from([0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255])
    const writer = new GifWriter({ width, height, palette })
    writer.addFrame(ordered, { delayCs: 10, interlaced: true })
    const decoded = decodeGif(writer.finish())
    const rgba = decoded.frames[0].rgba
    for (let y = 0; y < height; y += 1) {
      const i = y * width * 4
      expect([rgba[i], rgba[i + 1], rgba[i + 2]]).toEqual(
        Array.from(palette.subarray((y % 4) * 3, (y % 4) * 3 + 3)),
      )
    }
  })

  it('널리 쓰이는 10×10 예제 GIF를 푼다', () => {
    // "What's In A GIF" 예제 (흰·빨·파·검 4색)
    const bytes = Uint8Array.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x0a, 0x00, 0x0a, 0x00, 0x91, 0x00,
      0x00, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00,
      0x00, 0x21, 0xf9, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
      0x00, 0x00, 0x0a, 0x00, 0x0a, 0x00, 0x00, 0x02, 0x16, 0x8c, 0x2d, 0x99,
      0x87, 0x2a, 0x1c, 0xdc, 0x33, 0xa0, 0x02, 0x75, 0xec, 0x95, 0xfa, 0xa8,
      0xde, 0x60, 0x8c, 0x04, 0x91, 0x4c, 0x01, 0x00, 0x3b,
    ])
    const { frames } = decodeGif(bytes)
    const rows: string[] = []
    for (let y = 0; y < 10; y += 1) {
      let row = ''
      for (let x = 0; x < 10; x += 1) {
        const i = (y * 10 + x) * 4
        const [r, g, b] = frames[0].rgba.subarray(i, i + 3)
        row += r && g && b ? 'W' : r ? 'R' : b ? 'B' : 'K'
      }
      rows.push(row)
    }
    expect(rows).toEqual([
      'RRRRRBBBBB',
      'RRRRRBBBBB',
      'RRRRRBBBBB',
      'RRRWWWWBBB',
      'RRRWWWWBBB',
      'BBBWWWWRRR',
      'BBBWWWWRRR',
      'BBBBBRRRRR',
      'BBBBBRRRRR',
      'BBBBBRRRRR',
    ])
  })

  it('GIF가 아니거나 끊긴 파일은 알아보기 쉬운 오류를 낸다', () => {
    expect(() => decodeGif(new TextEncoder().encode('PNG....'))).toThrow(
      'GIF 파일이 아닙니다',
    )
    const { bytes } = encodeAnimation({
      width: 2,
      height: 2,
      frames: [{ rgba: solidFrame(2, 2, [9, 9, 9, 255]), delayMs: 100 }],
    })
    expect(() => decodeGif(bytes.slice(0, 20))).toThrow()
  })

  it('최대 크기를 넘는 GIF는 열지 않는다', () => {
    const { bytes } = encodeAnimation({
      width: 40,
      height: 2,
      frames: [{ rgba: solidFrame(40, 2, [9, 9, 9, 255]), delayMs: 100 }],
    })
    expect(() => decodeGif(bytes, { maxDimension: 32 })).toThrow('너무 큽니다')
  })
})
