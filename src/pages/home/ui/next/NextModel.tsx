import { useRef } from 'react'
import { useInView } from '@/shared/lib/viewport'
import { SectionHead } from '../SectionHead'
import styles from './NextModel.module.css'

const CENTER = 200
const ARC_RADIUS = 120
/** 호 위의 점: The Crimson Arc 문자판 상징처럼 12시에서 시계 방향으로 약 32도 */
const BEAD_ANGLE = Math.PI * 0.18

/** 12시가 0이고 시계 방향으로 커지는 각도를 SVG 좌표로 바꿉니다. */
function polar(radius: number, angle: number): [number, number] {
  return [
    Number((CENTER + Math.sin(angle) * radius).toFixed(2)),
    Number((CENTER - Math.cos(angle) * radius).toFixed(2)),
  ]
}

/** 베젤처럼 두른 바깥 눈금 60개 (5분마다 길게) */
const TICKS = Array.from({ length: 60 }, (_, index) => {
  const angle = (index / 60) * Math.PI * 2
  const major = index % 5 === 0
  const [x1, y1] = polar(major ? 172 : 180, angle)
  const [x2, y2] = polar(190, angle)
  return { index, major, x1, y1, x2, y2 }
})

/** 9시에서 3시까지 위쪽 반원 */
const ARC_PATH = `M ${CENTER - ARC_RADIUS} ${CENTER} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${CENTER + ARC_RADIUS} ${CENTER}`
const [BEAD_X, BEAD_Y] = polar(ARC_RADIUS, BEAD_ANGLE)

/**
 * 이름 그대로의 선홍색 호. 화면에 들어오면 왼쪽부터 그려지고 점이 뒤따라 나타납니다.
 * 동작 줄이기나 자동 연출 멈춤에서는 그리는 과정 없이 바로 보입니다. (CSS)
 */
function ScarletArcMark() {
  const ref = useRef<HTMLDivElement>(null)
  const shown = useInView(ref, { once: true, threshold: 0.4 })
  return (
    <div ref={ref} className={styles.mark} data-shown={shown}>
      <svg viewBox="0 0 400 400" aria-hidden="true">
        {TICKS.map((tick) => (
          <line
            key={tick.index}
            className={tick.major ? styles.tickMajor : styles.tick}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
          />
        ))}
        <path className={styles.track} d={ARC_PATH} />
        <path className={styles.arc} d={ARC_PATH} pathLength={1} />
        <circle className={styles.bead} cx={BEAD_X} cy={BEAD_Y} r={17} />
      </svg>
    </div>
  )
}

/** 후속 모델 예고: 런칭을 준비하는 The Scarlet Arc */
export function NextModel() {
  return (
    <section
      id="next"
      className={styles.next}
      data-theme="dark"
      aria-labelledby="next-title"
    >
      <div className={styles.copy}>
        <SectionHead
          id="next-title"
          eyebrow="05 · Next Model"
          title={
            <span lang="en">
              The <span className={styles.scarlet}>Scarlet</span> Arc
            </span>
          }
          lead="The Crimson Arc A-01의 뒤를 잇는 후속 모델 The Scarlet Arc가 런칭을 준비하고 있습니다. 이름 그대로 선홍색 호를 새긴 다음 시계를 이 자리에서 가장 먼저 공개합니다."
          className={styles.head}
        />
        <p className={styles.status}>
          <span className={styles.dot} aria-hidden="true" />
          런칭 준비 중
        </p>
        <p className={styles.note}>
          The Scarlet Arc도 판매하지 않는 가상의 모델입니다.
        </p>
      </div>
      <ScarletArcMark />
    </section>
  )
}
