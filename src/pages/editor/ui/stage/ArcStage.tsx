import { PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useRef, useState } from 'react'
import { scrollStore } from '@/shared/lib/scroll'
import { chapterBottom } from '../../model/chapters'
import { ArcScene } from './ArcScene'
import styles from './ArcStage.module.css'

/**
 * 페이지 뒤에 고정된 3D 캔버스. three.js가 커서 첫 화면 뒤에 따로 받습니다. (React.lazy)
 * 작동 원리 섹션을 지나면 렌더를 멈춰 배터리와 GPU를 아낍니다.
 */
export default function ArcStage() {
  const container = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(true)
  const [dpr, setDpr] = useState(1.75)

  useEffect(() => {
    const check = (y: number) => {
      const bottom = chapterBottom('process')
      const next = bottom === null || y < bottom
      setActive((previous) => (previous === next ? previous : next))
    }
    check(scrollStore.get().y)
    return scrollStore.subscribe((state) => check(state.y))
  }, [])

  const onFade = useCallback((opacity: number) => {
    if (container.current) container.current.style.opacity = opacity.toFixed(3)
  }, [])

  return (
    <div
      ref={container}
      className={styles.stage}
      data-active={active}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, dpr]}
        camera={{ position: [0, 0, 9], fov: 35, near: 0.1, far: 80 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        frameloop={active ? 'always' : 'never'}
      >
        {/* 프레임이 떨어지면 해상도를 낮추고, 여유가 생기면 되돌립니다. */}
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(1.75)}
        />
        <ArcScene onFade={onFade} />
      </Canvas>
    </div>
  )
}
