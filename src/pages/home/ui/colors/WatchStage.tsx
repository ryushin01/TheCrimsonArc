import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { Group } from 'three'
import {
  BEATS_PER_SECOND,
  type WatchConfig,
  WatchLighting,
  WatchModel,
  showcaseTime,
} from '@/entities/watch'
import { damp, stepDelta } from '@/shared/lib/math'
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
  /** 지난 프레임에서 다 돌아 쉬던 중이었는지 */
  const settledRef = useRef(true)
  const invalidate = useThree((state) => state.invalidate)

  // 필요할 때만 그리는 장면(frameloop="demand")에서도 마우스가 움직이거나 방향을 바꾸면 다시 그립니다.
  useEffect(() => {
    const release = pointerStore.retain()
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') invalidate()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      release()
      window.removeEventListener('pointermove', onMove)
    }
  }, [invalidate])
  useEffect(() => {
    invalidate()
  }, [invalidate, view, paused])

  useFrame((state, delta) => {
    const target = group.current
    if (!target) return
    // 필요할 때만 그리는 장면에서 쉬었다 다시 그린 첫 프레임은 delta에 쉰 시간까지 들어 있어 한 프레임으로 칩니다.
    const dt = stepDelta(
      delta,
      state.frameloop !== 'always' && settledRef.current,
    )
    if (!paused) elapsed.current += dt
    // 저절로 흔들리는 연출은 움직임을 멈추면 쉬고, 마우스 기울기는 사용자가 움직일 때만 따라갑니다.
    const sway = paused ? 0 : Math.sin(elapsed.current * 0.5) * 0.16
    const pointer = pointerStore.get()
    const goalY =
      VIEW_ANGLE[view] + sway + (pointer.active ? pointer.x * 0.22 : 0)
    const goalX = -0.06 + (pointer.active ? -pointer.y * 0.1 : 0)
    target.rotation.y = damp(target.rotation.y, goalY, 4, dt)
    target.rotation.x = damp(target.rotation.x, goalX, 4, dt)
    // 다 돌 때까지는 다음 프레임을 부탁합니다. (늘 그리는 장면에서는 아무 일도 하지 않음)
    settledRef.current =
      Math.abs(target.rotation.y - goalY) <= 1e-4 &&
      Math.abs(target.rotation.x - goalX) <= 1e-4
    if (!settledRef.current) state.invalidate()
  })
  return <group ref={group}>{children}</group>
}

/** 셰이더 준비 등으로 처음에 느린 시간(초)은 재지 않습니다. */
const WARMUP_S = 1
/** 이만큼(초) 잰 평균 FPS가 */
const MEASURE_S = 2
/** 이보다 낮으면 GPU가 없는(소프트웨어 렌더링) 등 아주 느린 기기로 봅니다. */
export const SLOW_FPS = 20
/** 이보다 긴 프레임 간격(초)은 탭을 숨기는 등 루프가 멈췄던 공백으로 보고 세지 않습니다. (느린 기기의 긴 프레임은 셈) */
const PAUSE_GAP_S = 1

/** 늘 그리는 동안 처음 몇 초의 FPS를 재서 아주 느리면 알립니다. 탭을 숨긴 사이 같은 긴 공백은 세지 않습니다. */
export function FrameBudget({ onSlow }: { onSlow: () => void }) {
  const stats = useRef({ time: 0, frames: 0, done: false })
  useFrame((_, delta) => {
    const current = stats.current
    if (current.done || delta > PAUSE_GAP_S) return
    current.time += delta
    if (current.time < WARMUP_S) return
    current.frames += 1
    const measured = current.time - WARMUP_S
    if (measured < MEASURE_S) return
    current.done = true
    if (current.frames / measured < SLOW_FPS) onSlow()
  })
  return null
}

/** 필요할 때만 그리는 동안에도 초침이 4Hz 무브먼트처럼 초당 8번 움직이게 다시 그립니다. */
function BeatTicker() {
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    const id = window.setInterval(() => invalidate(), 1000 / BEATS_PER_SECOND)
    return () => window.clearInterval(id)
  }, [invalidate])
  return null
}

export interface WatchStageProps {
  config: WatchConfig
  view: WatchView
  /** 화면에 보일 때만 그립니다. */
  active: boolean
  paused: boolean
  /** 디버그 패널의 DPR 상한 */
  maxDpr?: number
  /** 시계 모델(질감·재질)까지 준비되면 */
  onReady?: () => void
}

/**
 * 색·재질 구성기의 3D 무대 (three.js가 들어 있어 따로 받습니다)
 * - 움직임이 켜져 있으면 늘 그리고(흔들림·초침), 멈춤·동작 줄이기에서는 견본·방향·마우스가 바뀔 때만 그립니다.
 * - 처음 몇 초가 아주 느리면(GPU가 없는 소프트웨어 렌더링 등) 흔들림을 쉬고 초침 박자와 조작에 맞춰서만 그려
 *   페이지가 멈추지 않게 합니다.
 */
export default function WatchStage({
  config,
  view,
  active,
  paused,
  maxDpr = 2,
  onReady,
}: WatchStageProps) {
  const [lowPower, setLowPower] = useState(false)
  const continuous = active && !paused && !lowPower
  return (
    <Canvas
      dpr={[1, maxDpr]}
      frameloop={!active ? 'never' : continuous ? 'always' : 'demand'}
      camera={{ position: [0, 0, 10.5], fov: 30, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
      aria-hidden="true"
    >
      {continuous ? <FrameBudget onSlow={() => setLowPower(true)} /> : null}
      {active && lowPower && !paused ? <BeatTicker /> : null}
      <WatchLighting light={config.light} />
      <WatchRig view={view} paused={paused || lowPower}>
        <WatchModel
          config={config}
          time={paused ? SHOWCASE_TIME : 'live'}
          onReady={onReady}
        />
      </WatchRig>
    </Canvas>
  )
}
