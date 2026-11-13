import { useEffect, useRef } from 'react'
import { useFrameLoop } from '@/shared/lib/frame-loop'
import { damp } from '@/shared/lib/math'
import { useMotion } from '@/shared/lib/motion'
import { pointerStore } from '@/shared/lib/pointer'
import { useMediaQuery } from '@/shared/lib/viewport'
import styles from './CursorRing.module.css'

const INTERACTIVE =
  'a, button, label, input, select, textarea, summary, [role="application"]'

/**
 * 마우스 포인터를 lerp로 늦게 따라오는 고리. 원래 커서는 그대로 둡니다.
 * 터치 기기와 '동작 줄이기'에서는 쓰지 않습니다.
 */
export function CursorRing() {
  const ring = useRef<HTMLDivElement>(null)
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)')
  const { reduced } = useMotion()
  const enabled = fine && !reduced
  const state = useRef({ x: 0, y: 0, scale: 1, target: 1, placed: false })

  useEffect(() => {
    if (!enabled) return
    const release = pointerStore.retain()
    const onOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      state.current.target = target?.closest(INTERACTIVE) ? 1.7 : 1
    }
    window.addEventListener('pointerover', onOver, { passive: true })
    return () => {
      release()
      window.removeEventListener('pointerover', onOver)
    }
  }, [enabled])

  useFrameLoop((dt) => {
    const element = ring.current
    const pointer = pointerStore.get()
    if (!element || !pointer.active) return
    const s = state.current
    if (!s.placed) {
      s.x = pointer.clientX
      s.y = pointer.clientY
      s.placed = true
      element.style.opacity = '1'
    }
    s.x = damp(s.x, pointer.clientX, 14, dt)
    s.y = damp(s.y, pointer.clientY, 14, dt)
    s.scale = damp(s.scale, s.target, 10, dt)
    element.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${s.scale.toFixed(3)})`
  }, enabled)

  if (!enabled) return null
  return <div ref={ring} className={styles.ring} aria-hidden="true" />
}
