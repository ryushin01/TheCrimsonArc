import { useSyncExternalStore } from 'react'

/** lil-gui 튜닝 패널로 바꿀 수 있는 3D 무대 값 */
export interface TuningParams {
  arcColor: string
  arcDeepColor: string
  metalness: number
  roughness: number
  clearcoat: number
  scratch: number
  sliceCount: number
  extraGap: number
  spinSpeed: number
  tilt: number
  pointerLerp: number
  sparkles: boolean
  sparkleCount: number
  grid: boolean
  grain: number
  glow: number
}

export const DEFAULT_TUNING: Readonly<TuningParams> = {
  arcColor: '#d0304c',
  arcDeepColor: '#4a0a1b',
  metalness: 0.55,
  roughness: 0.36,
  clearcoat: 0.65,
  scratch: 0.55,
  sliceCount: 5,
  extraGap: 0,
  spinSpeed: 0.35,
  tilt: 1,
  pointerLerp: 4,
  sparkles: true,
  sparkleCount: 48,
  grid: true,
  grain: 0.16,
  glow: 1,
}

type Listener = () => void
let state: TuningParams = { ...DEFAULT_TUNING }
const listeners = new Set<Listener>()

export const tuningStore = {
  get(): Readonly<TuningParams> {
    return state
  },
  set(patch: Partial<TuningParams>): void {
    state = { ...state, ...patch }
    for (const listener of listeners) listener()
  },
  reset(): void {
    state = { ...DEFAULT_TUNING }
    for (const listener of listeners) listener()
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

/** 값 하나만 구독합니다. (바뀔 때만 다시 그림) */
export function useTuningValue<K extends keyof TuningParams>(
  key: K,
): TuningParams[K] {
  return useSyncExternalStore(
    tuningStore.subscribe,
    () => tuningStore.get()[key],
    () => DEFAULT_TUNING[key],
  )
}
