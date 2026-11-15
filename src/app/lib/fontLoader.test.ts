import { afterEach, describe, expect, it, vi } from 'vitest'
import { FONT_LOADER_TIMEOUT_MS, showFontLoader } from './fontLoader'

const state = () => document.documentElement.dataset.fonts
const loader = () => document.querySelector('.font-loader')
const link = () =>
  document.head.querySelector<HTMLLinkElement>('link[href="/fonts.css"]')
const stubFonts = (load: unknown) =>
  Object.defineProperty(document, 'fonts', {
    value: { load },
    configurable: true,
  })

describe('showFontLoader', () => {
  afterEach(() => {
    delete document.documentElement.dataset.fonts
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('글꼴 CSS를 받고 세 굵기를 다 받으면 로딩 화면을 없앤다', async () => {
    const load = vi.fn().mockResolvedValue([])
    stubFonts(load)
    const done = showFontLoader('/fonts.css')
    expect(state()).toBe('loading')
    expect(loader()?.getAttribute('role')).toBe('status')
    link()?.dispatchEvent(new Event('load'))
    await done
    expect(load).toHaveBeenCalledTimes(3)
    expect(state()).toBe('ready')
    expect(loader()).toBeNull()
  })

  it('글꼴이 늦으면 제한 시간 뒤에 연다', async () => {
    vi.useFakeTimers()
    stubFonts(() => new Promise(() => {}))
    const done = showFontLoader('/fonts.css')
    link()?.dispatchEvent(new Event('load'))
    await vi.advanceTimersByTimeAsync(FONT_LOADER_TIMEOUT_MS)
    await done
    expect(state()).toBe('ready')
    expect(loader()).toBeNull()
  })
})
