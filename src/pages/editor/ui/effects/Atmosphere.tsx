import { useEffect, useRef } from 'react'
import { useFrameLoop } from '@/shared/lib/frame-loop'
import { damp } from '@/shared/lib/math'
import { useMotion } from '@/shared/lib/motion'
import { pointerStore } from '@/shared/lib/pointer'
import { useTuningValue } from '../../model/tuning'
import styles from './Atmosphere.module.css'

/** 첫 화면의 버건디 그늘과, 마우스를 lerp로 천천히 따라오는 크림슨 빛 */
export function Atmosphere() {
  const glow = useRef<HTMLDivElement>(null)
  const intensity = useTuningValue('glow')
  const { reduced } = useMotion()
  const position = useRef({ x: 0, y: 0 })

  useEffect(() => pointerStore.retain(), [])

  useFrameLoop((dt) => {
    const element = glow.current
    if (!element) return
    const pointer = pointerStore.get()
    position.current.x = damp(position.current.x, pointer.x, 2.5, dt)
    position.current.y = damp(position.current.y, pointer.y, 2.5, dt)
    element.style.transform = `translate3d(${(position.current.x * 6).toFixed(2)}vw, ${(-position.current.y * 5).toFixed(2)}vh, 0)`
  }, !reduced)

  return (
    <div className={styles.atmosphere} aria-hidden="true">
      <div className={styles.shade} />
      <div ref={glow} className={styles.glow} style={{ opacity: intensity }} />
    </div>
  )
}
