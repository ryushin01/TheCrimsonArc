import { useSyncExternalStore } from 'react'

/** lil-gui 디버그 패널로 바꾸는 값. 엔진들이 매 프레임 직접 읽으므로 React를 다시 그리지 않습니다. */
export interface HomeTuning {
  particles: {
    count: number
    radius: number
    repulsion: number
    spring: number
    friction: number
    size: number
  }
  sequence: {
    /** 스크롤 위치를 따라가는 lerp 빠르기 (초당) */
    lerp: number
    /** 이웃 프레임을 겹쳐 그려 사이 각도를 메울지 */
    crossfade: boolean
  }
  hero: {
    /** 빛 덩어리가 마우스를 따라가는 빠르기 */
    follow: number
    /** 꼬리가 앞 점을 따라가는 빠르기 (작을수록 끈적함) */
    viscosity: number
    /** 빛 번짐 세기 */
    glow: number
  }
  render: {
    /** 캔버스 해상도에 쓰는 기기 배율 상한 */
    maxDpr: number
  }
}

const isNarrow = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(max-width: 640px)').matches

export function defaultTuning(narrow = isNarrow()): HomeTuning {
  return {
    particles: {
      count: narrow ? 1800 : 4200,
      radius: narrow ? 64 : 96,
      repulsion: 5,
      spring: 0.055,
      friction: 0.84,
      size: narrow ? 1.7 : 1.9,
    },
    sequence: { lerp: 9, crossfade: true },
    hero: { follow: 7, viscosity: 11, glow: 1 },
    render: { maxDpr: 2 },
  }
}

export const tuning: HomeTuning = defaultTuning()

type Listener = (tuning: Readonly<HomeTuning>) => void
const listeners = new Set<Listener>()

export const tuningEvents = {
  /** 값이 바뀌었다고 알립니다. (Worker로 보내야 하는 값 등) */
  emit(): void {
    for (const listener of listeners) listener(tuning)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function resetTuning(): void {
  const fresh = defaultTuning()
  Object.assign(tuning.particles, fresh.particles)
  Object.assign(tuning.sequence, fresh.sequence)
  Object.assign(tuning.hero, fresh.hero)
  Object.assign(tuning.render, fresh.render)
  tuningEvents.emit()
}

/** DPR 상한을 React 화면에서 읽습니다. (three.js 캔버스의 dpr 속성처럼 다시 그려야 하는 곳) */
export function useMaxDpr(): number {
  return useSyncExternalStore(
    tuningEvents.subscribe,
    () => tuning.render.maxDpr,
    () => tuning.render.maxDpr,
  )
}
