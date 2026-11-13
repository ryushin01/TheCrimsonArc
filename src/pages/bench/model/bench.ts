import { Particle, type ParticleForces } from '@/shared/lib/particles'

export type Technique = 'canvas' | 'dom' | 'svg'

export const TECHNIQUES: readonly { id: Technique; name: string }[] = [
  { id: 'canvas', name: 'Canvas 2D' },
  { id: 'dom', name: 'DOM (div + transform)' },
  { id: 'svg', name: 'SVG (rect)' },
]

export const COUNTS = [500, 2_000, 8_000, 20_000] as const

export const STAGE = { width: 640, height: 400 } as const

const FORCES: ParticleForces = {
  radius: 0,
  repulsion: 0,
  spring: 0.08,
  friction: 0.82,
}

export interface BenchResult {
  technique: Technique
  count: number
  /** 측정 구간의 평균 FPS */
  fps: number
  /** 한 프레임에 스크립트(계산 + 그리기 명령)가 쓴 평균 시간(ms) */
  scriptMs: number
}

/** 입자마다 다른 궤도를 돌도록 목표점을 옮깁니다. 세 방식 모두 같은 계산을 합니다. */
export function createSwarm(
  count: number,
  width: number,
  height: number,
): Particle[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = (index * 0.618_033_988_75) % 1
    return new Particle(width / 2, height / 2, seed)
  })
}

export function stepSwarm(
  particles: Particle[],
  time: number,
  width: number,
  height: number,
): void {
  const cx = width / 2
  const cy = height / 2
  for (const particle of particles) {
    const s = particle.seed
    const radius = 30 + s * Math.min(cx, cy) * 0.9
    const angle = time * (0.4 + s * 1.6) + s * 40
    particle.setTarget(
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle * 1.3) * radius * 0.8,
    )
    particle.update({ x: 0, y: 0, active: false }, FORCES)
  }
}

/** 결과를 README에 붙일 수 있는 마크다운 표로 만듭니다. */
export function resultsToMarkdown(results: readonly BenchResult[]): string {
  const head = `| 입자 수 | ${TECHNIQUES.map((technique) => technique.name).join(' | ')} |`
  const line = `| ---: | ${TECHNIQUES.map(() => '---:').join(' | ')} |`
  const rows = COUNTS.map((count) => {
    const cells = TECHNIQUES.map(({ id }) => {
      const result = results.find(
        (item) => item.technique === id && item.count === count,
      )
      return result ? `${Math.round(result.fps)} fps` : '-'
    })
    return `| ${count.toLocaleString('en-US')} | ${cells.join(' | ')} |`
  })
  return [head, line, ...rows].join('\n')
}
