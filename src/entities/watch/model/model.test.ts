import { DEFAULT_CONFIG, DIALS } from './config'
import { explodeOffset } from './explode'
import { handAngles, showcaseTime } from './time'

describe('시계 모델 설정', () => {
  it('기본 구성은 매트 블랙 다이얼, 스틸 케이스, 브레이슬릿, 스튜디오 조명이다', () => {
    expect(DEFAULT_CONFIG).toEqual({
      dial: 'black',
      case: 'steel',
      strap: 'bracelet',
      light: 'studio',
    })
    expect(Object.keys(DIALS)).toHaveLength(4)
  })

  it('10시 10분 32초의 핸즈 각도', () => {
    const angles = handAngles(showcaseTime())
    expect(angles.minute / (Math.PI * 2)).toBeCloseTo((10 + 32 / 60) / 60, 5)
    expect(angles.hour / (Math.PI * 2)).toBeCloseTo(
      (10 + (10 + 32 / 60) / 60) / 12,
      5,
    )
  })

  it('초침은 4Hz처럼 1/8초 단위로 끊어 움직인다', () => {
    const at = (ms: number) =>
      handAngles(new Date(2026, 0, 1, 0, 0, 0, ms)).second
    expect(at(120)).toBe(at(0))
    expect(at(130)).toBeGreaterThan(at(120))
  })

  it('분해 오프셋은 0에서 시작해 1에서 최대가 된다', () => {
    expect(explodeOffset('crystal', 0).z).toBe(0)
    expect(explodeOffset('crystal', 1).z).toBe(30)
    expect(explodeOffset('caseback', 1).z).toBeLessThan(
      explodeOffset('rotor', 1).z,
    )
    expect(explodeOffset('plate', 1).z).toBeLessThan(0)
    expect(explodeOffset('crown', 0.5).x).toBeLessThan(0)
    expect(explodeOffset('crystal', 2).z).toBe(30)
  })
})
