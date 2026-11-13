import type GUI from 'lil-gui'
import { useEffect, useRef } from 'react'
import {
  FpsMeter,
  type FrameLoop,
  createFrameLoop,
  drawFpsGraph,
} from '@/shared/lib/canvas'
import { Icon } from '@/shared/ui/icon'
import { heroRuntime } from '../../lib/hero-canvas'
import { resetTuning, tuning, tuningEvents } from '../../model/tuning'
import styles from './DebugPanel.module.css'

/** 주소에 ?debug가 있으면 패널을 연 채로 시작합니다. */
export function debugInitiallyOpen(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('debug')
  } catch {
    return false
  }
}

export interface DebugToggleProps {
  open: boolean
  panelId: string
  onToggle: () => void
}

/** 헤더 오른쪽 위에 놓는 디버그 패널 열기 버튼 */
export function DebugToggle({ open, panelId, onToggle }: DebugToggleProps) {
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-expanded={open}
      aria-controls={panelId}
      onClick={onToggle}
    >
      <Icon name="sliders" size={16} />
      <span lang="en">Debug</span>
    </button>
  )
}

const GRAPH_WIDTH = 252
const GRAPH_HEIGHT = 56

/**
 * lil-gui 디버그 패널: 입자 수·반발력·복원력, 시퀀스 lerp 빠르기, 첫 화면 빛, DPR 상한과 FPS 그래프.
 * 처음 열 때만 lil-gui를 받아 첫 화면 번들에 넣지 않습니다.
 */
export function DebugPanel({ id, open }: { id: string; open: boolean }) {
  const hostRef = useRef<HTMLElement>(null)
  const guiRef = useRef<GUI | null>(null)
  const loopRef = useRef<FrameLoop | null>(null)

  useEffect(() => {
    if (!open || guiRef.current) return
    let cancelled = false
    void import('lil-gui').then(({ default: LilGUI }) => {
      const host = hostRef.current
      if (cancelled || !host || guiRef.current) return
      const emit = () => tuningEvents.emit()
      const panel = new LilGUI({
        container: host,
        title: 'Debug · lil-gui',
        width: 280,
      })

      const stats = { main: 0, worker: 0, mode: '-' }
      const perf = panel.addFolder('성능 (FPS)')
      perf.add(stats, 'main').name('메인 스레드 FPS').listen().disable()
      perf.add(stats, 'worker').name('첫 화면 FPS').listen().disable()
      perf.add(stats, 'mode').name('첫 화면 그리는 곳').listen().disable()
      const graph = document.createElement('canvas')
      graph.className = styles.graph ?? ''
      graph.setAttribute('role', 'img')
      graph.setAttribute('aria-label', '최근 30초 메인 스레드 FPS 그래프')
      graph.width = GRAPH_WIDTH * 2
      graph.height = GRAPH_HEIGHT * 2
      perf.$children.append(graph)
      const graphContext = graph.getContext('2d')
      graphContext?.scale(2, 2)

      const particles = panel.addFolder('입자 (Particles)')
      particles.add(tuning.particles, 'count', 200, 12000, 100).name('입자 수')
      particles
        .add(tuning.particles, 'radius', 10, 240, 1)
        .name('밀어내는 반경(px)')
      particles
        .add(tuning.particles, 'repulsion', 0, 20, 0.1)
        .name('밀어내는 힘')
      particles
        .add(tuning.particles, 'spring', 0.005, 0.2, 0.001)
        .name('복원력')
      particles
        .add(tuning.particles, 'friction', 0.5, 0.98, 0.01)
        .name('마찰(속도 유지)')
      particles.add(tuning.particles, 'size', 0.6, 4, 0.1).name('입자 크기')

      const sequence = panel.addFolder('시퀀스 (Sequence)')
      sequence.add(tuning.sequence, 'lerp', 1, 30, 0.5).name('lerp 빠르기')
      sequence.add(tuning.sequence, 'crossfade').name('이웃 프레임 겹쳐 그리기')

      const hero = panel.addFolder('첫 화면 (Hero)')
      hero
        .add(tuning.hero, 'follow', 1, 20, 0.5)
        .name('마우스 따라가기')
        .onChange(emit)
      hero
        .add(tuning.hero, 'viscosity', 2, 30, 0.5)
        .name('꼬리 끈적임')
        .onChange(emit)
      hero.add(tuning.hero, 'glow', 0, 2, 0.05).name('빛 세기').onChange(emit)

      const render = panel.addFolder('화면 (Render)')
      render
        .add(tuning.render, 'maxDpr', 1, 3, 0.25)
        .name('DPR 상한')
        .onChange(emit)

      panel
        .add(
          {
            reset: () => {
              resetTuning()
              for (const controller of panel.controllersRecursive()) {
                controller.updateDisplay()
              }
            },
          },
          'reset',
        )
        .name('기본값으로 되돌리기')

      const meter = new FpsMeter({ samples: 60 })
      let lastGraph = 0
      loopRef.current = createFrameLoop((_, now) => {
        meter.tick(now)
        if (now - lastGraph < 500) return
        lastGraph = now
        stats.main = Math.round(meter.fps)
        stats.worker = heroRuntime.resting ? 0 : Math.round(heroRuntime.fps.fps)
        stats.mode =
          heroRuntime.mode === 'none'
            ? '멈춤'
            : `${heroRuntime.mode === 'worker' ? 'Worker (OffscreenCanvas)' : '메인 스레드'}${heroRuntime.resting ? ' · 화면 밖이라 쉼' : ''}`
        if (graphContext) {
          drawFpsGraph(
            graphContext,
            meter.values(),
            GRAPH_WIDTH,
            GRAPH_HEIGHT,
            {
              label: `main ${stats.main} fps · worst ${Math.round(meter.worstMs)}ms`,
            },
          )
        }
      })
      loopRef.current.start()
      guiRef.current = panel
    })
    return () => {
      cancelled = true
    }
  }, [open])

  // 닫혀 있는 동안에는 FPS를 재지 않습니다.
  useEffect(() => {
    if (open) loopRef.current?.start()
    else loopRef.current?.stop()
  }, [open])

  useEffect(
    () => () => {
      loopRef.current?.stop()
      guiRef.current?.destroy()
      guiRef.current = null
    },
    [],
  )

  return (
    <section
      id={id}
      ref={hostRef}
      className={styles.panel}
      aria-label="디버그 패널"
      data-lenis-prevent
      hidden={!open}
    />
  )
}
