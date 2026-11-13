import { FpsMeter } from './fps-meter'

describe('FpsMeter', () => {
  it('구간마다 평균 FPS와 가장 느린 프레임을 잰다', () => {
    const meter = new FpsMeter({ interval: 500 })
    let now = 0
    meter.tick(now)
    for (let i = 0; i < 30; i += 1) {
      now += i === 10 ? 50 : 1000 / 60
      meter.tick(now)
    }
    expect(meter.fps).toBeGreaterThan(50)
    expect(meter.fps).toBeLessThan(60)
    expect(meter.worstMs).toBe(50)
  })

  it('기록은 오래된 것부터 돌려준다', () => {
    const meter = new FpsMeter({ samples: 3 })
    meter.push(10)
    meter.push(20)
    meter.push(30)
    meter.push(40)
    expect(meter.values()).toEqual([20, 30, 40])
    meter.reset()
    expect(meter.values()).toEqual([])
  })
})
