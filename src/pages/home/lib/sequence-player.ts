import { clamp, damp } from '@/shared/lib/math'

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
type Frame = CanvasImageSource | null

export interface Bracket {
  lower: number
  upper: number
  /** lower에서 upper 쪽으로 얼마나 갔는지 0~1 */
  t: number
}

/** position을 사이에 둔, 받아 둔 프레임 두 장을 찾습니다. 하나도 없으면 null. */
export function bracketFrames(
  frames: readonly Frame[],
  position: number,
): Bracket | null {
  const last = frames.length - 1
  if (last < 0) return null
  const at = clamp(position, 0, last)
  let lower = Math.floor(at)
  while (lower >= 0 && !frames[lower]) lower -= 1
  let upper = Math.ceil(at)
  while (upper <= last && !frames[upper]) upper += 1
  if (lower < 0 && upper > last) return null
  if (lower < 0) return { lower: upper, upper, t: 0 }
  if (upper > last) return { lower, upper: lower, t: 0 }
  const t = upper === lower ? 0 : (at - lower) / (upper - lower)
  return { lower, upper, t }
}

/**
 * 스크롤 진행도로 이미지 시퀀스를 그립니다.
 * 스크롤 위치(target)를 lerp로 따라가므로 휠을 툭툭 굴려도 프레임이 부드럽게 넘어가고,
 * 소수 위치에서는 이웃 프레임을 겹쳐 그려(crossfade) 각도 사이를 메웁니다.
 */
export class SequencePlayer {
  position = 0
  private target = 0
  private lastTarget = 0
  private idle = 0
  private drawn = ''

  constructor(private readonly frames: readonly Frame[]) {}

  get frameCount(): number {
    return this.frames.length
  }

  setProgress(progress: number): void {
    this.target = clamp(progress) * Math.max(0, this.frames.length - 1)
  }

  /**
   * speed는 초당 lambda입니다. snap이면 바로 목표로 갑니다. (동작 줄이기)
   * 스크롤이 멈추면 가장 가까운 받은 프레임에 내려앉아, 두 장을 겹친 흐릿한 그림으로 머물지 않게 합니다.
   */
  update(dt: number, speed: number, snap = false): void {
    this.idle =
      Math.abs(this.target - this.lastTarget) < 1e-4 ? this.idle + dt : 0
    this.lastTarget = this.target
    const goal = this.idle > 0.15 ? this.nearestFrame(this.target) : this.target
    this.position = snap ? goal : damp(this.position, goal, speed, dt)
    if (Math.abs(this.position - goal) < 0.002) this.position = goal
  }

  private nearestFrame(position: number): number {
    const bracket = bracketFrames(this.frames, position)
    if (!bracket) return position
    return bracket.t < 0.5 ? bracket.lower : bracket.upper
  }

  /** 다시 그려야 하면 그리고 true. 같은 그림이면 건너뜁니다. */
  draw(
    context: Context2D,
    width: number,
    height: number,
    { crossfade = true, size = Math.min(width, height), force = false } = {},
  ): boolean {
    const bracket = bracketFrames(this.frames, this.position)
    const key = bracket
      ? `${bracket.lower}:${bracket.upper}:${crossfade ? bracket.t.toFixed(3) : Math.round(bracket.t)}:${width}x${height}:${size}`
      : `none:${width}x${height}`
    if (!force && key === this.drawn) return false
    this.drawn = key
    context.clearRect(0, 0, width, height)
    if (!bracket) return true
    const x = (width - size) / 2
    const y = (height - size) / 2
    const { lower, upper, t } = bracket
    if (!crossfade || upper === lower) {
      const frame = this.frames[t < 0.5 ? lower : upper]
      if (frame) context.drawImage(frame, x, y, size, size)
      return true
    }
    const a = this.frames[lower]
    const b = this.frames[upper]
    if (a) context.drawImage(a, x, y, size, size)
    if (b && t > 0.01) {
      context.globalAlpha = t
      context.drawImage(b, x, y, size, size)
      context.globalAlpha = 1
    }
    return true
  }

  /** 다음 draw()가 꼭 다시 그리게 합니다. (새 프레임이 들어왔을 때) */
  invalidate(): void {
    this.drawn = ''
  }
}
