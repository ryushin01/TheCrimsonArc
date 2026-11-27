import { FpsMeter, drawFpsGraph } from './fps-meter'

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

  it('루프가 멈췄다 다시 돌면 쉬던 시간을 느린 프레임으로 세지 않는다', () => {
    const meter = new FpsMeter({ interval: 500 })
    let now = 0
    meter.tick(now)
    for (let i = 0; i < 40; i += 1) meter.tick((now += 1000 / 60))
    now += 20_000
    meter.tick(now)
    for (let i = 0; i < 40; i += 1) meter.tick((now += 1000 / 60))
    expect(meter.worstMs).toBeLessThan(20)
    expect(meter.fps).toBeGreaterThan(55)
  })
})

describe('drawFpsGraph', () => {
  /** 그리기 호출 이름을 차례로 모으는 가짜 2D 컨텍스트 */
  function recorder() {
    const calls: string[] = []
    const context = new Proxy(
      {},
      {
        get:
          (_, name) =>
          (...args: unknown[]) =>
            calls.push(`${String(name)}(${args.join(',')})`),
        set: (_, name, value) => {
          calls.push(`${String(name)}=${String(value)}`)
          return true
        },
      },
    )
    return { calls, context: context as CanvasRenderingContext2D }
  }

  it('기록이 둘 이상이면 60fps 기준선과 꺾은선·채움, 이름표를 그린다', () => {
    const { calls, context } = recorder()
    drawFpsGraph(context, [30, 60, 90], 100, 40, { label: '60 fps' })
    expect(calls).toContain('fill()')
    expect(calls).toContain('fillText(60 fps,4,3)')
    // 72fps보다 큰 값은 위쪽 끝(2px)에 그립니다.
    expect(calls).toContain('lineTo(100,2)')
  })

  it('기록이 하나뿐이고 이름표가 없으면 기준선만 그린다', () => {
    const { calls, context } = recorder()
    drawFpsGraph(context, [60], 100, 40)
    expect(calls).not.toContain('fill()')
    expect(calls.some((call) => call.startsWith('fillText'))).toBe(false)
    expect(calls.filter((call) => call === 'stroke()')).toHaveLength(1)
  })
})
