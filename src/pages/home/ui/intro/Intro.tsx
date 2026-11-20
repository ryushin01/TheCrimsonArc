import {
  type CSSProperties,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  LINEUP,
  LINEUP_IMAGE_SIZE,
  lineupImageUrl,
  lineupLabel,
} from '@/entities/watch'
import { whenFontsSettled } from '@/shared/lib/fonts'
import { Button } from '@/shared/ui/button'
import { markIntroSeen } from '../../lib/intro'
import styles from './Intro.module.css'
import { DialOrbit, DialRing, DialSky } from './ZodiacDial'

/**
 * 들어가기 연출(다이얼이 돌며 다가오고 가운데가 열려 첫 화면이 드러남)이 끝나 인트로를 닫기까지의 시간(ms).
 * Intro.module.css의 intro-stage-out·intro-open과 맞춥니다.
 */
export const INTRO_ENTER_MS = 1500
/** 이만큼(px) 아래로 휠을 굴리거나 화면을 위로 밀면 들어갑니다. */
const SWIPE_PX = 36

/** waiting: 글꼴 로딩 화면 뒤에서 기다림, open: 다이얼이 돌며 기다림, entering: 들어가는 중 */
type Phase = 'waiting' | 'open' | 'entering'

function showLoaded(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.dataset.loaded = 'true'
}

export interface IntroProps {
  /** 인트로가 닫힌 뒤(들어가기를 마쳤거나 Esc로 건너뜀) 부릅니다. */
  onDone: () => void
}

/**
 * 첫 화면 인트로: 조디악 다이얼 궤도에서 A-01 열두 조합이 공전하다가,
 * '입장하기'·스크롤·화면 누르기로 다이얼이 돌며 다가오고 가운데가 원형으로 열리며 첫 화면이 드러납니다.
 * 네이티브 <dialog>의 showModal()로 열어 뒤 페이지는 비활성이고, Esc로 바로 건너뜁니다.
 * 닫히면 초점은 문서 처음으로 돌아가 다음 Tab이 '본문 바로가기'부터 시작합니다.
 */
