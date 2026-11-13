export interface ScrollState {
  /** 현재 스크롤 위치(px) */
  y: number
  /** 프레임당 이동량. 부드러운 스크롤일 때는 lenis가 계산한 값 */
  velocity: number
}

type Listener = (state: ScrollState) => void

const state: ScrollState = { y: 0, velocity: 0 }
const listeners = new Set<Listener>()

/** 페이지 스크롤 위치를 한곳에 모아 둡니다. 3D 무대와 섹션 연출이 매 프레임 읽습니다. */
export const scrollStore = {
  get(): Readonly<ScrollState> {
    return state
  },
  set(next: Partial<ScrollState>): void {
    Object.assign(state, next)
    for (const listener of listeners) listener(state)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
