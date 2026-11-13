import { Suspense, lazy, useEffect, useState } from 'react'
import { useMotion } from '@/shared/lib/motion'
import { pointerStore } from '@/shared/lib/pointer'
import { useHashLinks, useSmoothScroll } from '@/shared/lib/scroll'
import { ErrorBoundary } from '@/shared/ui/error-boundary'
import { SiteFooter } from '@/widgets/site-footer'
import { SiteHeader } from '@/widgets/site-header'
import { anchorStore } from '../model/anchors'
import { Atmosphere } from './effects/Atmosphere'
import { CursorRing } from './effects/CursorRing'
import { Grain } from './effects/Grain'
import { TuningPanel } from './effects/TuningPanel'
import styles from './HomePage.module.css'
import { About } from './sections/About'
import { ExportShowcase } from './sections/ExportShowcase'
import { FramesShowcase } from './sections/FramesShowcase'
import { Hero } from './sections/Hero'
import { LayersShowcase } from './sections/LayersShowcase'
import { Launch } from './sections/Launch'
import { OpenShowcase } from './sections/OpenShowcase'
import { Process } from './sections/Process'
import { Specs } from './sections/Specs'

const ArcStage = lazy(() => import('./stage/ArcStage'))

/** 3D 무대는 첫 화면의 글자가 먼저 그려진 뒤에 받습니다. */
function useDeferredStage(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const start = () => setReady(true)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(start, { timeout: 1200 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(start, 300)
    return () => clearTimeout(id)
  }, [])
  return ready
}

export function HomePage() {
  const { reduced } = useMotion()
  const stageReady = useDeferredStage()
  useSmoothScroll(!reduced)
  useHashLinks(!reduced)
  useEffect(() => pointerStore.retain(), [])

  return (
    <>
      <SiteHeader page="home" showMotionToggle />
      <Atmosphere />
      {stageReady ? (
        <ErrorBoundary onError={() => anchorStore.hideAll()}>
          <Suspense fallback={null}>
            <ArcStage />
          </Suspense>
        </ErrorBoundary>
      ) : null}
      <main id="main" className={styles.main}>
        <Hero />
        <About />
        <Process />
        <LayersShowcase />
        <FramesShowcase />
        <ExportShowcase />
        <OpenShowcase />
        <Specs />
        <Launch />
      </main>
      <SiteFooter page="home" />
      <Grain />
      <CursorRing />
      <TuningPanel />
    </>
  )
}
