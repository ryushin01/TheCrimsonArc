import { createContext, useContext, useSyncExternalStore } from 'react'
import type { StudioState, StudioStore } from './studio-store'

export const StudioContext = createContext<StudioStore | null>(null)

export function useStudioStore(): StudioStore {
  const store = useContext(StudioContext)
  if (!store) throw new Error('StudioContext 안에서만 쓸 수 있습니다.')
  return store
}

/** 상태 일부만 골라 구독합니다. 고른 값이 같으면 다시 그리지 않습니다. */
export function useStudio<T>(select: (state: StudioState) => T): T {
  const store = useStudioStore()
  return useSyncExternalStore(
    store.subscribe,
    () => select(store.get()),
    () => select(store.get()),
  )
}
