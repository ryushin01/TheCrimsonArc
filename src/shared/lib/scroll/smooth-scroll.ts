import Lenis from 'lenis'
import { useEffect } from 'react'
import { scrollStore } from './scroll-store'

let activeLenis: Lenis | null = null

/** 지금 켜져 있는 lenis (부드러운 스크롤을 끄면 null) */
export function getLenis(): Lenis | null {
  return activeLenis
}

/**
 * enabled일 때 lenis로 부드러운 스크롤을 켜고, 꺼져 있으면 기본 스크롤 위치만 모읍니다.
 * 어느 쪽이든 scrollStore에 위치와 속도를 남깁니다.
 */
export function useSmoothScroll(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      let last = window.scrollY
      let frame = 0
      const update = () => {
        frame = 0
        const y = window.scrollY
        scrollStore.set({ y, velocity: y - last })
        last = y
      }
      const onScroll = () => {
        if (!frame) frame = requestAnimationFrame(update)
      }
      update()
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => {
        window.removeEventListener('scroll', onScroll)
        if (frame) cancelAnimationFrame(frame)
        scrollStore.set({ velocity: 0 })
      }
    }

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      smoothWheel: true,
      // data-lenis-prevent가 붙은 안쪽 스크롤 영역은 기본 스크롤을 씁니다.
      allowNestedScroll: true,
    })
    activeLenis = lenis
    scrollStore.set({ y: lenis.scroll, velocity: 0 })
    const off = lenis.on('scroll', (instance) => {
      scrollStore.set({ y: instance.scroll, velocity: instance.velocity })
    })
    return () => {
      off()
      lenis.destroy()
      if (activeLenis === lenis) activeLenis = null
      scrollStore.set({ velocity: 0 })
    }
  }, [enabled])
}

/**
 * 요소로 스크롤하고 키보드 초점도 옮깁니다. (본문 바로가기·목차 링크용)
 * 초점을 받을 수 없는 요소에는 tabindex="-1"을 붙입니다.
 */
export function scrollToElement(
  element: HTMLElement,
  { smooth = true }: { smooth?: boolean } = {},
): void {
  if (!element.hasAttribute('tabindex') && !isFocusable(element)) {
    element.setAttribute('tabindex', '-1')
  }
  element.focus({ preventScroll: true })
  if (activeLenis && smooth) {
    activeLenis.scrollTo(element, { offset: 0 })
  } else {
    element.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'start',
    })
  }
}

function isFocusable(element: HTMLElement): boolean {
  return element.matches(
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )
}

/**
 * 같은 페이지 안의 '#아이디' 링크를 눌렀을 때 lenis로 부드럽게 이동하고 초점을 옮깁니다.
 * 주소의 해시도 바꿔 뒤로 가기와 공유가 되게 합니다.
 */
export function useHashLinks(smooth: boolean): void {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return
      const link = (event.target as Element | null)?.closest?.('a[href^="#"]')
      if (!(link instanceof HTMLAnchorElement)) return
      const id = decodeURIComponent(link.hash.slice(1))
      const target = id ? document.getElementById(id) : null
      if (!target) return
      event.preventDefault()
      scrollToElement(target, { smooth })
      if (window.location.hash !== link.hash) {
        window.history.pushState(null, '', link.hash)
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [smooth])
}
