import { useEffect, useRef } from 'react'
import { SEQUENCE_FRAMES } from '@/entities/watch'
import {
  createFrameLoop,
  fitCanvas,
  observeCanvasSize,
} from '@/shared/lib/canvas'
import { clamp } from '@/shared/lib/math'
import { motionStore } from '@/shared/lib/motion'
import { sequenceFrames, sequenceDrawSize } from '../../lib/sequence-frames'
import { SequencePlayer } from '../../lib/sequence-player'
import { ANATOMY_CAPTIONS } from '../../model/content'
import { tuning, tuningEvents } from '../../model/tuning'
import { SectionHead } from '../SectionHead'
import styles from './Anatomy.module.css'

const TOTAL = String(SEQUENCE_FRAMES).padStart(3, '0')

/** 스크롤 진행도에 맞춰 시계가 한 바퀴 돈 뒤 부품이 펼쳐지는 이미지 시퀀스 */
export function Anatomy() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const captionsRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!section || !canvas || !context) return

    const player = new SequencePlayer(sequenceFrames.frames)
    let size = { width: 1, height: 1, dpr: 1 }
    const stopResize = observeCanvasSize(
      canvas,
      (next) => {
        size = next
        fitCanvas(canvas, context, next)
        player.invalidate()
      },
      () => tuning.render.maxDpr,
    )
    const stopFrames = sequenceFrames.subscribe(() => player.invalidate())
    // 디버그 패널에서 DPR 상한을 바꾸면 크기가 그대로여도 해상도를 다시 맞춥니다.
    const stopTuning = tuningEvents.subscribe(() => stopResize.refresh())

    const captions = Array.from(
      captionsRef.current?.querySelectorAll<HTMLElement>('[data-from]') ?? [],
    )
    let lastFrame = -1
    const shownProgress = () =>
      player.position / Math.max(1, player.frameCount - 1)
    const loop = createFrameLoop((dt) => {
      const rect = section.getBoundingClientRect()
      const range = rect.height - window.innerHeight
      const progress = range > 0 ? clamp(-rect.top / range) : 0
      player.setProgress(progress)
      player.update(dt, tuning.sequence.lerp, motionStore.get().reduced)
      player.draw(context, size.width, size.height, {
        crossfade: tuning.sequence.crossfade,
        size: sequenceDrawSize(size.width, size.height, shownProgress()),
      })
      const shown = shownProgress()
      for (const caption of captions) {
        const active =
          shown >= Number(caption.dataset.from) &&
          shown < Number(caption.dataset.to)
        if (caption.dataset.active !== String(active)) {
          caption.dataset.active = String(active)
        }
      }
      const frame = Math.round(player.position) + 1
      if (frame !== lastFrame && counterRef.current) {
        lastFrame = frame
        counterRef.current.textContent = String(frame).padStart(3, '0')
      }
      barRef.current?.style.setProperty('--progress', shown.toFixed(4))
    })

    // 나머지 프레임은 사용자가 스크롤을 시작하면 받습니다. (가만히 첫 화면만 보는 방문자는 핵심 프레임만 받음)
    const loadRest = () => {
      if (window.scrollY <= 0) return
      sequenceFrames.loadRest()
      window.removeEventListener('scroll', loadRest)
    }
    window.addEventListener('scroll', loadRest, { passive: true })
    loadRest()
    // 보이는 동안만 그립니다.
    const visible = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) loop.start()
      else loop.stop()
    })
    visible.observe(section)

    return () => {
      loop.stop()
      window.removeEventListener('scroll', loadRest)
      visible.disconnect()
      stopResize()
      stopTuning()
      stopFrames()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="anatomy"
      className={styles.anatomy}
      data-theme="dark"
      aria-labelledby="anatomy-title"
    >
      <div className={styles.sticky}>
        <div
          className={styles.visual}
          role="img"
          aria-label="A-01이 스크롤에 따라 한 바퀴 돌아 케이스백을 보여 준 뒤, 크리스털·베젤·문자판·케이스·무브먼트·케이스백 순으로 앞뒤로 펼쳐지는 장면"
        >
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
        <div className={styles.head}>
          <SectionHead
            id="anatomy-title"
            eyebrow="01 · Anatomy"
            title="한 바퀴 돌고, 펼쳐 보기"
            lead={`스크롤하는 만큼 ${SEQUENCE_FRAMES}장의 이미지 시퀀스가 넘어갑니다.`}
          />
        </div>
        <ol ref={captionsRef} className={styles.captions}>
          {ANATOMY_CAPTIONS.map((caption) => (
            <li
              key={caption.id}
              className={styles.caption}
              data-from={caption.from}
              data-to={caption.to}
              data-side={caption.side}
              data-active="false"
            >
              <p className={styles.kicker} lang="en">
                {caption.kicker}
              </p>
              <h3 className={styles.captionTitle}>{caption.title}</h3>
              <p className={styles.body}>{caption.body}</p>
            </li>
          ))}
        </ol>
        <p className={styles.meter} aria-hidden="true">
          <span lang="en">Frame</span> <span ref={counterRef}>001</span>
          <span className={styles.total}>/ {TOTAL}</span>
          <span ref={barRef} className={styles.bar} />
        </p>
      </div>
    </section>
  )
}
