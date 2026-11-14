import { fitCanvas } from '@/shared/lib/canvas'
import { clamp, damp } from '@/shared/lib/math'

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas
type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
type Drawable = ImageBitmap | HTMLCanvasElement | OffscreenCanvas

export interface HeroSettings {
  /** 빛 덩어리가 마우스를 따라가는 빠르기 (초당 lambda) */
  follow: number
  /** 꼬리가 앞 점을 따라가는 빠르기. 작을수록 끈적하게 늘어집니다. */
  viscosity: number
  /** 빛 번짐 세기 */
  glow: number
}

/** 메인 스레드와 Worker가 주고받는 메시지 */
export type HeroMessage =
  | {
      type: 'init'
      canvas: OffscreenCanvas
      width: number
      height: number
      dpr: number
      settings: HeroSettings
      paused: boolean
    }
  | { type: 'resize'; width: number; height: number; dpr: number }
  | { type: 'progress'; progress: number; done: boolean }
  | { type: 'pointer'; x: number; y: number; active: boolean }
  | { type: 'title'; bitmap: ImageBitmap }
  | { type: 'paused'; paused: boolean }
  | { type: 'visible'; visible: boolean }
  | { type: 'settings'; settings: HeroSettings }

export type HeroReply = { type: 'fps'; fps: number; worstMs: number }

const TRAIL = 16
const CRIMSON = '210 51 80'
const EMBER = '255 122 144'

/** 로딩 링과 큰 제목이 놓이는 가운데 */
export function heroCenter(width: number, height: number) {
  const portrait = height > width * 1.1
  return { x: width / 2, y: height * (portrait ? 0.36 : 0.42), portrait }
}

/** 큰 제목 줄과 글자 크기. 넓은 화면은 한 줄, 좁은 화면은 두 줄로 놓습니다. */
export function titleLayout(width: number, height: number) {
  const { y, portrait } = heroCenter(width, height)
  const lines = portrait ? ['CRIMSON', 'ARC'] : ['CRIMSON ARC']
  // Chakra Petch 700 대문자의 평균 너비는 글자 크기의 약 0.66배입니다.
  const longest = Math.max(...lines.map((line) => line.length))
  const byWidth = (width * (portrait ? 0.86 : 0.9)) / (longest * 0.66)
  const fontSize = Math.min(byWidth, height * (portrait ? 0.2 : 0.3))
  const lineHeight = fontSize * 0.92
  return { lines, fontSize, lineHeight, centerY: y }
}

// 7세그먼트 숫자: 위(a), 오른쪽 위(b), 오른쪽 아래(c), 아래(d), 왼쪽 아래(e), 왼쪽 위(f), 가운데(g)
const DIGIT_SEGMENTS = [
  'abcdef',
  'bc',
  'abged',
  'abgcd',
  'fgbc',
  'afgcd',
  'afgedc',
  'abc',
  'abcdefg',
  'abcdfg',
] as const

/** 진행률(0~1)을 화면에 쓸 백분율 숫자로 바꿉니다. 100%는 모두 받았을 때만 보입니다. */
export function percentLabel(progress: number, done: boolean): string {
  const value = done ? 100 : Math.min(99, Math.floor(clamp(progress) * 100))
  return String(value).padStart(2, '0')
}

const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2

/**
 * 첫 화면 캔버스. 메인 스레드에서도, OffscreenCanvas를 넘겨받은 Worker에서도 같은 코드로 돕니다.
 * 1. 자료를 받는 동안: 회전 베젤처럼 눈금 60개와 크림슨 호가 차오르고 7세그먼트 숫자로 %를 보여 줍니다.
 * 2. 다 받으면: 링이 퍼지며 사라지고, 마우스를 lerp로 따라가는 빛 덩어리가 큰 제목 글자 안을 유체처럼 흐릅니다.
 */
