import { render, screen } from '@testing-library/react'
import { NextModel } from './NextModel'

/** observe하자마자 화면에 들어왔다고 알리는 대역 */
class EnteringObserver {
  private readonly callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }

  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

describe('NextModel', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('후속 모델 The Scarlet Arc가 런칭을 준비 중이라고 알린다', () => {
    render(<NextModel />)
    expect(
      screen.getByRole('region', { name: 'The Scarlet Arc' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'The Scarlet Arc' }),
    ).toBeInTheDocument()
    expect(screen.getByText('런칭 준비 중')).toBeInTheDocument()
    expect(
      screen.getByText(/후속 모델 The Scarlet Arc가 런칭을 준비하고/),
    ).toBeInTheDocument()
  })

  it('선홍색 호는 꾸밈이라 보조기기에서 숨기고, 화면에 들어오기 전에는 그리지 않는다', () => {
    const { container } = render(<NextModel />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg?.parentElement).toHaveAttribute('data-shown', 'false')
    expect(container.querySelector('path[pathLength="1"]')).not.toBeNull()
  })

  it('화면에 들어오면 호를 그린다', () => {
    vi.stubGlobal('IntersectionObserver', EnteringObserver)
    const { container } = render(<NextModel />)
    expect(container.querySelector('svg')?.parentElement).toHaveAttribute(
      'data-shown',
      'true',
    )
  })
})
