import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useScrollRestoration } from './restore-scroll'

const root = document.documentElement

function navigateAs(type: NavigationTimingType) {
  vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
    { type } as PerformanceNavigationTiming,
  ])
}

/** 글꼴 로딩 화면을 끝내고, 다음 그리기까지 기다립니다. */
async function settleFonts() {
  root.dataset.fonts = 'ready'
  await new Promise((resolve) => setTimeout(resolve, 0))
  await new Promise((resolve) => requestAnimationFrame(resolve))
}

describe('useScrollRestoration', () => {
  let scrollTo: ReturnType<typeof vi.fn>

  beforeEach(() => {
    root.dataset.fonts = 'loading'
    scrollTo = vi.fn()
    vi.spyOn(window, 'scrollTo').mockImplementation(
      scrollTo as unknown as typeof window.scrollTo,
    )
    Element.prototype.scrollIntoView = vi.fn()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    delete root.dataset.fonts
    window.history.replaceState(null, '', '/')
    vi.restoreAllMocks()
  })

  it('다른 페이지에서 #구간 주소로 오면 글꼴 로딩 화면이 끝난 뒤 그 구간으로 간다', async () => {
    navigateAs('navigate')
    window.history.replaceState(null, '', '/#colors')
    const section = document.createElement('section')
    section.id = 'colors'
    document.body.append(section)
    renderHook(() => useScrollRestoration())
    expect(section.scrollIntoView).not.toHaveBeenCalled()
    await settleFonts()
    expect(section.scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
    section.remove()
  })

  it('새로고침하면 떠날 때 저장한 위치로 돌아간다', async () => {
    window.sessionStorage.setItem('crimson-arc:scroll:/', '4200')
    navigateAs('reload')
    renderHook(() => useScrollRestoration())
    await settleFonts()
    expect(scrollTo).toHaveBeenCalledWith(0, 4200)
  })

  it('옮긴 직후 브라우저가 맨 위로 되돌리면 다시 옮기고, 사용자가 움직이면 그만둔다', async () => {
    window.sessionStorage.setItem('crimson-arc:scroll:/', '4200')
    navigateAs('reload')
    const scrollY = vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)
    renderHook(() => useScrollRestoration())
    await settleFonts()
    expect(scrollTo).toHaveBeenCalledTimes(1)
    // 브라우저가 늦게 맨 위로 되돌림
    window.dispatchEvent(new Event('scroll'))
    expect(scrollTo).toHaveBeenCalledTimes(2)
    // 사용자가 휠을 굴리기 시작하면 더는 붙잡지 않음
    window.dispatchEvent(new Event('wheel'))
    window.dispatchEvent(new Event('scroll'))
    expect(scrollTo).toHaveBeenCalledTimes(2)
    scrollY.mockRestore()
  })

  it('탐색 기록이 아직 없으면(WebKit) 예전 API로 새로고침인지 안다', async () => {
    window.sessionStorage.setItem('crimson-arc:scroll:/', '4200')
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([])
    Object.defineProperty(performance, 'navigation', {
      configurable: true,
      value: { type: 1 },
    })
    renderHook(() => useScrollRestoration())
    await settleFonts()
    expect(scrollTo).toHaveBeenCalledWith(0, 4200)
    Reflect.deleteProperty(performance, 'navigation')
  })

  it('처음 들어온 페이지는 저장한 위치가 있어도 맨 위에서 시작한다', async () => {
    window.sessionStorage.setItem('crimson-arc:scroll:/', '4200')
    navigateAs('navigate')
    renderHook(() => useScrollRestoration())
    await settleFonts()
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('브라우저가 이미 옮겼으면 건드리지 않는다', async () => {
    window.sessionStorage.setItem('crimson-arc:scroll:/', '4200')
    navigateAs('back_forward')
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(4200)
    renderHook(() => useScrollRestoration())
    await settleFonts()
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('페이지를 떠날 때 주소(#구간 포함)마다 위치를 저장한다', () => {
    window.history.replaceState(null, '', '/#details')
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1234.4)
    const { unmount } = renderHook(() => useScrollRestoration())
    window.dispatchEvent(new Event('pagehide'))
    expect(window.sessionStorage.getItem('crimson-arc:scroll:/#details')).toBe(
      '1234',
    )
    unmount()
  })
})
