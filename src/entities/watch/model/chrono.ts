import { BEATS_PER_SECOND } from './time'

/**
 * 6시 30분 적산계를 갖춘 크로노그래프의 상태.
 * 도는 중이면 since부터 흐른 시간을 elapsedMs에 더해 읽습니다.
 * 시각은 모두 performance.now() 기준(ms)입니다. 시스템 시계를 뒤로 맞춰도 잰 시간이 거꾸로 가지 않게 합니다.
 */
export interface ChronoState {
  running: boolean
  /** 멈춘 순간까지 잰 시간(ms). 도는 중이면 since 이전까지 잰 시간 */
  elapsedMs: number
  /** 마지막으로 시작한 시각(performance.now ms) */
  since: number
}

const TAU = Math.PI * 2
const MINUTE = 60_000
/** 적산계가 한 바퀴 도는 시간: 30분 */
export const CHRONO_COUNTER_MS = 30 * MINUTE

/** 지금까지 잰 시간(ms) */
export function chronoElapsed(state: ChronoState, now: number): number {
  return state.running
    ? state.elapsedMs + Math.max(0, now - state.since)
    : state.elapsedMs
}

/** 2시 푸셔: 멈춰 있으면 이어서 재고, 돌고 있으면 멈춥니다. */
export function toggleChrono(state: ChronoState, now: number): ChronoState {
  return state.running
    ? { running: false, elapsedMs: chronoElapsed(state, now), since: now }
    : { running: true, elapsedMs: state.elapsedMs, since: now }
}

/**
 * 4시 푸셔: 0으로 되돌립니다. 도는 중이면 0에서 바로 다시 잽니다(플라이백).
 * 파일럿이 구간을 바꿀 때 멈추고·되돌리고·다시 시작하는 세 번 누르기를 한 번으로 줄인 기능입니다.
 */
export function resetChrono(state: ChronoState, now: number): ChronoState {
  return { running: state.running, elapsedMs: 0, since: now }
}

/** 시각 date의 분(30분 단위)·초·밀리초를 잰 시간(ms)으로 */
function clockElapsed(date: Date): number {
  return (
    ((date.getMinutes() % 30) * 60 + date.getSeconds()) * 1000 +
    date.getMilliseconds()
  )
}

/**
 * 지금 시각에 맞춰 돌고 있는 크로노그래프. 처음 모습이 시계 초침·분처럼 보이도록
 * 가운데 초침은 date의 초를, 적산계는 분(30분 단위)을 가리키게 맞추고, now(performance.now)부터 잽니다.
 */
export function syncedChrono(date: Date, now: number): ChronoState {
  return { running: true, elapsedMs: clockElapsed(date), since: now }
}

/** 시각 date에 멈춰 있는 크로노그래프 (움직임을 멈췄을 때의 제품 사진 시각) */
export function frozenChrono(date: Date): ChronoState {
  return { running: false, elapsedMs: clockElapsed(date), since: 0 }
}

export interface ChronoAngles {
  /** 가운데 크로노그래프 초침 (12시에서 시계 방향 라디안) */
  second: number
  /** 6시 30분 적산계 바늘 */
  counter: number
}

/** 잰 시간을 바늘 각도로. 초침은 4Hz 무브먼트처럼 1/8초씩 끊어 갑니다. */
export function chronoAngles(
  elapsedMs: number,
  beats = BEATS_PER_SECOND,
): ChronoAngles {
  const seconds = Math.floor(((elapsedMs % MINUTE) / 1000) * beats) / beats
  return {
    second: (seconds / 60) * TAU,
    counter: ((elapsedMs % CHRONO_COUNTER_MS) / CHRONO_COUNTER_MS) * TAU,
  }
}

/** 화면 낭독기에 읽어 줄 잰 시간, 예: '12분 3초' */
export function formatChrono(elapsedMs: number): string {
  const total = Math.floor(elapsedMs / 1000) % (CHRONO_COUNTER_MS / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return minutes ? `${minutes}분 ${seconds}초` : `${seconds}초`
}
