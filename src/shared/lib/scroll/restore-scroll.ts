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
export function navigationType(): NavigationTimingType | 'unknown' {
  const [entry] = (performance.getEntriesByType?.('navigation') ??
    []) as PerformanceNavigationTiming[]
  if (entry) return entry.type
  const legacy = performance.navigation?.type
  return legacy === undefined ? 'unknown' : (LEGACY_TYPES[legacy] ?? 'unknown')
}

/** 저장한 위치. 저장한 적이 없으면 null (맨 위에서 떠났으면 0) */
function readSaved(key: string): number | null {
  try {
    const raw = window.sessionStorage.getItem(key)
    if (raw === null) return null
    const value = Number(raw)
    return Number.isFinite(value) && value >= 0 ? value : null
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

/** 되돌릴 동작. section은 #구간으로 왔을 때의 그 구간 */
interface Restore {
  apply: () => void
  section?: HTMLElement
}

/** 새로고침·뒤로 가기면 저장한 위치로, 다른 페이지에서 #구간으로 왔으면 그 구간으로 옮기는 동작. 할 일이 없으면 null */
function pickRestore(key: string, hash: string): Restore | null {
  const type = navigationType()
  const saved =
    type === 'reload' || type === 'back_forward' ? readSaved(key) : null
  // 맨 위에서 떠났으면(0) 그대로 둡니다. (#구간 주소여도 구간으로 옮기지 않음)
  if (saved !== null) {
    return saved > 0 ? { apply: () => window.scrollTo(0, saved) } : null
  }
  if (!hash) return null
  let id = hash.slice(1)
  try {
    id = decodeURIComponent(id)
  } catch {
    // 잘못 인코딩된 주소는 그대로 찾습니다.
  }
  const section = document.getElementById(id)
  return section
    ? { apply: () => section.scrollIntoView({ block: 'start' }), section }
    : null
}

/**
 * 브라우저가 이미 #구간으로 옮겼다고 볼 거리(px). 구간 윗선이 머리글 여백(scroll-margin-top)에서 이만큼 안에 있으면.
 * 브라우저가 옮긴 직후의 오차는 1px이 안 되므로, 이보다 멀면 사용자가 먼저 움직인 것으로 봅니다.
 */
const NEAR_SECTION_PX = 32

function nearSection(section: HTMLElement): boolean {
  const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0
  return (
    Math.abs(section.getBoundingClientRect().top - margin) < NEAR_SECTION_PX
  )
}

/** 옮긴 위치를 지켜보는 시간(ms). 페이지의 글꼴을 모두 받은 뒤부터 셉니다. */
export const RESTORE_HOLD_MS = 1500
/** 글꼴이 끝내 오지 않아도 이 시간(ms)이 지나면 그만둡니다. */
const RESTORE_HOLD_MAX_MS = 10_000
const USER_INPUTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
/** 문서 높이가 그대로인데 위치가 이만큼(px) 넘게 바뀌면 사용자가 움직인 것으로 봅니다. (반올림 오차 여유) */
const USER_MOVE_PX = 4

/**
 * 옮긴 직후 위치가 흐트러지는 경우를 잠시 지켜보다가 다시 옮깁니다.
 * - 브라우저가 늦게 자기 기록(맨 위)으로 되돌리는 경우(WebKit)
 * - 글꼴 로딩 화면이 기다리지 않는 글꼴(제목·숫자용)이 늦게 와서 위쪽 높이가 바뀌는 경우.
 *   같은 위치가 다른 내용을 가리키게 되고, WebKit은 스크롤 앵커링으로 위치까지 옮깁니다. (새로고침 4000 → 4026)
 * 페이지의 글꼴을 모두 받은 뒤 한 번 더 맞추고 잠시(RESTORE_HOLD_MS) 더 지켜봅니다.
 * 사용자가 휠·터치·키보드·클릭으로 움직이기 시작하면 바로 그만둡니다. 입력 이벤트 없이 움직인 경우(창 스크롤바 끌기,
 * 스크린 리더의 이동)는 '문서 높이는 그대로인데 위치가 바뀐 것'으로 알아채 그만둡니다. 높이가 바뀌며 밀린 것은
 * 스크롤 앵커링이므로 다시 맞춥니다. 그만두는 함수를 돌려줍니다.
 */
function holdAgainstReset(apply: () => void): () => void {
  let stopped = false
  let timer = 0
  let limit = 0
  const doc = document.documentElement
  // 마지막으로 맞춘 위치와 그때의 문서 높이
  let settledY = window.scrollY
  let settledHeight = doc.scrollHeight
  const realign = () => {
    apply()
    settledY = window.scrollY
    settledHeight = doc.scrollHeight
  }
  const onScroll = () => {
    if (window.scrollY === 0) {
      realign()
      return
    }
    if (
      doc.scrollHeight === settledHeight &&
      Math.abs(window.scrollY - settledY) > USER_MOVE_PX
    ) {
      stop()
    }
  }
  // 처음 observe할 때 알리는 크기는 바뀐 것이 아니므로 건너뜁니다.
  let measured = false
  const observer =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          if (measured) realign()
          measured = true
        })
  const stop = () => {
    if (stopped) return
    stopped = true
    window.clearTimeout(timer)
    window.clearTimeout(limit)
    observer?.disconnect()
    window.removeEventListener('scroll', onScroll)
    for (const type of USER_INPUTS) window.removeEventListener(type, stop)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  for (const type of USER_INPUTS)
    window.addEventListener(type, stop, { passive: true })
  observer?.observe(document.body)
  limit = window.setTimeout(stop, RESTORE_HOLD_MAX_MS)

  const fonts = document.fonts as FontFaceSet | undefined
  if (!fonts || fonts.status === 'loaded') {
    timer = window.setTimeout(stop, RESTORE_HOLD_MS)
  } else {
    const settle = () => {
      if (stopped) return
      realign()
      timer = window.setTimeout(stop, RESTORE_HOLD_MS)
    }
    void fonts.ready.then(settle, settle)
  }
  return stop
}

/**
 * 자바스크립트가 내용을 그리는 페이지에서 브라우저가 놓치는 스크롤 위치를 잡아 줍니다.
 * - 다른 페이지에서 '#구간' 주소로 들어오면 그 구간으로 갑니다. (내용이 생기기 전에 브라우저가 찾기를 끝냄)
 * - 새로고침·뒤로 가기면 떠날 때의 위치로 돌아갑니다. (Safari는 스스로 되돌리지 못함)
 *
 * 글꼴 로딩 화면이 끝난 뒤에 옮깁니다. 가려진 동안이라 튀는 것이 보이지 않고, 글꼴로 바뀐 줄 높이가 반영됩니다.
 * 브라우저가 이미 옮겼거나 사용자가 먼저 스크롤했으면(위치가 0이 아니면) 건드리지 않습니다.
 * (#구간으로 왔고 그 구간 근처라면 늦게 바뀌는 높이에 맞춰 다시 맞추기만 합니다.)
 * 같은 페이지 안에서 #구간을 오가는 뒤로 가기는 브라우저 기본 동작에 맡깁니다.
 */
export function useScrollRestoration(): void {
  useEffect(() => {
    let cancelled = false
    let frame = 0
    let release = () => {}
    // 되돌리기를 마치기 전(글꼴 로딩 중)에는 저장하지 않습니다. 그때의 맨 위(0)가 되돌릴 위치를 덮어쓰지 않게 합니다.
    let restored = false
    const hash = window.location.hash
    const key = storageKey()

    void whenFontsSettled().then(() => {
      if (cancelled) return
      frame = requestAnimationFrame(() => {
        restored = true
        const restore = pickRestore(key, hash)
        if (!restore) return
        if (window.scrollY > 0) {
          // 브라우저가 이미 옮겼으면 그대로 둡니다. 다만 #구간으로 왔다면 브라우저가 내용이 덜 그려진 채 옮겨,
          // 늦게 바뀌는 높이로 구간이 머리글 아래에서 어긋날 수 있으니 옮기지는 않고 지켜보기만 합니다.
          // (사용자가 먼저 멀리 스크롤했으면 건드리지 않음)
          if (restore.section && nearSection(restore.section)) {
            release = holdAgainstReset(restore.apply)
          }
          return
        }
        restore.apply()
        release = holdAgainstReset(restore.apply)
      })
    })

    const saveIfRestored = () => {
      if (restored) save()
    }
    // 모바일 Safari는 앱을 바꿀 때 pagehide 없이 숨기기만 하므로 visibilitychange에서도 저장합니다.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveIfRestored()
    }
    window.addEventListener('pagehide', saveIfRestored)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      release()
      window.removeEventListener('pagehide', saveIfRestored)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])
}
