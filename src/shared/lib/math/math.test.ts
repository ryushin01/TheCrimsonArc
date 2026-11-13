import {
  bell,
  clamp,
  damp,
  inverseLerp,
  lerp,
  mapRange,
  smoothstep,
} from './math'

describe('math', () => {
  it('clamp는 범위를 벗어난 값을 자른다', () => {
    expect(clamp(-1)).toBe(0)
    expect(clamp(2)).toBe(1)
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('lerp와 inverseLerp는 서로 역관계다', () => {
    expect(lerp(10, 20, 0.25)).toBe(12.5)
    expect(inverseLerp(10, 20, 12.5)).toBe(0.25)
    expect(inverseLerp(3, 3, 3)).toBe(0)
  })

  it('mapRange는 범위를 옮기고 기본으로 자른다', () => {
    expect(mapRange(5, 0, 10, 100, 200)).toBe(150)
    expect(mapRange(20, 0, 10, 100, 200)).toBe(200)
    expect(mapRange(20, 0, 10, 100, 200, false)).toBe(300)
  })

  it('damp는 프레임을 나눠도 같은 곳에 도달한다', () => {
    const once = damp(0, 1, 5, 0.1)
    let split = 0
    for (let i = 0; i < 10; i += 1) split = damp(split, 1, 5, 0.01)
    expect(split).toBeCloseTo(once, 10)
    expect(once).toBeGreaterThan(0)
    expect(once).toBeLessThan(1)
  })

  it('smoothstep과 bell은 0~1 사이 곡선이다', () => {
    expect(smoothstep(0, 1, -1)).toBe(0)
    expect(smoothstep(0, 1, 0.5)).toBe(0.5)
    expect(smoothstep(0, 1, 2)).toBe(1)
    expect(bell(0.5, 0, 0.2, 0.8, 1)).toBe(1)
    expect(bell(0, 0, 0.2, 0.8, 1)).toBe(0)
    expect(bell(1, 0, 0.2, 0.8, 1)).toBe(0)
  })
})
