import { createStore } from 'jotai'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '@/entities/watch'
import {
  chronoAtom,
  chronoMessageAtom,
  normalizeConfigUrlAtom,
  pressPusherAtom,
  pushersAtom,
  watchConfigAtom,
  watchViewAtom,
} from './configurator'

/** 주소를 바꾼 뒤 구독을 붙인 새 store (구독이 붙을 때 지금 주소를 읽음) */
function storeAt(url: string) {
  window.history.replaceState(null, '', url)
  const store = createStore()
  const unsubscribe = [
    store.sub(watchConfigAtom, () => {}),
    store.sub(watchViewAtom, () => {}),
  ]
  return {
    store,
    dispose: () => {
      for (const off of unsubscribe) off()
    },
  }
}

describe('구성기 atom', () => {
  let dispose = () => {}
  afterEach(() => {
    dispose()
    window.history.replaceState(null, '', '/')
  })

  it('기존 공유 주소 형식에서 조합과 방향을 읽는다', () => {
    const opened = storeAt('/?dial=crimson&strap=bracelet&view=side#colors')
    dispose = opened.dispose
    expect(opened.store.get(watchConfigAtom)).toEqual({
      ...DEFAULT_CONFIG,
      dial: 'crimson',
      strap: 'bracelet',
    })
    expect(opened.store.get(watchViewAtom)).toBe('side')
  })

  it('고르면 같은 형식으로 주소에 담고, 기록·#구간·다른 매개변수는 그대로 둔다', () => {
    const opened = storeAt('/?debug=1#colors')
    dispose = opened.dispose
    window.history.replaceState({ scroll: 1 }, '', window.location.href)
    const length = window.history.length
    opened.store.set(watchConfigAtom, { case: 'dlc' })
    opened.store.set(watchViewAtom, 'back')
    expect(window.location.search).toBe('?debug=1&case=dlc&view=back')
    expect(window.location.hash).toBe('#colors')
    expect(window.history.length).toBe(length)
    expect(window.history.state).toEqual({ scroll: 1 })
    expect(opened.store.get(watchConfigAtom).case).toBe('dlc')
  })

  it('방향만 바꾸면 조합 객체를 그대로 둔다 (재질을 다시 만들지 않음)', () => {
    const opened = storeAt('/?dial=snow')
    dispose = opened.dispose
    const before = opened.store.get(watchConfigAtom)
    opened.store.set(watchViewAtom, 'side')
    expect(opened.store.get(watchConfigAtom)).toBe(before)
  })

  it('앞뒤로 가기로 주소가 바뀌면 조합도 따라 바뀐다', () => {
    const opened = storeAt('/?dial=crimson')
    dispose = opened.dispose
    window.history.replaceState(null, '', '/?dial=navy&light=night')
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(opened.store.get(watchConfigAtom)).toEqual({
      ...DEFAULT_CONFIG,
      dial: 'navy',
      light: 'night',
    })
  })

  it('처음 열 때 기본값·모르는 값은 주소에서 뺀다', () => {
    const opened = storeAt('/?dial=bogus&case=dlc&view=front#colors')
    dispose = opened.dispose
    opened.store.set(normalizeConfigUrlAtom)
    expect(window.location.search).toBe('?case=dlc')
    expect(window.location.hash).toBe('#colors')
  })

  it('푸셔를 누르면 크로노그래프 상태·누른 시각·알림이 함께 바뀐다', () => {
    const store = createStore()
    store.set(pressPusherAtom, { pusher: 'startStop', paused: false })
    expect(store.get(chronoAtom)?.running).toBe(false)
    expect(store.get(pushersAtom).startStop).toBeGreaterThan(0)
    expect(store.get(chronoMessageAtom)).toMatch(/크로노그래프를 멈췄습니다/)
    store.set(pressPusherAtom, { pusher: 'reset', paused: false })
    expect(store.get(chronoMessageAtom)).toBe(
      '크로노그래프를 0으로 되돌렸습니다.',
    )
    store.set(pressPusherAtom, { pusher: 'startStop', paused: false })
    store.set(pressPusherAtom, { pusher: 'reset', paused: false })
    expect(store.get(chronoMessageAtom)).toMatch(/플라이백/)
    expect(store.get(pushersAtom).reset).toBeGreaterThan(0)
  })
})
