import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import {
  CASES,
  type CaseId,
  type ChronoState,
  DIALS,
  type DialId,
  LIGHTS,
  type LightId,
  type PusherPresses,
  STRAPS,
  type StrapId,
  type WatchConfig,
  chronoElapsed,
  formatChrono,
  frozenChrono,
  resetChrono,
  showcaseTime,
  syncedChrono,
  toggleChrono,
} from '@/entities/watch'
import { useMotion } from '@/shared/lib/motion'
import { useInView } from '@/shared/lib/viewport'
import { ErrorBoundary } from '@/shared/ui/error-boundary'
import {
  type WatchView,
  readConfig,
  shareUrl,
  writeConfig,
} from '../../model/config-url'
import { useMaxDpr } from '../../model/tuning'
import { SectionHead } from '../SectionHead'
import { ChronoControls } from './ChronoControls'
import styles from './Colors.module.css'
import { type Option, OptionGroup } from './OptionGroup'
import { ShareLink } from './ShareLink'

const WatchStage = lazy(() => import('./WatchStage'))

const DIAL_OPTIONS: readonly Option<DialId>[] = (
  Object.keys(DIALS) as DialId[]
).map((id) => ({
  id,
  name: DIALS[id].name,
  swatch: [DIALS[id].base, DIALS[id].print],
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

/** 움직임을 멈췄을 때 시계가 가리키는 제품 사진 시각 (10시 10분 32초) */
const SHOWCASE_TIME = showcaseTime()

export function describeConfig(config: WatchConfig): string {
  return `${DIALS[config.dial].name} 문자판, ${CASES[config.case].name} 케이스, ${STRAPS[config.strap].name}, ${LIGHTS[config.light].name} 조명`
}

/** 팔레트를 고르면 3D 시계의 색·재질·조명이 lerp로 부드럽게 바뀝니다. */
export function Colors() {
  // 공유 주소(?dial=…&view=…)로 들어오면 그 조합으로 시작합니다.
  const [initial] = useState(() => readConfig(window.location.search))
  const [config, setConfig] = useState<WatchConfig>(initial.config)
  const [view, setView] = useState<WatchView>(initial.view)
  const stageRef = useRef<HTMLDivElement>(null)
  const near = useInView(stageRef, { rootMargin: '600px 0px', once: true })
  const visible = useInView(stageRef)
  const { paused } = useMotion()
  const maxDpr = useMaxDpr()
  const [stage, setStage] = useState<'loading' | 'ready' | 'error'>('loading')
  const summary = describeConfig(config)
  const viewName = VIEW_OPTIONS.find((option) => option.id === view)?.name

  const set =
    <K extends keyof WatchConfig>(key: K) =>
    (value: WatchConfig[K]) =>
      setConfig((current) => ({ ...current, [key]: value }))

  // 고른 조합을 주소에 담아, 새로고침하거나 주소를 복사해도 같은 조합으로 엽니다. (기록은 늘리지 않음)
  useEffect(() => {
    const { pathname, search, hash } = window.location
    const next = writeConfig(search, config, view)
    if (next !== search) {
      window.history.replaceState(
        window.history.state,
        '',
        `${pathname}${next}${hash}`,
      )
    }
  }, [config, view])

  // 크로노그래프: 누르기 전(null)에는 움직임이 켜져 있으면 지금 시각에 맞춰 돌고, 멈춰 있으면 제품 사진 시각에 멈춰 있습니다.
  const [chrono, setChrono] = useState<ChronoState | null>(null)
  const [pushers, setPushers] = useState<PusherPresses>({
    startStop: 0,
    reset: 0,
  })
  const [chronoMessage, setChronoMessage] = useState('')
  const chronoRunning = chrono ? chrono.running : !paused
  const currentChrono = (now: number) =>
    chrono ??
    (paused ? frozenChrono(SHOWCASE_TIME) : syncedChrono(new Date(now)))

  const onStartStop = () => {
    const now = Date.now()
    const next = toggleChrono(currentChrono(now), now)
    setChrono(next)
    setPushers((current) => ({ ...current, startStop: performance.now() }))
    setChronoMessage(
      next.running
        ? '크로노그래프를 시작했습니다.'
        : `크로노그래프를 멈췄습니다. ${formatChrono(chronoElapsed(next, now))}`,
    )
  }
  const onReset = () => {
    const now = Date.now()
    const next = resetChrono(currentChrono(now), now)
    setChrono(next)
    setPushers((current) => ({ ...current, reset: performance.now() }))
    setChronoMessage(
      next.running
        ? '0으로 되돌려 바로 다시 잽니다. (플라이백)'
        : '크로노그래프를 0으로 되돌렸습니다.',
    )
  }

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
      <div className={styles.stageWrap}>
        <div
          ref={stageRef}
          className={styles.stage}
          data-light={config.light}
          role="img"
          aria-label={`${summary}의 A-01 (${viewName})`}
        >
          {near ? (
            <ErrorBoundary fallback={null} onError={() => setStage('error')}>
              <Suspense fallback={null}>
                <WatchStage
                  config={config}
                  view={view}
                  active={visible}
                  paused={paused}
                  maxDpr={maxDpr}
                  chrono={chrono ?? undefined}
                  chronoRunning={chronoRunning}
                  pushers={pushers}
                  onReady={() => setStage('ready')}
                />
              </Suspense>
            </ErrorBoundary>
          ) : null}
        </div>
        {/* role="img" 안의 글은 읽히지 않으므로 불러오는 중·실패 안내는 바깥의 상태 영역에 둡니다.
            (영역은 처음부터 두고 글만 바꿔야 화면 낭독기가 읽습니다) */}
        <p className={styles.stageNote} role="status">
          {!near || stage === 'ready'
            ? ''
            : stage === 'error'
              ? '이 브라우저에서는 3D 모델을 그리지 못했습니다. 아래 견본을 고르면 조합 설명은 그대로 바뀝니다.'
              : '3D 모델을 불러오는 중…'}
        </p>
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
        <ChronoControls
          running={chronoRunning}
          onStartStop={onStartStop}
          onReset={onReset}
          message={chronoMessage}
        />
        <p className={styles.summary} role="status">
          {summary}
        </p>
        <p className={styles.hint}>{LIGHTS[config.light].description}</p>
        <ShareLink url={shareUrl(window.location, config, view)} />
      </div>
    </section>
  )
}
