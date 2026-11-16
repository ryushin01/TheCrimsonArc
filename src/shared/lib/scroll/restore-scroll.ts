import { useEffect } from 'react'
import { whenFontsSettled } from '@/shared/lib/fonts'

const PREFIX = 'crimson-arc:scroll:'

/** 지금 주소(경로와 #구간)마다 떠날 때의 위치를 저장합니다. */
function storageKey(): string {
  return `${PREFIX}${window.location.pathname}${window.location.hash}`
}

const LEGACY_TYPES: Record<number, NavigationTimingType> = {
  0: 'navigate',
  1: 'reload',
  2: 'back_forward',
}

/**
 * 이 페이지에 어떻게 들어왔는지. WebKit은 문서를 읽는 동안(DOMContentLoaded 전) 탐색 기록이 비어 있어
 * 그때는 예전 API(performance.navigation)로 대신합니다.
 */
function navigationType(): NavigationTimingType | 'unknown' {
  const [entry] = (performance.getEntriesByType?.('navigation') ??
    []) as PerformanceNavigationTiming[]
  if (entry) return entry.type
  const legacy = performance.navigation?.type
  return legacy === undefined ? 'unknown' : (LEGACY_TYPES[legacy] ?? 'unknown')
}

function readSaved(key: string): number | null {
  try {
    const value = Number(window.sessionStorage.getItem(key))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function save(): void {
  try {
    window.sessionStorage.setItem(
      storageKey(),
      String(Math.round(window.scrollY)),
    )
  } catch {
    // 저장하지 못하면 돌아올 때 맨 위에서 시작합니다.
  }
}

/** 새로고침·뒤로 가기면 저장한 위치로, 다른 페이지에서 #구간으로 왔으면 그 구간으로 옮기는 동작. 할 일이 없으면 null */
function pickRestore(key: string, hash: string): (() => void) | null {
  const type = navigationType()
  const saved =
    type === 'reload' || type === 'back_forward' ? readSaved(key) : null
  if (saved !== null) return () => window.scrollTo(0, saved)
  if (!hash) return null
  let id = hash.slice(1)
  try {
    id = decodeURIComponent(id)
  } catch {
    // 잘못 인코딩된 주소는 그대로 찾습니다.
  }
  const target = document.getElementById(id)
  return target ? () => target.scrollIntoView({ block: 'start' }) : null
}

/** 옮긴 위치를 지켜보는 시간(ms) */
export const RESTORE_HOLD_MS = 1500
const USER_INPUTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const

/**
 * 옮긴 직후 브라우저가 늦게 자기 기록(맨 위)으로 되돌리는 경우가 있어(WebKit) 잠시 지켜보다가 다시 옮깁니다.
 * 사용자가 휠·터치·키보드·클릭으로 움직이기 시작하면 바로 그만둡니다. 그만두는 함수를 돌려줍니다.
 */
function holdAgainstReset(apply: () => void): () => void {
  let timer = 0
  const onScroll = () => {
    if (window.scrollY === 0) apply()
  }
  const stop = () => {
    window.clearTimeout(timer)
    window.removeEventListener('scroll', onScroll)
    for (const type of USER_INPUTS) window.removeEventListener(type, stop)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  for (const type of USER_INPUTS)
    window.addEventListener(type, stop, { passive: true })
  timer = window.setTimeout(stop, RESTORE_HOLD_MS)
  return stop
}

/**
 * 자바스크립트가 내용을 그리는 페이지에서 브라우저가 놓치는 스크롤 위치를 잡아 줍니다.
 * - 다른 페이지에서 '#구간' 주소로 들어오면 그 구간으로 갑니다. (내용이 생기기 전에 브라우저가 찾기를 끝냄)
 * - 새로고침·뒤로 가기면 떠날 때의 위치로 돌아갑니다. (Safari는 스스로 되돌리지 못함)
 *
 * 글꼴 로딩 화면이 끝난 뒤에 옮깁니다. 가려진 동안이라 튀는 것이 보이지 않고, 글꼴로 바뀐 줄 높이가 반영됩니다.
 * 브라우저가 이미 옮겼거나 사용자가 먼저 스크롤했으면(위치가 0이 아니면) 건드리지 않습니다.
 * 같은 페이지 안에서 #구간을 오가는 뒤로 가기는 브라우저 기본 동작에 맡깁니다.
 */
export function useScrollRestoration(): void {
  useEffect(() => {
    let cancelled = false
    let frame = 0
    let release = () => {}
    const hash = window.location.hash
    const key = storageKey()

    void whenFontsSettled().then(() => {
      if (cancelled) return
      frame = requestAnimationFrame(() => {
        if (window.scrollY > 0) return
        const apply = pickRestore(key, hash)
        if (!apply) return
        apply()
        release = holdAgainstReset(apply)
      })
    })

    // 모바일 Safari는 앱을 바꿀 때 pagehide 없이 숨기기만 하므로 visibilitychange에서도 저장합니다.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') save()
    }
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      release()
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])
}
