import { useEffect, useRef } from 'react'
import { ROUTES, SITE } from '@/shared/config'
import { useFrameLoop } from '@/shared/lib/frame-loop'
import { damp } from '@/shared/lib/math'
import { useMotion } from '@/shared/lib/motion'
import { scrollStore } from '@/shared/lib/scroll'
import { useInView } from '@/shared/lib/viewport'
import { ButtonLink } from '@/shared/ui/button'
import { DisplayHeading } from '@/shared/ui/display-heading'
import styles from './Launch.module.css'

const WORDS = [
  'Crimson Arc',
  'Draw',
  'Crimson Arc',
  'Move',
  'Crimson Arc',
  'Export',
]

/** 흐르는 큰 글자: 스크롤을 빨리 할수록 lerp로 빨라졌다가 천천히 돌아옵니다. */
function Marquee() {
  const box = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const state = useRef({ x: 0, speed: 0, half: 0 })
  const { paused } = useMotion()
  const inView = useInView(box)

  useEffect(() => {
    const element = track.current
    if (!element) return
    const measure = () => {
      state.current.half = element.scrollWidth / 2
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useFrameLoop((dt) => {
    const element = track.current
    const s = state.current
    if (!element || s.half <= 0) return
    const push = Math.min(Math.abs(scrollStore.get().velocity) * 24, 1100)
    s.speed = damp(s.speed, 70 + push, 3, dt)
    s.x -= s.speed * dt
    if (-s.x >= s.half) s.x += s.half
    element.style.transform = `translate3d(${s.x.toFixed(1)}px, 0, 0)`
  }, inView && !paused)

  return (
    <div ref={box} className={styles.marquee} aria-hidden="true" lang="en">
      <div ref={track} className={styles.track}>
        {[...WORDS, ...WORDS].map((word, index) => (
          <span key={index}>{word} ✦</span>
        ))}
      </div>
    </div>
  )
}

export function Launch() {
  return (
    <section
      id="launch"
      className={styles.launch}
      aria-labelledby="launch-title"
      data-theme="dark"
    >
      <Marquee />
      <div className={styles.content}>
        <DisplayHeading
          id="launch-title"
          tone="light"
          lines={['Start your', 'first frame']}
          className={styles.title}
        />
        <div className={styles.side}>
          <p className={styles.lead}>
            샘플 작품이 열린 스튜디오에서 바로 시작하세요. 그린 그림은 이
            브라우저 안에만 있고, GIF와 PNG로 내려받을 수 있습니다.
          </p>
          <div className={styles.ctas}>
            <ButtonLink
              href={ROUTES.studio}
              variant="light"
              icon="arrow-up-right"
            >
              스튜디오 열기
            </ButtonLink>
            <ButtonLink
              href={SITE.repositoryUrl}
              variant="outline"
              icon="arrow-right"
            >
              GitHub 저장소
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  )
}
