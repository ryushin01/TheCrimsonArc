import { defaultTuning, resetTuning, tuning, tuningEvents } from './tuning'

describe('tuning', () => {
  it('좁은 화면은 입자를 적게 쓴다', () => {
    expect(defaultTuning(true).particles.count).toBeLessThan(
      defaultTuning(false).particles.count,
    )
  })

  it('되돌리면 기본값으로 돌아가고 구독자에게 알린다', () => {
    const listener = vi.fn()
    const off = tuningEvents.subscribe(listener)
    tuning.particles.radius = 10
    tuning.sequence.crossfade = false
    resetTuning()
    expect(tuning.particles.radius).toBe(defaultTuning().particles.radius)
    expect(tuning.sequence.crossfade).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)
    off()
  })
})
