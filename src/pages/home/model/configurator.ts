import { atom } from 'jotai'
import { atomWithLocation } from 'jotai-location'
import {
  type ChronoState,
  type PusherPresses,
  type WatchConfig,
  chronoElapsed,
  formatChrono,
  frozenChrono,
  resetChrono,
  showcaseTime,
  syncedChrono,
  toggleChrono,
} from '@/entities/watch'
import { type WatchView, readConfig, writeConfig } from './config-url'

/*
 * 구성기 상태 (Jotai)
 * - 고른 조합(문자판·케이스·스트랩·조명)과 보는 방향은 따로 담지 않고 주소(`?dial=…&view=…`)에서 읽는 파생 atom입니다.
 *   고르면 기존 형식(config-url.ts) 그대로 주소를 고쳐 쓰므로(기록은 늘리지 않음) 예전 공유 링크도 그대로 열립니다.
 * - 크로노그래프 상태와 푸셔를 누른 시각도 atom에 두어, R3F Canvas 안의 시계와 바깥의 버튼이 같은 store를 씁니다.
 *   (R3F 9의 Canvas는 바깥 React 컨텍스트를 이어 주므로 페이지의 Provider가 Canvas 안까지 닿습니다)
 */

/** 주소. 앞뒤로 가기(popstate)에도 따라 바뀌고, 쓸 때는 replaceState로 지금 기록만 고칩니다(history.state·#구간 유지). */
const locationAtom = atomWithLocation({ replace: true })

/** 주소의 검색 부분. 글자가 같으면 아래 atom을 다시 계산하지 않습니다. */
const searchAtom = atom(
  (get) => get(locationAtom).searchParams?.toString() ?? '',
)

const selectionAtom = atom((get) => readConfig(get(searchAtom)))

// 항목마다 나눠 두어, 한 항목(예: 보는 방향)만 바뀌면 조합 객체가 그대로 유지됩니다. (재질을 다시 만들지 않음)
const dialAtom = atom((get) => get(selectionAtom).config.dial)
const caseAtom = atom((get) => get(selectionAtom).config.case)
const strapAtom = atom((get) => get(selectionAtom).config.strap)
const lightAtom = atom((get) => get(selectionAtom).config.light)

/** 조합과 방향을 기존 주소 형식으로 씁니다. 다른 매개변수(`?debug` 등)와 #구간은 그대로 둡니다. */
const writeSelectionAtom = atom(
  null,
  (_get, set, next: { config: WatchConfig; view: WatchView }) => {
    const { search } = window.location
    const query = writeConfig(search, next.config, next.view)
    if (query === search) return
    set(locationAtom, { searchParams: new URLSearchParams(query) })
  },
)

/** 고른 조합. 쓰면 바꾼 항목만 주소에 반영합니다. */
export const watchConfigAtom = atom(
  (get): WatchConfig => ({
    dial: get(dialAtom),
    case: get(caseAtom),
    strap: get(strapAtom),
    light: get(lightAtom),
  }),
  (get, set, update: Partial<WatchConfig>) => {
    const { config, view } = get(selectionAtom)
    set(writeSelectionAtom, { config: { ...config, ...update }, view })
  },
)

/** 보는 방향 */
export const watchViewAtom = atom(
  (get) => get(selectionAtom).view,
  (get, set, view: WatchView) => {
    set(writeSelectionAtom, { config: get(selectionAtom).config, view })
  },
)

/**
 * 구성기를 처음 열 때 주소를 정리합니다. (기본값·모르는 값은 주소에서 뺌)
 * 구독이 붙기 전일 수 있어 atom 대신 지금 주소를 바로 읽습니다.
 */
export const normalizeConfigUrlAtom = atom(null, (_get, set) => {
  set(writeSelectionAtom, readConfig(window.location.search))
})

/** 움직임을 멈췄을 때 시계가 가리키는 제품 사진 시각 (10시 10분 32초) */
const SHOWCASE_TIME = showcaseTime()

/** 크로노그래프를 눌렀으면 그 상태. 누르기 전(null)에는 움직임이 켜져 있으면 지금 시각에 맞춰 돌고, 멈춰 있으면 제품 사진 시각에 멈춰 있습니다. */
export const chronoAtom = atom<ChronoState | null>(null)

/** 푸셔를 마지막으로 누른 시각 (3D 푸셔가 눌렸다 돌아오는 연출) */
export const pushersAtom = atom<PusherPresses>({ startStop: 0, reset: 0 })

/** 푸셔를 누른 결과 알림 */
export const chronoMessageAtom = atom('')

/** 크로노그래프 바늘이 도는 중인지 */
export function isChronoRunning(
  chrono: ChronoState | null,
  paused: boolean,
): boolean {
  return chrono ? chrono.running : !paused
}

function currentChrono(
  chrono: ChronoState | null,
  paused: boolean,
  now: number,
): ChronoState {
  return (
    chrono ??
    (paused ? frozenChrono(SHOWCASE_TIME) : syncedChrono(new Date(), now))
  )
}

/** 2시(시작·정지) 또는 4시(0으로 되돌리기, 도는 중이면 플라이백) 푸셔를 누릅니다. */
export const pressPusherAtom = atom(
  null,
  (
    get,
    set,
    { pusher, paused }: { pusher: keyof PusherPresses; paused: boolean },
  ) => {
    // 잰 시간은 시스템 시계와 상관없는 단조 시계로 잽니다.
    const now = performance.now()
    const current = currentChrono(get(chronoAtom), paused, now)
    const next =
      pusher === 'startStop'
        ? toggleChrono(current, now)
        : resetChrono(current, now)
    set(chronoAtom, next)
    set(pushersAtom, (presses) => ({ ...presses, [pusher]: now }))
    set(
      chronoMessageAtom,
      pusher === 'startStop'
        ? next.running
          ? '크로노그래프를 시작했습니다.'
          : `크로노그래프를 멈췄습니다. ${formatChrono(chronoElapsed(next, now))}`
        : next.running
          ? '0으로 되돌려 바로 다시 잽니다. (플라이백)'
          : '크로노그래프를 0으로 되돌렸습니다.',
    )
  },
)
