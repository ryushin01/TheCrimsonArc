import { useEffect, useId, useRef } from 'react'
import { useMotion } from '@/shared/lib/motion'
import { Icon } from '@/shared/ui/icon'
import {
  type HeroCanvasController,
  mountHeroCanvas,
} from '../../lib/hero-canvas'
import { useLoadState } from '../../model/load-store'
import styles from './Hero.module.css'

/** 자료를 받는 동안만 보조기기에 진행률을 알려 줍니다. (캔버스 숫자는 보조기기에서 숨김) */
function LoadProgress() {
  const { progress, done } = useLoadState()
  if (done) return null
  return (
    <progress
      className="visually-hidden"
      max={100}
      value={Math.round(progress * 100)}
      aria-label="제품 이미지 불러오기"
    />
  )
}

export function Hero() {
  const titleId = useId()
  const hostRef = useRef<HTMLElement>(null)
  const controllerRef = useRef<HeroCanvasController | null>(null)
  const { paused } = useMotion()
  const pausedRef = useRef(paused)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const controller = mountHeroCanvas(host, styles.canvas, {
      paused: pausedRef.current,
    })
    controllerRef.current = controller
    return () => {
      controller.dispose()
      controllerRef.current = null
    }
  }, [])

  useEffect(() => {
    pausedRef.current = paused
    controllerRef.current?.setPaused(paused)
  }, [paused])

  return (
    <section
      ref={hostRef}
      className={styles.hero}
      data-theme="dark"
      aria-labelledby={titleId}
    >
      <div className={styles.content}>
        <p className={styles.eyebrow}>
          <span lang="en">Mechanical Pilot Watch</span>
          <span aria-hidden="true">·</span>
          <span>80,000A/m 내자성</span>
        </p>
        <h1 id={titleId} className={styles.title}>
          <span lang="en">The Crimson Arc</span>{' '}
          <span className={styles.model} lang="en">
            A-01
          </span>
        </h1>
        <p className={styles.lead}>
          처음 15분을 크림슨으로 칠한 회전 베젤, 크림슨 호를 두른 6시
          크로노그래프, 80,000A/m 내자성. 가상의 기계식 파일럿 워치를 HTML5
          Canvas 위에서 돌리고, 펼치고, 흩뜨려 봅니다.
        </p>
        <a className={styles.scroll} href="#anatomy">
          <Icon name="chevron-down" size={18} />
          스크롤해서 살펴보기
        </a>
      </div>
      <p className={styles.note} lang="en" aria-hidden="true">
        Move your cursor
      </p>
      <LoadProgress />
    </section>
  )
}
