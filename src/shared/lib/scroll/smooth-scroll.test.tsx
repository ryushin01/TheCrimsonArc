import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { scrollStore } from './scroll-store'
import {
  getLenis,
  scrollToElement,
  useHashLinks,
  useSmoothScroll,
} from './smooth-scroll'

const lenis = vi.hoisted(() => ({
  instances: [] as {
    scroll: number
    scrollTo: ReturnType<typeof vi.fn>
    destroy: ReturnType<typeof vi.fn>
    emit: (scroll: number, velocity: number) => void
  }[],
}))

vi.mock('lenis', () => ({
  default: class {
    scroll = 40
    scrollTo = vi.fn()
    destroy = vi.fn()
    private listener: ((instance: unknown) => void) | null = null
    constructor() {
      lenis.instances.push(this)
    }
    on(_event: string, listener: (instance: unknown) => void) {
      this.listener = listener
      return () => {
        this.listener = null
      }
    }
    emit(scroll: number, velocity: number) {
      this.listener?.({ scroll, velocity })
    }
  },
}))

function SmoothScroll({ enabled }: { enabled: boolean }) {
  useSmoothScroll(enabled)
  return null
}

describe('useSmoothScroll', () => {
  beforeEach(() => {
    lenis.instances.length = 0
    scrollStore.set({ y: 0, velocity: 0 })
  })

  it('끄면 기본 스크롤 위치와 속도를 프레임마다 모은다', () => {
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frames.push(cb)
      return frames.length
    })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const { unmount } = render(<SmoothScroll enabled={false} />)
    expect(getLenis()).toBeNull()

    window.scrollY = 300
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll')) // 같은 프레임에는 한 번만 잽니다.
    expect(frames).toHaveLength(1)
    act(() => frames[0]!(0))
    expect(scrollStore.get()).toEqual({ y: 300, velocity: 300 })

    window.dispatchEvent(new Event('scroll'))
    unmount()
    expect(cancel).toHaveBeenCalled()
    expect(scrollStore.get().velocity).toBe(0)
    window.scrollY = 0
    vi.restoreAllMocks()
  })

  it('켜면 lenis의 위치·속도를 모으고, 끄면 lenis를 치운다', () => {
    const { unmount } = render(<SmoothScroll enabled />)
    const instance = lenis.instances[0]!
    expect(getLenis()).toBe(instance)
    expect(scrollStore.get().y).toBe(40)
    instance.emit(120, 6)
    expect(scrollStore.get()).toEqual({ y: 120, velocity: 6 })

    unmount()
    expect(instance.destroy).toHaveBeenCalled()
    expect(getLenis()).toBeNull()
    expect(scrollStore.get().velocity).toBe(0)
  })
})

describe('scrollToElement', () => {
  it('초점을 받을 수 없는 요소에는 tabindex=-1을 붙이고 초점과 스크롤을 옮긴다', () => {
    render(<h2>Specs</h2>)
    const heading = screen.getByRole('heading', { name: 'Specs' })
    const scrollIntoView = vi.fn()
    heading.scrollIntoView = scrollIntoView
    scrollToElement(heading, { smooth: false })
    expect(heading).toHaveAttribute('tabindex', '-1')
    expect(heading).toHaveFocus()
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
    })
  })

  it('버튼처럼 초점을 받는 요소는 그대로 두고, lenis가 켜져 있으면 lenis로 옮긴다', () => {
    const { unmount } = render(
      <>
        <SmoothScroll enabled />
        <button type="button">Top</button>
      </>,
    )
    const button = screen.getByRole('button', { name: 'Top' })
    scrollToElement(button)
    expect(button).not.toHaveAttribute('tabindex')
    expect(button).toHaveFocus()
    expect(lenis.instances.at(-1)!.scrollTo).toHaveBeenCalledWith(button, {
      offset: 0,
    })
    unmount()
  })
})

function HashLinks() {
  useHashLinks(false)
  return (
    <>
      <a href="#specs">사양</a>
      <a href="#missing">없는 구간</a>
      <section id="specs" aria-label="사양 구간" />
    </>
  )
}

describe('useHashLinks', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('#구간 링크를 누르면 그 구간으로 초점을 옮기고 주소의 해시를 바꾼다', async () => {
    const user = userEvent.setup()
    render(<HashLinks />)
    const section = screen.getByRole('region', { name: '사양 구간' })
    section.scrollIntoView = vi.fn()
    await user.click(screen.getByRole('link', { name: '사양' }))
    expect(section).toHaveFocus()
    expect(window.location.hash).toBe('#specs')
  })

  it('보조 키를 누르거나 없는 구간이면 브라우저 기본 동작에 맡긴다', async () => {
    const user = userEvent.setup()
    render(<HashLinks />)
    const section = screen.getByRole('region', { name: '사양 구간' })
    section.scrollIntoView = vi.fn()
    await user.keyboard('{Control>}')
    await user.click(screen.getByRole('link', { name: '사양' }))
    await user.keyboard('{/Control}')
    expect(section).not.toHaveFocus()
    await user.click(screen.getByRole('link', { name: '없는 구간' }))
    expect(section).not.toHaveFocus()
  })
})
