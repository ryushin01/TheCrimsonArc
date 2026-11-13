import { useEffect, useState } from 'react'

/** 웹 글꼴이 준비됐는지. Canvas에 글자를 그리기 전에 기다릴 때 씁니다. */
export function useFontsReady(families: readonly string[] = []): boolean {
  const [ready, setReady] = useState(false)
  const key = families.join('|')
  useEffect(() => {
    let cancelled = false
    if (typeof document === 'undefined' || !('fonts' in document)) {
      queueMicrotask(() => setReady(true))
      return
    }
    const loads = key
      ? key.split('|').map((family) => document.fonts.load(family))
      : []
    void Promise.allSettled([...loads, document.fonts.ready]).then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [key])
  return ready
}