export class HeroRenderer {
  settings: HeroSettings = { follow: 7, viscosity: 11, glow: 1 }
  private width = 1
  private height = 1
  private target = 0
  private shown = 0
  private done = false
  private intro = 0
  private time = 0
  private paused = false
  private sized = false
  private title: Drawable | null = null
  private readonly pointer = { x: 0, y: 0, active: false }
  private readonly trail = Array.from({ length: TRAIL }, () => ({ x: 0, y: 0 }))
  private readonly fluid: AnyCanvas
  private readonly fluidContext: Context2D | null
  private still = 0

  constructor(
    private readonly canvas: AnyCanvas,
    private readonly context: Context2D,
    createBuffer: () => AnyCanvas,
  ) {
    this.fluid = createBuffer()
    this.fluidContext = this.fluid.getContext('2d') as Context2D | null
  }

  resize(width: number, height: number, dpr: number): void {
    this.width = Math.max(1, width)
    this.height = Math.max(1, height)
    fitCanvas(this.canvas, this.context, {
      width: this.width,
      height: this.height,
      dpr,
    })
    if (this.fluidContext) {
      fitCanvas(this.fluid, this.fluidContext, {
        width: this.width,
        height: this.height,
        dpr,
      })
    }
    if (!this.sized) {
      const { x, y } = heroCenter(this.width, this.height)
      for (const point of this.trail) {
        point.x = x
        point.y = y
      }
      this.sized = true
    }
    this.still = 0
  }

  setProgress(progress: number, done: boolean): void {
    this.target = clamp(progress)
    this.done = done
    this.still = 0
  }

  setPointer(x: number, y: number, active: boolean): void {
    this.pointer.x = x
    this.pointer.y = y
    this.pointer.active = active
    this.still = 0
  }

  setPaused(paused: boolean): void {
    this.paused = paused
    this.still = 0
  }

  setSettings(settings: HeroSettings): void {
    this.settings = { ...settings }
    this.still = 0
  }

  setTitle(title: Drawable): void {
    if (this.title && 'close' in this.title) this.title.close()
    this.title = title
    this.still = 0
  }

  /** 한 프레임 나아가 그립니다. 움직임을 멈춘 채 화면이 변하지 않으면 그리지 않고 넘어갑니다. */
  frame(dt: number): void {
    this.time += this.paused ? 0 : dt
    this.shown = this.done
      ? damp(this.shown, 1, 5, dt)
      : damp(this.shown, this.target, 4, dt)
    if (this.done && this.shown > 0.985) {
      this.intro = clamp(this.intro + dt / (this.paused ? 0.01 : 1.1))
    }
    const moving = this.moveTrail(dt)
    const settled = this.intro >= 1 && !moving
    this.still = settled ? this.still + 1 : 0
    // 다 그린 정지 화면은 두 번 더 그린 뒤로는 쉬어 배터리를 아낍니다.
    if (this.still > 2) return
    this.draw()
  }

  private moveTrail(dt: number): boolean {
    const { x: cx, y: cy } = heroCenter(this.width, this.height)
    let tx = cx
    let ty = cy
    if (this.pointer.active) {
      tx = this.pointer.x
      ty = this.pointer.y
    } else if (!this.paused) {
      // 마우스가 없으면 제목 위를 8자로 천천히 떠돕니다.
      const t = this.time
      tx =
        cx +
        Math.cos(t * 0.42) * this.width * 0.3 +
        Math.sin(t * 1.1) * this.width * 0.04
      ty = cy + Math.sin(t * 0.84) * this.height * 0.12
    }
    let moved = 0
    const head = this.trail[0]!
    const nx = damp(head.x, tx, this.settings.follow, dt)
    const ny = damp(head.y, ty, this.settings.follow, dt)
    moved += Math.abs(nx - head.x) + Math.abs(ny - head.y)
    head.x = nx
    head.y = ny
    for (let i = 1; i < this.trail.length; i += 1) {
      const point = this.trail[i]!
      const previous = this.trail[i - 1]!
      const px = damp(point.x, previous.x, this.settings.viscosity, dt)
      const py = damp(point.y, previous.y, this.settings.viscosity, dt)
      moved += Math.abs(px - point.x) + Math.abs(py - point.y)
      point.x = px
      point.y = py
    }
    return moved > 0.05
  }

