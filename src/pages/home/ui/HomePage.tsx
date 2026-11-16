import { useEffect, useId, useState } from 'react'
import { PRODUCT_SECTIONS, sectionNav } from '@/shared/config'
import { whenFontsSettled } from '@/shared/lib/fonts'
import { useMotion } from '@/shared/lib/motion'
import { useHashLinks, useSmoothScroll } from '@/shared/lib/scroll'
import { SiteFooter } from '@/widgets/site-footer'
import { SiteHeader } from '@/widgets/site-header'
import { sequenceFrames } from '../lib/sequence-frames'
import { Anatomy } from './anatomy/Anatomy'
import { Colors } from './colors/Colors'
import { DebugPanel, DebugToggle, debugInitiallyOpen } from './debug/DebugPanel'
import { Details } from './details/Details'
import { Hero } from './hero/Hero'
import { Lab } from './lab/Lab'
import { NextModel } from './next/NextModel'
import { Specs } from './specs/Specs'

/** 큰 제목과 입자 글자에 쓰는 글꼴도 첫 화면 로딩에 포함합니다. */
function loadTitleFont(): Promise<unknown> {
  return document.fonts?.load('700 100px "Electrolize"') ?? Promise.resolve()
}

export function HomePage() {
  const { reduced } = useMotion()
  const [debugOpen, setDebugOpen] = useState(debugInitiallyOpen)
  const panelId = useId()
  useSmoothScroll(!reduced)
  useHashLinks(!reduced)

  // 핵심 프레임(약 400KB)은 한글 글꼴(약 1MB)을 다 받은 뒤에 받기 시작합니다.
  // 함께 받으면 느린 회선에서 대역폭을 나눠 써서 글꼴 로딩 화면이 그만큼 길어집니다.
  useEffect(() => {
    void whenFontsSettled().then(() => sequenceFrames.start([loadTitleFont()]))
  }, [])

  return (
    <>
      <SiteHeader
        page="home"
        nav={sectionNav(PRODUCT_SECTIONS)}
        cta={{
          href: '#colors',
          label: 'Configure',
          title: '색 고르기',
          icon: 'chevron-down',
        }}
        actions={
          <DebugToggle
            open={debugOpen}
            panelId={panelId}
            onToggle={() => setDebugOpen((open) => !open)}
          />
        }
        showMotionToggle
      />
      <main id="main">
        <Hero />
        <Anatomy />
        <Details />
        <Colors />
        <Specs />
        <NextModel />
        <Lab />
      </main>
      <SiteFooter page="home" />
      <DebugPanel id={panelId} open={debugOpen} />
    </>
  )
}
