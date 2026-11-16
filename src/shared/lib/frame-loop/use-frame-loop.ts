import { useEffect, useRef } from 'react'
import { createFrameLoop } from '@/shared/lib/canvas'

/**
 * active인 동안 매 프레임 callback(dt초, 경과 시간초)을 부릅니다.
 * 루프는 createFrameLoop와 같은 것을 써서, 탭을 숨겼다 돌아왔을 때 dt를 0.1초로 자르고
 * 꺼지거나 사라지면 예약된 프레임까지 지웁니다.
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
    const start = performance.now()
    const loop = createFrameLoop((dt, now) =>
      callbackRef.current(dt, (now - start) / 1000),
    )
    loop.start()
    return () => loop.stop()
  }, [active])
}
