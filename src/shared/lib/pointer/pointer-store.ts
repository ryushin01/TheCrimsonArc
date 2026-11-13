export interface PointerState {
  /** 화면 가운데가 0, 왼쪽 -1, 오른쪽 1 */
  x: number
  /** 화면 가운데가 0, 아래 -1, 위 1 (three.js 좌표와 같은 방향) */
  y: number
  clientX: number
  clientY: number
  /** 마우스·펜이 한 번이라도 움직였는지 */
  active: boolean
}

const state: PointerState = {
  x: 0,
  y: 0,
  clientX: 0,
  clientY: 0,
  active: false,
}
let users = 0

function onMove(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  state.clientX = event.clientX
  state.clientY = event.clientY
  state.x = (event.clientX / window.innerWidth) * 2 - 1
  state.y = -((event.clientY / window.innerHeight) * 2 - 1)
  state.active = true
}

/**
 * 마우스 위치의 '목표값'만 모읍니다. 쓰는 쪽은 매 프레임 damp(lerp)로 이 값을 따라갑니다.
 * 처음 쓰는 쪽이 생길 때 이벤트를 걸고, 모두 그만 쓰면 뗍니다.
 */
export const pointerStore = {
  get(): Readonly<PointerState> {
    return state
  },
  retain(): () => void {
    users += 1
    if (users === 1) {
      window.addEventListener('pointermove', onMove, { passive: true })
    }
    let released = false
    return () => {
      if (released) return
      released = true
      users -= 1
      if (users === 0) window.removeEventListener('pointermove', onMove)
    }
  },
}
