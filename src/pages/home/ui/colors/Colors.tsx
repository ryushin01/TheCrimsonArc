import { Suspense, lazy, useRef, useState } from 'react'
import {
  CASES,
  type CaseId,
  DEFAULT_CONFIG,
  DIALS,
  type DialId,
  LIGHTS,
  type LightId,
  STRAPS,
  type StrapId,
  type WatchConfig,
} from '@/entities/watch'
import { useMotion } from '@/shared/lib/motion'
import { useInView } from '@/shared/lib/viewport'
import { ErrorBoundary } from '@/shared/ui/error-boundary'
import { SectionHead } from '../SectionHead'
import styles from './Colors.module.css'
import { type Option, OptionGroup } from './OptionGroup'
import type { WatchView } from './WatchStage'

const WatchStage = lazy(() => import('./WatchStage'))

const DIAL_OPTIONS: readonly Option<DialId>[] = (
  Object.keys(DIALS) as DialId[]
).map((id) => ({
  id,
  name: DIALS[id].name,
  swatch: [DIALS[id].base, DIALS[id].accent],
}))

const CASE_OPTIONS: readonly Option<CaseId>[] = (
  Object.keys(CASES) as CaseId[]
).map((id) => ({ id, name: CASES[id].name, swatch: [CASES[id].color] }))

const STRAP_OPTIONS: readonly Option<StrapId>[] = (
  Object.keys(STRAPS) as StrapId[]
).map((id) => ({ id, name: STRAPS[id].name, swatch: [STRAPS[id].color] }))

const LIGHT_SWATCH: Record<LightId, readonly [string, string]> = {
  studio: ['#f4f1ea', '#8c8f96'],
  sunset: ['#ffb27a', '#b3203a'],
  night: ['#0d1420', '#9dffbf'],
}
const LIGHT_OPTIONS: readonly Option<LightId>[] = (
  Object.keys(LIGHTS) as LightId[]
).map((id) => ({ id, name: LIGHTS[id].name, swatch: LIGHT_SWATCH[id] }))

const VIEW_OPTIONS: readonly Option<WatchView>[] = [
  { id: 'front', name: '앞면' },
  { id: 'side', name: '옆면' },
  { id: 'back', name: '뒷면' },
]

export function describeConfig(config: WatchConfig): string {
  return `${DIALS[config.dial].name} 문자판, ${CASES[config.case].name} 케이스, ${STRAPS[config.strap].name}, ${LIGHTS[config.light].name} 조명`
}

/** 팔레트를 고르면 3D 시계의 색·재질·조명이 lerp로 부드럽게 바뀝니다. */
export function Colors() {
  const [config, setConfig] = useState<WatchConfig>({ ...DEFAULT_CONFIG })
  const [view, setView] = useState<WatchView>('front')
  const stageRef = useRef<HTMLDivElement>(null)
  const near = useInView(stageRef, { rootMargin: '600px 0px', once: true })
  const visible = useInView(stageRef)
  const { paused } = useMotion()
  const summary = describeConfig(config)
  const viewName = VIEW_OPTIONS.find((option) => option.id === view)?.name

  const set =
    <K extends keyof WatchConfig>(key: K) =>
    (value: WatchConfig[K]) =>
      setConfig((current) => ({ ...current, [key]: value }))

  return (
    <section
      id="colors"
      className={styles.colors}
      data-theme="dark"
      aria-labelledby="colors-title"
    >
      <SectionHead
        id="colors-title"
        className={styles.head}
        eyebrow="03 · Colors"
        title="문자판부터 조명까지, 나만의 조합"
        lead="견본을 고르면 three.js로 그린 시계의 색·거칠기·야광이 바로 이어서 바뀝니다. 마우스를 움직이면 시계가 따라 기울어집니다."
      />
      <div
        ref={stageRef}
        className={styles.stage}
        data-light={config.light}
        role="img"
        aria-label={`${summary}의 CA-01 (${viewName})`}
      >
        {near ? (
          <ErrorBoundary
            fallback={
              <p className={styles.fallback}>
                이 브라우저에서는 3D 모델을 그리지 못했습니다.
              </p>
            }
          >
            <Suspense
              fallback={
                <p className={styles.fallback}>3D 모델을 불러오는 중…</p>
              }
            >
              <WatchStage
                config={config}
                view={view}
                active={visible}
                paused={paused}
              />
            </Suspense>
          </ErrorBoundary>
        ) : null}
      </div>
      <div className={styles.controls}>
        <OptionGroup
          legend="문자판"
          name="dial"
          options={DIAL_OPTIONS}
          value={config.dial}
          onChange={set('dial')}
        />
        <OptionGroup
          legend="케이스"
          name="case"
          options={CASE_OPTIONS}
          value={config.case}
          onChange={set('case')}
        />
        <OptionGroup
          legend="스트랩"
          name="strap"
          options={STRAP_OPTIONS}
          value={config.strap}
          onChange={set('strap')}
        />
        <OptionGroup
          legend="조명"
          name="light"
          options={LIGHT_OPTIONS}
          value={config.light}
          onChange={set('light')}
        />
        <OptionGroup
          legend="보는 방향"
          name="view"
          options={VIEW_OPTIONS}
          value={view}
          onChange={setView}
        />
        <p className={styles.summary} role="status">
          {summary}
        </p>
        <p className={styles.hint}>{LIGHTS[config.light].description}</p>
      </div>
    </section>
  )
}
