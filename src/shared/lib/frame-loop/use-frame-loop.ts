import { useEffect, useRef } from 'react'

/**
 * active인 동안 매 프레임 callback(dt초, 경과 시간초)을 부릅니다.
 * 탭이 숨겨져 돌아왔을 때 큰 dt로 튀지 않도록 0.1초로 자릅니다.
 */
export function useFrameLoop(
  callback: (dt: number, elapsed: number) => void,
  active = true,
): void {
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  })
  useEffect(() => {
    if (!active) return
    let frame = 0
    let last = performance.now()
    const start = last
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      callbackRef.current(dt, (now - start) / 1000)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active])
}
