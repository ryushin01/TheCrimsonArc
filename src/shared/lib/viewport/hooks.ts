import {
  type RefObject,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'

/** CSS 미디어 쿼리가 맞는지 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** 요소가 화면에 들어왔는지. once면 한 번 들어온 뒤로는 계속 true */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { rootMargin = '0px', once = false, threshold = 0 } = {},
): boolean {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        setInView(entry.isIntersecting)
        if (entry.isIntersecting && once) observer.disconnect()
      },
      { rootMargin, threshold },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, rootMargin, once, threshold])
  return inView
}

/** 요소의 콘텐츠 크기 */
export function useElementSize<T extends Element>(
  ref: RefObject<T | null>,
): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      )
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return size
}