export function Intro({ onDone }: IntroProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [phase, setPhase] = useState<Phase>('waiting')
  const phaseRef = useRef<Phase>('waiting')
  const titleId = useId()
  const leadId = useId()
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  const moveTo = useCallback((next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  // 글꼴 로딩 화면이 사라지는 바로 그 작업 안에서 열어, 사이에 첫 화면이 비치지 않게 합니다.
  // (whenFontsSettled는 로딩 화면을 없애는 작업의 마이크로태스크에서 끝납니다.)
  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.intro = 'pending'
    let active = true
    void whenFontsSettled().then(() => {
      const dialog = ref.current
      if (!active || !dialog) return
      if (!dialog.open) dialog.showModal()
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
      root.dataset.intro = 'open'
      markIntroSeen()
      moveTo('open')
    })
    return () => {
      active = false
      delete root.dataset.intro
    }
  }, [moveTo])

  const enter = useCallback(() => {
    if (phaseRef.current === 'open') moveTo('entering')
  }, [moveTo])

  // 들어가기 연출이 끝나면 닫습니다.
  useEffect(() => {
    if (phase !== 'entering') return
    const timer = window.setTimeout(() => ref.current?.close(), INTRO_ENTER_MS)
    return () => window.clearTimeout(timer)
  }, [phase])

  // 닫히면(들어가기를 마쳤거나 Esc로 건너뜀) 바로 첫 화면을 돌려줍니다.
  // 브라우저는 닫는 즉시 open 속성을 빼지만 close 이벤트는 다음 렌더링 뒤에야 보내서,
  // 렌더링이 느린 기기에서는 그동안(수 초) 스크롤이 잠겨 있었습니다. 그래서 open 속성이 빠지는 순간을 지켜보고,
  // 뒤늦게 온 close 이벤트는 한 번만 처리합니다.
  const doneRef = useRef(false)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const finish = () => {
      if (dialog.open || doneRef.current) return
      doneRef.current = true
      delete document.documentElement.dataset.intro
      onDoneRef.current()
    }
    const observer = new MutationObserver(finish)
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] })
    dialog.addEventListener('close', finish)
    return () => {
      observer.disconnect()
      dialog.removeEventListener('close', finish)
    }
  }, [])

  // 버튼 말고도 휠을 아래로 굴리거나, 화면을 위로 밀거나, 아래 화살표·Page Down을 누르거나, 화면을 눌러도 들어갑니다.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    let wheel = 0
    let touchY: number | null = null
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      wheel = Math.max(0, wheel + event.deltaY)
      if (wheel > SWIPE_PX) enter()
    }
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null
    }
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY
      if (touchY !== null && y !== undefined && touchY - y > SWIPE_PX) enter()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault()
        enter()
      }
    }
    dialog.addEventListener('wheel', onWheel, { passive: false })
    dialog.addEventListener('touchstart', onTouchStart, { passive: true })
    dialog.addEventListener('touchmove', onTouchMove, { passive: true })
    dialog.addEventListener('keydown', onKeyDown)
    dialog.addEventListener('click', enter)
    return () => {
      dialog.removeEventListener('wheel', onWheel)
      dialog.removeEventListener('touchstart', onTouchStart)
      dialog.removeEventListener('touchmove', onTouchMove)
      dialog.removeEventListener('keydown', onKeyDown)
      dialog.removeEventListener('click', enter)
    }
  }, [enter])

  // 글꼴(약 1MB)을 받는 동안에는 시계 이미지를 받지 않아 대역폭을 나눠 쓰지 않습니다.
  const ready = phase !== 'waiting'

  return (
    <dialog
      ref={ref}
      className={styles.intro}
      data-phase={phase}
      data-theme="dark"
      aria-labelledby={titleId}
      aria-describedby={leadId}
    >
      <div className={styles.sky} aria-hidden="true" />
      <div className={styles.copy}>
        <p className={styles.eyebrow} lang="en">
          Twelve faces · One Ash Core
        </p>
        <h2 id={titleId} className={styles.title} lang="en">
          The Crimson Arc
        </h2>
        <p id={leadId} className={styles.lead}>
          세계 최초의 특수합금 무브먼트{' '}
          <span className={styles.nowrap}>
            애쉬 코어(<span lang="en">Ash Core</span>)를
          </span>{' '}
          품은 A-01의 열두 가지 얼굴
        </p>
        <Button
          variant="crimson"
          icon="chevron-down"
          data-autofocus
          onClick={enter}
        >
          입장하기
        </Button>
      </div>
      <div className={styles.stage}>
        <div className={styles.dial}>
          <DialSky className={styles.heavens} />
          <DialRing className={styles.ring} />
          <div className={styles.orbit}>
            <DialOrbit className={styles.track} />
            <ol className={styles.watches} aria-label="A-01 열두 가지 조합">
              {LINEUP.map((entry, index) => (
                <li
                  key={`${entry.dial}-${entry.case}`}
                  className={styles.watch}
                  style={{ '--i': index } as CSSProperties}
                >
                  <picture className={styles.upright}>
                    <source
                      type="image/avif"
                      srcSet={ready ? lineupImageUrl(index, 'avif') : undefined}
                    />
                    <img
                      className={styles.image}
                      src={ready ? lineupImageUrl(index, 'webp') : undefined}
                      alt={lineupLabel(entry)}
                      width={LINEUP_IMAGE_SIZE}
                      height={LINEUP_IMAGE_SIZE}
                      decoding="async"
                      fetchPriority="high"
                      onLoad={showLoaded}
                    />
                  </picture>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <p className={styles.hint}>스크롤하거나 화면을 눌러도 들어갑니다</p>
    </dialog>
  )
}
