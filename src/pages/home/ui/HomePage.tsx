import { Provider } from 'jotai'
import { useEffect, useId, useState } from 'react'
import { PRODUCT_SECTIONS, sectionNav } from '@/shared/config'
import { whenFontsSettled } from '@/shared/lib/fonts'
import { useMotion } from '@/shared/lib/motion'
import {
  useHashLinks,
  useScrollRestoration,
  useSmoothScroll,
} from '@/shared/lib/scroll'
import { SiteFooter } from '@/widgets/site-footer'
import { SiteHeader } from '@/widgets/site-header'
import { readIntroEnv, shouldShowIntro } from '../lib/intro'
import { sequenceFrames } from '../lib/sequence-frames'
import { Anatomy } from './anatomy/Anatomy'
import { Colors } from './colors/Colors'
import { DebugPanel, DebugToggle, debugInitiallyOpen } from './debug/DebugPanel'
import { Details } from './details/Details'
import { Hero } from './hero/Hero'
import { Intro } from './intro/Intro'
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
  // 처음 들어올 때만 보여 주는 인트로(조디악 다이얼). 구간 링크·새로고침·동작 줄이기 등은 건너뜁니다.
  const [intro, setIntro] = useState(() => shouldShowIntro(readIntroEnv()))
  const panelId = useId()
  // 인트로가 열려 있는 동안은 부드러운 스크롤을 켜지 않아 휠이 뒤 페이지를 움직이지 않게 합니다.
  useSmoothScroll(!reduced && !intro)
  useHashLinks(!reduced)
  useScrollRestoration()

  // 핵심 프레임(약 400KB)은 한글 글꼴(약 1MB)을 다 받은 뒤에 받기 시작합니다.
  // 함께 받으면 느린 회선에서 대역폭을 나눠 써서 글꼴 로딩 화면이 그만큼 길어집니다.
  useEffect(() => {
    void whenFontsSettled().then(() => sequenceFrames.start([loadTitleFont()]))
  }, [])

  // 구성기 상태(Jotai)는 페이지마다 새 store에 둡니다. R3F Canvas 안까지 같은 store가 이어집니다.
  return (
    <Provider>
      {intro ? <Intro onDone={() => setIntro(false)} /> : null}
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
    </Provider>
  )
}
