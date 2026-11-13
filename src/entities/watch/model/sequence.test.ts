import {
  SEQUENCE_FRAMES,
  TURN_FRAMES,
  frameState,
  pickSequenceSize,
  sequenceFrameUrl,
  sequenceSource,
} from './sequence'

describe('시퀀스 프레임', () => {
  it('앞쪽은 한 바퀴 돌고 분해하지 않는다', () => {
    expect(frameState(0)).toMatchObject({ rotationY: 0, explode: 0 })
    expect(frameState(TURN_FRAMES / 2).rotationY).toBeCloseTo(Math.PI, 5)
  })

  it('마지막 프레임은 완전히 분해된 3/4 각도다', () => {
    const last = frameState(SEQUENCE_FRAMES - 1)
    expect(last.explode).toBe(1)
    expect(last.rotationY).toBeLessThan(-0.9)
    expect(frameState(TURN_FRAMES).explode).toBe(0)
  })
})

describe('시퀀스 파일', () => {
  it('세 자리 번호와 크기·형식으로 주소를 만든다', () => {
    expect(sequenceFrameUrl(7, 'lg', 'avif', '/base/')).toBe(
      '/base/sequence/lg/007.avif',
    )
  })

  it('그릴 크기와 배율이 크면 큰 프레임을 고른다', () => {
    expect(pickSequenceSize(360, 1)).toBe('sm')
    expect(pickSequenceSize(360, 3)).toBe('lg')
    expect(pickSequenceSize(900, 1)).toBe('lg')
  })
})

describe('sequenceSource', () => {
  it('AVIF를 읽으면 크기에 맞는 AVIF, 못 읽으면 작은 WebP', () => {
    expect(sequenceSource(true, 900, 1)).toEqual({ size: 'lg', format: 'avif' })
    expect(sequenceSource(true, 360, 1)).toEqual({ size: 'sm', format: 'avif' })
    expect(sequenceSource(false, 900, 2)).toEqual({
      size: 'sm',
      format: 'webp',
    })
  })
})
