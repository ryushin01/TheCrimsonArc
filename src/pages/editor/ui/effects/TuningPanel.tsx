import type GUI from 'lil-gui'
import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@/shared/ui/icon'
import { type TuningParams, tuningStore } from '../../model/tuning'
import styles from './TuningPanel.module.css'

function initiallyOpen(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('gui')
  } catch {
    return false
  }
}

/**
 * 3D 무대 값을 바꿔 보는 lil-gui 패널. 처음 열 때만 lil-gui를 불러옵니다.
 * 주소에 ?gui를 붙이면 열린 채로 시작합니다.
 */
export function TuningPanel() {
  const [open, setOpen] = useState(initiallyOpen)
  const host = useRef<HTMLDivElement>(null)
  const gui = useRef<GUI | null>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open || gui.current) return
    let cancelled = false
    void import('lil-gui').then(({ default: LilGUI }) => {
      const container = host.current
      if (cancelled || !container || gui.current) return
      const params: TuningParams = { ...tuningStore.get() }
      const set =
        <K extends keyof TuningParams>(key: K) =>
        (value: TuningParams[K]) =>
          tuningStore.set({ [key]: value } as Partial<TuningParams>)

      const panel = new LilGUI({
        container,
        title: 'Arc tuning · lil-gui',
        width: 300,
      })
      const arc = panel.addFolder('호 (Arc)')
      arc
        .addColor(params, 'arcColor')
        .name('앞 조각 색')
        .onChange(set('arcColor'))
      arc
        .addColor(params, 'arcDeepColor')
        .name('뒤 조각 색')
        .onChange(set('arcDeepColor'))
      arc
        .add(params, 'sliceCount', 2, 8, 1)
        .name('조각(레이어) 수')
        .onChange(set('sliceCount'))
      arc
        .add(params, 'metalness', 0, 1, 0.01)
        .name('금속성')
        .onChange(set('metalness'))
      arc
        .add(params, 'roughness', 0, 1, 0.01)
        .name('거칠기')
        .onChange(set('roughness'))
      arc
        .add(params, 'clearcoat', 0, 1, 0.01)
        .name('클리어코트')
        .onChange(set('clearcoat'))
      arc
        .add(params, 'scratch', 0, 1, 0.01)
        .name('흠집 세기')
        .onChange(set('scratch'))

      const motion = panel.addFolder('움직임 (Motion)')
      motion
        .add(params, 'spinSpeed', 0, 1.5, 0.01)
        .name('흔들림 속도')
        .onChange(set('spinSpeed'))
      motion
        .add(params, 'tilt', 0, 2, 0.01)
        .name('마우스 기울기')
        .onChange(set('tilt'))
      motion
        .add(params, 'pointerLerp', 1, 14, 0.1)
        .name('마우스 lerp 빠르기')
        .onChange(set('pointerLerp'))
      motion
        .add(params, 'extraGap', 0, 0.6, 0.01)
        .name('조각 간격 더하기')
        .onChange(set('extraGap'))

      const atmosphere = panel.addFolder('분위기 (Atmosphere)')
      atmosphere
        .add(params, 'sparkles')
        .name('반짝이')
        .onChange(set('sparkles'))
      atmosphere
        .add(params, 'sparkleCount', 0, 200, 1)
        .name('반짝이 수')
        .onChange(set('sparkleCount'))
      atmosphere.add(params, 'grid').name('바닥 격자').onChange(set('grid'))
      atmosphere
        .add(params, 'grain', 0, 0.4, 0.01)
        .name('그레인')
        .onChange(set('grain'))
      atmosphere
        .add(params, 'glow', 0, 1.5, 0.01)
        .name('빛 번짐')
        .onChange(set('glow'))

      panel
        .add(
          {
            reset: () => {
              panel.reset()
              tuningStore.reset()
            },
          },
          'reset',
        )
        .name('기본값으로 되돌리기')
      gui.current = panel
    })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(
    () => () => {
      gui.current?.destroy()
      gui.current = null
    },
    [],
  )

  return (
    <div className={styles.tuning}>
      <section
        id={panelId}
        ref={host}
        className={styles.host}
        aria-label="3D 튜닝 패널"
        hidden={!open}
      />
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="sliders" size={16} />
        튜닝
      </button>
    </div>
  )
}
