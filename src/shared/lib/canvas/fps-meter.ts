/**
 * 프레임마다 tick(now)을 불러 평균 FPS와 프레임 시간을 잽니다.
 * 평균은 interval(ms)마다 새로 계산하고, 최근 값은 history에 돌려 담아 그래프로 그립니다.
 */
export class FpsMeter {
  readonly history: Float32Array
  fps = 0
  /** 가장 느렸던 프레임 시간(ms, 최근 구간) */
  worstMs = 0
  private cursor = 0
  private filled = 0
  private frames = 0
  private windowStart = -1
  private last = -1
  private worstInWindow = 0
  private readonly interval: number

  constructor({ samples = 60, interval = 500 } = {}) {
    this.history = new Float32Array(samples)
    this.interval = interval
  }

  tick(now: number): void {
    if (this.windowStart < 0) {
      this.windowStart = now
      this.last = now
      return
    }
    this.worstInWindow = Math.max(this.worstInWindow, now - this.last)
    this.last = now
    this.frames += 1
    const elapsed = now - this.windowStart
    if (elapsed < this.interval) return
    this.push((this.frames * 1000) / elapsed, this.worstInWindow)
    this.frames = 0
    this.worstInWindow = 0
    this.windowStart = now
  }

  /** 다른 곳(Worker 등)에서 잰 값을 그대로 넣습니다. */
  push(fps: number, worstMs = 0): void {
    this.fps = fps
    this.worstMs = worstMs
    this.history[this.cursor] = fps
    this.cursor = (this.cursor + 1) % this.history.length
    this.filled = Math.min(this.history.length, this.filled + 1)
  }

  /** 오래된 것부터 순서대로 */
  values(): number[] {
    const out: number[] = []
    const start = this.filled < this.history.length ? 0 : this.cursor
    for (let i = 0; i < this.filled; i += 1) {
      out.push(this.history[(start + i) % this.history.length]!)
    }
    return out
  }

  reset(): void {
    this.history.fill(0)
    this.cursor = 0
    this.filled = 0
    this.frames = 0
    this.windowStart = -1
    this.fps = 0
    this.worstMs = 0
  }
}

export interface FpsGraphStyle {
  line: string
  fill: string
  guide: string
  text: string
  font: string
}

const DEFAULT_STYLE: FpsGraphStyle = {
  line: '#ff7a90',
  fill: 'rgb(255 122 144 / 18%)',
  guide: 'rgb(255 255 255 / 22%)',
  text: '#f4e9ec',
  font: '11px ui-monospace, monospace',
}

/** FPS 기록을 막대 대신 꺾은선으로 그립니다. 60fps 기준선을 함께 긋습니다. */
export function drawFpsGraph(
  context: CanvasRenderingContext2D,
  values: readonly number[],
  width: number,
  height: number,
  { max = 72, label = '', style = DEFAULT_STYLE } = {},
): void {
  context.clearRect(0, 0, width, height)
  const y = (fps: number) =>
    height - (Math.min(fps, max) / max) * (height - 4) - 2
  context.strokeStyle = style.guide
  context.lineWidth = 1
  context.setLineDash([3, 3])
  context.beginPath()
  context.moveTo(0, y(60))
  context.lineTo(width, y(60))
  context.stroke()
  context.setLineDash([])
  if (values.length > 1) {
    const step = width / (values.length - 1)
    context.beginPath()
    values.forEach((fps, index) => {
      const x = index * step
      if (index === 0) context.moveTo(x, y(fps))
      else context.lineTo(x, y(fps))
    })
    context.strokeStyle = style.line
    context.lineWidth = 1.5
    context.stroke()
    context.lineTo(width, height)
    context.lineTo(0, height)
    context.closePath()
    context.fillStyle = style.fill
    context.fill()
  }
  if (label) {
    context.fillStyle = style.text
    context.font = style.font
    context.textBaseline = 'top'
    context.fillText(label, 4, 3)
  }
}
