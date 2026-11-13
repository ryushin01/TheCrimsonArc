import { ParticleField, shapePoints } from '@/shared/lib/particles'
import type { DetailStep } from '../model/content'
import { tuning } from '../model/tuning'

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

/** 은빛이 대부분이고 크림슨이 열에 두 개꼴로 섞이도록 앞쪽 색을 더 자주 씁니다. (seed² 분포) */
export const PARTICLE_PALETTE = [
  '#f4f1ea',
  '#e4dfd8',
  '#cfc9c2',
  '#b8b2ac',
  '#ff5470',
  '#a3183a',
] as const

const FONT = '"Chakra Petch", "Arial Narrow", sans-serif'

/** 시계 정면 프레임에서 밝은 부분(케이스·브레이슬릿·인덱스·핸즈)만 점으로 고릅니다. */
export function silhouettePoints(
  image: CanvasImageSource,
  width: number,
  height: number,
  step: number,
): Float32Array {
  return shapePoints(
    width,
    height,
    (context, w, h) => {
      const size = Math.min(h * 1.05, w * 1.15)
      context.drawImage(image, (w - size) / 2, (h - size) / 2, size, size)
    },
    { step, threshold: 140, minLuminance: 118 },
  )
}

/** 프레임을 아직 받지 못했을 때 쓰는 간단한 시계 윤곽 */
export function fallbackWatchPoints(
  width: number,
  height: number,
  step: number,
): Float32Array {
  return shapePoints(
    width,
    height,
    (context, w, h) => {
      const r = Math.min(w, h) * 0.3
      const cx = w / 2
      const cy = h / 2
      context.fillStyle = '#fff'
      context.strokeStyle = '#fff'
      context.fillRect(cx - r * 0.55, cy - r * 1.7, r * 1.1, r * 0.9)
      context.fillRect(cx - r * 0.55, cy + r * 0.8, r * 1.1, r * 0.9)
      context.lineWidth = r * 0.22
      context.beginPath()
      context.arc(cx, cy, r, 0, Math.PI * 2)
      context.stroke()
      for (let i = 0; i < 12; i += 1) {
        const a = (i / 12) * Math.PI * 2
        context.fillRect(
          cx + Math.cos(a) * r * 0.7 - 4,
          cy + Math.sin(a) * r * 0.7 - 4,
          8,
          8,
        )
      }
    },
    { step },
  )
}

/** 글자를 화면 폭에 맞춰 그려 점으로 바꿉니다. */
export function glyphPoints(
  glyphs: string,
  width: number,
  height: number,
  step: number,
): Float32Array {
  return shapePoints(
    width,
    height,
    (context, w, h) => {
      let size = h * 0.42
      context.font = `700 ${size}px ${FONT}`
      const measured = context.measureText(glyphs).width || size
      size = Math.min(size, (size * w * 0.88) / measured)
      context.font = `700 ${size}px ${FONT}`
      context.fillStyle = '#fff'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(glyphs, w / 2, h / 2)
    },
    { step },
  )
}

/**
 * 핵심 기능 구간의 입자 무대. 단계마다 모양(목표점)을 바꾸고, 마우스를 피했다가 복원력으로 돌아옵니다.
 * 좌표·속도는 Particle 객체에 두고 React 상태로 올리지 않습니다.
 */
export class ParticleScene {
  readonly pointer = { x: 0, y: 0, active: false }
  private readonly field: ParticleField
  /** 단계별 목표점. 지금 단계를 보여 줄 때 처음 만들고, 크기·글꼴·실루엣이 바뀌면 비웁니다. */
  private shapes: (Float32Array | undefined)[] = []
  private index = 0
  private width = 1
  private height = 1
  private silhouette: CanvasImageSource | null = null

  constructor(private readonly steps: readonly DetailStep[]) {
    this.field = new ParticleField(tuning.particles.count, 1, 1)
  }

  get count(): number {
    return this.field.count
  }

  resize(width: number, height: number): void {
    const w = Math.max(1, width)
    const h = Math.max(1, height)
    if (w === this.width && h === this.height && this.shapes.length) return
    this.width = w
    this.height = h
    this.field.resize(w, h)
    this.refreshShapes()
  }

  setSilhouette(image: CanvasImageSource | null): void {
    if (!image || image === this.silhouette) return
    this.silhouette = image
    this.steps.forEach((step, index) => {
      if (step.shape === 'silhouette') this.shapes[index] = undefined
    })
    if (this.steps[this.index]?.shape === 'silhouette') this.applyShape()
  }

  /** 글꼴이 준비되는 등 모양을 다시 그려야 할 때 부릅니다. */
  refreshShapes(): void {
    this.shapes = this.steps.map(() => undefined)
    this.applyShape()
  }

  /** 단계를 바꿉니다. 동작 줄이기에서는 날아가지 않고 바로 자리를 잡습니다. */
  show(index: number, { animate = true } = {}): void {
    this.index = Math.max(0, Math.min(this.steps.length - 1, index))
    this.applyShape()
    if (animate) this.field.burst(5)
    else this.snap()
  }

  frame(context: Context2D, dt: number): void {
    const { particles } = tuning
    if (this.field.count !== particles.count)
      this.field.setCount(particles.count)
    this.field.update(this.pointer, particles, Math.min(3, dt * 60))
    context.clearRect(0, 0, this.width, this.height)
    this.field.draw(context, PARTICLE_PALETTE, particles.size)
  }

  private snap(): void {
    for (const particle of this.field.particles) {
      particle.x = particle.tx
      particle.y = particle.ty
      particle.vx = 0
      particle.vy = 0
    }
  }

  private shapeFor(index: number): Float32Array | undefined {
    const cached = this.shapes[index]
    if (cached) return cached
    const step = this.steps[index]
    if (!step) return undefined
    const gap = this.width < 520 ? 2 : 3
    const shape =
      step.shape === 'text'
        ? glyphPoints(step.glyphs ?? '', this.width, this.height, gap)
        : this.silhouette
          ? silhouettePoints(this.silhouette, this.width, this.height, gap)
          : fallbackWatchPoints(this.width, this.height, gap)
    this.shapes[index] = shape
    return shape
  }

  private applyShape(): void {
    const shape = this.shapeFor(this.index)
    if (shape) this.field.setShape(shape)
  }
}
