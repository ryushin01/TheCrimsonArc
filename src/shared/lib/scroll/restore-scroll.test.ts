import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RESTORE_HOLD_MS, useScrollRestoration } from './restore-scroll'

const root = document.documentElement

function navigateAs(type: NavigationTimingType) {
  vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
    { type } as PerformanceNavigationTiming,
  ])
}

/** 크기 변화 알림을 테스트에서 직접 보내는 ResizeObserver 대역. 처음 observe하면 브라우저처럼 한 번 알립니다. */
function stubResizeObserver(): () => void {
  let notify = () => {}
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        notify = () => callback([], this as unknown as ResizeObserver)
      }
      observe() {
        notify()
      }
      unobserve() {}
      disconnect() {
        notify = () => {}
      }
    },
  )
  return () => notify()
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
    vi.unstubAllGlobals()
    vi.useRealTimers()
    Reflect.deleteProperty(document, 'fonts')
    document.getElementById('colors')?.remove()
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

  it('옮긴 뒤 늦게 받은 글꼴 등으로 문서 높이가 바뀌면(WebKit 스크롤 앵커링) 다시 맞추고, 사용자가 움직이면 그만둔다', async () => {
    const resize = stubResizeObserver()
    window.sessionStorage.setItem('crimson-arc:scroll:/', '4000')
    navigateAs('reload')
    renderHook(() => useScrollRestoration())
    await settleFonts()
    // 옮긴 직후 처음 알리는 크기는 바뀐 것이 아니므로 그대로 둡니다.
    expect(scrollTo).toHaveBeenCalledTimes(1)
    resize()
    expect(scrollTo).toHaveBeenCalledTimes(2)
    expect(scrollTo).toHaveBeenLastCalledWith(0, 4000)
    window.dispatchEvent(new Event('touchstart'))
    resize()
    expect(scrollTo).toHaveBeenCalledTimes(2)
    vi.unstubAllGlobals()
  })

  it('지켜보는 동안 문서 높이는 그대로인데 위치가 바뀌면(스크롤바 끌기·스크린 리더 이동) 사용자가 움직인 것으로 보고 그만둔다', async () => {
    const resize = stubResizeObserver()
    let y = 0
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => y)
    scrollTo.mockImplementation((_x: number, top: number) => {
      y = top
    })
    window.sessionStorage.setItem('crimson-arc:scroll:/', '4000')
    navigateAs('reload')
    renderHook(() => useScrollRestoration())
    await settleFonts()
    expect(scrollTo).toHaveBeenCalledTimes(1)
    // 입력 이벤트 없이 위치만 바뀜 (스크롤바를 끌었거나 스크린 리더가 옮김)
    y = 4600
    window.dispatchEvent(new Event('scroll'))
    resize()
    expect(scrollTo).toHaveBeenCalledTimes(1)
  })

  it('높이가 바뀌며 위치가 밀린 것(스크롤 앵커링)은 사용자 움직임으로 보지 않고 다시 맞춘다', async () => {
    const resize = stubResizeObserver()
    let y = 0
    let height = 12663
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => y)
    vi.spyOn(root, 'scrollHeight', 'get').mockImplementation(() => height)
    scrollTo.mockImplementation((_x: number, top: number) => {
      y = top
    })
    window.sessionStorage.setItem('crimson-arc:scroll:/', '4000')
    navigateAs('reload')
    renderHook(() => useScrollRestoration())
    await settleFonts()
    height = 12952
    y = 4026
    window.dispatchEvent(new Event('scroll'))
    resize()
    expect(scrollTo).toHaveBeenCalledTimes(2)
    expect(y).toBe(4000)
  })

  it('모든 글꼴을 다 받기 전에는 시간이 지나도 지켜보고, 받은 뒤 한 번 더 맞춘 다음 잠시 뒤 그만둔다', async () => {
    let fontsLoaded = () => {}
    const ready = new Promise<void>((resolve) => {
      fontsLoaded = resolve
    })
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { status: 'loading', ready },
    })
    const resize = stubResizeObserver()
    window.sessionStorage.setItem('crimson-arc:scroll:/', '4000')
    navigateAs('reload')
    renderHook(() => useScrollRestoration())
    await settleFonts()
    expect(scrollTo).toHaveBeenCalledTimes(1)
    vi.useFakeTimers()
    try {
      vi.advanceTimersByTime(RESTORE_HOLD_MS * 2)
      resize()
      expect(scrollTo).toHaveBeenCalledTimes(2)
      fontsLoaded()
      await Promise.resolve()
      await Promise.resolve()
      expect(scrollTo).toHaveBeenCalledTimes(3)
      vi.advanceTimersByTime(RESTORE_HOLD_MS)
      resize()
      expect(scrollTo).toHaveBeenCalledTimes(3)
    } finally {
      vi.useRealTimers()
      vi.unstubAllGlobals()
      Reflect.deleteProperty(document, 'fonts')
    }
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

  it('브라우저가 이미 #구간으로 옮겼으면 그대로 두되, 늦게 바뀌는 높이로 어긋나면 그 구간으로 다시 맞춘다', async () => {
    const resize = stubResizeObserver()
    navigateAs('navigate')
    window.history.replaceState(null, '', '/#colors')
    const section = document.createElement('section')
    section.id = 'colors'
    document.body.append(section)
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(6011)
    renderHook(() => useScrollRestoration())
    await settleFonts()
    expect(section.scrollIntoView).not.toHaveBeenCalled()
    resize()
    expect(section.scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
    section.remove()
    vi.unstubAllGlobals()
  })

  it('#구간 주소여도 그 구간에서 멀리 떨어져 있으면(사용자가 먼저 스크롤) 지켜보지 않는다', async () => {
    const resize = stubResizeObserver()
    navigateAs('navigate')
    window.history.replaceState(null, '', '/#colors')
    const section = document.createElement('section')
    section.id = 'colors'
    document.body.append(section)
    vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({
      top: 1800,
    } as DOMRect)
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(2400)
    renderHook(() => useScrollRestoration())
    await settleFonts()
    resize()
    expect(section.scrollIntoView).not.toHaveBeenCalled()
    section.remove()
    vi.unstubAllGlobals()
  })

  it('페이지를 떠날 때 주소(#구간 포함)마다 위치를 저장한다', async () => {
    navigateAs('navigate')
    window.history.replaceState(null, '', '/#details')
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1234.4)
    const { unmount } = renderHook(() => useScrollRestoration())
    await settleFonts()
    window.dispatchEvent(new Event('pagehide'))
    expect(window.sessionStorage.getItem('crimson-arc:scroll:/#details')).toBe(
      '1234',
    )
    unmount()
  })

  it('되돌리기 전(글꼴 로딩 중)에 탭을 숨겨도 저장한 위치를 맨 위로 덮어쓰지 않는다', async () => {
    window.sessionStorage.setItem('crimson-arc:scroll:/', '4200')
    navigateAs('reload')
    renderHook(() => useScrollRestoration())
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    Reflect.deleteProperty(document, 'visibilityState')
    expect(window.sessionStorage.getItem('crimson-arc:scroll:/')).toBe('4200')
    await settleFonts()
    expect(scrollTo).toHaveBeenCalledWith(0, 4200)
  })

  it('맨 위에서 새로고침했으면 #구간 주소여도 맨 위에 둔다', async () => {
    window.history.replaceState(null, '', '/#colors')
    window.sessionStorage.setItem('crimson-arc:scroll:/#colors', '0')
    navigateAs('reload')
    const section = document.createElement('section')
    section.id = 'colors'
    document.body.append(section)
    renderHook(() => useScrollRestoration())
    await settleFonts()
    expect(scrollTo).not.toHaveBeenCalled()
    expect(section.scrollIntoView).not.toHaveBeenCalled()
    section.remove()
  })
})
