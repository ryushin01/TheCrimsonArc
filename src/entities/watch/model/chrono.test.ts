import { describe, expect, it } from 'vitest'
import {
  chronoAngles,
  chronoElapsed,
  formatChrono,
  frozenChrono,
  resetChrono,
  syncedChrono,
  toggleChrono,
} from './chrono'
import { handAngles, showcaseTime } from './time'

describe('크로노그래프', () => {
  it('처음 모습은 지금 시각의 초침·30분 적산계와 같다', () => {
    const date = new Date(2026, 10, 16, 14, 47, 21, 625)
    const chrono = syncedChrono(date, 5_000)
    const angles = chronoAngles(chronoElapsed(chrono, 5_000))
    const clock = handAngles(date)
    expect(angles.second).toBeCloseTo(clock.second, 6)
    expect(angles.counter).toBeCloseTo(clock.counter, 6)
  })

  it('2시 푸셔로 멈추면 잰 시간이 멈추고, 다시 누르면 이어서 잰다', () => {
    const start = { running: true, elapsedMs: 0, since: 1_000 }
    const stopped = toggleChrono(start, 6_000)
    expect(stopped.running).toBe(false)
    expect(chronoElapsed(stopped, 60_000)).toBe(5_000)
    const resumed = toggleChrono(stopped, 70_000)
    expect(chronoElapsed(resumed, 72_000)).toBe(7_000)
  })

  it('4시 푸셔는 멈춰 있으면 0에 두고, 도는 중이면 0에서 다시 잰다(플라이백)', () => {
    const stopped = { running: false, elapsedMs: 42_000, since: 0 }
    const reset = resetChrono(stopped, 10_000)
    expect(reset.running).toBe(false)
    expect(chronoElapsed(reset, 99_000)).toBe(0)

    const running = { running: true, elapsedMs: 42_000, since: 0 }
    const flyback = resetChrono(running, 10_000)
    expect(flyback.running).toBe(true)
    expect(chronoElapsed(flyback, 13_000)).toBe(3_000)
  })

  it('초침은 1/8초씩 끊어 가고 적산계는 30분에 한 바퀴 돈다', () => {
    expect(chronoAngles(15_000).second).toBeCloseTo(Math.PI / 2)
    expect(chronoAngles(15_100).second).toBeCloseTo(Math.PI / 2)
    expect(chronoAngles(15 * 60_000).counter).toBeCloseTo(Math.PI)
    expect(chronoAngles(0)).toEqual({ second: 0, counter: 0 })
  })

  it('움직임을 멈췄을 때는 제품 사진 시각(10시 10분 32초)에 멈춰 있다', () => {
    const frozen = frozenChrono(showcaseTime())
    expect(frozen.running).toBe(false)
    expect(chronoElapsed(frozen, performance.now())).toBe((10 * 60 + 32) * 1000)
  })

  it('시작한 뒤로는 단조 시계로 재서, 시스템 시계를 뒤로 맞춰도 영향이 없다', () => {
    // since·now는 performance.now() 기준이라 Date(벽시계)와 상관이 없습니다.
    const chrono = syncedChrono(new Date(2026, 10, 16, 14, 0, 0, 0), 1_000)
    expect(chronoElapsed(chrono, 6_000)).toBe(5_000)
    expect(chronoElapsed(chrono, 11_000)).toBe(10_000)
  })

  it('잰 시간을 분·초로 읽어 준다', () => {
    expect(formatChrono(3_400)).toBe('3초')
    expect(formatChrono((12 * 60 + 5) * 1000)).toBe('12분 5초')
  })
})
