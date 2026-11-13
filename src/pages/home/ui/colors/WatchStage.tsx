import { Canvas, useFrame } from '@react-three/fiber'
import { type ReactNode, useEffect, useRef } from 'react'
import type { Group } from 'three'
import {
  type WatchConfig,
  WatchLighting,
  WatchModel,
  showcaseTime,
} from '@/entities/watch'
import { damp } from '@/shared/lib/math'
import { pointerStore } from '@/shared/lib/pointer'

export type WatchView = 'front' | 'side' | 'back'

const VIEW_ANGLE: Record<WatchView, number> = {
  front: 0,
  side: -Math.PI / 2,
  back: Math.PI,
}

const SHOWCASE_TIME = showcaseTime()

/** 보는 방향으로 돌리고, 저절로 흔들리며, 마우스를 따라 기울어지는 받침 */
export function WatchRig({
  view,
  paused,
  children,
}: {
  view: WatchView
  paused: boolean
  children: ReactNode
}) {
  const group = useRef<Group>(null)
  const elapsed = useRef(0)
  useEffect(() => pointerStore.retain(), [])
  useFrame((_, dt) => {
    const target = group.current
    if (!target) return
    if (!paused) elapsed.current += dt
    // 저절로 흔들리는 연출은 움직임을 멈추면 쉬고, 마우스 기울기는 사용자가 움직일 때만 따라갑니다.
    const sway = paused ? 0 : Math.sin(elapsed.current * 0.5) * 0.16
    const pointer = pointerStore.get()
    const tiltY = pointer.active ? pointer.x * 0.22 : 0
    const tiltX = pointer.active ? -pointer.y * 0.1 : 0
    target.rotation.y = damp(
      target.rotation.y,
      VIEW_ANGLE[view] + sway + tiltY,
      4,
      dt,
    )
    target.rotation.x = damp(target.rotation.x, -0.06 + tiltX, 4, dt)
  })
  return <group ref={group}>{children}</group>
}

export interface WatchStageProps {
  config: WatchConfig
  view: WatchView
  /** 화면에 보일 때만 그립니다. */
  active: boolean
  paused: boolean
  /** 디버그 패널의 DPR 상한 */
  maxDpr?: number
  /** WebGL 렌더러가 준비되면 */
  onReady?: () => void
}

/** 색·재질 구성기의 3D 무대 (three.js가 들어 있어 따로 받습니다) */
export default function WatchStage({
  config,
  view,
  active,
  paused,
  maxDpr = 2,
  onReady,
}: WatchStageProps) {
  return (
    <Canvas
      dpr={[1, maxDpr]}
      onCreated={() => onReady?.()}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0, 10.5], fov: 30, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
      aria-hidden="true"
    >
      <WatchLighting light={config.light} />
      <WatchRig view={view} paused={paused}>
        <WatchModel config={config} time={paused ? SHOWCASE_TIME : 'live'} />
      </WatchRig>
    </Canvas>
  )
}
