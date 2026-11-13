import { useEffect, useState } from 'react'

/**
 * 헤더 아래에 어두운 섹션([data-theme="dark"])이 지나가는지 살펴 글자색을 바꿀 수 있게 합니다.
 * 화면 맨 위 헤더 높이만큼의 띠와 겹치는 섹션만 봅니다.
 */
export function useHeaderTone(headerHeight = 72): 'light' | 'dark' {
  const [tone, setTone] = useState<'light' | 'dark'>('light')
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window === 'undefined' ? 800 : window.innerHeight,
  )

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-theme]'),
    )
    if (sections.length === 0) return
    const visible = new Map<Element, string>()
    // rootMargin은 calc()를 받지 않으므로 화면 높이로 픽셀 값을 계산합니다.
    const bottom = Math.max(0, viewportHeight - headerHeight)
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(
              entry.target,
              entry.target.getAttribute('data-theme') ?? 'light',
            )
          } else {
            visible.delete(entry.target)
          }
        }
        setTone([...visible.values()].includes('dark') ? 'dark' : 'light')
      },
      { rootMargin: `0px 0px -${bottom}px 0px` },
    )
    for (const section of sections) observer.observe(section)
    return () => observer.disconnect()
  }, [headerHeight, viewportHeight])
  return tone
}

/** 스크롤을 조금이라도 내렸는지 (헤더 배경을 깔기 위해) */
export function useScrolled(offset = 24): boolean {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > offset)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [offset])
  return scrolled
}
