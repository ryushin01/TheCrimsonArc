/** requestAnimationFrame을 쓸 수 없는 곳(일부 Worker)을 위해 바꿔 끼울 수 있게 둡니다. */
export interface FrameScheduler {
  request(callback: (now: number) => void): number
  cancel(id: number): void
}

export interface FrameLoop {
  start(): void
  stop(): void
  readonly running: boolean
}

/** 창과 Worker 모두에서 쓰는 기본 스케줄러. requestAnimationFrame이 없으면 16ms 타이머로 대신합니다. */
export function defaultScheduler(): FrameScheduler {
  const scope = globalThis as typeof globalThis & {
    requestAnimationFrame?: (callback: FrameRequestCallback) => number
    cancelAnimationFrame?: (id: number) => void
  }
  if (typeof scope.requestAnimationFrame === 'function') {
    return {
      request: (callback) => scope.requestAnimationFrame!(callback),
      cancel: (id) => scope.cancelAnimationFrame?.(id),
    }
  }
  return {
    request: (callback) =>
      setTimeout(() => callback(performance.now()), 16) as unknown as number,
    cancel: (id) => clearTimeout(id),
  }
}

/**
 * 매 프레임 tick(dt초, 지금 시각ms)을 부르는 루프.
 * stop()은 cancelAnimationFrame으로 예약된 프레임까지 지워, 컴포넌트가 사라진 뒤 그리지 않게 합니다.
 * 탭을 오래 숨겼다 돌아오면 dt가 커져 튀므로 0.1초로 자릅니다.
 */
export function createFrameLoop(
  tick: (dt: number, now: number) => void,
  scheduler: FrameScheduler = defaultScheduler(),
): FrameLoop {
  let id = 0
  let last = 0
  let running = false

  const frame = (now: number) => {
    if (!running) return
    const dt = last ? Math.min(0.1, Math.max(0, (now - last) / 1000)) : 1 / 60
    last = now
    // 다음 프레임을 먼저 예약해 tick 안에서 stop()을 불러도 올바르게 멈춥니다.
    id = scheduler.request(frame)
    tick(dt, now)
  }

  return {
    start() {
      if (running) return
      running = true
      last = 0
      id = scheduler.request(frame)
    },
    stop() {
      if (!running) return
      running = false
      scheduler.cancel(id)
      id = 0
    },
    get running() {
      return running
    },
  }
}
