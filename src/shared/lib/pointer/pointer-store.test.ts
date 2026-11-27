import { pointerStore } from './pointer-store'

function move(clientX: number, clientY: number, pointerType = 'mouse') {
  const event = new MouseEvent('pointermove', { clientX, clientY })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  window.dispatchEvent(event)
}

describe('pointerStore', () => {
  it('쓰는 동안만 마우스 위치를 -1~1로 모으고, 터치는 무시한다', () => {
    const release = pointerStore.retain()
    const releaseOther = pointerStore.retain()
    move(window.innerWidth, 0)
    expect(pointerStore.get()).toMatchObject({ x: 1, y: 1, active: true })
    move(0, window.innerHeight, 'touch')
    expect(pointerStore.get()).toMatchObject({ x: 1, y: 1 })

    release()
    release() // 두 번 놓아도 한 번으로 셉니다.
    move(window.innerWidth / 2, window.innerHeight / 2)
    expect(pointerStore.get()).toMatchObject({ x: 0, y: -0 })

    releaseOther()
    move(0, 0)
    expect(pointerStore.get()).toMatchObject({ x: 0, y: -0 })
  })
})
