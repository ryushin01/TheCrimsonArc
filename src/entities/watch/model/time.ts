/** 4Hz(초당 8진동) 무브먼트처럼 초침을 1/8초씩 끊어서 움직입니다. */
export const BEATS_PER_SECOND = 8

export interface HandAngles {
  /** 12시에서 시계 방향으로 잰 라디안 */
  hour: number
  minute: number
  second: number
  /** 6시 크로노그래프 30분 적산계: 잰 분을 30분에 한 바퀴로 */
  counter: number
}

const TAU = Math.PI * 2

export function handAngles(date: Date, beats = BEATS_PER_SECOND): HandAngles {
  const ms = date.getMilliseconds()
  const seconds = date.getSeconds() + Math.floor((ms / 1000) * beats) / beats
  const minutes = date.getMinutes() + seconds / 60
  const hours = (date.getHours() % 12) + minutes / 60
  return {
    hour: (hours / 12) * TAU,
    minute: (minutes / 60) * TAU,
    second: (seconds / 60) * TAU,
    counter: ((minutes % 30) / 30) * TAU,
  }
}

/** 제품 사진의 관례인 10시 10분 32초 */
export function showcaseTime(): Date {
  const date = new Date(2026, 10, 13, 10, 10, 32, 0)
  return date
}
