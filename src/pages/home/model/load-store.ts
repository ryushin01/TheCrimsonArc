import { useSyncExternalStore } from 'react'

export interface LoadState {
  /** 첫 화면에 필요한 자료(핵심 프레임·글꼴)를 받은 비율 0~1 */
  progress: number
  done: boolean
  /** 받지 못한 파일 수 */
  failed: number
}

type Listener = () => void
const listeners = new Set<Listener>()
let state: LoadState = { progress: 0, done: false, failed: 0 }

export const loadStore = {
  get(): LoadState {
    return state
  },
  set(next: Partial<LoadState>): void {
    state = { ...state, ...next }
    for (const listener of listeners) listener()
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  /** 테스트와 스토리에서 처음 상태로 되돌립니다. */
  reset(next: Partial<LoadState> = {}): void {
    state = { progress: 0, done: false, failed: 0, ...next }
    for (const listener of listeners) listener()
  },
}

export function useLoadState(): LoadState {
  return useSyncExternalStore(loadStore.subscribe, loadStore.get, loadStore.get)
}
