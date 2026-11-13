import { useEffect, useRef, useState } from 'react'
import { PRODUCT_SECTIONS, ROUTES, sectionNav } from '@/shared/config'
import { getDpr } from '@/shared/lib/canvas'
import { Button } from '@/shared/ui/button'
import { SiteFooter } from '@/widgets/site-footer'
import { SiteHeader } from '@/widgets/site-header'
import {
  type BenchResult,
  COUNTS,
  STAGE,
  TECHNIQUES,
  type Technique,
  createSwarm,
  resultsToMarkdown,
  stepSwarm,
} from '../model/bench'
import styles from './BenchPage.module.css'

declare global {
  interface Window {
    /** 측정 스크립트가 부르는 함수: 모든 조합을 재고 결과를 돌려줍니다. */
    __runBench?: (options?: {
      warmupMs?: number
      measureMs?: number
    }) => Promise<BenchResult[]>
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg'
const nextFrame = () =>
  new Promise<number>((resolve) => requestAnimationFrame(resolve))

/** 한 방식·입자 수로 measureMs 동안 움직이며 FPS를 잽니다. */
async function measure(
  stage: HTMLElement,
  technique: Technique,
  count: number,
  { warmupMs = 600, measureMs = 2000 } = {},
): Promise<BenchResult> {
  stage.replaceChildren()
  const { width, height } = STAGE
  const swarm = createSwarm(count, width, height)
  let draw: () => void

  if (technique === 'canvas') {
    const canvas = document.createElement('canvas')
    const dpr = getDpr(2)
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.className = styles.layer ?? ''
    stage.append(canvas)
    const context = canvas.getContext('2d')
    context?.scale(dpr, dpr)
    draw = () => {
      if (!context) return
      context.clearRect(0, 0, width, height)
      context.beginPath()
      for (const particle of swarm)
        context.rect(particle.x - 1, particle.y - 1, 2, 2)
      context.fillStyle = '#ff5470'
      context.fill()
    }
  } else if (technique === 'dom') {
    const layer = document.createElement('div')
    layer.className = styles.layer ?? ''
    const dots = swarm.map(() => {
      const dot = document.createElement('div')
      dot.className = styles.dot ?? ''
      layer.append(dot)
      return dot
    })
    stage.append(layer)
    draw = () => {
      swarm.forEach((particle, index) => {
        dots[index]!.style.transform =
          `translate(${particle.x - 1}px, ${particle.y - 1}px)`
      })
    }
  } else {
    const svg = document.createElementNS(SVG_NS, 'svg')
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    svg.setAttribute('class', styles.layer ?? '')
    const rects = swarm.map(() => {
      const rect = document.createElementNS(SVG_NS, 'rect')
      rect.setAttribute('width', '2')
      rect.setAttribute('height', '2')
      rect.setAttribute('fill', '#ff5470')
      svg.append(rect)
      return rect
    })
    stage.append(svg)
    draw = () => {
      swarm.forEach((particle, index) => {
        rects[index]!.setAttribute('x', (particle.x - 1).toFixed(1))
        rects[index]!.setAttribute('y', (particle.y - 1).toFixed(1))
      })
    }
  }

  const start = await nextFrame()
  let frames = 0
  let scriptTime = 0
  let measureStart = 0
  for (;;) {
    const now = await nextFrame()
    const t0 = performance.now()
    stepSwarm(swarm, (now - start) / 1000, width, height)
    draw()
    const spent = performance.now() - t0
    if (now - start < warmupMs) continue
    if (!measureStart) measureStart = now
    frames += 1
    scriptTime += spent
    if (now - measureStart >= measureMs) {
      const fps = ((frames - 1) * 1000) / Math.max(1, now - measureStart)
      stage.replaceChildren()
      return { technique, count, fps, scriptMs: scriptTime / frames }
    }
  }
}

export function BenchPage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [results, setResults] = useState<BenchResult[]>([])
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const runningRef = useRef(false)

  const run = async (options?: { warmupMs?: number; measureMs?: number }) => {
    const stage = stageRef.current
    if (!stage || runningRef.current) return []
    runningRef.current = true
    setRunning(true)
    setResults([])
    const collected: BenchResult[] = []
    for (const count of COUNTS) {
      for (const technique of TECHNIQUES) {
        setStatus(
          `${technique.name}로 입자 ${count.toLocaleString('ko-KR')}개를 재는 중…`,
        )
        const result = await measure(stage, technique.id, count, options)
        collected.push(result)
        setResults([...collected])
      }
    }
    setStatus('측정을 마쳤습니다. 표에서 방식별 FPS를 비교해 보세요.')
    runningRef.current = false
    setRunning(false)
    return collected
  }

  useEffect(() => {
    window.__runBench = (options) => run(options)
    return () => {
      delete window.__runBench
    }
  })

  return (
    <>
      <SiteHeader
        page="other"
        nav={sectionNav(PRODUCT_SECTIONS, ROUTES.home)}
        cta={{ href: ROUTES.home, label: 'Showcase', title: '시계 쇼케이스' }}
      />
      <main id="main" className={styles.page}>
        <header className={styles.head}>
          <p className={styles.eyebrow} lang="en">
            Benchmark
          </p>
          <h1 className={styles.title}>Canvas · DOM · SVG 성능 비교</h1>
          <p className={styles.lead}>
            같은 궤도 계산으로 점 수백~수만 개를 움직이며 세 방식의 FPS를
            잽니다. DOM과 SVG는 요소마다 스타일 계산·레이아웃·페인트가 따라붙어
            점이 많아질수록 급격히 느려지고, Canvas 2D는 한 번의 경로 채우기로
            그려 훨씬 오래 버팁니다.
          </p>
          <div className={styles.actions}>
            <Button type="button" onClick={() => void run()} disabled={running}>
              {running ? '재는 중…' : '측정 시작 (약 30초)'}
            </Button>
          </div>
          <p className={styles.status} role="status">
            {status}
          </p>
        </header>

        <div className={styles.results}>
          <div
            className={styles.tableWrap}
            role="region"
            aria-labelledby="bench-caption"
            tabIndex={0}
          >
            <table className={styles.table}>
              <caption id="bench-caption">
                입자 수와 그리는 방식별 평균 FPS (괄호는 한 프레임의 스크립트
                시간)
              </caption>
              <thead>
                <tr>
                  <th scope="col">입자 수</th>
                  {TECHNIQUES.map((technique) => (
                    <th key={technique.id} scope="col">
                      {technique.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COUNTS.map((count) => (
                  <tr key={count}>
                    <th scope="row">{count.toLocaleString('ko-KR')}</th>
                    {TECHNIQUES.map((technique) => {
                      const result = results.find(
                        (item) =>
                          item.technique === technique.id &&
                          item.count === count,
                      )
                      return (
                        <td key={technique.id}>
                          {result
                            ? `${Math.round(result.fps)} fps (${result.scriptMs.toFixed(1)}ms)`
                            : '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            ref={stageRef}
            className={styles.stage}
            data-running={running}
            style={{
              width: STAGE.width,
              aspectRatio: `${STAGE.width} / ${STAGE.height}`,
            }}
            aria-hidden="true"
          />
        </div>

        {results.length === COUNTS.length * TECHNIQUES.length ? (
          <details className={styles.markdown}>
            <summary>README에 붙일 마크다운 표</summary>
            <pre>{resultsToMarkdown(results)}</pre>
          </details>
        ) : null}
      </main>
      <SiteFooter page="bench" />
    </>
  )
}
