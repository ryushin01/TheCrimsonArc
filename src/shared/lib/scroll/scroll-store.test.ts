import { scrollStore } from './scroll-store'

describe('scrollStore', () => {
  it('바뀐 값만 덮어쓰고 구독한 곳에 알리며, 구독을 끊으면 더 알리지 않는다', () => {
    const listener = vi.fn()
    const unsubscribe = scrollStore.subscribe(listener)
    scrollStore.set({ y: 120 })
    expect(scrollStore.get()).toEqual({ y: 120, velocity: 0 })
    expect(listener).toHaveBeenLastCalledWith({ y: 120, velocity: 0 })
    scrollStore.set({ velocity: 3 })
    expect(scrollStore.get()).toEqual({ y: 120, velocity: 3 })

    unsubscribe()
    scrollStore.set({ y: 0, velocity: 0 })
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
