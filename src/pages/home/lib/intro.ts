import { motionStore } from '@/shared/lib/motion'
import { navigationType } from '@/shared/lib/scroll'

/** 이번 탭에서 인트로를 이미 봤는지 남기는 sessionStorage 키 */
export const INTRO_SEEN_KEY = 'crimson-arc:intro'

/** 인트로를 보여 줄지 정하는 데 쓰는 지금 상태 */
export interface IntroEnv {
  /** 주소의 ?intro 값. '1'이면 늘 보여 주고(확인·화면 찍기용), '0'이면 건너뜁니다. */
  force: string | null
  /** 주소의 #구간 */
  hash: string
  /** 이 페이지에 어떻게 들어왔는지 (새로 열기, 새로고침, 뒤로·앞으로) */
  navigation: NavigationTimingType | 'unknown'
  /** 이번 탭에서 이미 봤는지 */
  seen: boolean
  /** 운영체제의 '동작 줄이기' */
  reduced: boolean
  /** 머리글의 '움직임 멈춤' */
  paused: boolean
}

/**
 * 첫 화면 인트로(조디악 다이얼)를 보여 줄지 정합니다.
 * - 회전·확대 연출이라 운영체제 '동작 줄이기'면 언제나 건너뜁니다.
 * - ?intro=1이면 그 밖의 조건과 상관없이 보여 주고, ?intro=0이면 건너뜁니다.
 * - 움직임 멈춤, 구간 링크·공유 주소(#…)로 온 경우, 새로고침·뒤로 가기, 이번 탭에서 이미 본 경우에도 건너뜁니다.
 *   (보러 온 구간이나 보던 위치로 곧장 가야 하므로)
 */
export function shouldShowIntro(env: IntroEnv): boolean {
  if (env.reduced) return false
  if (env.force === '1') return true
  if (env.force === '0') return false
  if (env.paused || env.hash) return false
  if (env.navigation === 'reload' || env.navigation === 'back_forward') {
    return false
  }
  return !env.seen
}

function readSeen(): boolean {
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) === 'seen'
  } catch {
    return false
  }
}

/** 브라우저에서 지금 상태를 읽습니다. */
export function readIntroEnv(): IntroEnv {
  const { reduced, paused } = motionStore.get()
  return {
    force: new URLSearchParams(window.location.search).get('intro'),
    hash: window.location.hash,
    navigation: navigationType(),
    seen: readSeen(),
    reduced,
    paused,
  }
}

/** 이번 탭에서는 인트로를 다시 보여 주지 않도록 남깁니다. */
export function markIntroSeen(): void {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, 'seen')
  } catch {
    // 저장하지 못하면 다음에 들어올 때 다시 보여 줄 뿐입니다.
  }
}
