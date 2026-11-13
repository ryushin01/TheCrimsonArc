import { fitCanvas, getDpr } from './canvas'
import { type FrameScheduler, createFrameLoop } from './loop'

function fakeContext() {
  return {
    setTransform: vi.fn(),
    scale: vi.fn(),
  } as unknown as CanvasRenderingContext2D
}

describe('fitCanvas', () => {
  it('픽셀 크기를 CSS 크기 × 배율로 맞추고 배율을 한 번만 건다', () => {
    const canvas = { width: 300, height: 150 } as HTMLCanvasElement
    const context = fakeContext()
    fitCanvas(canvas, context, { width: 400, height: 200, dpr: 2 })
    fitCanvas(canvas, context, { width: 400, height: 200, dpr: 2 })
    expect(canvas.width).toBe(800)
    expect(canvas.height).toBe(400)
    // 다시 맞출 때마다 변환을 되돌린 뒤 scale하므로 배율이 곱해지지 않습니다.
    expect(context.setTransform).toHaveBeenCalledTimes(2)
    expect(context.setTransform).toHaveBeenLastCalledWith(1, 0, 0, 1, 0, 0)
    expect(context.scale).toHaveBeenLastCalledWith(2, 2)
  })

  it('크기가 0이어도 1픽셀 캔버스를 만든다', () => {
    const canvas = { width: 300, height: 150 } as HTMLCanvasElement
    fitCanvas(canvas, fakeContext(), { width: 0, height: 0, dpr: 3 })
    expect(canvas.width).toBe(1)
    expect(canvas.height).toBe(1)
  })
})

describe('getDpr', () => {
  it('기기 배율을 1 이상, max 이하로 자른다', () => {
    const original = window.devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 3,
      configurable: true,
    })
    expect(getDpr(2)).toBe(2)
    expect(getDpr(4)).toBe(3)
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 0.5,
      configurable: true,
    })
    expect(getDpr()).toBe(1)
    Object.defineProperty(window, 'devicePixelRatio', {
      value: original,
      configurable: true,
    })
  })
})

describe('createFrameLoop', () => {
  function manualScheduler() {
    const queue = new Map<number, (now: number) => void>()
    let next = 1
    const scheduler: FrameScheduler = {
      request(callback) {
        queue.set(next, callback)
        return next++
      },
      cancel(id) {
        queue.delete(id)
      },
    }
    const flush = (now: number) => {
      const callbacks = [...queue.values()]
      queue.clear()
      for (const callback of callbacks) callback(now)
    }
    return { scheduler, flush, pending: () => queue.size }
  }

  it('프레임마다 dt를 넘기고 0.1초에서 자른다', () => {
    const { scheduler, flush } = manualScheduler()
    const tick = vi.fn()
    const loop = createFrameLoop(tick, scheduler)
    loop.start()
    flush(1000)
    flush(1016)
    flush(5000)
    expect(tick).toHaveBeenCalledTimes(3)
    expect(tick.mock.calls[1]?.[0]).toBeCloseTo(0.016, 3)
    expect(tick.mock.calls[2]?.[0]).toBe(0.1)
  })

  it('stop()하면 예약한 프레임까지 취소한다', () => {
    const { scheduler, flush, pending } = manualScheduler()
    const tick = vi.fn()
    const loop = createFrameLoop(tick, scheduler)
    loop.start()
    expect(pending()).toBe(1)
    loop.stop()
    expect(pending()).toBe(0)
    flush(16)
    expect(tick).not.toHaveBeenCalled()
    expect(loop.running).toBe(false)
  })
})