  private draw(): void {
    const { context: ctx, width, height } = this
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, width, height)
    if (this.intro < 1)
      this.drawLoader(1 - easeOut(this.intro), 1 + easeOut(this.intro) * 0.35)
    if (this.intro > 0) this.drawTitle(easeInOut(this.intro))
  }

  private drawLoader(alpha: number, scale: number): void {
    const { context: ctx, width, height } = this
    const { x, y, portrait } = heroCenter(width, height)
    const radius = Math.min(width, height) * (portrait ? 0.34 : 0.27) * scale
    const progress = this.shown
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(x, y)

    // 눈금 60개: 진행률만큼 밝힙니다. 5분마다 굵고 깁니다.
    for (let i = 0; i < 60; i += 1) {
      const angle = -Math.PI / 2 + (i / 60) * Math.PI * 2
      const major = i % 5 === 0
      const lit = i / 60 < progress
      const inner = radius * (major ? 0.86 : 0.9)
      ctx.strokeStyle = lit
        ? 'rgb(244 233 236 / 92%)'
        : 'rgb(255 255 255 / 16%)'
      ctx.lineWidth = major ? 2.4 : 1.2
      ctx.beginPath()
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      ctx.lineTo(
        Math.cos(angle) * radius * 0.96,
        Math.sin(angle) * radius * 0.96,
      )
      ctx.stroke()
    }

    // 크림슨 호: 12시에서 시계 방향으로 차오릅니다.
    ctx.lineCap = 'round'
    ctx.lineWidth = Math.max(3, radius * 0.035)
    ctx.strokeStyle = 'rgb(255 255 255 / 8%)'
    ctx.beginPath()
    ctx.arc(0, 0, radius * 1.06, 0, Math.PI * 2)
    ctx.stroke()
    if (progress > 0.002) {
      ctx.shadowColor = `rgb(${CRIMSON} / 90%)`
      ctx.shadowBlur = 24 * this.settings.glow
      ctx.strokeStyle = `rgb(${CRIMSON})`
      ctx.beginPath()
      ctx.arc(
        0,
        0,
        radius * 1.06,
        -Math.PI / 2,
        -Math.PI / 2 + progress * Math.PI * 2,
      )
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // 가운데 7세그먼트 숫자와 라벨
    const label = percentLabel(progress, this.done && progress > 0.985)
    const digitHeight = radius * 0.46
    const digitWidth = digitHeight * 0.54
    const gap = digitWidth * 0.32
    const total = label.length * digitWidth + (label.length - 1) * gap
    let left = -total / 2
    for (const char of label) {
      this.drawDigit(
        Number(char),
        left,
        -digitHeight * 0.62,
        digitWidth,
        digitHeight,
      )
      left += digitWidth + gap
    }
    ctx.fillStyle = 'rgb(244 233 236 / 72%)'
    ctx.font = `600 ${Math.max(10, radius * 0.07)}px ui-monospace, Menlo, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('LOADING  ·  %', 0, digitHeight * 0.62)
    ctx.restore()
  }

  private drawDigit(
    digit: number,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const ctx = this.context
    const t = Math.max(2, w * 0.17)
    const half = h / 2
    const lit = DIGIT_SEGMENTS[digit] ?? ''
    const bars: Record<string, [number, number, number, number]> = {
      a: [x + t * 0.6, y, w - t * 1.2, t],
      b: [x + w - t, y + t * 0.6, t, half - t * 0.9],
      c: [x + w - t, y + half + t * 0.3, t, half - t * 0.9],
      d: [x + t * 0.6, y + h - t, w - t * 1.2, t],
      e: [x, y + half + t * 0.3, t, half - t * 0.9],
      f: [x, y + t * 0.6, t, half - t * 0.9],
      g: [x + t * 0.6, y + half - t / 2, w - t * 1.2, t],
    }
    for (const [name, [bx, by, bw, bh]] of Object.entries(bars)) {
      const on = lit.includes(name)
      ctx.fillStyle = on ? `rgb(${EMBER})` : 'rgb(255 255 255 / 6%)'
      ctx.shadowColor = on ? `rgb(${CRIMSON} / 80%)` : 'transparent'
      ctx.shadowBlur = on ? 14 * this.settings.glow : 0
      ctx.fillRect(bx, by, bw, bh)
    }
    ctx.shadowBlur = 0
  }

  private drawTitle(alpha: number): void {
    const { context: ctx, width, height } = this
    const blob = Math.min(width, height) * 0.17
    const glow = this.settings.glow

    // 1. 글자 밖에도 은은하게 번지는 빛
    ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < this.trail.length; i += 3) {
      const point = this.trail[i]!
      const radius = blob * 2.2
      const gradient = ctx.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        radius,
      )
      gradient.addColorStop(0, `rgb(${CRIMSON} / ${0.16 * glow * alpha})`)
      gradient.addColorStop(1, `rgb(${CRIMSON} / 0)`)
      ctx.fillStyle = gradient
      ctx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2)
    }

    if (!this.title) return
    // 2. 어둡게 깔린 제목
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = alpha * 0.14
    ctx.drawImage(this.title, 0, 0, width, height)
    ctx.globalAlpha = 1

    // 3. 빛 덩어리를 따로 그린 뒤 제목 글자 모양으로 오려 냅니다(destination-in).
    const fluid = this.fluidContext
    if (!fluid) return
    fluid.globalCompositeOperation = 'source-over'
    fluid.clearRect(0, 0, width, height)
    fluid.globalCompositeOperation = 'lighter'
    this.trail.forEach((point, index) => {
      const fade = 1 - index / this.trail.length
      const radius = blob * (0.55 + fade * 0.6)
      const gradient = fluid.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        radius,
      )
      const hot = index < 2
      gradient.addColorStop(
        0,
        hot
          ? `rgb(255 240 242 / ${0.9 * glow})`
          : `rgb(${EMBER} / ${0.5 * fade * glow})`,
      )
      gradient.addColorStop(0.45, `rgb(${CRIMSON} / ${0.55 * fade * glow})`)
      gradient.addColorStop(1, `rgb(${CRIMSON} / 0)`)
      fluid.fillStyle = gradient
      fluid.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2)
    })
    fluid.globalCompositeOperation = 'destination-in'
    fluid.drawImage(this.title, 0, 0, width, height)

    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = alpha
    // fluid 버퍼는 기기 픽셀 크기이므로 CSS 크기로 줄여 그립니다.
    ctx.drawImage(
      this.fluid,
      0,
      0,
      this.fluid.width,
      this.fluid.height,
      0,
      0,
      width,
      height,
    )
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
}

/** Worker와 메인 스레드가 같은 방식으로 메시지를 렌더러에 적용합니다. */
export function applyHeroMessage(
  renderer: HeroRenderer,
  message: Exclude<HeroMessage, { type: 'init' } | { type: 'visible' }>,
): void {
  switch (message.type) {
    case 'resize':
      renderer.resize(message.width, message.height, message.dpr)
      break
    case 'progress':
      renderer.setProgress(message.progress, message.done)
      break
    case 'pointer':
      renderer.setPointer(message.x, message.y, message.active)
      break
    case 'title':
      renderer.setTitle(message.bitmap)
      break
    case 'paused':
      renderer.setPaused(message.paused)
      break
    case 'settings':
      renderer.setSettings(message.settings)
      break
  }
}

/** 큰 제목을 메인 스레드에서 글꼴로 그립니다. (Worker는 페이지 글꼴을 바로 쓰지 못합니다) */
export function paintTitle(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  fontFamily: string,
): void {
  const { lines, fontSize, lineHeight, centerY } = titleLayout(width, height)
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#ffffff'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = `700 ${fontSize}px ${fontFamily}`
  const top = centerY - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((line, index) => {
    context.fillText(line, width / 2, top + index * lineHeight, width * 0.94)
  })
}
