import { useSyncExternalStore } from 'react'

export interface MotionState {
  /** 운영체제의 '동작 줄이기' 설정 */
  reduced: boolean
  /** 자동으로 움직이는 연출(회전, 흐르는 글자 등)을 멈췄는지 */
  paused: boolean
}

const STORAGE_KEY = 'crimson-arc:motion'
const QUERY = '(prefers-reduced-motion: reduce)'

type Listener = () => void
const listeners = new Set<Listener>()
let state: MotionState | null = null
let storedChoice: 'paused' | 'playing' | null = null

function readStored(): 'paused' | 'playing' | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === 'paused' || value === 'playing' ? value : null
  } catch {
    return null
  }
}

function apply(next: MotionState) {
  state = next
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.motion = next.paused ? 'paused' : 'playing'
    document.documentElement.dataset.reducedMotion = String(next.reduced)
  }
  for (const listener of listeners) listener()
}

function ensureState(): MotionState {
  if (state) return state
  if (typeof window === 'undefined') return { reduced: false, paused: false }
  const media = window.matchMedia(QUERY)
  storedChoice = readStored()
  const initial: MotionState = {
    reduced: media.matches,
    paused: storedChoice ? storedChoice === 'paused' : media.matches,
  }
  apply(initial)
  media.addEventListener('change', (event) => {
    const current = ensureState()
    apply({
      reduced: event.matches,
      // 직접 고른 적이 없으면 운영체제 설정을 따라갑니다.
      paused: storedChoice ? current.paused : event.matches,
    })
  })
  return initial
}

export const motionStore = {
  get: ensureState,
  subscribe(listener: Listener): () => void {
    ensureState()
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  setPaused(paused: boolean): void {
    storedChoice = paused ? 'paused' : 'playing'
    try {
      window.localStorage.setItem(STORAGE_KEY, storedChoice)
    } catch {
      // 저장하지 못해도 이번 방문 동안은 적용됩니다.
    }
    apply({ ...ensureState(), paused })
  },
}

const serverState: MotionState = { reduced: false, paused: false }

export function useMotion(): MotionState & {
  setPaused: (paused: boolean) => void
} {
  const current = useSyncExternalStore(
    motionStore.subscribe,
    motionStore.get,
    () => serverState,
  )
  return { ...current, setPaused: motionStore.setPaused }
}
