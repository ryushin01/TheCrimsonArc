import { ParticleField } from './field'
import { DEFAULT_FORCES, Particle } from './particle'
import { pickTargets, samplePoints } from './sample'

const away = { x: 0, y: 0, active: false }

describe('Particle', () => {
  it('마우스 반경 안이면 거리 반대쪽으로 밀려난다', () => {
    const particle = new Particle(110, 100)
    particle.update({ x: 100, y: 100, active: true }, DEFAULT_FORCES)
    expect(particle.vx).toBeGreaterThan(0)
    expect(particle.x).toBeGreaterThan(110)
    expect(Math.abs(particle.vy)).toBeLessThan(1e-9)
  })

  it('반경 밖이면 밀리지 않는다', () => {
    const particle = new Particle(400, 100)
    particle.update({ x: 100, y: 100, active: true }, DEFAULT_FORCES)
    expect(particle.x).toBe(400)
  })

  it('복원력으로 목표점에 돌아가 멈춘다', () => {
    const particle = new Particle(0, 0)
    particle.setTarget(50, -20)
    for (let i = 0; i < 400; i += 1) particle.update(away, DEFAULT_FORCES)
    expect(particle.x).toBeCloseTo(50, 1)
    expect(particle.y).toBeCloseTo(-20, 1)
  })

  it('프레임 간격(step)이 달라도 비슷한 곳에 이른다', () => {
    const a = new Particle(0, 0)
    const b = new Particle(0, 0)
    a.setTarget(100, 0)
    b.setTarget(100, 0)
    for (let i = 0; i < 120; i += 1) a.update(away, DEFAULT_FORCES, 1)
    for (let i = 0; i < 60; i += 1) b.update(away, DEFAULT_FORCES, 2)
    expect(Math.abs(a.x - b.x)).toBeLessThan(6)
  })
})

describe('samplePoints · pickTargets', () => {
  it('알파가 기준 이상인 픽셀만 간격마다 고른다', () => {
    const width = 4
    const height = 2
    const data = new Uint8ClampedArray(width * height * 4)
    data[(0 * width + 2) * 4 + 3] = 255
    data[(1 * width + 0) * 4 + 3] = 40
    expect([...samplePoints(data, width, height, { step: 1 })]).toEqual([2, 0])
    expect([...samplePoints(data, width, height, { step: 2 })]).toEqual([2, 0])
    expect(
      samplePoints(data, width, height, { step: 1, threshold: 30 }).length,
    ).toBe(4)
  })

  it('밝기 기준을 주면 어두운 픽셀은 뺀다', () => {
    const data = Uint8ClampedArray.from([250, 250, 250, 255, 20, 20, 20, 255])
    expect([
      ...samplePoints(data, 2, 1, { step: 1, minLuminance: 120 }),
    ]).toEqual([0, 0])
  })

  it('점이 넉넉하면 겹치지 않게 고른다', () => {
    const points = Float32Array.from([0, 0, 1, 1, 2, 2, 3, 3])
    const picked = pickTargets(points, 3)
    const xs = new Set([picked[0], picked[2], picked[4]])
    expect(xs.size).toBe(3)
  })

  it('점이 모자라면 돌려 쓰고, 점이 없으면 원점에 모은다', () => {
    const points = Float32Array.from([10, 10])
    expect(pickTargets(points, 3, { jitter: 0 })).toEqual(
      Float32Array.from([10, 10, 10, 10, 10, 10]),
    )
    expect(pickTargets(new Float32Array(0), 2)).toEqual(new Float32Array(4))
  })
})

describe('ParticleField', () => {
  it('수를 늘리고 줄여도 모양의 목표점을 다시 나눠 준다', () => {
    const field = new ParticleField(10, 200, 100)
    field.setShape(Float32Array.from([5, 5, 6, 6]))
    field.setCount(20)
    expect(field.count).toBe(20)
    expect(
      field.particles.every((particle) => particle.tx >= 3 && particle.tx <= 8),
    ).toBe(true)
    field.setCount(4)
    expect(field.count).toBe(4)
  })
})
