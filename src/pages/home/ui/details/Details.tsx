import { useEffect, useRef, useState } from 'react'
import {
  createFrameLoop,
  fitCanvas,
  observeCanvasSize,
} from '@/shared/lib/canvas'
import { useMotion } from '@/shared/lib/motion'
import { useFontsReady } from '@/shared/lib/fonts'
import { ParticleScene } from '../../lib/particle-scene'
import { sequenceFrames } from '../../lib/sequence-frames'
import { DETAIL_STEPS } from '../../model/content'
import { tuning, tuningEvents } from '../../model/tuning'
import { SectionHead } from '../SectionHead'
import styles from './Details.module.css'

const FONTS = ['700 64px "Chakra Petch"'] as const

/** 단계마다 수천 개의 입자가 시계 실루엣·숫자로 모이고, 마우스를 피해 흩어졌다가 돌아옵니다. */
export function Details() {
  const [active, setActive] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stepsRef = useRef<HTMLOListElement>(null)
  const sceneRef = useRef<ParticleScene | null>(null)
  const { reduced } = useMotion()
  const fontsReady = useFontsReady(FONTS)

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!stage || !canvas || !context) return
    const scene = new ParticleScene(DETAIL_STEPS)
    sceneRef.current = scene

    const stopResize = observeCanvasSize(
      canvas,
      (next) => {
        fitCanvas(canvas, context, next)
        scene.resize(next.width, next.height)
      },
      () => tuning.render.maxDpr,
    )
    scene.setSilhouette(sequenceFrames.frames[0] ?? null)
    const stopFrames = sequenceFrames.subscribe((index) => {
      if (index === 0) scene.setSilhouette(sequenceFrames.frames[0] ?? null)
    })

    // 디버그 패널에서 DPR 상한을 바꾸면 크기가 그대로여도 해상도를 다시 맞춥니다.
    const stopTuning = tuningEvents.subscribe(() => stopResize.refresh())
    const loop = createFrameLoop((dt) => scene.frame(context, dt))
    const visible = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) loop.start()
      else loop.stop()
    })
    visible.observe(stage)

    const toLocal = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      scene.pointer.x = event.clientX - rect.left
      scene.pointer.y = event.clientY - rect.top
    }
    const onMove = (event: PointerEvent) => {
      toLocal(event)
      scene.pointer.active = true
    }
    const onLeave = () => {
      scene.pointer.active = false
    }
    // 손가락은 떼면 사라지므로 마우스와 달리 바로 놓아 줍니다.
    const onUp = (event: PointerEvent) => {
      if (event.pointerType === 'touch') onLeave()
    }
    canvas.addEventListener('pointermove', onMove, { passive: true })
    canvas.addEventListener('pointerdown', onMove, { passive: true })
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('pointercancel', onLeave)
    canvas.addEventListener('pointerup', onUp)

    return () => {
      loop.stop()
      visible.disconnect()
      stopResize()
      stopTuning()
      stopFrames()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('pointercancel', onLeave)
      canvas.removeEventListener('pointerup', onUp)
      sceneRef.current = null
    }
  }, [])

  // 글꼴이 준비되면 글자 모양을 다시 만듭니다.
  useEffect(() => {
    if (fontsReady) sceneRef.current?.refreshShapes()
  }, [fontsReady])

  useEffect(() => {
    sceneRef.current?.show(active, { animate: !reduced })
  }, [active, reduced])

  // 화면 가운데를 지나는 단계를 지금 단계로 삼습니다.
  useEffect(() => {
    const items = Array.from(
      stepsRef.current?.querySelectorAll<HTMLElement>('[data-step]') ?? [],
    )
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.step))
          }
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    for (const item of items) observer.observe(item)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="details"
      className={styles.details}
      data-theme="dark"
      aria-labelledby="details-title"
    >
      <div className={styles.intro}>
        <SectionHead
          id="details-title"
          eyebrow="02 · Details"
          title="숫자로 보는 CA-01"
          lead="입자 수천 개가 단계마다 다른 모양으로 모입니다. 마우스나 손가락을 올리면 흩어졌다가 제자리로 돌아옵니다."
        />
      </div>
      <div className={styles.layout}>
        <div
          ref={stageRef}
          className={styles.stage}
          role="img"
          aria-label={`입자로 그린 ${DETAIL_STEPS[active]?.glyphs ?? 'CA-01 시계 실루엣'}`}
        >
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
        <ol ref={stepsRef} className={styles.steps}>
          {DETAIL_STEPS.map((step, index) => (
            <li
              key={step.id}
              className={styles.step}
              data-step={index}
              aria-current={index === active ? 'step' : undefined}
            >
              <p className={styles.kicker} lang="en">
                <span className={styles.index}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                {step.kicker}
              </p>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.body}>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
