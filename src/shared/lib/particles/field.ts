import { Particle, type ParticleForces, type PointerLike } from './particle'
import { pickTargets } from './sample'

/** 입자 여러 개를 한꺼번에 움직이고 그립니다. 모양(목표점 묶음)을 바꾸면 그쪽으로 모여듭니다. */
export class ParticleField {
  readonly particles: Particle[] = []
  private shape: Float32Array = new Float32Array(0)
  private width: number
  private height: number

  constructor(count: number, width: number, height: number) {
    this.width = width
    this.height = height
    this.setCount(count)
  }

  get count(): number {
    return this.particles.length
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
  }

  /** 수를 바꿉니다. 새 입자는 화면 아무 곳에서 나타나 모양으로 날아갑니다. */
  setCount(count: number): void {
    const next = Math.max(0, Math.floor(count))
    if (next < this.particles.length) this.particles.length = next
    while (this.particles.length < next) {
      this.particles.push(
        new Particle(Math.random() * this.width, Math.random() * this.height),
      )
    }
    if (this.shape.length) this.applyShape()
  }

  /** 모양을 [x0, y0, x1, y1, …] 점 목록으로 정합니다. */
  setShape(points: Float32Array): void {
    this.shape = points
    this.applyShape()
  }

  /** 모양을 바꿀 때 살짝 흩어 날아가는 느낌을 줍니다. */
  burst(strength = 6): void {
    for (const particle of this.particles) {
      const angle = Math.random() * Math.PI * 2
      const speed = strength * (0.3 + Math.random())
      particle.vx += Math.cos(angle) * speed
      particle.vy += Math.sin(angle) * speed
    }
  }

  update(pointer: PointerLike, forces: ParticleForces, step = 1): void {
    for (const particle of this.particles)
      particle.update(pointer, forces, step)
  }

  /**
   * 색마다 경로 하나에 사각형을 모아 한 번에 채웁니다. 입자마다 fillRect를 부르는 것보다 빠릅니다.
   * palette의 앞쪽 색일수록 많이 쓰입니다(seed²).
   */
  draw(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    palette: readonly string[],
    size = 1.6,
  ): void {
    palette.forEach((color, colorIndex) => {
      context.beginPath()
      for (const particle of this.particles) {
        const pick = Math.min(
          palette.length - 1,
          Math.floor(particle.seed * particle.seed * palette.length),
        )
        if (pick !== colorIndex) continue
        const s = size * (0.7 + particle.seed * 0.8)
        context.rect(particle.x - s / 2, particle.y - s / 2, s, s)
      }
      context.fillStyle = color
      context.fill()
    })
  }

  private applyShape(): void {
    const targets = pickTargets(this.shape, this.particles.length)
    this.particles.forEach((particle, index) => {
      particle.setTarget(targets[index * 2]!, targets[index * 2 + 1]!)
    })
  }
}
