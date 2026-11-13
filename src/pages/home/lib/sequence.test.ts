import { SequencePlayer, bracketFrames } from './sequence-player'
import {
  keyFrameIndices,
  restFrameIndices,
  sequenceDrawSize,
} from './sequence-frames'

const img = {} as CanvasImageSource

describe('keyFrameIndices', () => {
  it('간격마다 고르고 마지막 프레임을 꼭 넣는다', () => {
    expect(keyFrameIndices(10, 4)).toEqual([0, 4, 8, 9])
    expect(keyFrameIndices(9, 4)).toEqual([0, 4, 8])
    // 나머지는 간격을 반씩 좁혀 가며 받습니다.
    expect(restFrameIndices(10, 4)).toEqual([2, 6, 1, 3, 5, 7])
    expect(restFrameIndices(17, 8).slice(0, 2)).toEqual([4, 12])
  })
})

describe('sequenceDrawSize', () => {
  it('가로 화면은 높이, 세로 화면은 폭보다 조금 크게', () => {
    expect(sequenceDrawSize(1440, 900)).toBe(900)
    expect(sequenceDrawSize(390, 844)).toBeCloseTo(499.2)
    // 분해 구간에서는 세로 화면도 폭에 맞춰 부품이 잘리지 않게 합니다.
    expect(sequenceDrawSize(390, 844, 1)).toBeCloseTo(390 * 0.98)
  })
})

describe('bracketFrames', () => {
  it('받은 프레임 사이의 위치를 찾는다', () => {
    const frames = [img, null, null, null, img]
    expect(bracketFrames(frames, 1)).toEqual({ lower: 0, upper: 4, t: 0.25 })
    expect(bracketFrames(frames, 4)).toEqual({ lower: 4, upper: 4, t: 0 })
  })

  it('한쪽에만 있으면 그 프레임을, 하나도 없으면 null', () => {
    expect(bracketFrames([null, null, img], 0)).toEqual({
      lower: 2,
      upper: 2,
      t: 0,
    })
    expect(bracketFrames([img, null, null], 2)).toEqual({
      lower: 0,
      upper: 0,
      t: 0,
    })
    expect(bracketFrames([null, null], 1)).toBeNull()
  })
})

describe('SequencePlayer', () => {
  function fakeContext() {
    return {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D
  }

  it('스크롤 진행도를 lerp로 따라가고 같은 그림은 다시 그리지 않는다', () => {
    const player = new SequencePlayer([img, img, img, img, img])
    player.setProgress(1)
    player.update(1 / 60, 9)
    expect(player.position).toBeGreaterThan(0)
    expect(player.position).toBeLessThan(4)
    player.update(0, 9, true)
    expect(player.position).toBe(4)
    const context = fakeContext()
    expect(player.draw(context, 100, 100)).toBe(true)
    expect(player.draw(context, 100, 100)).toBe(false)
    player.invalidate()
    expect(player.draw(context, 100, 100)).toBe(true)
  })

  it('스크롤이 멈추면 가장 가까운 받은 프레임에 내려앉는다', () => {
    const player = new SequencePlayer([img, null, null, null, img])
    player.setProgress(0.3)
    player.update(0, 9, true)
    expect(player.position).toBeCloseTo(1.2)
    for (let i = 0; i < 30; i += 1) player.update(1 / 60, 9, true)
    expect(player.position).toBe(0)
  })

  it('소수 위치에서는 두 프레임을 겹쳐 그린다', () => {
    const player = new SequencePlayer([img, img])
    player.setProgress(0.5)
    player.update(0, 9, true)
    const context = fakeContext()
    player.draw(context, 200, 100)
    expect(context.drawImage).toHaveBeenCalledTimes(2)
    expect(context.drawImage).toHaveBeenCalledWith(img, 50, 0, 100, 100)
  })
})
