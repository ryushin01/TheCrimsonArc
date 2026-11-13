import { COUNTS, createSwarm, resultsToMarkdown, stepSwarm } from './bench'

describe('성능 비교', () => {
  it('입자는 무대 안의 궤도를 돈다', () => {
    const swarm = createSwarm(50, 640, 400)
    for (let frame = 0; frame < 120; frame += 1)
      stepSwarm(swarm, frame / 60, 640, 400)
    for (const particle of swarm) {
      expect(particle.x).toBeGreaterThan(-40)
      expect(particle.x).toBeLessThan(680)
    }
  })

  it('결과를 입자 수별 마크다운 표로 만든다', () => {
    const markdown = resultsToMarkdown([
      { technique: 'canvas', count: COUNTS[0], fps: 60.2, scriptMs: 1 },
      { technique: 'dom', count: COUNTS[0], fps: 41.6, scriptMs: 9 },
    ])
    expect(markdown).toContain('| 500 | 60 fps | 42 fps | - |')
    expect(markdown.split('\n')).toHaveLength(2 + COUNTS.length)
  })
})
