import { ParticleField } from './field'
import { DEFAULT_FORCES } from './particle'

describe('ParticleField', () => {
  it('수를 늘리고 줄이며, 소수·음수는 정수·0으로 맞춘다', () => {
    const field = new ParticleField(10, 100, 50)
    expect(field.count).toBe(10)
    field.setCount(4.7)
    expect(field.count).toBe(4)
    field.setCount(-3)
    expect(field.count).toBe(0)
  })

  it('모양을 정하면 입자가 그 점으로 모여들고, 새로 생긴 입자도 모양을 따른다', () => {
    const field = new ParticleField(2, 100, 50)
    field.setShape(new Float32Array([10, 20, 30, 40]))
    const targets = () =>
      field.particles.map((particle) => [particle.tx, particle.ty])
    expect(targets()).toEqual(
      expect.arrayContaining([
        [10, 20],
        [30, 40],
      ]),
    )
    field.setCount(3)
    expect(field.particles).toHaveLength(3)

    field.resize(200, 100)
    field.burst(4)
    expect(field.particles.some((p) => p.vx !== 0 || p.vy !== 0)).toBe(true)
    const before = field.particles.map((p) => p.x)
    field.update({ x: 0, y: 0, active: false }, DEFAULT_FORCES)
    expect(field.particles.map((p) => p.x)).not.toEqual(before)
  })

  it('색마다 한 경로로 모아 채운다', () => {
    const field = new ParticleField(20, 100, 50)
    const calls: string[] = []
    const context = {
      fillStyle: '',
      beginPath: () => calls.push('begin'),
      rect: () => calls.push('rect'),
      fill() {
        calls.push(`fill ${this.fillStyle}`)
      },
    }
    field.draw(context as unknown as CanvasRenderingContext2D, [
      '#8b0000',
      '#eeebe6',
    ])
    expect(calls.filter((call) => call === 'begin')).toHaveLength(2)
    expect(calls.filter((call) => call === 'rect')).toHaveLength(20)
    expect(calls.filter((call) => call.startsWith('fill '))).toEqual([
      'fill #8b0000',
      'fill #eeebe6',
    ])
  })
})
